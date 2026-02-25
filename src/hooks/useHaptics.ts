import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export function useHaptics(enabled: boolean) {
  const triggerHit = useCallback(() => {
    if (Platform.OS === 'web' || !enabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [enabled]);

  const triggerStart = useCallback(() => {
    if (Platform.OS === 'web' || !enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [enabled]);

  const triggerStop = useCallback(() => {
    if (Platform.OS === 'web' || !enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  }, [enabled]);

  return { triggerHit, triggerStart, triggerStop };
}
