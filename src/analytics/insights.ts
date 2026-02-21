import { WorkoutSession } from '../domain/entities';

export interface InsightStat {
  label: string;
  value: number;
}

export function buildInsights(history: WorkoutSession[]): InsightStat[] {
  const sessions = history.length;
  const totalHits = history.reduce((sum, s) => sum + s.reps, 0);
  const totalPoints = history.reduce((sum, s) => sum + s.totalScore, 0);
  const bestHits = history.reduce((max, s) => Math.max(max, s.reps), 0);
  const bestPoints = history.reduce((max, s) => Math.max(max, s.totalScore), 0);
  const avgHits = sessions === 0 ? 0 : Math.round(totalHits / sessions);

  return [
    { label: 'Sessions', value: sessions },
    { label: 'Total Hits', value: totalHits },
    { label: 'Total Points', value: totalPoints },
    { label: 'Best Hits', value: bestHits },
    { label: 'Best Points', value: bestPoints },
    { label: 'Avg Hits', value: avgHits },
  ];
}
