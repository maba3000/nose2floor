import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:nose2floor/features/pushup_counter/presentation/cubit/pushup_cubit.dart';
import 'package:nose2floor/features/pushup_counter/presentation/cubit/pushup_state.dart';
import 'package:nose2floor/features/pushup_counter/presentation/widgets/bullseye_painter.dart';
import 'package:nose2floor/features/pushup_counter/presentation/widgets/corner_badge.dart';
import 'package:nose2floor/features/pushup_counter/presentation/widgets/hit_marker_layer.dart';

class ActiveSessionView extends StatelessWidget {
  const ActiveSessionView({super.key});

  String _formatTime(int seconds) {
    final m = (seconds ~/ 60).toString().padLeft(2, '0');
    final s = (seconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<PushupCubit, PushupState>(
      builder: (context, state) {
        final cubit = context.read<PushupCubit>();
        final settings = state.settings;
        final goalReached =
            settings.goalReps != null && state.reps >= settings.goalReps!;

        return LayoutBuilder(
          builder: (context, constraints) {
            final centerX = constraints.maxWidth / 2;
            final centerY = constraints.maxHeight / 2;
            final maxRadius = BullsEyePainter.maxRadius;

            return Container(
              color: const Color(0xFFF5F0EB),
              width: double.infinity,
              height: double.infinity,
              child: Stack(
                children: [
                  // Scoring layer: fires on any contact instantly
                  Positioned.fill(
                    child: Listener(
                      onPointerDown: (event) {
                        cubit.incrementRepWithScore(
                          event.localPosition.dx,
                          event.localPosition.dy,
                          centerX,
                          centerY,
                          maxRadius,
                        );
                      },
                      behavior: HitTestBehavior.opaque,
                      child: settings.showBullseye
                          ? const CustomPaint(
                              painter: BullsEyePainter(),
                              size: Size.infinite,
                            )
                          : const SizedBox.expand(),
                    ),
                  ),

                  if (settings.showHitMarker &&
                      state.lastTapX != null &&
                      state.lastTapY != null)
                    IgnorePointer(
                      child: HitMarkerLayer(
                        tapX: state.lastTapX!,
                        tapY: state.lastTapY!,
                        score: state.lastTapScore,
                        hideAfterSeconds: settings.hideHitAfterSeconds,
                        showScore: settings.showPoints,
                      ),
                    ),

                  // Top-left: reps
                  if (settings.showReps)
                    Positioned(
                      top: 0,
                      left: 0,
                      child: SafeArea(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: CornerBadge(
                            label: goalReached ? 'GOAL!' : 'REPS',
                            value: '${state.reps}',
                            labelColor: goalReached
                                ? Colors.green.shade700
                                : null,
                            valueColor: goalReached
                                ? Colors.green.shade700
                                : null,
                          ),
                        ),
                      ),
                    ),

                  // Top-right: points
                  if (settings.showPoints)
                    Positioned(
                      top: 0,
                      right: 0,
                      child: SafeArea(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: CornerBadge(
                            label: 'PTS',
                            value: '${state.totalScore}',
                            alignment: CrossAxisAlignment.end,
                          ),
                        ),
                      ),
                    ),

                  // Bottom row: timer (left), hold to stop (right)
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            if (settings.soundEnabled)
                              CornerBadge(
                                label: 'TIME',
                                value: _formatTime(state.elapsedSeconds),
                              )
                            else
                              const SizedBox.shrink(),
                            GestureDetector(
                              onLongPress: cubit.stopSession,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 10,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.red.shade700,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: Colors.white.withValues(alpha: 0.6),
                                    width: 1.5,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(
                                        alpha: 0.3,
                                      ),
                                      blurRadius: 6,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      Icons.stop_rounded,
                                      size: 18,
                                      color: Colors.white,
                                    ),
                                    SizedBox(width: 8),
                                    Text(
                                      'Hold to stop',
                                      style: TextStyle(
                                        fontSize: 14,
                                        color: Colors.white,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
