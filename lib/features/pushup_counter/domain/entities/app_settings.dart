class AppSettings {
  const AppSettings({
    this.debounceMs = 400,
    this.goalReps,
    this.soundEnabled = false,
    this.showReps = true,
    this.showPoints = true,
    this.showBullseye = true,
    this.showHitMarker = true,
    this.hideHitAfterSeconds = 3,
    this.bullseyeScale = 1.0,
  });

  final int debounceMs;
  final int? goalReps;
  final bool soundEnabled;
  final bool showReps;
  final bool showPoints;
  final bool showBullseye;
  final bool showHitMarker;
  final int hideHitAfterSeconds;
  final double bullseyeScale;

  AppSettings copyWith({
    int? debounceMs,
    int? Function()? goalReps,
    bool? soundEnabled,
    bool? showReps,
    bool? showPoints,
    bool? showBullseye,
    bool? showHitMarker,
    int? hideHitAfterSeconds,
    double? bullseyeScale,
  }) {
    return AppSettings(
      debounceMs: debounceMs ?? this.debounceMs,
      goalReps: goalReps != null ? goalReps() : this.goalReps,
      soundEnabled: soundEnabled ?? this.soundEnabled,
      showReps: showReps ?? this.showReps,
      showPoints: showPoints ?? this.showPoints,
      showBullseye: showBullseye ?? this.showBullseye,
      showHitMarker: showHitMarker ?? this.showHitMarker,
      hideHitAfterSeconds: hideHitAfterSeconds ?? this.hideHitAfterSeconds,
      bullseyeScale: bullseyeScale ?? this.bullseyeScale,
    );
  }
}
