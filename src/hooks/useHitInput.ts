import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { GestureResponderEvent } from 'react-native';

import { useSessionStore } from '@/store/sessionStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useDebounce } from '@/hooks/useDebounce';
import { computeDistance, computeScore } from '@/domain/scoring';
import type { Hit } from '@/domain/entities';

// ─── Constants ───────────────────────────────────────────────────────────────

const INPUT_EVENT_DEDUPE_MS = 30;
const MOVE_SAMPLE_MS = 40;
const MOVE_MIN_DISTANCE = 6;
const DEBUG_LONG_TOUCH_MS = 350;
const DEBUG_SCROLL_DISTANCE = 20;
const MAX_DEBUG_TOUCHES = 250;

// ─── Types ───────────────────────────────────────────────────────────────────

export type InputDebugStats = {
  touches: number;
  hits: number;
  blocked: number;
  moves: number;
  long: number;
  scrolls: number;
};

export type DebugTouchMarker = {
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

// ─── Web coordinate extraction ───────────────────────────────────────────────
//
// Event shapes vary across platform and event type:
//   Native (iOS/Android)  — locationX/Y always present on nativeEvent
//   Web touch (mobile)    — DOM TouchEvent: changedTouches[0].clientX/Y
//   Web mouse (desktop)   — onPressIn goes through RNW's responder; the resulting
//                           nativeEvent may have locationX/Y, clientX/Y, offsetX/Y,
//                           or pageX/Y depending on RNW version — try all in order.

type CoordSource = 'dom-touch' | 'dom-client' | 'dom-offset' | 'rn-location' | 'dom-page' | 'none';

type ExtractedCoords = {
  x: number;
  y: number;
  /** Which property was used — shown in debug logs to diagnose platform differences. */
  source: CoordSource;
  /** Every candidate value found on the event, for debug logging. */
  candidates: Record<string, number | null>;
};

// Typed intersection covering DOM coordinate fields that may appear on web events
// but are absent from the base React Native type definition.
type NativeEventExtended = GestureResponderEvent['nativeEvent'] & {
  changedTouches?: Array<{ clientX?: number; clientY?: number }>;
  touches?: Array<{ clientX?: number; clientY?: number }>;
  locationX?: number;
  locationY?: number;
  clientX?: number;
  clientY?: number;
  offsetX?: number;
  offsetY?: number;
  pageX?: number;
  pageY?: number;
};

function extractWebCoords(nativeEvent: GestureResponderEvent['nativeEvent']): ExtractedCoords {
  const ev = nativeEvent as NativeEventExtended;
  const touch0 = ev.changedTouches?.[0] ?? ev.touches?.[0] ?? null;

  const candidates: Record<string, number | null> = {
    'touch.clientX': touch0?.clientX ?? null,
    'touch.clientY': touch0?.clientY ?? null,
    locationX: ev.locationX ?? null,
    locationY: ev.locationY ?? null,
    clientX: ev.clientX ?? null,
    clientY: ev.clientY ?? null,
    offsetX: ev.offsetX ?? null,
    offsetY: ev.offsetY ?? null,
    pageX: ev.pageX ?? null,
    pageY: ev.pageY ?? null,
  };

  // Real touch (mobile) — clientX/Y must be a valid number, not just truthy/non-zero
  if (touch0 && typeof touch0.clientX === 'number' && (touch0.clientX !== 0 || touch0.clientY !== 0)) {
    return { x: touch0.clientX, y: touch0.clientY ?? 0, source: 'dom-touch', candidates };
  }

  // Mouse/pointer (desktop) — RNW's responder reliably sets locationX/Y;
  // fall back through raw DOM fields in case the RNW version behaves differently.
  if (ev.locationX !== undefined) {
    return { x: ev.locationX, y: ev.locationY ?? 0, source: 'rn-location', candidates };
  }
  if (ev.clientX !== undefined) {
    return { x: ev.clientX, y: ev.clientY ?? 0, source: 'dom-client', candidates };
  }
  if (ev.offsetX !== undefined) {
    return { x: ev.offsetX, y: ev.offsetY ?? 0, source: 'dom-offset', candidates };
  }
  if (ev.pageX !== undefined) {
    return { x: ev.pageX, y: ev.pageY ?? 0, source: 'dom-page', candidates };
  }

  return { x: 0, y: 0, source: 'none', candidates };
}

function readEventXY(nativeEvent: GestureResponderEvent['nativeEvent']): { x: number; y: number } {
  if (Platform.OS !== 'web') {
    const ev = nativeEvent as NativeEventExtended;
    return {
      x: ev.locationX ?? ev.offsetX ?? 0,
      y: ev.locationY ?? ev.offsetY ?? 0,
    };
  }
  const { x, y } = extractWebCoords(nativeEvent);
  return { x, y };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

type Layout = { cx: number; cy: number; maxRadius: number };

type UseHitInputOptions = {
  layoutRef: React.MutableRefObject<Layout | null>;
  isActive: boolean;
  sessionStartTime: React.MutableRefObject<number>;
  triggerHit: () => void;
};

export function useHitInput({ layoutRef, isActive, sessionStartTime, triggerHit }: UseHitInputOptions) {
  const recordHit = useSessionStore((s) => s.recordHit);
  const settings = useSettingsStore((s) => s.settings);
  const { isAllowed: checkDebounce, reset: resetDebounce } = useDebounce(settings.hitCooldownMs);

  const showDebug = settings.showInputDebug;

  // Refs tracking the active touch gesture
  const activeTouchRef = useRef<{
    startAt: number;
    startX: number;
    startY: number;
    lastMarkAt: number;
    lastX: number;
    lastY: number;
  } | null>(null);
  const lastInputEventRef = useRef<{ at: number; x: number; y: number } | null>(null);

  // Debug overlay state
  const debugTouchIdRef = useRef(0);
  const [inputDebug, setInputDebug] = useState<InputDebugStats>(EMPTY_INPUT_DEBUG);
  const [debugTouches, setDebugTouches] = useState<DebugTouchMarker[]>([]);

  // Clear debug counters/markers when the debug overlay is turned on
  useEffect(() => {
    if (!showDebug) return;
    setInputDebug(EMPTY_INPUT_DEBUG);
    setDebugTouches([]);
  }, [showDebug]);

  // ── Debug helpers ──────────────────────────────────────────────────────────

  const incDebug = useCallback(
    (key: keyof InputDebugStats) => {
      if (!showDebug) return;
      setInputDebug((prev) => ({ ...prev, [key]: prev[key] + 1 }));
    },
    [showDebug],
  );

  const addDebugMarker = useCallback(
    (x: number, y: number, kind: DebugTouchMarker['kind']) => {
      if (!showDebug) return;
      setDebugTouches((prev) => {
        const next = [...prev, { id: ++debugTouchIdRef.current, x, y, kind }];
        return next.length <= MAX_DEBUG_TOUCHES ? next : next.slice(next.length - MAX_DEBUG_TOUCHES);
      });
    },
    [showDebug],
  );

  // ── Core hit processing ────────────────────────────────────────────────────

  const processHit = useCallback(
    (tapX: number, tapY: number): boolean => {
      if (!checkDebounce()) {
        incDebug('blocked');
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

      recordHit(hit, { x: tapX, y: tapY, score, at: now }, isActive);
      incDebug('hits');
      triggerHit();
      return true;
    },
    [checkDebounce, incDebug, isActive, layoutRef, recordHit, sessionStartTime, triggerHit],
  );

  // ── Event handlers ─────────────────────────────────────────────────────────

  // Mouse clicks on web (desktop). Touch events bypass this via onTouchStart.
  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      if (activeTouchRef.current !== null) return;

      const coords = Platform.OS === 'web'
        ? extractWebCoords(e.nativeEvent)
        : { ...readEventXY(e.nativeEvent), source: 'native' as const, candidates: {} };

      if (showDebug) {
        console.log('[hit] handlePress | source:', coords.source, '| x:', coords.x, 'y:', coords.y, '| candidates:', coords.candidates);
      }

      if (coords.source === 'none') return;

      const { x: tapX, y: tapY } = coords;
      const eventTime = Number(e.nativeEvent.timestamp ?? Date.now());
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
      incDebug('touches');
      const wasHit = processHit(tapX, tapY);
      addDebugMarker(tapX, tapY, wasHit ? 'hit' : 'blocked');
    },
    [addDebugMarker, incDebug, processHit, showDebug],
  );

  // Finger down — records the hit. On web, filters out mouse-simulated touch events
  // that desktop browsers synthesise (they lack real touch data and produce wrong coords).
  const handleTouchStart = useCallback(
    (e: GestureResponderEvent) => {
      if (Platform.OS === 'web') {
        e.preventDefault();
        const coords = extractWebCoords(e.nativeEvent);

        if (showDebug) {
          console.log('[hit] handleTouchStart | source:', coords.source, '| x:', coords.x, 'y:', coords.y, '| candidates:', coords.candidates);
        }

        if (coords.source !== 'dom-touch') {
          if (showDebug) console.log('[hit] handleTouchStart — skipped (not a real touch event)');
          return;
        }

        const { x, y } = coords;
        const now = Number(e.nativeEvent.timestamp ?? Date.now());
        activeTouchRef.current = { startAt: now, startX: x, startY: y, lastMarkAt: now, lastX: x, lastY: y };
        incDebug('touches');
        const wasHit = processHit(x, y);
        addDebugMarker(x, y, wasHit ? 'hit' : 'blocked');
        return;
      }

      const { x, y } = readEventXY(e.nativeEvent);
      const now = Number(e.nativeEvent.timestamp ?? Date.now());
      activeTouchRef.current = { startAt: now, startX: x, startY: y, lastMarkAt: now, lastX: x, lastY: y };
      incDebug('touches');
      const wasHit = processHit(x, y);
      addDebugMarker(x, y, wasHit ? 'hit' : 'blocked');
    },
    [addDebugMarker, incDebug, processHit, showDebug],
  );

  // Finger moving — tracks position for debug overlay; hits are not recorded during movement.
  const handleTouchMove = useCallback(
    (e: GestureResponderEvent) => {
      const active = activeTouchRef.current;
      if (!active) return;

      const { x, y } = readEventXY(e.nativeEvent);
      const now = Number(e.nativeEvent.timestamp ?? Date.now());
      const distanceSinceLast = Math.hypot(x - active.lastX, y - active.lastY);
      const elapsedSinceLast = now - active.lastMarkAt;
      if (distanceSinceLast < MOVE_MIN_DISTANCE && elapsedSinceLast < MOVE_SAMPLE_MS) return;

      active.lastX = x;
      active.lastY = y;
      active.lastMarkAt = now;
      incDebug('moves');
      addDebugMarker(x, y, 'move');
    },
    [addDebugMarker, incDebug],
  );

  // Finger lifted — clears the active touch; records scroll/long-press in debug overlay.
  const handleTouchEnd = useCallback(
    (e: GestureResponderEvent) => {
      const active = activeTouchRef.current;
      activeTouchRef.current = null;
      if (!showDebug || !active) return;

      const { x, y } = readEventXY(e.nativeEvent);
      const now = Number(e.nativeEvent.timestamp ?? Date.now());
      const duration = now - active.startAt;
      const totalDistance = Math.hypot(x - active.startX, y - active.startY);

      if (duration >= DEBUG_LONG_TOUCH_MS) incDebug('long');
      if (totalDistance >= DEBUG_SCROLL_DISTANCE) {
        incDebug('scrolls');
        addDebugMarker(x, y, 'scroll');
      }
    },
    [addDebugMarker, incDebug, showDebug],
  );

  // ── Reset ──────────────────────────────────────────────────────────────────

  // Call on session start/stop to clear all input and debug state.
  const resetInputState = useCallback(() => {
    activeTouchRef.current = null;
    lastInputEventRef.current = null;
    resetDebounce();
    setInputDebug(EMPTY_INPUT_DEBUG);
    setDebugTouches([]);
  }, [resetDebounce]);

  return {
    handlePress,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    inputDebug,
    debugTouches,
    resetInputState,
  };
}
