import 'dart:convert';

import 'package:nose2floor/features/pushup_counter/domain/entities/app_settings.dart';

class AppSettingsModel extends AppSettings {
  const AppSettingsModel({
    super.debounceMs,
    super.goalReps,
    super.soundEnabled,
    super.showReps,
    super.showPoints,
    super.showBullseye,
    super.showHitMarker,
    super.hideHitAfterSeconds,
    super.bullseyeScale,
  });

  factory AppSettingsModel.fromEntity(AppSettings settings) {
    return AppSettingsModel(
      debounceMs: settings.debounceMs,
      goalReps: settings.goalReps,
      soundEnabled: settings.soundEnabled,
      showReps: settings.showReps,
      showPoints: settings.showPoints,
      showBullseye: settings.showBullseye,
      showHitMarker: settings.showHitMarker,
      hideHitAfterSeconds: settings.hideHitAfterSeconds,
      bullseyeScale: settings.bullseyeScale,
    );
  }

  factory AppSettingsModel.fromJson(Map<String, dynamic> json) {
    return AppSettingsModel(
      debounceMs: json['debounceMs'] as int? ?? 400,
      goalReps: json['goalReps'] as int?,
      soundEnabled: json['soundEnabled'] as bool? ?? false,
      showReps: json['showReps'] as bool? ?? true,
      showPoints: json['showPoints'] as bool? ?? true,
      showBullseye: json['showBullseye'] as bool? ?? true,
      showHitMarker: json['showHitMarker'] as bool? ?? true,
      hideHitAfterSeconds: json['hideHitAfterSeconds'] as int? ?? 3,
      bullseyeScale: (json['bullseyeScale'] as num?)?.toDouble() ?? 1.0,
    );
  }

  factory AppSettingsModel.fromJsonString(String jsonString) {
    if (jsonString.isEmpty) return const AppSettingsModel();
    return AppSettingsModel.fromJson(
      json.decode(jsonString) as Map<String, dynamic>,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'debounceMs': debounceMs,
      'goalReps': goalReps,
      'soundEnabled': soundEnabled,
      'showReps': showReps,
      'showPoints': showPoints,
      'showBullseye': showBullseye,
      'showHitMarker': showHitMarker,
      'hideHitAfterSeconds': hideHitAfterSeconds,
      'bullseyeScale': bullseyeScale,
    };
  }

  String toJsonString() => json.encode(toJson());
}
