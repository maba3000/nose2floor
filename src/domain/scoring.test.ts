import { computeScore, computeDistance } from './scoring';

test("bull's-eye (distance 0) scores 10", () => {
  expect(computeScore(0)).toBe(10);
});

test('ring boundaries map to correct scores', () => {
  expect(computeScore(0.19)).toBe(10);
  expect(computeScore(0.21)).toBe(8);
  expect(computeScore(0.41)).toBe(6);
  expect(computeScore(0.61)).toBe(4);
  expect(computeScore(0.81)).toBe(2);
  expect(computeScore(1.01)).toBe(1);
});

test('computeDistance returns 0 at centre', () => {
  expect(computeDistance(150, 150, 150, 150, 150)).toBe(0);
});
