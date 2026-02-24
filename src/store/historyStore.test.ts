import { act, renderHook } from '@testing-library/react-native';
import { useHistoryStore } from './historyStore';

const sessionA = {
  id: 'a',
  startedAt: 1000,
  durationSeconds: 10,
  reps: 2,
  totalScore: 12,
  hits: [],
  bullseyeScale: 1,
};

const sessionAUpdated = {
  ...sessionA,
  reps: 3,
  totalScore: 18,
};

beforeEach(() => {
  useHistoryStore.setState({ history: [] });
});

test('addSession prepends session', () => {
  const { result } = renderHook(() => useHistoryStore());
  act(() => result.current.addSession(sessionA));
  expect(result.current.history).toHaveLength(1);
  expect(result.current.history[0].id).toBe('a');
});

test('upsertSession updates existing session without duplicating', () => {
  const { result } = renderHook(() => useHistoryStore());
  act(() => result.current.addSession(sessionA));
  act(() => result.current.upsertSession(sessionAUpdated));
  expect(result.current.history).toHaveLength(1);
  expect(result.current.history[0].reps).toBe(3);
  expect(result.current.history[0].totalScore).toBe(18);
});
