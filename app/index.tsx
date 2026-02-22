import 'react-native-get-random-values';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, Pressable } from 'react-native';
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
  const upsertSession = useHistoryStore((s) => s.upsertSession);
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const sessionStartTime = useRef<number>(0);
  const sessionIdRef = useRef<string | null>(null);
  const autoStartBlockedRef = useRef(false);
  const layoutRef = useRef<{ cx: number; cy: number; maxRadius: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [introVisible, setIntroVisible] = useState(false);

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

      if (settings.sessionMode === 'auto' && isActive) {
        if (!sessionIdRef.current) {
          sessionIdRef.current = uuid();
          sessionStartTime.current = Date.now();
        }
        upsertSession({
          id: sessionIdRef.current,
          startedAt: sessionStartTime.current || now,
          durationSeconds: elapsedSeconds,
          reps: reps + 1,
          totalScore: totalScore + hit.score,
          hits: [...hits, hit],
          bullseyeScale: settings.bullseyeScale,
        });
      }
    },
    [
      checkDebounce,
      isActive,
      recordHit,
      settings.sessionMode,
      settings.bullseyeScale,
      elapsedSeconds,
      reps,
      totalScore,
      hits,
      upsertSession,
    ],
  );

  const handleStartSession = useCallback(() => {
    sessionStartTime.current = Date.now();
    sessionIdRef.current = uuid();
    startSession();
  }, [startSession]);

  const handleStopSession = useCallback(() => {
    if (settings.sessionMode === 'auto') {
      autoStartBlockedRef.current = true;
    }
    if (reps === 0) {
      sessionIdRef.current = null;
      reset();
      return;
    }
    const id = sessionIdRef.current ?? uuid();
    const startedAt = sessionStartTime.current || Date.now();
    const session = {
      id,
      startedAt,
      durationSeconds: elapsedSeconds,
      reps,
      totalScore,
      hits,
      bullseyeScale: settings.bullseyeScale,
    };
    if (settings.sessionMode === 'auto') {
      upsertSession(session);
    } else {
      addSession(session);
    }
    sessionIdRef.current = null;
    reset();
  }, [
    addSession,
    upsertSession,
    elapsedSeconds,
    reps,
    totalScore,
    hits,
    settings.bullseyeScale,
    settings.sessionMode,
    reset,
  ]);

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

  useEffect(() => {
    setIntroVisible(settings.showIntro);
  }, [settings.showIntro]);

  useEffect(() => {
    if (settings.sessionMode === 'auto') {
      autoStartBlockedRef.current = false;
    }
  }, [settings.sessionMode]);

  useEffect(() => {
    if (settings.sessionMode !== 'auto') return;
    if (introVisible) return;
    if (autoStartBlockedRef.current) return;
    if (!isActive) {
      sessionStartTime.current = Date.now();
      sessionIdRef.current = uuid();
      startSession();
    }
  }, [settings.sessionMode, introVisible, isActive, startSession]);

  useEffect(() => {
    if (settings.sessionMode !== 'auto') return;
    if (!isActive || !sessionIdRef.current) return;
    if (reps === 0) return;
    upsertSession({
      id: sessionIdRef.current,
      startedAt: sessionStartTime.current || Date.now(),
      durationSeconds: elapsedSeconds,
      reps,
      totalScore,
      hits,
      bullseyeScale: settings.bullseyeScale,
    });
  }, [
    settings.sessionMode,
    isActive,
    elapsedSeconds,
    reps,
    totalScore,
    hits,
    settings.bullseyeScale,
    upsertSession,
  ]);

  return (
    <View
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      onLayout={onLayout}
    >
      {introVisible && (
        <View style={styles.introOverlay} pointerEvents="box-none">
          <View style={styles.introBanner}>
            <Text selectable={false} style={styles.introTitle}>
              Welcome
            </Text>
            <Text selectable={false} style={styles.introBody}>
              Place your phone on the floor near your face and do push-ups. Try to tap the
              bull&apos;s-eye with your nose to count a rep.
            </Text>
            <Text selectable={false} style={styles.introBody}>
              “Hold to Start” to begin.
            </Text>
            <Text selectable={false} style={styles.introBody}>
              “Hold for More” to personalise the experience.
            </Text>
            <View style={styles.introActions}>
              <Pressable style={styles.introDismiss} onPress={() => setIntroVisible(false)}>
                <Text selectable={false} style={styles.introDismissText}>
                  Got it
                </Text>
              </Pressable>
              <Pressable
                style={styles.introDismiss}
                onPress={() => {
                  updateSettings({ showIntro: false });
                  setIntroVisible(false);
                }}
              >
                <Text selectable={false} style={styles.introDismissText}>
                  Don&apos;t show again
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
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
              <HoldButton label="Hold to Stop" color="#E53935" onHold={handleStopSession} />
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
  introOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  introBanner: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    gap: 8,
  },
  introTitle: { fontSize: 18, fontWeight: '600', color: '#1A202C' },
  introBody: { fontSize: 14, color: 'rgba(0,0,0,0.7)', lineHeight: 20 },
  introActions: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  introDismiss: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: '#F5F0EB',
    marginTop: 4,
  },
  introDismissText: { fontSize: 12, fontWeight: '500', color: '#1A202C' },
});
