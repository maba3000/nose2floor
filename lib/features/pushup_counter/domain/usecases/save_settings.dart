import 'package:nose2floor/features/pushup_counter/domain/entities/app_settings.dart';
import 'package:nose2floor/features/pushup_counter/domain/repositories/session_repository.dart';

class SaveSettings {
  SaveSettings(this.repository);

  final SessionRepository repository;

  Future<void> call(AppSettings settings) {
    return repository.saveSettings(settings);
  }
}
