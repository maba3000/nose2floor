// Shared ring colour palettes and zone radii used by BullseyeCanvas and HitMapCanvas.
// Both platforms (Skia / web-View) import from here so changes are never duplicated.

export const RING_COLORS_LIGHT = ['#FFFFFF', '#FFB74D', '#FF7043', '#E53935', '#D32F2F'] as const;
export const RING_COLORS_DARK = ['#2A2A2D', '#6F4B1E', '#7C3A25', '#7A1E1B', '#5E1412'] as const;

/** Fraction of maxRadius for each ring, outermost first. */
export const ZONES = [1.0, 0.8, 0.6, 0.4, 0.2] as const;
