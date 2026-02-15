class WorkoutSession {
  const WorkoutSession({
    required this.id,
    required this.startedAt,
    required this.durationSeconds,
    required this.reps,
  });

  final String id;
  final DateTime startedAt;
  final int durationSeconds;
  final int reps;
}
