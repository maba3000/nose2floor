import 'react-native-gesture-handler';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useSettingsStore } from '@/store/settingsStore';
import { useHistoryStore } from '@/store/historyStore';
import { useTheme } from '@/hooks/useTheme';

export default function RootLayout() {
  const hydrateSettings = useSettingsStore((s) => s._hydrate);
  const hydrateHistory = useHistoryStore((s) => s._hydrate);
  const theme = useTheme();

  useEffect(() => {
    hydrateSettings();
    hydrateHistory();
  }, [hydrateSettings, hydrateHistory]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme.background);
  }, [theme.background]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
