import 'package:flutter/material.dart';

/// A small badge with a frosted background for displaying a label + value
/// in one of the screen corners.
class CornerBadge extends StatelessWidget {
  const CornerBadge({
    required this.label,
    required this.value,
    this.labelColor,
    this.valueColor,
    this.alignment = CrossAxisAlignment.start,
    super.key,
  });

  final String label;
  final String value;
  final Color? labelColor;
  final Color? valueColor;
  final CrossAxisAlignment alignment;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.65),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: alignment,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              color: labelColor ?? Colors.black.withValues(alpha: 0.4),
              fontWeight: FontWeight.w600,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.w900,
              color: valueColor ?? Colors.black87,
            ),
          ),
        ],
      ),
    );
  }
}
