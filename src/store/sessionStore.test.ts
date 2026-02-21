import { act, renderHook } from '@testing-library/react-native';
import { useSessionStore } from './sessionStore';

test('recordHit increments reps and totalScore', () => {
  const { result } = renderHook(() => useSessionStore());
  act(() => result.current.startSession());
  act(() =>
    result.current.recordHit(
      { dx: 0, dy: 0, distance: 0, score: 10, timestamp: 0 },
      { x: 0, y: 0, score: 10, at: 0 },
      true,
    ),
  );
  expect(result.current.reps).toBe(1);
  expect(result.current.totalScore).toBe(10);
});
