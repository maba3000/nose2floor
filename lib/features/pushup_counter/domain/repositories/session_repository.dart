import 'package:nose2floor/features/pushup_counter/domain/entities/app_settings.dart';
import 'package:nose2floor/features/pushup_counter/domain/entities/workout_session.dart';

abstract class SessionRepository {
  Future<List<WorkoutSession>> getHistory();
  Future<void> saveSession(WorkoutSession session);
  Future<void> deleteSession(String id);
  Future<void> clearHistory();
  Future<void> replaceHistory(List<WorkoutSession> sessions);
  Future<AppSettings> getSettings();
  Future<void> saveSettings(AppSettings settings);
}
