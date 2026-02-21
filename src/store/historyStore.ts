import { create } from 'zustand';
import { WorkoutSession } from '../domain/entities';
import { loadHistory, saveHistory } from '../persistence/storage';

interface HistoryStore {
  history: WorkoutSession[];
  addSession: (session: WorkoutSession) => void;
  deleteSession: (id: string) => void;
  replaceHistory: (sessions: WorkoutSession[]) => void;
  _hydrate: () => void;
}

export const useHistoryStore = create<HistoryStore>()((set, get) => ({
  history: [],

  addSession(session) {
    const next = [session, ...get().history];
    set({ history: next });
    saveHistory(next);
  },

  deleteSession(id) {
    const next = get().history.filter((s) => s.id !== id);
    set({ history: next });
    saveHistory(next);
  },

  replaceHistory(sessions) {
    set({ history: sessions });
    saveHistory(sessions);
  },

  _hydrate() {
    set({ history: loadHistory() });
  },
}));
