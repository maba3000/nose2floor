import 'package:nose2floor/core/constants.dart';
import 'package:nose2floor/features/pushup_counter/data/models/app_settings_model.dart';
import 'package:nose2floor/features/pushup_counter/data/models/workout_session_model.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocalDatasource {
  LocalDatasource(this.prefs);

  final SharedPreferences prefs;

  List<WorkoutSessionModel> getHistory() {
    final jsonString = prefs.getString(kPrefsHistoryKey) ?? '';
    return WorkoutSessionModel.fromJsonList(jsonString);
  }

  Future<void> saveHistory(List<WorkoutSessionModel> sessions) async {
    await prefs.setString(
      kPrefsHistoryKey,
      WorkoutSessionModel.toJsonList(sessions),
    );
  }

  AppSettingsModel getSettings() {
    final jsonString = prefs.getString(kPrefsSettingsKey) ?? '';
    return AppSettingsModel.fromJsonString(jsonString);
  }

  Future<void> saveSettings(AppSettingsModel settings) async {
    await prefs.setString(kPrefsSettingsKey, settings.toJsonString());
  }
}
