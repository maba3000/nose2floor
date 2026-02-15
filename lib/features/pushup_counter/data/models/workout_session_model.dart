import 'dart:convert';

import 'package:nose2floor/features/pushup_counter/domain/entities/workout_session.dart';

class WorkoutSessionModel extends WorkoutSession {
  const WorkoutSessionModel({
    required super.id,
    required super.startedAt,
    required super.durationSeconds,
    required super.reps,
  });

  factory WorkoutSessionModel.fromEntity(WorkoutSession session) {
    return WorkoutSessionModel(
      id: session.id,
      startedAt: session.startedAt,
      durationSeconds: session.durationSeconds,
      reps: session.reps,
    );
  }

  factory WorkoutSessionModel.fromJson(Map<String, dynamic> json) {
    return WorkoutSessionModel(
      id: json['id'] as String,
      startedAt: DateTime.parse(json['startedAt'] as String),
      durationSeconds: json['durationSeconds'] as int,
      reps: json['reps'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'startedAt': startedAt.toIso8601String(),
      'durationSeconds': durationSeconds,
      'reps': reps,
    };
  }

  static List<WorkoutSessionModel> fromJsonList(String jsonString) {
    if (jsonString.isEmpty) return [];
    final List<dynamic> list = json.decode(jsonString) as List<dynamic>;
    return list
        .map((e) => WorkoutSessionModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static String toJsonList(List<WorkoutSession> sessions) {
    final models = sessions.map(WorkoutSessionModel.fromEntity);
    return json.encode(models.map((m) => m.toJson()).toList());
  }
}
