import 'dart:math';

import 'package:flutter/material.dart';
import 'package:nose2floor/features/pushup_counter/domain/entities/hit.dart';
import 'package:nose2floor/features/pushup_counter/domain/entities/workout_session.dart';
import 'package:nose2floor/features/pushup_counter/presentation/widgets/bullseye_painter.dart';

class SessionDetailScreen extends StatelessWidget {
  const SessionDetailScreen({required this.session, super.key});

  final WorkoutSession session;

  @override
  Widget build(BuildContext context) {
    final date = session.startedAt;
    final dateStr =
        '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')} '
        '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    final mins = session.durationSeconds ~/ 60;
    final secs = session.durationSeconds % 60;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F0EB),
      appBar: AppBar(
        title: Text('Session — $dateStr'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.black87,
      ),
      body: Column(
        children: [
          // Stats row
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            child: Row(
              children: [
                _Stat(label: 'HITS', value: '${session.reps}'),
                _Stat(label: 'PTS', value: '${session.totalScore}'),
                _Stat(label: 'TIME', value: '${mins}m ${secs}s'),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Hit map
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final side = min(constraints.maxWidth, constraints.maxHeight);
                  return Center(
                    child: SizedBox(
                      width: side,
                      height: side,
                      child: RepaintBoundary(
                        child: CustomPaint(
                          painter: _HitMapPainter(
                            hits: session.hits,
                            bullseyeScale: session.bullseyeScale,
                          ),
                          size: Size(side, side),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: Colors.black87,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.black.withValues(alpha: 0.4),
              letterSpacing: 1,
            ),
          ),
        ],
      ),
    );
  }
}

class _HitMapPainter extends CustomPainter {
  _HitMapPainter({required this.hits, required this.bullseyeScale});

  final List<Hit> hits;
  final double bullseyeScale;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);

    // Scale the bullseye to fit within the available space with padding.
    final originalMaxRadius = BullsEyePainter.defaultMaxRadius * bullseyeScale;
    final fitRadius = (min(size.width, size.height) / 2) * 0.9;
    final scale = fitRadius / originalMaxRadius;

    // Draw bullseye rings.
    const zones = [1.0, 0.8, 0.6, 0.4, 0.2];
    const colors = [
      Color(0xFFFFFFFF),
      Color(0xFFFFB74D),
      Color(0xFFFF7043),
      Color(0xFFE53935),
      Color(0xFFD32F2F),
    ];

    for (var i = 0; i < zones.length; i++) {
      final r = fitRadius * zones[i];
      canvas.drawCircle(
        center,
        r,
        Paint()
          ..color = colors[i]
          ..style = PaintingStyle.fill,
      );
      canvas.drawCircle(
        center,
        r,
        Paint()
          ..color = Colors.black.withValues(alpha: 0.12)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1,
      );
    }

    // Draw crosshair.
    final crossPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.06)
      ..strokeWidth = 1;
    canvas.drawLine(
      Offset(center.dx - fitRadius, center.dy),
      Offset(center.dx + fitRadius, center.dy),
      crossPaint,
    );
    canvas.drawLine(
      Offset(center.dx, center.dy - fitRadius),
      Offset(center.dx, center.dy + fitRadius),
      crossPaint,
    );

    // Draw hits.
    final dotPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.7)
      ..style = PaintingStyle.fill;
    final dotBorder = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    for (final hit in hits) {
      final pos = Offset(
        center.dx + hit.dx * scale,
        center.dy + hit.dy * scale,
      );
      canvas.drawCircle(pos, 5, dotPaint);
      canvas.drawCircle(pos, 5, dotBorder);
    }
  }

  @override
  bool shouldRepaint(_HitMapPainter old) =>
      old.hits != hits || old.bullseyeScale != bullseyeScale;
}
