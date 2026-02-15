import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:nose2floor/features/pushup_counter/presentation/cubit/pushup_cubit.dart';
import 'package:nose2floor/features/pushup_counter/presentation/cubit/pushup_state.dart';
import 'package:nose2floor/features/pushup_counter/presentation/screens/history_screen.dart';
import 'package:nose2floor/features/pushup_counter/presentation/screens/settings_screen.dart';
import 'package:nose2floor/features/pushup_counter/presentation/widgets/bullseye_painter.dart';
import 'package:nose2floor/features/pushup_counter/presentation/widgets/corner_badge.dart';
import 'package:nose2floor/features/pushup_counter/presentation/widgets/hit_marker_layer.dart';

class InactiveView extends StatelessWidget {
  const InactiveView({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<PushupCubit, PushupState>(
      builder: (context, state) {
        final cubit = context.read<PushupCubit>();
        final settings = state.settings;

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
                            label: 'DEMO',
                            value: '${state.reps}',
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

                  // Bottom row: settings & history (left), hold to start (right)
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                _ActionButton(
                                  icon: Icons.tune,
                                  label: 'Settings',
                                  onTap: () => Navigator.of(context).push(
                                    MaterialPageRoute<void>(
                                      builder: (_) => BlocProvider.value(
                                        value: cubit,
                                        child: const SettingsScreen(),
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                _ActionButton(
                                  icon: Icons.history,
                                  label: 'History',
                                  onTap: () => Navigator.of(context).push(
                                    MaterialPageRoute<void>(
                                      builder: (_) => BlocProvider.value(
                                        value: cubit,
                                        child: const HistoryScreen(),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            _ActionButton(
                              icon: Icons.play_arrow_rounded,
                              label: 'Hold to start',
                              color: Colors.green,
                              textColor: Colors.white,
                              onLongPress: cubit.startSession,
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

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.label,
    this.color,
    this.textColor,
    this.onTap,
    this.onLongPress,
  });

  final IconData icon;
  final String label;
  final Color? color;
  final Color? textColor;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;

  @override
  Widget build(BuildContext context) {
    final bg = color ?? Colors.white.withValues(alpha: 0.8);
    final fg = textColor ?? Colors.black54;

    return GestureDetector(
      onTap: onTap,
      onLongPress: onLongPress,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.6),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 18, color: fg),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: fg,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
