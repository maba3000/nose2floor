import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:nose2floor/features/pushup_counter/domain/entities/app_settings.dart';
import 'package:nose2floor/features/pushup_counter/domain/entities/workout_session.dart';
import 'package:nose2floor/features/pushup_counter/domain/repositories/session_repository.dart';
import 'package:nose2floor/features/pushup_counter/presentation/cubit/pushup_cubit.dart';
import 'package:nose2floor/features/pushup_counter/presentation/cubit/pushup_state.dart';

class MockSessionRepository extends Mock implements SessionRepository {}

class FakeWorkoutSession extends Fake implements WorkoutSession {}

class FakeAppSettings extends Fake implements AppSettings {}

void main() {
  late MockSessionRepository mockRepo;

  setUpAll(() {
    registerFallbackValue(FakeWorkoutSession());
    registerFallbackValue(FakeAppSettings());
  });

  setUp(() {
    mockRepo = MockSessionRepository();
    when(() => mockRepo.getHistory()).thenAnswer((_) async => []);
    when(
      () => mockRepo.getSettings(),
    ).thenAnswer((_) async => const AppSettings());
    when(() => mockRepo.saveSession(any())).thenAnswer((_) async {});
    when(() => mockRepo.saveSettings(any())).thenAnswer((_) async {});
  });

  group('Debounce logic', () {
    test('incrementRep counts only once within debounce window', () {
      final cubit = PushupCubit(mockRepo);
      cubit.startSession();

      // First tap should succeed
      final result1 = cubit.incrementRep();
      expect(result1, isTrue);
      expect(cubit.state.reps, 1);

      // Immediate second tap should be debounced (within 400ms default)
      final result2 = cubit.incrementRep();
      expect(result2, isFalse);
      expect(cubit.state.reps, 1);

      cubit.close();
    });

    test('incrementRep does not count when session is inactive', () {
      final cubit = PushupCubit(mockRepo);
      // Don't start session

      final result = cubit.incrementRep();
      expect(result, isFalse);
      expect(cubit.state.reps, 0);

      cubit.close();
    });
  });

  group('Stop session', () {
    blocTest<PushupCubit, PushupState>(
      'stopSession saves session to history and returns to inactive state',
      build: () {
        when(() => mockRepo.saveSession(any())).thenAnswer((_) async {});
        when(() => mockRepo.getHistory()).thenAnswer(
          (_) async => [
            WorkoutSession(
              id: 'test-id',
              startedAt: DateTime(2024),
              durationSeconds: 60,
              reps: 10,
            ),
          ],
        );
        return PushupCubit(mockRepo);
      },
      act: (cubit) async {
        cubit.startSession();
        cubit.incrementRep();
        await cubit.stopSession();
      },
      verify: (cubit) {
        verify(() => mockRepo.saveSession(any())).called(1);
        expect(cubit.state.isActive, isFalse);
        expect(cubit.state.history.length, 1);
      },
    );
  });

  group('Load initial data', () {
    blocTest<PushupCubit, PushupState>(
      'loadInitialData populates settings and history',
      build: () {
        when(
          () => mockRepo.getSettings(),
        ).thenAnswer((_) async => const AppSettings(debounceMs: 500));
        when(() => mockRepo.getHistory()).thenAnswer(
          (_) async => [
            WorkoutSession(
              id: '1',
              startedAt: DateTime(2024),
              durationSeconds: 30,
              reps: 5,
            ),
          ],
        );
        return PushupCubit(mockRepo);
      },
      act: (cubit) => cubit.loadInitialData(),
      expect: () => [
        isA<PushupState>()
            .having((s) => s.settings.debounceMs, 'debounceMs', 500)
            .having((s) => s.history.length, 'history length', 1),
      ],
    );
  });
}
