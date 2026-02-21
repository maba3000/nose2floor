import 'react-native-get-random-values';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { v4 as uuid } from 'uuid';

import { useSessionStore } from '@/store/sessionStore';
import { useHistoryStore } from '@/store/historyStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTimer } from '@/hooks/useTimer';
import { useDebounce } from '@/hooks/useDebounce';
import { computeDistance, computeScore } from '@/domain/scoring';
import { BullseyeCanvas } from '@/components/BullseyeCanvas';
import { HoldButton } from '@/components/HoldButton';
import { HitMarkerOverlay } from '@/components/HitMarkerOverlay';
import { CornerBadge } from '@/components/CornerBadge';
import type { Hit } from '@/domain/entities';

const DEFAULT_MAX_RADIUS = 190;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isActive = useSessionStore((s) => s.isActive);
  const reps = useSessionStore((s) => s.reps);
  const totalScore = useSessionStore((s) => s.totalScore);
  const elapsedSeconds = useSessionStore((s) => s.elapsedSeconds);
  const hits = useSessionStore((s) => s.hits);
  const startSession = useSessionStore((s) => s.startSession);
  const recordHit = useSessionStore((s) => s.recordHit);
  const reset = useSessionStore((s) => s.reset);
  const lastTap = useSessionStore((s) => s.lastTap);

  const addSession = useHistoryStore((s) => s.addSession);
  const settings = useSettingsStore((s) => s.settings);

  const sessionStartTime = useRef<number>(0);
  const layoutRef = useRef<{ cx: number; cy: number; maxRadius: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useTimer();

  const checkDebounce = useDebounce(settings.hitCooldownMs);

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      setCanvasSize({ width, height });
      layoutRef.current = {
        cx: width / 2,
        cy: height / 2,
        maxRadius: DEFAULT_MAX_RADIUS * settings.bullseyeScale,
      };
    },
    [settings.bullseyeScale],
  );

  const handleTap = useCallback(
    (tapX: number, tapY: number) => {
      if (!checkDebounce()) return;
      const layout = layoutRef.current;
      if (!layout) return;

      const distance = computeDistance(tapX, tapY, layout.cx, layout.cy, layout.maxRadius);
      const score = computeScore(distance);
      const dx = (tapX - layout.cx) / layout.maxRadius;
      const dy = (tapY - layout.cy) / layout.maxRadius;
      const now = Date.now();

      const hit: Hit = {
        dx,
        dy,
        distance,
        score,
        timestamp: isActive ? now - sessionStartTime.current : 0,
      };

      const tap = { x: tapX, y: tapY, score, at: now };

      recordHit(hit, tap, isActive);
    },
    [checkDebounce, isActive, recordHit],
  );

  const handleStartSession = useCallback(() => {
    sessionStartTime.current = Date.now();
    startSession();
  }, [startSession]);

  const handleStopSession = useCallback(() => {
    addSession({
      id: uuid(),
      startedAt: sessionStartTime.current,
      durationSeconds: elapsedSeconds,
      reps,
      totalScore,
      hits,
      bullseyeScale: settings.bullseyeScale,
    });
    reset();
  }, [addSession, elapsedSeconds, reps, totalScore, hits, settings.bullseyeScale, reset]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const [markerVisible, setMarkerVisible] = useState(false);
  useEffect(() => {
    if (!settings.showHitMarkers || !lastTap) {
      setMarkerVisible(false);
      return;
    }
    setMarkerVisible(true);
    if (settings.hitMarkerAutoHideMs === 0) return;
    const id = setTimeout(() => setMarkerVisible(false), settings.hitMarkerAutoHideMs);
    return () => clearTimeout(id);
  }, [lastTap, settings.showHitMarkers, settings.hitMarkerAutoHideMs]);

  return (
    <View
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      onLayout={onLayout}
    >
      <Pressable
        onPress={(e) => {
          const nativeEvent = e.nativeEvent as unknown as {
            locationX?: number;
            locationY?: number;
            offsetX?: number;
            offsetY?: number;
            pageX?: number;
            pageY?: number;
          };
          const tapX =
            typeof nativeEvent.locationX === 'number'
              ? nativeEvent.locationX
              : (nativeEvent.offsetX ?? 0);
          const tapY =
            typeof nativeEvent.locationY === 'number'
              ? nativeEvent.locationY
              : (nativeEvent.offsetY ?? 0);
          handleTap(tapX, tapY);
        }}
        style={styles.tapLayer}
        pointerEvents="box-only"
      />
      {settings.showBullseye && canvasSize.width > 0 && (
        <View style={[StyleSheet.absoluteFill, styles.canvasWrapper]} pointerEvents="none">
          <BullseyeCanvas
            width={canvasSize.width}
            height={canvasSize.height}
            maxRadius={DEFAULT_MAX_RADIUS * settings.bullseyeScale}
          />
        </View>
      )}

      {markerVisible && lastTap && (
        <HitMarkerOverlay
          x={lastTap.x}
          y={lastTap.y}
          score={lastTap.score}
          showScore={settings.showPoints}
        />
      )}

      <View pointerEvents="box-none" style={styles.overlayLayer}>
        {isActive ? (
          <>
            {settings.showHitCount && (
              <View style={styles.badgeTopLeft}>
                <CornerBadge label="HITS" value={`${reps}`} />
              </View>
            )}
            {settings.showPoints && (
              <View style={styles.topRight}>
                <CornerBadge label="PTS" value={`${totalScore}`} align="flex-end" />
              </View>
            )}
            <View style={styles.bottomRow} pointerEvents="box-none">
              {settings.showTimer ? (
                <CornerBadge label="TIME" value={formatTime(elapsedSeconds)} />
              ) : (
                <View pointerEvents="none" />
              )}
              <HoldButton label="Hold to stop" color="#E53935" onHold={handleStopSession} />
            </View>
          </>
        ) : (
          <>
            {settings.showHitCount && (
              <View style={styles.badgeTopLeft}>
                <CornerBadge label="DEMO" value={`${reps}`} />
              </View>
            )}
            {settings.showPoints && (
              <View style={styles.topRight}>
                <CornerBadge label="PTS" value={`${totalScore}`} align="flex-end" />
              </View>
            )}
            <View style={styles.bottomRow} pointerEvents="box-none">
              <HoldButton
                label="Hold for More"
                color="#2E7D32"
                onHold={() => router.push('/more')}
              />
              <HoldButton label="Hold to Start" color="#2E7D32" onHold={handleStartSession} />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  tapLayer: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  overlayLayer: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  canvasWrapper: { alignItems: 'center', justifyContent: 'center' },
  badgeTopLeft: { position: 'absolute', top: 16, left: 16 },
  topRight: { position: 'absolute', top: 16, right: 16 },
  bottomRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
});
