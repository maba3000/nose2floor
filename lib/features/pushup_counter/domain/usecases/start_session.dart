import 'package:nose2floor/features/pushup_counter/domain/repositories/session_repository.dart';

class StartSession {
  StartSession(this.repository);

  final SessionRepository repository;
  // Session start is handled by Cubit state; this use case exists for
  // architectural completeness and future expansion.
}
