import { applyHitsCorrection } from './sessionCorrections';

const session = {
  id: 'session-1',
  startedAt: 1000,
  durationSeconds: 30,
  reps: 3,
  totalScore: 24,
  hits: [
    { dx: 0, dy: 0, distance: 0, score: 10, timestamp: 1 },
    { dx: 0.1, dy: 0.1, distance: 0.2, score: 8, timestamp: 2 },
    { dx: 0.2, dy: 0.2, distance: 0.4, score: 6, timestamp: 3 },
  ],
  bullseyeScale: 1,
};

test('applyHitsCorrection rejects non-numeric values', () => {
  const result = applyHitsCorrection(session, 'abc');
  expect(result).toEqual({ ok: false, error: 'invalid_hits' });
});

test('applyHitsCorrection allows values above recorded markers', () => {
  const result = applyHitsCorrection(session, '4');
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.session.reps).toBe(4);
  expect(result.session.hits).toHaveLength(3);
  expect(result.session.totalScore).toBe(24);
});

test('applyHitsCorrection trims hits and recalculates points', () => {
  const result = applyHitsCorrection(session, '2');
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.session.reps).toBe(2);
  expect(result.session.hits).toHaveLength(2);
  expect(result.session.totalScore).toBe(18);
});
