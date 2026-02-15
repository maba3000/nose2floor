import 'package:flutter/material.dart';

class BullsEyePainter extends CustomPainter {
  const BullsEyePainter();

  /// ~2cm per ring at standard density. 1cm ≈ 38 logical px.
  static const double ringWidth = 76;
  static const int ringCount = 5;

  /// Total radius of the outermost ring.
  static double get maxRadius => ringWidth * ringCount;

  static const _ringColors = [
    Color(0xFFD32F2F), // bullseye - red
    Color(0xFFE53935),
    Color(0xFFFF7043), // orange
    Color(0xFFFFB74D),
    Color(0xFFFFFFFF), // outer - white
  ];

  @override
  void paint(Canvas canvas, Size size) {
    final centerX = size.width / 2;
    final centerY = size.height / 2;

    // Draw rings from outside in, fixed size (clips if screen is small)
    for (var i = 0; i < ringCount; i++) {
      final radius = maxRadius - (i * ringWidth);
      final paint = Paint()
        ..color = _ringColors[i]
        ..style = PaintingStyle.fill;
      canvas.drawCircle(Offset(centerX, centerY), radius, paint);

      final borderPaint = Paint()
        ..color = Colors.black.withValues(alpha: 0.12)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.0;
      canvas.drawCircle(Offset(centerX, centerY), radius, borderPaint);
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
  bool shouldRepaint(BullsEyePainter old) => false;
}
