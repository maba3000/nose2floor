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

export interface AppSettings {
  hitCooldownMs: number;
  sessionMode: 'manual' | 'auto';
  showIntro: boolean;
  showHitCount: boolean;
  showPoints: boolean;
  showBullseye: boolean;
  showTimer: boolean;
  bullseyeScale: number;
  showHitMarkers: boolean;
  hitMarkerAutoHideMs: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  hitCooldownMs: 400,
  sessionMode: 'manual',
  showIntro: true,
  showHitCount: true,
  showPoints: true,
  showBullseye: true,
  showTimer: true,
  bullseyeScale: 1.0,
  showHitMarkers: true,
  hitMarkerAutoHideMs: 3000,
};
