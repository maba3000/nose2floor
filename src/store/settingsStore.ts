import { create } from 'zustand';
import { AppSettings, DEFAULT_SETTINGS } from '../domain/entities';
import { loadSettings, saveSettings } from '../persistence/storage';

interface SettingsStore {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  _hydrate: () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,

  updateSettings(patch) {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    saveSettings(next);
  },

  _hydrate() {
    set({ settings: loadSettings() });
  },
}));
