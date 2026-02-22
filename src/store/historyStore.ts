import { create } from 'zustand';
import { WorkoutSession } from '../domain/entities';
import { loadHistory, saveHistory } from '../persistence/storage';

interface HistoryStore {
  history: WorkoutSession[];
  addSession: (session: WorkoutSession) => void;
  deleteSession: (id: string) => void;
  upsertSession: (session: WorkoutSession) => void;
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

  upsertSession(session) {
    const history = get().history;
    const index = history.findIndex((s) => s.id === session.id);
    const next =
      index === -1 ? [session, ...history] : history.map((s, i) => (i === index ? session : s));
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
