import 'react-native-get-random-values';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { v4 as uuid } from 'uuid';

import { useSessionStore } from '@/store/sessionStore';
import { useHistoryStore } from '@/store/historyStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTimer } from '@/hooks/useTimer';
import { useHaptics } from '@/hooks/useHaptics';
import { useHitInput } from '@/hooks/useHitInput';
import { buildAutoSessionSnapshot } from '@/domain/autoSession';
import { BullseyeCanvas } from '@/components/BullseyeCanvas';
import { HoldButton } from '@/components/HoldButton';
import { HitMarkerOverlay } from '@/components/HitMarkerOverlay';
import { CornerBadge } from '@/components/CornerBadge';
import type { CornerWidget } from '@/domain/entities';
import { clearAutoSession, loadAutoSession, saveAutoSession } from '@/persistence/storage';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

const DEFAULT_MAX_RADIUS = 190;

function formatTime(s: number) {
  return `${Math.floor(s / 60)
    .toString()
    .padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ── Store subscriptions ───────────────────────────────────────────────────

  const isActive = useSessionStore((s) => s.isActive);
  const reps = useSessionStore((s) => s.reps);
  const totalScore = useSessionStore((s) => s.totalScore);
  const elapsedSeconds = useSessionStore((s) => s.elapsedSeconds);
  const hits = useSessionStore((s) => s.hits);
  const startSession = useSessionStore((s) => s.startSession);
  const loadSession = useSessionStore((s) => s.loadSession);
  const reset = useSessionStore((s) => s.reset);
  const lastTap = useSessionStore((s) => s.lastTap);

  const history = useHistoryStore((s) => s.history);
  const addSession = useHistoryStore((s) => s.addSession);
  const upsertSession = useHistoryStore((s) => s.upsertSession);

  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const theme = useTheme();

  // ── Refs ──────────────────────────────────────────────────────────────────

  const sessionStartTime = useRef<number>(0);
  const sessionIdRef = useRef<string | null>(null);
  const autoStartBlockedRef = useRef(false);
  const layoutRef = useRef<{ cx: number; cy: number; maxRadius: number } | null>(null);

  // ── Local state ───────────────────────────────────────────────────────────

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [introVisible, setIntroVisible] = useState(false);
  const [markerVisible, setMarkerVisible] = useState(false);

  useTimer();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // ── Hooks ─────────────────────────────────────────────────────────────────

  const { triggerHit, triggerStart, triggerStop } = useHaptics(settings.hapticsEnabled);

  const {
    handlePress,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    inputDebug,
    debugTouches,
    resetInputState,
  } = useHitInput({ layoutRef, isActive, sessionStartTime, triggerHit });

  // ── Layout ────────────────────────────────────────────────────────────────

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

  // ── Session control ───────────────────────────────────────────────────────

  const handleStartSession = useCallback(() => {
    resetInputState();
    sessionStartTime.current = Date.now();
    sessionIdRef.current = uuid();
    startSession();
    triggerStart();
  }, [resetInputState, startSession, triggerStart]);

  const handleStopSession = useCallback(() => {
    resetInputState();
    if (settings.sessionMode === 'auto') {
      autoStartBlockedRef.current = true;
    }
    if (reps === 0) {
      if (settings.sessionMode === 'auto') clearAutoSession();
      sessionIdRef.current = null;
      reset();
      triggerStop();
      return;
    }
    const id = sessionIdRef.current ?? uuid();
    const session = {
      id,
      startedAt: sessionStartTime.current || Date.now(),
      durationSeconds: elapsedSeconds,
      reps,
      totalScore,
      hits,
      bullseyeScale: settings.bullseyeScale,
    };
    if (settings.sessionMode === 'auto') {
      upsertSession(session);
      clearAutoSession();
    } else {
      addSession(session);
    }
    sessionIdRef.current = null;
    reset();
    triggerStop();
  }, [
    addSession,
    elapsedSeconds,
    hits,
    reps,
    reset,
    resetInputState,
    settings.bullseyeScale,
    settings.sessionMode,
    totalScore,
    triggerStop,
    upsertSession,
  ]);

  // ── Computed values ───────────────────────────────────────────────────────

  const remainingGoal = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const historyRepsToday = history
      .filter((s) => s.startedAt >= todayStart.getTime() && s.id !== sessionIdRef.current)
      .reduce((acc, s) => acc + s.reps, 0);
    return settings.dailyGoal - historyRepsToday - reps;
  }, [history, settings.dailyGoal, reps]);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    setMarkerVisible(!!settings.showHitMarkers && !!lastTap);
    if (!settings.showHitMarkers || !lastTap || settings.hitMarkerAutoHideMs === 0) return;
    const id = setTimeout(() => setMarkerVisible(false), settings.hitMarkerAutoHideMs);
    return () => clearTimeout(id);
  }, [lastTap, settings.showHitMarkers, settings.hitMarkerAutoHideMs]);

  useEffect(() => {
    setIntroVisible(settings.showIntro);
  }, [settings.showIntro]);

  // Auto-session: restore a saved in-progress session on mount
  useEffect(() => {
    if (settings.sessionMode !== 'auto' || introVisible || isActive) return;
    const session = loadAutoSession();
    if (!session || session.reps === 0) return;
    sessionStartTime.current = session.startedAt;
    sessionIdRef.current = session.id;
    loadSession(session);
  }, [settings.sessionMode, introVisible, isActive, loadSession]);

  // Auto-session: unblock auto-start when mode is toggled back to auto
  useEffect(() => {
    if (settings.sessionMode === 'auto') autoStartBlockedRef.current = false;
  }, [settings.sessionMode]);

  // Auto-session: start a new session automatically when none is active
  useEffect(() => {
    if (
      settings.sessionMode !== 'auto' ||
      introVisible ||
      autoStartBlockedRef.current ||
      sessionIdRef.current ||
      isActive
    )
      return;
    sessionStartTime.current = Date.now();
    sessionIdRef.current = uuid();
    startSession();
  }, [settings.sessionMode, introVisible, isActive, startSession]);

  // Auto-session: persist snapshot on every rep so progress survives app closure
  useEffect(() => {
    if (settings.sessionMode !== 'auto' || !isActive) return;
    if (!sessionIdRef.current) {
      sessionIdRef.current = uuid();
      if (!sessionStartTime.current) sessionStartTime.current = Date.now();
    }
    const snapshot = buildAutoSessionSnapshot({
      sessionMode: settings.sessionMode,
      isActive,
      id: sessionIdRef.current,
      startedAt: sessionStartTime.current || Date.now(),
      durationSeconds: elapsedSeconds,
      reps,
      totalScore,
      hits,
      bullseyeScale: settings.bullseyeScale,
    });
    if (!snapshot) return;
    upsertSession(snapshot);
    saveAutoSession(snapshot);
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

  // ── Corner widget renderer ────────────────────────────────────────────────

  const renderCornerWidget = useCallback(
    (widget: CornerWidget, align: 'flex-start' | 'flex-end') => {
      switch (widget) {
        case 'hits':
          return <CornerBadge label={isActive ? 'HITS' : 'DEMO'} value={`${reps}`} align={align} />;
        case 'points':
          return <CornerBadge label="PTS" value={`${totalScore}`} align={align} />;
        case 'timer':
          return isActive ? (
            <CornerBadge label="TIME" value={formatTime(elapsedSeconds)} align={align} />
          ) : null;
        case 'goal':
          return (
            <CornerBadge
              label="GOAL"
              value={
                remainingGoal > 0
                  ? `${remainingGoal}`
                  : isActive
                    ? remainingGoal === 0
                      ? 'Done'
                      : `Done ${remainingGoal}`
                    : 'Demo'
              }
              align={align}
            />
          );
        case 'none':
        default:
          return null;
      }
    },
    [isActive, reps, totalScore, elapsedSeconds, remainingGoal],
  );

  // ── Render ────────────────────────────────────────────────────────────────

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
              "Hold to Start" to begin.
            </Text>
            <Text selectable={false} style={styles.introBody}>
              "Hold for More" to personalise the experience.
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
        onPressIn={Platform.OS === 'web' ? handlePress : undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
        <HitMarkerOverlay x={lastTap.x} y={lastTap.y} score={lastTap.score} showScore={true} />
      )}

      {settings.showInputDebug && (
        <View style={styles.debugBadge} pointerEvents="none">
          {/* T=Touches H=Hits B=Blocked M=Moves L=Long S=Scrolls */}
          <Text selectable={false} style={styles.debugLine}>
            T {inputDebug.touches} · H {inputDebug.hits} · B {inputDebug.blocked} · M{' '}
            {inputDebug.moves} · L {inputDebug.long} · S {inputDebug.scrolls}
          </Text>
        </View>
      )}

      {settings.showInputDebug && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {debugTouches.map((marker) => (
            <View
              key={marker.id}
              style={[
                styles.debugTouch,
                marker.kind === 'hit' ? styles.debugTouchHit : styles.debugTouchBlocked,
                marker.kind === 'move' ? styles.debugTouchMove : null,
                marker.kind === 'scroll' ? styles.debugTouchScroll : null,
                { left: marker.x - 4, top: marker.y - 4 },
              ]}
            />
          ))}
        </View>
      )}

      <View pointerEvents="box-none" style={styles.overlayLayer}>
        <View style={styles.cornerTopLeft} pointerEvents="none">
          {renderCornerWidget(settings.corners.topLeft, 'flex-start')}
        </View>
        <View style={styles.cornerTopRight} pointerEvents="none">
          {renderCornerWidget(settings.corners.topRight, 'flex-end')}
        </View>
        <View style={styles.cornerBottomLeft} pointerEvents={isActive ? 'none' : 'box-none'}>
          {isActive ? (
            renderCornerWidget(settings.corners.bottomLeft, 'flex-start')
          ) : (
            <HoldButton
              label="Hold for More"
              color={theme.actionPrimary}
              onHold={() => router.push('/more')}
              accessibilityHint="Opens more options and screens."
            />
          )}
        </View>
        <View style={styles.cornerBottomRight} pointerEvents="box-none">
          {isActive ? (
            <HoldButton
              label="Hold to Stop"
              color={theme.actionDanger}
              onHold={handleStopSession}
              accessibilityHint="Stops the current session."
            />
          ) : (
            <HoldButton
              label="Hold to Start"
              color={theme.actionPrimary}
              onHold={handleStartSession}
              accessibilityHint="Starts a manual session."
            />
          )}
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    tapLayer: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
    overlayLayer: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
    canvasWrapper: { alignItems: 'center', justifyContent: 'center' },
    debugBadge: {
      position: 'absolute',
      top: 14,
      alignSelf: 'center',
      zIndex: 3,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.cardSoft,
      paddingHorizontal: 12,
      paddingVertical: 3,
    },
    debugLine: { fontSize: 11, color: theme.text },
    debugTouch: { position: 'absolute', width: 8, height: 8, borderRadius: 999, borderWidth: 1 },
    debugTouchHit: { backgroundColor: '#2E7D32', borderColor: 'rgba(255,255,255,0.8)' },
    debugTouchBlocked: { backgroundColor: '#FF8F00', borderColor: 'rgba(255,255,255,0.8)' },
    debugTouchMove: { backgroundColor: '#0288D1', borderColor: 'rgba(255,255,255,0.8)' },
    debugTouchScroll: { backgroundColor: '#7B1FA2', borderColor: 'rgba(255,255,255,0.9)' },
    cornerTopLeft: { position: 'absolute', top: 16, left: 16 },
    cornerTopRight: { position: 'absolute', top: 16, right: 16 },
    cornerBottomLeft: { position: 'absolute', bottom: 16, left: 16 },
    cornerBottomRight: { position: 'absolute', bottom: 16, right: 16 },
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
      backgroundColor: theme.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 8,
    },
    introTitle: { fontSize: 18, fontWeight: '600', color: theme.text },
    introBody: { fontSize: 14, color: theme.textMuted, lineHeight: 20 },
    introActions: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
    introDismiss: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.borderStrong,
      backgroundColor: theme.background,
      marginTop: 4,
    },
    introDismissText: { fontSize: 12, fontWeight: '500', color: theme.text },
  });
