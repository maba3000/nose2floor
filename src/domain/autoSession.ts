import type { Hit, WorkoutSession } from './entities';

interface AutoSessionSnapshotInput {
  sessionMode: 'manual' | 'auto';
  isActive: boolean;
  id: string;
  startedAt: number;
  durationSeconds: number;
  reps: number;
  totalScore: number;
  hits: Hit[];
  bullseyeScale: number;
}

export function buildAutoSessionSnapshot(input: AutoSessionSnapshotInput): WorkoutSession | null {
  if (input.sessionMode !== 'auto') return null;
  if (!input.isActive) return null;
  if (input.reps <= 0) return null;

  return {
    id: input.id,
    startedAt: input.startedAt,
    durationSeconds: input.durationSeconds,
    reps: input.reps,
    totalScore: input.totalScore,
    hits: input.hits,
    bullseyeScale: input.bullseyeScale,
  };
}
