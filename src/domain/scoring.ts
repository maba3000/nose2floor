export function computeScore(distance: number): number {
  if (distance <= 0.2) return 10;
  if (distance <= 0.4) return 8;
  if (distance <= 0.6) return 6;
  if (distance <= 0.8) return 4;
  if (distance <= 1.0) return 2;
  return 1;
}

export function computeDistance(
  tapX: number,
  tapY: number,
  centreX: number,
  centreY: number,
  maxRadius: number,
): number {
  const dx = tapX - centreX;
  const dy = tapY - centreY;
  return Math.sqrt(dx * dx + dy * dy) / maxRadius;
}
