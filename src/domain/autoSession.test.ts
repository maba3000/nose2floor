import { buildAutoSessionSnapshot } from './autoSession';

const base = {
  sessionMode: 'auto' as const,
  isActive: true,
  id: 's1',
  startedAt: 1000,
  durationSeconds: 20,
  reps: 3,
  totalScore: 24,
  hits: [
    { dx: 0, dy: 0, distance: 0, score: 10, timestamp: 1 },
    { dx: 0.1, dy: 0.1, distance: 0.2, score: 8, timestamp: 2 },
    { dx: 0.2, dy: 0.2, distance: 0.4, score: 6, timestamp: 3 },
  ],
  bullseyeScale: 1,
};

test('buildAutoSessionSnapshot returns null for non-auto mode', () => {
  expect(buildAutoSessionSnapshot({ ...base, sessionMode: 'manual' })).toBeNull();
});

test('buildAutoSessionSnapshot returns null when inactive or empty', () => {
  expect(buildAutoSessionSnapshot({ ...base, isActive: false })).toBeNull();
  expect(buildAutoSessionSnapshot({ ...base, reps: 0 })).toBeNull();
});

test('buildAutoSessionSnapshot returns snapshot for active auto session', () => {
  const snapshot = buildAutoSessionSnapshot(base);
  expect(snapshot).not.toBeNull();
  expect(snapshot?.id).toBe('s1');
  expect(snapshot?.reps).toBe(3);
  expect(snapshot?.totalScore).toBe(24);
});
