// ─── Store barrel ────────────────────────────────────────────────────────────
// Re-exports every Zustand store hook so consumers can write:
//   import { useSessionStore, useSettingsStore } from '@/store'

export { useHistoryStore } from './historyStore';
export { useSessionStore } from './sessionStore';
export { useSettingsStore } from './settingsStore';
