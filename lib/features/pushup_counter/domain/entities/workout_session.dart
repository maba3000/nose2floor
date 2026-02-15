import 'package:nose2floor/features/pushup_counter/domain/entities/hit.dart';

class WorkoutSession {
  const WorkoutSession({
    required this.id,
    required this.startedAt,
    required this.durationSeconds,
    required this.reps,
    this.totalScore = 0,
    this.bullseyeScale = 1.0,
    this.hits = const [],
  });

  final String id;
  final DateTime startedAt;
  final int durationSeconds;
  final int reps;
  final int totalScore;
  final double bullseyeScale;
  final List<Hit> hits;
}
