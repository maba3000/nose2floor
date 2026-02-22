import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/store/settingsStore';
import { resolveTheme } from '@/theme';

export function useTheme() {
  const mode = useSettingsStore((s) => s.settings.themeMode);
  const system = useColorScheme();
  return useMemo(() => resolveTheme(mode, system), [mode, system]);
}
