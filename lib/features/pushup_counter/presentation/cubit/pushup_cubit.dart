import 'dart:async';
import 'dart:math';

import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:nose2floor/features/pushup_counter/domain/entities/app_settings.dart';
import 'package:nose2floor/features/pushup_counter/domain/entities/workout_session.dart';
import 'package:nose2floor/features/pushup_counter/domain/repositories/session_repository.dart';
import 'package:nose2floor/features/pushup_counter/presentation/cubit/pushup_state.dart';
import 'package:uuid/uuid.dart';

class PushupCubit extends Cubit<PushupState> {
  PushupCubit(this.repository) : super(const PushupState());

  final SessionRepository repository;
  final Uuid _uuid = const Uuid();

  Timer? _timer;
  DateTime? _sessionStart;
  DateTime? _lastTapTime;

  Future<void> loadInitialData() async {
    final settings = await repository.getSettings();
    final history = await repository.getHistory();
    emit(state.copyWith(settings: settings, history: history));
  }

  void startSession() {
    _sessionStart = DateTime.now();
    _lastTapTime = null;
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_sessionStart != null) {
        final elapsed = DateTime.now().difference(_sessionStart!).inSeconds;
        emit(state.copyWith(elapsedSeconds: elapsed));
      }
    });
    emit(
      state.copyWith(
        isActive: true,
        reps: 0,
        elapsedSeconds: 0,
        totalScore: 0,
        lastTapScore: 0,
        lastTapX: () => null,
        lastTapY: () => null,
      ),
    );
  }

  bool incrementRep() {
    if (!state.isActive) return false;
    final now = DateTime.now();
    if (_lastTapTime != null) {
      final diff = now.difference(_lastTapTime!).inMilliseconds;
      if (diff < state.settings.debounceMs) return false;
    }
    _lastTapTime = now;
    emit(state.copyWith(reps: state.reps + 1));
    return true;
  }

  /// Increment rep with position-based scoring.
  /// [tapX], [tapY] are the tap coordinates.
  /// [centerX], [centerY] are the bull's eye center.
  /// [maxRadius] is the radius of the outermost ring.
  bool incrementRepWithScore(
    double tapX,
    double tapY,
    double centerX,
    double centerY,
    double maxRadius,
  ) {
    final now = DateTime.now();
    if (_lastTapTime != null) {
      final diff = now.difference(_lastTapTime!).inMilliseconds;
      if (diff < state.settings.debounceMs) return false;
    }
    _lastTapTime = now;

    final dx = tapX - centerX;
    final dy = tapY - centerY;
    final distance = sqrt(dx * dx + dy * dy);

    // 5 rings: bullseye=10, then 8, 6, 4, 2, outside=1
    final int score;
    if (distance <= maxRadius * 0.1) {
      score = 10;
    } else if (distance <= maxRadius * 0.3) {
      score = 8;
    } else if (distance <= maxRadius * 0.5) {
      score = 6;
    } else if (distance <= maxRadius * 0.7) {
      score = 4;
    } else if (distance <= maxRadius) {
      score = 2;
    } else {
      score = 1;
    }

    emit(
      state.copyWith(
        reps: state.reps + 1,
        totalScore: state.totalScore + score,
        lastTapScore: score,
        lastTapX: () => tapX,
        lastTapY: () => tapY,
      ),
    );
    return true;
  }

  Future<void> stopSession() async {
    _timer?.cancel();
    _timer = null;
    if (_sessionStart == null) return;

    final session = WorkoutSession(
      id: _uuid.v4(),
      startedAt: _sessionStart!,
      durationSeconds: DateTime.now().difference(_sessionStart!).inSeconds,
      reps: state.reps,
    );
    _sessionStart = null;
    _lastTapTime = null;

    await repository.saveSession(session);
    final history = await repository.getHistory();
    emit(
      state.copyWith(
        isActive: false,
        reps: 0,
        elapsedSeconds: 0,
        history: history,
        totalScore: 0,
        lastTapScore: 0,
        lastTapX: () => null,
        lastTapY: () => null,
      ),
    );
  }

  void resetReps() {
    if (!state.isActive) return;
    _lastTapTime = null;
    emit(state.copyWith(reps: 0));
  }

  Future<void> updateSettings(AppSettings settings) async {
    await repository.saveSettings(settings);
    emit(state.copyWith(settings: settings));
  }

  Future<void> deleteSession(String id) async {
    await repository.deleteSession(id);
    final history = await repository.getHistory();
    emit(state.copyWith(history: history));
  }

  Future<void> clearHistory() async {
    await repository.clearHistory();
    emit(state.copyWith(history: []));
  }

  @override
  Future<void> close() {
    _timer?.cancel();
    return super.close();
  }
}
