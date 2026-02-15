import 'package:flutter/material.dart';

class BullsEyePainter extends CustomPainter {
  const BullsEyePainter({this.maxRadius = defaultMaxRadius});

  final double maxRadius;

  static const double defaultMaxRadius = 190;

  /// Zone fractions matching the scoring logic in PushupCubit.
  /// Equal-width rings, drawn from outermost to innermost.
  static const _zones = [1.0, 0.8, 0.6, 0.4, 0.2];

  static const _ringColors = [
    Color(0xFFFFFFFF), // outer - white   (score 2)
    Color(0xFFFFB74D), // amber           (score 4)
    Color(0xFFFF7043), // orange          (score 6)
    Color(0xFFE53935), // red             (score 8)
    Color(0xFFD32F2F), // bullseye - red  (score 10)
  ];

  @override
  void paint(Canvas canvas, Size size) {
    final centerX = size.width / 2;
    final centerY = size.height / 2;
    final center = Offset(centerX, centerY);

    // Draw rings from outside in so inner rings paint over outer ones.
    for (var i = 0; i < _zones.length; i++) {
      final radius = maxRadius * _zones[i];
      final paint = Paint()
        ..color = _ringColors[i]
        ..style = PaintingStyle.fill;
      canvas.drawCircle(center, radius, paint);

      final borderPaint = Paint()
        ..color = Colors.black.withValues(alpha: 0.12)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.0;
      canvas.drawCircle(center, radius, borderPaint);
    }

    // Crosshair lines (subtle)
    final crossPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.06)
      ..strokeWidth = 1;
    canvas.drawLine(
      Offset(centerX - maxRadius, centerY),
      Offset(centerX + maxRadius, centerY),
      crossPaint,
    );
    canvas.drawLine(
      Offset(centerX, centerY - maxRadius),
      Offset(centerX, centerY + maxRadius),
      crossPaint,
    );
  }

  @override
  bool shouldRepaint(BullsEyePainter old) => old.maxRadius != maxRadius;
}
