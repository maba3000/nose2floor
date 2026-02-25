import 'react-native-get-random-values';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, Pressable, Platform } from 'react-native';
import type { GestureResponderEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { v4 as uuid } from 'uuid';
import * as Haptics from 'expo-haptics';

import { useSessionStore } from '@/store/sessionStore';
import { useHistoryStore } from '@/store/historyStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTimer } from '@/hooks/useTimer';
import { useDebounce } from '@/hooks/useDebounce';
import { computeDistance, computeScore } from '@/domain/scoring';
import { buildAutoSessionSnapshot } from '@/domain/autoSession';
import { BullseyeCanvas } from '@/components/BullseyeCanvas';
import { HoldButton } from '@/components/HoldButton';
import { HitMarkerOverlay } from '@/components/HitMarkerOverlay';
import { CornerBadge } from '@/components/CornerBadge';
import type { Hit, CornerWidget } from '@/domain/entities';
import { clearAutoSession, loadAutoSession, saveAutoSession } from '@/persistence/storage';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

const DEFAULT_MAX_RADIUS = 190;
const INPUT_EVENT_DEDUPE_MS = 30;
const MOVE_SAMPLE_MS = 40;
const MOVE_MIN_DISTANCE = 6;
const DEBUG_LONG_TOUCH_MS = 350;
const DEBUG_SCROLL_DISTANCE = 20;

type InputDebugStats = {
  touches: number;
  hits: number;
  blocked: number;
  moves: number;
  long: number;
  scrolls: number;
};

type DebugTouchMarker = {
  id: number;
  x: number;
  y: number;
  kind: 'hit' | 'blocked' | 'move' | 'scroll';
};

const EMPTY_INPUT_DEBUG: InputDebugStats = {
  touches: 0,
  hits: 0,
  blocked: 0,
  moves: 0,
  long: 0,
  scrolls: 0,
};
const MAX_DEBUG_TOUCHES = 250;

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
  const loadSession = useSessionStore((s) => s.loadSession);
  const reset = useSessionStore((s) => s.reset);
  const lastTap = useSessionStore((s) => s.lastTap);

  const history = useHistoryStore((s) => s.history);
  const addSession = useHistoryStore((s) => s.addSession);
  const upsertSession = useHistoryStore((s) => s.upsertSession);
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const theme = useTheme();

  const sessionStartTime = useRef<number>(0);
  const sessionIdRef = useRef<string | null>(null);
  const autoStartBlockedRef = useRef(false);
  const layoutRef = useRef<{ cx: number; cy: number; maxRadius: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [introVisible, setIntroVisible] = useState(false);
  const [inputDebug, setInputDebug] = useState<InputDebugStats>(EMPTY_INPUT_DEBUG);
  const [debugTouches, setDebugTouches] = useState<DebugTouchMarker[]>([]);
  const lastInputEventRef = useRef<{ at: number; x: number; y: number } | null>(null);
  const activeTouchRef = useRef<{
    startAt: number;
    startX: number;
    startY: number;
    lastMarkAt: number;
    lastX: number;
    lastY: number;
  } | null>(null);
  const debugTouchIdRef = useRef(0);

  useTimer();

  const styles = useMemo(() => createStyles(theme), [theme]);

  const { isAllowed: checkDebounce, reset: resetHitDebounce } = useDebounce(settings.hitCooldownMs);

  const resetInputDebug = useCallback(() => {
    lastInputEventRef.current = null;
    activeTouchRef.current = null;
    setInputDebug(EMPTY_INPUT_DEBUG);
    setDebugTouches([]);
  }, []);

  const incrementInputDebug = useCallback(
    (key: keyof InputDebugStats) => {
      if (!settings.showInputDebug) return;
      setInputDebug((prev) => ({ ...prev, [key]: prev[key] + 1 }));
    },
    [settings.showInputDebug],
  );

  const addDebugTouch = useCallback(
    (x: number, y: number, kind: DebugTouchMarker['kind']) => {
      if (!settings.showInputDebug) return;
      setDebugTouches((prev) => {
        const next = [
          ...prev,
          {
            id: ++debugTouchIdRef.current,
            x,
            y,
            kind,
          },
        ];
        if (next.length <= MAX_DEBUG_TOUCHES) return next;
        return next.slice(next.length - MAX_DEBUG_TOUCHES);
      });
    },
    [settings.showInputDebug],
  );

  const triggerHitHaptic = useCallback(() => {
    if (Platform.OS === 'web' || !settings.hapticsEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [settings.hapticsEnabled]);

  const triggerStartHaptic = useCallback(() => {
    if (Platform.OS === 'web' || !settings.hapticsEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [settings.hapticsEnabled]);

  const triggerStopHaptic = useCallback(() => {
    if (Platform.OS === 'web' || !settings.hapticsEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  }, [settings.hapticsEnabled]);

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
    (tapX: number, tapY: number): boolean => {
      if (!checkDebounce()) {
        incrementInputDebug('blocked');
        return false;
      }
      const layout = layoutRef.current;
      if (!layout) return false;

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
      incrementInputDebug('hits');
      triggerHitHaptic();
      return true;
    },
    [checkDebounce, incrementInputDebug, isActive, recordHit, triggerHitHaptic],
  );

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      // Touch events are handled by onTouchEnd; this is only for mouse clicks on web
      if (activeTouchRef.current !== null) return;
      const nativeEvent = e.nativeEvent;
      const tapX =
        typeof nativeEvent.locationX === 'number'
          ? nativeEvent.locationX
          : (nativeEvent.offsetX ?? 0);
      const tapY =
        typeof nativeEvent.locationY === 'number'
          ? nativeEvent.locationY
          : (nativeEvent.offsetY ?? 0);
      if (Platform.OS === 'web' && tapX === 0 && tapY === 0) {
        return;
      }
      const eventTime = Number(nativeEvent.timestamp ?? Date.now());
      const last = lastInputEventRef.current;
      if (
        last &&
        Math.abs(eventTime - last.at) <= INPUT_EVENT_DEDUPE_MS &&
        Math.abs(tapX - last.x) < 1 &&
        Math.abs(tapY - last.y) < 1
      ) {
        return;
      }
      lastInputEventRef.current = { at: eventTime, x: tapX, y: tapY };
      incrementInputDebug('touches');
      const wasHit = handleTap(tapX, tapY);
      addDebugTouch(tapX, tapY, wasHit ? 'hit' : 'blocked');
    },
    [addDebugTouch, handleTap, incrementInputDebug],
  );

  const handleTouchStart = useCallback(
    (e: GestureResponderEvent) => {
      if (Platform.OS === 'web') {
        e.preventDefault();
      }
      const nativeEvent = e.nativeEvent;
      const x =
        typeof nativeEvent.locationX === 'number'
          ? nativeEvent.locationX
          : (nativeEvent.offsetX ?? 0);
      const y =
        typeof nativeEvent.locationY === 'number'
          ? nativeEvent.locationY
          : (nativeEvent.offsetY ?? 0);
      const now = Number(nativeEvent.timestamp ?? Date.now());
      activeTouchRef.current = {
        startAt: now,
        startX: x,
        startY: y,
        lastMarkAt: now,
        lastX: x,
        lastY: y,
      };
      incrementInputDebug('touches');
      const wasHit = handleTap(x, y);
      addDebugTouch(x, y, wasHit ? 'hit' : 'blocked');
    },
    [addDebugTouch, handleTap, incrementInputDebug],
  );

  const handleTouchMove = useCallback(
    (e: GestureResponderEvent) => {
      const active = activeTouchRef.current;
      if (!active) return;

      const nativeEvent = e.nativeEvent;
      const x =
        typeof nativeEvent.locationX === 'number'
          ? nativeEvent.locationX
          : (nativeEvent.offsetX ?? 0);
      const y =
        typeof nativeEvent.locationY === 'number'
          ? nativeEvent.locationY
          : (nativeEvent.offsetY ?? 0);
      const now = Number(nativeEvent.timestamp ?? Date.now());

      const distanceSinceLast = Math.hypot(x - active.lastX, y - active.lastY);
      const elapsedSinceLast = now - active.lastMarkAt;
      if (distanceSinceLast < MOVE_MIN_DISTANCE && elapsedSinceLast < MOVE_SAMPLE_MS) {
        return;
      }

      active.lastX = x;
      active.lastY = y;
      active.lastMarkAt = now;
      incrementInputDebug('moves');
      const wasHit = handleTap(x, y);
      addDebugTouch(x, y, wasHit ? 'hit' : 'move');
    },
    [addDebugTouch, handleTap, incrementInputDebug],
  );

  const handleTouchEnd = useCallback(
    (e: GestureResponderEvent) => {
      const active = activeTouchRef.current;
      activeTouchRef.current = null;
      if (!settings.showInputDebug || !active) return;

      const nativeEvent = e.nativeEvent;
      const x =
        typeof nativeEvent.locationX === 'number'
          ? nativeEvent.locationX
          : (nativeEvent.offsetX ?? 0);
      const y =
        typeof nativeEvent.locationY === 'number'
          ? nativeEvent.locationY
          : (nativeEvent.offsetY ?? 0);
      const now = Number(nativeEvent.timestamp ?? Date.now());

      const duration = now - active.startAt;
      const totalDistance = Math.hypot(x - active.startX, y - active.startY);

      if (duration >= DEBUG_LONG_TOUCH_MS) {
        incrementInputDebug('long');
      }
      if (totalDistance >= DEBUG_SCROLL_DISTANCE) {
        incrementInputDebug('scrolls');
        addDebugTouch(x, y, 'scroll');
      }
    },
    [addDebugTouch, incrementInputDebug, settings.showInputDebug],
  );

  const handleStartSession = useCallback(() => {
    resetHitDebounce();
    resetInputDebug();
    sessionStartTime.current = Date.now();
    sessionIdRef.current = uuid();
    startSession();
    triggerStartHaptic();
  }, [resetHitDebounce, resetInputDebug, startSession, triggerStartHaptic]);

  const handleStopSession = useCallback(() => {
    resetHitDebounce();
    resetInputDebug();
    if (settings.sessionMode === 'auto') {
      autoStartBlockedRef.current = true;
    }
    if (reps === 0) {
      if (settings.sessionMode === 'auto') {
        clearAutoSession();
      }
      sessionIdRef.current = null;
      reset();
      triggerStopHaptic();
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
      clearAutoSession();
    } else {
      addSession(session);
    }
    sessionIdRef.current = null;
    reset();
    triggerStopHaptic();
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
    resetHitDebounce,
    resetInputDebug,
    triggerStopHaptic,
  ]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const remainingGoal = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const start = todayStart.getTime();
    const historyRepsToday = history
      .filter((s) => s.startedAt >= start && s.id !== sessionIdRef.current)
      .reduce((acc, s) => acc + s.reps, 0);
    return settings.dailyGoal - historyRepsToday - reps;
  }, [history, settings.dailyGoal, reps]);

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
    if (!settings.showInputDebug) return;
    resetInputDebug();
  }, [settings.showInputDebug, resetInputDebug]);

  useEffect(() => {
    if (settings.sessionMode !== 'auto') return;
    if (introVisible) return;
    if (isActive) return;
    const session = loadAutoSession();
    if (!session || session.reps === 0) return;
    sessionStartTime.current = session.startedAt;
    sessionIdRef.current = session.id;
    loadSession(session);
  }, [settings.sessionMode, introVisible, isActive, loadSession]);

  useEffect(() => {
    if (settings.sessionMode === 'auto') {
      autoStartBlockedRef.current = false;
    }
  }, [settings.sessionMode]);

  useEffect(() => {
    if (settings.sessionMode !== 'auto') return;
    if (introVisible) return;
    if (autoStartBlockedRef.current) return;
    if (sessionIdRef.current) return;
    if (!isActive) {
      sessionStartTime.current = Date.now();
      sessionIdRef.current = uuid();
      startSession();
    }
  }, [settings.sessionMode, introVisible, isActive, startSession]);

  useEffect(() => {
    if (settings.sessionMode !== 'auto') return;
    if (!isActive) return;
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
    debugTouch: {
      position: 'absolute',
      width: 8,
      height: 8,
      borderRadius: 999,
      borderWidth: 1,
    },
    debugTouchHit: {
      backgroundColor: '#2E7D32',
      borderColor: 'rgba(255,255,255,0.8)',
    },
    debugTouchBlocked: {
      backgroundColor: '#FF8F00',
      borderColor: 'rgba(255,255,255,0.8)',
    },
    debugTouchMove: {
      backgroundColor: '#0288D1',
      borderColor: 'rgba(255,255,255,0.8)',
    },
    debugTouchScroll: {
      backgroundColor: '#7B1FA2',
      borderColor: 'rgba(255,255,255,0.9)',
    },
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
