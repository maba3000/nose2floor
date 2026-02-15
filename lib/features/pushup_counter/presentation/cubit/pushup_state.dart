import 'package:equatable/equatable.dart';
import 'package:nose2floor/features/pushup_counter/domain/entities/app_settings.dart';
import 'package:nose2floor/features/pushup_counter/domain/entities/workout_session.dart';

class PushupState extends Equatable {
  const PushupState({
    this.isActive = false,
    this.reps = 0,
    this.elapsedSeconds = 0,
    this.settings = const AppSettings(),
    this.history = const [],
    this.totalScore = 0,
    this.lastTapScore = 0,
    this.lastTapX,
    this.lastTapY,
  });

  final bool isActive;
  final int reps;
  final int elapsedSeconds;
  final AppSettings settings;
  final List<WorkoutSession> history;
  final int totalScore;
  final int lastTapScore;
  final double? lastTapX;
  final double? lastTapY;

  PushupState copyWith({
    bool? isActive,
    int? reps,
    int? elapsedSeconds,
    AppSettings? settings,
    List<WorkoutSession>? history,
    int? totalScore,
    int? lastTapScore,
    double? Function()? lastTapX,
    double? Function()? lastTapY,
  }) {
    return PushupState(
      isActive: isActive ?? this.isActive,
      reps: reps ?? this.reps,
      elapsedSeconds: elapsedSeconds ?? this.elapsedSeconds,
      settings: settings ?? this.settings,
      history: history ?? this.history,
      totalScore: totalScore ?? this.totalScore,
      lastTapScore: lastTapScore ?? this.lastTapScore,
      lastTapX: lastTapX != null ? lastTapX() : this.lastTapX,
      lastTapY: lastTapY != null ? lastTapY() : this.lastTapY,
    );
  }

  @override
  List<Object?> get props => [
    isActive,
    reps,
    elapsedSeconds,
    settings,
    history,
    totalScore,
    lastTapScore,
    lastTapX,
    lastTapY,
  ];
}
