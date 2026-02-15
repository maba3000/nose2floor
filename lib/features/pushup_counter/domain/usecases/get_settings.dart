import 'package:nose2floor/features/pushup_counter/domain/entities/app_settings.dart';
import 'package:nose2floor/features/pushup_counter/domain/repositories/session_repository.dart';

class GetSettings {
  GetSettings(this.repository);

  final SessionRepository repository;

  Future<AppSettings> call() {
    return repository.getSettings();
  }
}
