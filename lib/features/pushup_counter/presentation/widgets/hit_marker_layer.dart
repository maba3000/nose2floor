import 'dart:async';

import 'package:flutter/material.dart';

/// Shows a hit marker (cross + score) that auto-hides after [hideAfterSeconds].
/// If [hideAfterSeconds] is 0, it never hides.
class HitMarkerLayer extends StatefulWidget {
  const HitMarkerLayer({
    required this.tapX,
    required this.tapY,
    required this.score,
    required this.hideAfterSeconds,
    this.showScore = true,
    super.key,
  });

  final double tapX;
  final double tapY;
  final int score;
  final int hideAfterSeconds;
  final bool showScore;

  @override
  State<HitMarkerLayer> createState() => _HitMarkerLayerState();
}

class _HitMarkerLayerState extends State<HitMarkerLayer> {
  bool _visible = true;
  Timer? _timer;
  double? _lastX;
  double? _lastY;

  void _resetTimer() {
    _timer?.cancel();
    _visible = true;
    if (widget.hideAfterSeconds > 0) {
      _timer = Timer(Duration(seconds: widget.hideAfterSeconds), () {
        if (mounted) setState(() => _visible = false);
      });
    }
  }

  @override
  void initState() {
    super.initState();
    _lastX = widget.tapX;
    _lastY = widget.tapY;
    _resetTimer();
  }

  @override
  void didUpdateWidget(HitMarkerLayer old) {
    super.didUpdateWidget(old);
    if (widget.tapX != _lastX || widget.tapY != _lastY) {
      _lastX = widget.tapX;
      _lastY = widget.tapY;
      setState(_resetTimer);
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_visible) return const SizedBox.shrink();

    return CustomPaint(
      painter: _HitPainter(
        tapX: widget.tapX,
        tapY: widget.tapY,
        score: widget.showScore ? widget.score : null,
      ),
      size: Size.infinite,
    );
  }
}

class _HitPainter extends CustomPainter {
  _HitPainter({required this.tapX, required this.tapY, this.score});

  final double tapX;
  final double tapY;
  final int? score;

  @override
  void paint(Canvas canvas, Size size) {
    final markerPaint = Paint()
      ..color = Colors.black87
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;
    const arm = 14.0;
    canvas.drawLine(
      Offset(tapX - arm, tapY - arm),
      Offset(tapX + arm, tapY + arm),
      markerPaint,
    );
    canvas.drawLine(
      Offset(tapX + arm, tapY - arm),
      Offset(tapX - arm, tapY + arm),
      markerPaint,
    );

    if (score != null) {
      final textPainter = TextPainter(
        text: TextSpan(
          text: '+$score',
          style: const TextStyle(
            color: Colors.black87,
            fontSize: 22,
            fontWeight: FontWeight.bold,
          ),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      textPainter.paint(canvas, Offset(tapX + 18, tapY - 28));
    }
  }

  @override
  bool shouldRepaint(_HitPainter old) =>
      tapX != old.tapX || tapY != old.tapY || score != old.score;
}
