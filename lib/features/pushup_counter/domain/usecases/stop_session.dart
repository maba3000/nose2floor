import 'package:nose2floor/features/pushup_counter/domain/entities/workout_session.dart';
import 'package:nose2floor/features/pushup_counter/domain/repositories/session_repository.dart';

class StopSession {
  StopSession(this.repository);

  final SessionRepository repository;

  Future<void> call(WorkoutSession session) {
    return repository.saveSession(session);
  }
}
