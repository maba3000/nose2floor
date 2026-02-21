import React, { useMemo, useRef, useState } from 'react';
import { Text, StyleSheet, Pressable, Platform, View, ViewStyle } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';

interface Props {
  label: string;
  color: string;
  onHold: () => void;
  holdDurationMs?: number;
}

export function HoldButton({ label, color, onHold, holdDurationMs = 600 }: Props) {
  if (Platform.OS === 'web') {
    return (
      <WebHoldButton label={label} color={color} onHold={onHold} holdDurationMs={holdDurationMs} />
    );
  }
  return (
    <NativeHoldButton label={label} color={color} onHold={onHold} holdDurationMs={holdDurationMs} />
  );
}

function NativeHoldButton({ label, color, onHold, holdDurationMs = 600 }: Props) {
  const scale = useSharedValue(1);
  const progress = useSharedValue(0);

  const gesture = Gesture.LongPress()
    .minDuration(holdDurationMs)
    .onBegin(() => {
      scale.value = withSpring(0.92);
      progress.value = 0;
      progress.value = withTiming(1, { duration: holdDurationMs });
    })
    .onStart(() => {
      runOnJS(onHold)();
    })
    .onFinalize(() => {
      scale.value = withSpring(1);
      cancelAnimation(progress);
      progress.value = 0;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: color,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${Math.round(progress.value * 100)}%`,
    opacity: progress.value === 0 ? 0 : 0.35,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.button, animatedStyle]}>
        <Animated.View pointerEvents="none" style={[styles.progress, progressStyle]} />
        <Text style={styles.label}>{label}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    shadowOpacity: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  progress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '400',
    zIndex: 1,
  },
});

function WebHoldButton({ label, color, onHold, holdDurationMs = 600 }: Props) {
  const [pressed, setPressed] = useState(false);
  const [progress, setProgress] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const baseStyle = useMemo<ViewStyle>(
    () => ({
      backgroundColor: color,
      transform: [{ scale: pressed ? 0.94 : 1 }],
    }),
    [color, pressed],
  );

  const progressStyle = useMemo<ViewStyle>(
    () => ({
      width: `${Math.round(progress * 100)}%`,
      opacity: progress === 0 ? 0 : 0.35,
    }),
    [progress],
  );

  const cancelRaf = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const tick = () => {
    const elapsed = performance.now() - startRef.current;
    const next = Math.min(1, elapsed / holdDurationMs);
    setProgress(next);
    if (next < 1) {
      rafRef.current = requestAnimationFrame(tick);
    }
  };

  return (
    <Pressable
      onPressIn={(e) => {
        // Prevent parent press handlers (web bubbling).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (e as any).stopPropagation?.();
        setPressed(true);
        setProgress(0);
        startRef.current = performance.now();
        cancelRaf();
        rafRef.current = requestAnimationFrame(tick);
        timeoutRef.current = setTimeout(onHold, holdDurationMs);
      }}
      onPressOut={(e) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (e as any).stopPropagation?.();
        setPressed(false);
        setProgress(0);
        cancelRaf();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }}
      onPress={(e) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (e as any).stopPropagation?.();
      }}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...({ onContextMenu: (e: any) => e.preventDefault() } as any)}
      style={[styles.button, baseStyle]}
    >
      <View pointerEvents="none" style={[styles.progress, progressStyle]} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}
