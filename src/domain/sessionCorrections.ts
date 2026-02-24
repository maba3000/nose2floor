import type { WorkoutSession } from './entities';

type SessionCorrectionError = 'invalid_hits' | 'exceeds_recorded_hits';

export type SessionCorrectionResult =
  | { ok: true; session: WorkoutSession }
  | { ok: false; error: SessionCorrectionError };

export function applyHitsCorrection(
  session: WorkoutSession,
  rawHits: string,
): SessionCorrectionResult {
  const trimmed = rawHits.trim();
  if (!/^\d+$/.test(trimmed)) {
    return { ok: false, error: 'invalid_hits' };
  }

  const nextReps = Number(trimmed);
  if (!Number.isSafeInteger(nextReps) || nextReps < 0) {
    return { ok: false, error: 'invalid_hits' };
  }

  if (nextReps > session.hits.length) {
    return { ok: false, error: 'exceeds_recorded_hits' };
  }

  const nextHits = session.hits.slice(0, nextReps);
  const nextTotalScore = nextHits.reduce((sum, hit) => sum + hit.score, 0);

  return {
    ok: true,
    session: {
      ...session,
      reps: nextReps,
      totalScore: nextTotalScore,
      hits: nextHits,
    },
  };
}
