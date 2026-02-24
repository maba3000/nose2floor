import { buildInsights, filterByRange } from './insights';

const history = [
  {
    id: 'a',
    startedAt: 1000,
    durationSeconds: 20,
    reps: 3,
    totalScore: 24,
    hits: [],
    bullseyeScale: 1,
  },
  {
    id: 'b',
    startedAt: 2000,
    durationSeconds: 30,
    reps: 2,
    totalScore: 12,
    hits: [],
    bullseyeScale: 1,
  },
  {
    id: 'c',
    startedAt: 3000,
    durationSeconds: 40,
    reps: 4,
    totalScore: 30,
    hits: [],
    bullseyeScale: 1,
  },
];

test('filterByRange returns only sessions in range', () => {
  const filtered = filterByRange(history, 1500, 2500);
  expect(filtered.map((s) => s.id)).toEqual(['b']);
});

test('buildInsights aggregates filtered sessions', () => {
  const stats = buildInsights([history[0], history[2]]);
  expect(stats.find((s) => s.label === 'Sessions')?.value).toBe('2');
  expect(stats.find((s) => s.label === 'Total Hits')?.value).toBe('7');
  expect(stats.find((s) => s.label === 'Total Points')?.value).toBe('54');
});
