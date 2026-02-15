class Hit {
  const Hit({
    required this.timestampMs,
    required this.dx,
    required this.dy,
    required this.distance,
    required this.maxRadius,
    required this.score,
  });

  /// Milliseconds since session start.
  final int timestampMs;

  /// Horizontal offset from bull's eye center (px). Negative = left.
  final double dx;

  /// Vertical offset from bull's eye center (px). Negative = above.
  final double dy;

  /// Distance from bull's eye center (px).
  final double distance;

  /// Outer radius of the target at the time of hit (px).
  final double maxRadius;

  /// Score awarded for this hit.
  final int score;
}
