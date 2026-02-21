import 'react-native-gesture-handler';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { useHistoryStore } from '@/store/historyStore';

export default function RootLayout() {
  const hydrateSettings = useSettingsStore((s) => s._hydrate);
  const hydrateHistory = useHistoryStore((s) => s._hydrate);

  useEffect(() => {
    hydrateSettings();
    hydrateHistory();
  }, [hydrateSettings, hydrateHistory]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
