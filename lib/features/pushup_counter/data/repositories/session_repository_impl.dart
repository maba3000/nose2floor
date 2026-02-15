import 'package:nose2floor/features/pushup_counter/data/datasources/local_datasource.dart';
import 'package:nose2floor/features/pushup_counter/data/models/app_settings_model.dart';
import 'package:nose2floor/features/pushup_counter/data/models/workout_session_model.dart';
import 'package:nose2floor/features/pushup_counter/domain/entities/app_settings.dart';
import 'package:nose2floor/features/pushup_counter/domain/entities/workout_session.dart';
import 'package:nose2floor/features/pushup_counter/domain/repositories/session_repository.dart';

class SessionRepositoryImpl implements SessionRepository {
  SessionRepositoryImpl(this.datasource);

  final LocalDatasource datasource;

  @override
  Future<List<WorkoutSession>> getHistory() async {
    return datasource.getHistory();
  }

  @override
  Future<void> saveSession(WorkoutSession session) async {
    final history = datasource.getHistory();
    history.insert(0, WorkoutSessionModel.fromEntity(session));
    await datasource.saveHistory(history);
  }

  @override
  Future<void> deleteSession(String id) async {
    final history = datasource.getHistory();
    history.removeWhere((s) => s.id == id);
    await datasource.saveHistory(history);
  }

  @override
  Future<void> clearHistory() async {
    await datasource.saveHistory([]);
  }

  @override
  Future<AppSettings> getSettings() async {
    return datasource.getSettings();
  }

  @override
  Future<void> saveSettings(AppSettings settings) async {
    await datasource.saveSettings(AppSettingsModel.fromEntity(settings));
  }
}
