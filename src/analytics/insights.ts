import { WorkoutSession } from '../domain/entities';

export type RangeKey = 'week' | 'month' | 'year' | 'all' | 'custom';

export interface InsightStat {
  label: string;
  value: string;
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export function getRangeMs(
  range: RangeKey,
  customStart?: number,
  customEnd?: number,
): [number, number] {
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const endMs = endOfToday.getTime();

  if (range === 'custom') {
    return [customStart ?? 0, customEnd ?? endMs];
  }

  if (range === 'all') {
    return [0, endMs];
  }

  const startDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);

  if (range === 'week') {
    startDate.setDate(startDate.getDate() - 6);
  } else if (range === 'month') {
    startDate.setDate(startDate.getDate() - 29);
  } else if (range === 'year') {
    startDate.setFullYear(startDate.getFullYear() - 1);
    startDate.setDate(startDate.getDate() + 1);
  }

  return [startDate.getTime(), endMs];
}

export function filterByRange(
  history: WorkoutSession[],
  startMs: number,
  endMs: number,
): WorkoutSession[] {
  return history.filter((s) => s.startedAt >= startMs && s.startedAt <= endMs);
}

export function buildInsights(history: WorkoutSession[]): InsightStat[] {
  const sessions = history.length;
  const totalHits = history.reduce((sum, s) => sum + s.reps, 0);
  const totalPoints = history.reduce((sum, s) => sum + s.totalScore, 0);
  const bestHits = history.reduce((max, s) => Math.max(max, s.reps), 0);
  const bestPoints = history.reduce((max, s) => Math.max(max, s.totalScore), 0);
  const avgHits = sessions === 0 ? 0 : Math.round(totalHits / sessions);
  const totalSeconds = history.reduce((sum, s) => sum + s.durationSeconds, 0);

  return [
    { label: 'Sessions', value: String(sessions) },
    { label: 'Total Hits', value: String(totalHits) },
    { label: 'Total Points', value: String(totalPoints) },
    { label: 'Best Hits', value: String(bestHits) },
    { label: 'Best Points', value: String(bestPoints) },
    { label: 'Avg Hits', value: String(avgHits) },
    { label: 'Total Time', value: formatDuration(totalSeconds) },
  ];
}
