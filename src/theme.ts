import type { ColorSchemeName } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

export type Theme = {
  isDark: boolean;
  background: string;
  card: string;
  cardSoft: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  textFaint: string;
  border: string;
  borderStrong: string;
  actionPrimary: string;
  actionDanger: string;
  dangerBackground: string;
  dangerText: string;
  dangerBorder: string;
};

export const lightTheme: Theme = {
  isDark: false,
  background: '#F5F0EB',
  card: '#FFFFFF',
  cardSoft: 'rgba(255,255,255,0.85)',
  text: '#1A202C',
  textMuted: 'rgba(0,0,0,0.65)',
  textSubtle: 'rgba(0,0,0,0.55)',
  textFaint: 'rgba(0,0,0,0.4)',
  border: 'rgba(0,0,0,0.08)',
  borderStrong: 'rgba(0,0,0,0.12)',
  actionPrimary: '#2E7D32',
  actionDanger: '#E53935',
  dangerBackground: '#F7E7E2',
  dangerText: '#6B1A0D',
  dangerBorder: 'rgba(0,0,0,0.12)',
};

export const darkTheme: Theme = {
  isDark: true,
  background: '#0F0F10',
  card: '#1B1B1E',
  cardSoft: '#232326',
  text: '#F2F2F2',
  textMuted: 'rgba(255,255,255,0.75)',
  textSubtle: 'rgba(255,255,255,0.6)',
  textFaint: 'rgba(255,255,255,0.45)',
  border: 'rgba(255,255,255,0.12)',
  borderStrong: 'rgba(255,255,255,0.18)',
  actionPrimary: '#2D6D46',
  actionDanger: '#7A1E1B',
  dangerBackground: '#3A1B18',
  dangerText: '#FFB4A9',
  dangerBorder: 'rgba(255,255,255,0.18)',
};

export function resolveTheme(mode: ThemeMode, system: ColorSchemeName): Theme {
  if (mode === 'system') {
    return system === 'dark' ? darkTheme : lightTheme;
  }
  return mode === 'dark' ? darkTheme : lightTheme;
}
