// ─── Hooks barrel ────────────────────────────────────────────────────────────
// Re-exports every custom hook so consumers can write:
//   import { useHaptics, useHitInput } from '@/hooks'

export { useDebounce } from './useDebounce';
export { useHaptics } from './useHaptics';
export { useHitInput } from './useHitInput';
export type { InputDebugStats, DebugTouchMarker } from './useHitInput';
export { useTheme } from './useTheme';
export { useTimer } from './useTimer';
