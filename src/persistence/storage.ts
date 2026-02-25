import { Platform } from 'react-native';
import type { WorkoutSession, AppSettings } from '../domain/entities';
import { DEFAULT_SETTINGS } from '../domain/entities';

type StorageLike = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
};

let storage: StorageLike;

if (Platform.OS === 'web') {
  const memory = new Map<string, string>();
  storage = {
    getString(key) {
      try {
        return localStorage.getItem(key) ?? undefined;
      } catch {
        return memory.get(key);
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch {
        memory.set(key, value);
      }
    },
  };
} else {
  const { MMKV } = require('react-native-mmkv');
  storage = new MMKV({ id: 'nose2floor' });
}

export function loadSettings(): AppSettings {
  const raw = storage.getString('settings');
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as AppSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  storage.set('settings', JSON.stringify(settings));
}

export function loadHistory(): WorkoutSession[] {
  const raw = storage.getString('history');
  if (!raw) return [];
  try {
    return JSON.parse(raw) as WorkoutSession[];
  } catch {
    return [];
  }
}

export function saveHistory(history: WorkoutSession[]): void {
  storage.set('history', JSON.stringify(history));
}

export interface ExportData {
  version: 1;
  exportedAt: string;
  settings: AppSettings;
  history: WorkoutSession[];
}

export function exportData(settings: AppSettings, history: WorkoutSession[]): string {
  const payload: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    history,
  };
  return JSON.stringify(payload, null, 2);
}

export function importData(raw: string): ExportData {
  const parsed = JSON.parse(raw) as ExportData;
  if (parsed.version !== 1) throw new Error('Unsupported export version');
  return parsed;
}
