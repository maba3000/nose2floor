import { create } from 'zustand';
import { Hit } from '../domain/entities';

interface SessionState {
  isActive: boolean;
  reps: number;
  totalScore: number;
  elapsedSeconds: number;
  hits: Hit[];
  lastHit: Hit | null;
  lastTap: { x: number; y: number; score: number; at: number } | null;
  startSession: () => void;
  recordHit: (
    hit: Hit,
    tap: { x: number; y: number; score: number; at: number },
    saveToSession: boolean,
  ) => void;
  tickTimer: () => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  isActive: false,
  reps: 0,
  totalScore: 0,
  elapsedSeconds: 0,
  hits: [],
  lastHit: null,
  lastTap: null,

  startSession: () =>
    set({
      isActive: true,
      reps: 0,
      totalScore: 0,
      elapsedSeconds: 0,
      hits: [],
      lastHit: null,
      lastTap: null,
    }),

  recordHit: (hit, tap, saveToSession) =>
    set((s) => ({
      reps: s.reps + 1,
      totalScore: s.totalScore + hit.score,
      hits: saveToSession ? [...s.hits, hit] : s.hits,
      lastHit: hit,
      lastTap: tap,
    })),

  tickTimer: () => set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 })),

  reset: () =>
    set({
      isActive: false,
      reps: 0,
      totalScore: 0,
      elapsedSeconds: 0,
      hits: [],
      lastHit: null,
      lastTap: null,
    }),
}));
