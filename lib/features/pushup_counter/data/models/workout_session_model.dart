import 'dart:convert';

import 'package:nose2floor/features/pushup_counter/domain/entities/hit.dart';
import 'package:nose2floor/features/pushup_counter/domain/entities/workout_session.dart';

class WorkoutSessionModel extends WorkoutSession {
  const WorkoutSessionModel({
    required super.id,
    required super.startedAt,
    required super.durationSeconds,
    required super.reps,
    super.totalScore,
    super.bullseyeScale,
    super.hits,
  });

  factory WorkoutSessionModel.fromEntity(WorkoutSession session) {
    return WorkoutSessionModel(
      id: session.id,
      startedAt: session.startedAt,
      durationSeconds: session.durationSeconds,
      reps: session.reps,
      totalScore: session.totalScore,
      bullseyeScale: session.bullseyeScale,
      hits: session.hits,
    );
  }

  factory WorkoutSessionModel.fromJson(Map<String, dynamic> json) {
    return WorkoutSessionModel(
      id: json['id'] as String,
      startedAt: DateTime.parse(json['startedAt'] as String),
      durationSeconds: json['durationSeconds'] as int,
      reps: json['reps'] as int,
      totalScore: json['totalScore'] as int? ?? 0,
      bullseyeScale: (json['bullseyeScale'] as num?)?.toDouble() ?? 1.0,
      hits: _hitsFromJson(json['hits']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'startedAt': startedAt.toIso8601String(),
      'durationSeconds': durationSeconds,
      'reps': reps,
      'totalScore': totalScore,
      'bullseyeScale': bullseyeScale,
      'hits': hits.map(_hitToJson).toList(),
    };
  }

  static List<Hit> _hitsFromJson(Object? value) {
    if (value == null) return [];
    return (value as List<dynamic>).map((e) {
      final h = e as Map<String, dynamic>;
      return Hit(
        timestampMs: h['t'] as int,
        dx: (h['dx'] as num).toDouble(),
        dy: (h['dy'] as num).toDouble(),
        distance: (h['dist'] as num).toDouble(),
        maxRadius: (h['maxR'] as num).toDouble(),
        score: h['score'] as int,
      );
    }).toList();
  }

  static Map<String, dynamic> _hitToJson(Hit h) {
    return {
      't': h.timestampMs,
      'dx': double.parse(h.dx.toStringAsFixed(1)),
      'dy': double.parse(h.dy.toStringAsFixed(1)),
      'dist': double.parse(h.distance.toStringAsFixed(1)),
      'maxR': double.parse(h.maxRadius.toStringAsFixed(1)),
      'score': h.score,
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
