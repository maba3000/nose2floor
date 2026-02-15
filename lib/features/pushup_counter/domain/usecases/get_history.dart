import 'package:nose2floor/features/pushup_counter/domain/entities/workout_session.dart';
import 'package:nose2floor/features/pushup_counter/domain/repositories/session_repository.dart';

class GetHistory {
  GetHistory(this.repository);

  final SessionRepository repository;

  Future<List<WorkoutSession>> call() {
    return repository.getHistory();
  }
}
