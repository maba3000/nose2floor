export interface Hit {
  dx: number;
  dy: number;
  distance: number;
  score: number;
  timestamp: number;
}

export interface WorkoutSession {
  id: string;
  startedAt: number;
  durationSeconds: number;
  reps: number;
  totalScore: number;
  hits: Hit[];
  bullseyeScale: number;
}

export type CornerWidget = 'hits' | 'points' | 'timer' | 'goal' | 'none';

export interface AppSettings {
  hitCooldownMs: number;
  sessionMode: 'manual' | 'auto';
  showIntro: boolean;
  hapticsEnabled: boolean;
  themeMode: 'light' | 'dark' | 'system';
  corners: { topLeft: CornerWidget; topRight: CornerWidget; bottomLeft: CornerWidget };
  dailyGoal: number;
  heatmapThresholds: [number, number, number, number];
  heatmapShowGoalStar: boolean;
  heatmapShowHitCount: boolean;
  insightsShowPreview: boolean;
  insightsShowActivity: boolean;
  insightsShowStats: boolean;
  showBullseye: boolean;
  bullseyeScale: number;
  showHitMarkers: boolean;
  hitMarkerAutoHideMs: number;
  showInputDebug: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  hitCooldownMs: 400,
  sessionMode: 'manual',
  showIntro: true,
  hapticsEnabled: true,
  themeMode: 'system',
  corners: { topLeft: 'hits', topRight: 'points', bottomLeft: 'timer' },
  dailyGoal: 100,
  heatmapThresholds: [1, 25, 50, 75],
  heatmapShowGoalStar: true,
  heatmapShowHitCount: false,
  insightsShowPreview: true,
  insightsShowActivity: true,
  insightsShowStats: true,
  showBullseye: true,
  bullseyeScale: 1.0,
  showHitMarkers: true,
  hitMarkerAutoHideMs: 3000,
  showInputDebug: false,
};
