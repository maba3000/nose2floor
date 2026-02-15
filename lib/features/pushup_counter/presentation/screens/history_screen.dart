import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:nose2floor/features/pushup_counter/presentation/cubit/pushup_cubit.dart';
import 'package:nose2floor/features/pushup_counter/presentation/cubit/pushup_state.dart';

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F0EB),
      appBar: AppBar(
        title: const Text('History'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.black87,
        actions: [
          BlocBuilder<PushupCubit, PushupState>(
            builder: (context, state) {
              if (state.history.isEmpty) return const SizedBox.shrink();
              return TextButton(
                onPressed: () => _confirmClear(context),
                child: const Text(
                  'Clear all',
                  style: TextStyle(color: Colors.red, fontSize: 16),
                ),
              );
            },
          ),
        ],
      ),
      body: BlocBuilder<PushupCubit, PushupState>(
        builder: (context, state) {
          if (state.history.isEmpty) {
            return Center(
              child: Text(
                'No sessions yet.',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.black.withValues(alpha: 0.4),
                ),
              ),
            );
          }

          final cubit = context.read<PushupCubit>();
          final history = state.history;

          // Stats
          final totalSessions = history.length;
          final totalReps = history.fold<int>(0, (sum, s) => sum + s.reps);
          final totalSeconds = history.fold<int>(
            0,
            (sum, s) => sum + s.durationSeconds,
          );
          final avgReps = totalSessions > 0
              ? (totalReps / totalSessions).round()
              : 0;
          final bestReps = history
              .map((s) => s.reps)
              .reduce((a, b) => a > b ? a : b);
          final totalMins = totalSeconds ~/ 60;

          return ListView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            children: [
              // Statistics card
              Container(
                margin: const EdgeInsets.only(top: 8, bottom: 24),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'STATISTICS',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Colors.black.withValues(alpha: 0.4),
                        letterSpacing: 2,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        _StatTile(label: 'Sessions', value: '$totalSessions'),
                        _StatTile(label: 'Total reps', value: '$totalReps'),
                        _StatTile(label: 'Best', value: '$bestReps'),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _StatTile(label: 'Avg / session', value: '$avgReps'),
                        _StatTile(label: 'Total time', value: '${totalMins}m'),
                        const Expanded(child: SizedBox.shrink()),
                      ],
                    ),
                  ],
                ),
              ),

              // Session list with swipe to delete
              ...List.generate(history.length, (index) {
                final session = history[index];
                final date = session.startedAt;
                final dateStr =
                    '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')} '
                    '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
                final mins = session.durationSeconds ~/ 60;
                final secs = session.durationSeconds % 60;

                return Dismissible(
                  key: ValueKey(session.id),
                  direction: DismissDirection.endToStart,
                  background: Container(
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.only(right: 24),
                    color: Colors.red,
                    child: const Icon(Icons.delete, color: Colors.white),
                  ),
                  onDismissed: (_) => cubit.deleteSession(session.id),
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(
                          color: Colors.black.withValues(alpha: 0.06),
                        ),
                      ),
                    ),
                    child: ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(
                        '${session.reps} reps',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      subtitle: Text('$dateStr  •  ${mins}m ${secs}s'),
                    ),
                  ),
                );
              }),
              const SizedBox(height: 24),
            ],
          );
        },
      ),
    );
  }

  void _confirmClear(BuildContext context) {
    final cubit = context.read<PushupCubit>();
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clear all history?'),
        content: const Text('This cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () {
              Navigator.of(ctx).pop();
              cubit.clearHistory();
            },
            child: const Text('Clear'),
          ),
        ],
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.black.withValues(alpha: 0.4),
            ),
          ),
        ],
      ),
    );
  }
}
