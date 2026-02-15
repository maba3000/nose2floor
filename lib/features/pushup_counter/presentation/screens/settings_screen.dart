import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:nose2floor/features/pushup_counter/presentation/cubit/pushup_cubit.dart';
import 'package:nose2floor/features/pushup_counter/presentation/cubit/pushup_state.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F0EB),
      appBar: AppBar(
        title: const Text('Settings'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.black87,
      ),
      body: BlocBuilder<PushupCubit, PushupState>(
        builder: (context, state) {
          final cubit = context.read<PushupCubit>();
          final s = state.settings;

          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              // --- Gameplay ---
              const _SectionHeader('GAMEPLAY'),
              const SizedBox(height: 12),

              _SettingRow(title: 'Hit cooldown', subtitle: '${s.debounceMs}ms'),
              Slider(
                value: s.debounceMs.toDouble(),
                min: 100,
                max: 1000,
                divisions: 18,
                onChanged: (v) {
                  cubit.updateSettings(s.copyWith(debounceMs: v.round()));
                },
              ),

              const SizedBox(height: 32),

              // --- Display ---
              const _SectionHeader('DISPLAY'),
              const SizedBox(height: 12),

              _ToggleRow(
                title: 'Show hits',
                value: s.showReps,
                onChanged: (v) {
                  cubit.updateSettings(s.copyWith(showReps: v));
                },
              ),
              _ToggleRow(
                title: 'Show points',
                value: s.showPoints,
                onChanged: (v) {
                  cubit.updateSettings(s.copyWith(showPoints: v));
                },
              ),
              _ToggleRow(
                title: "Show bull's eye",
                value: s.showBullseye,
                onChanged: (v) {
                  cubit.updateSettings(s.copyWith(showBullseye: v));
                },
              ),
              if (s.showBullseye) ...[
                const SizedBox(height: 8),
                _SettingRow(
                  title: "Bull's eye size",
                  subtitle: '${(s.bullseyeScale * 100).round()}%',
                ),
                Slider(
                  value: s.bullseyeScale,
                  min: 0.5,
                  max: 2,
                  divisions: 15,
                  onChanged: (v) {
                    cubit.updateSettings(s.copyWith(bullseyeScale: v));
                  },
                ),
              ],
              _ToggleRow(
                title: 'Show timer',
                value: s.soundEnabled,
                onChanged: (v) {
                  cubit.updateSettings(s.copyWith(soundEnabled: v));
                },
              ),

              const SizedBox(height: 32),

              // --- Hit markers ---
              const _SectionHeader('HIT MARKERS'),
              const SizedBox(height: 12),

              _ToggleRow(
                title: 'Show hit marker',
                value: s.showHitMarker,
                onChanged: (v) {
                  cubit.updateSettings(s.copyWith(showHitMarker: v));
                },
              ),
              if (s.showHitMarker) ...[
                const SizedBox(height: 8),
                _SettingRow(
                  title: 'Hide after',
                  subtitle: s.hideHitAfterSeconds == 0
                      ? 'Never'
                      : '${s.hideHitAfterSeconds}s',
                ),
                Slider(
                  value: s.hideHitAfterSeconds.toDouble(),
                  max: 10,
                  divisions: 10,
                  label: s.hideHitAfterSeconds == 0
                      ? 'Never'
                      : '${s.hideHitAfterSeconds}s',
                  onChanged: (v) {
                    cubit.updateSettings(
                      s.copyWith(hideHitAfterSeconds: v.round()),
                    );
                  },
                ),
              ],

              const SizedBox(height: 32),

              // --- Data ---
              const _SectionHeader('DATA'),
              const SizedBox(height: 12),

              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.copy, size: 18),
                  label: const Text('Export all data to clipboard'),
                  onPressed: () {
                    final json = cubit.exportAllDataAsJson();
                    Clipboard.setData(ClipboardData(text: json));
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Data copied to clipboard'),
                        duration: Duration(seconds: 2),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.paste, size: 18),
                  label: const Text('Import data from JSON'),
                  onPressed: () => _showImportDialog(context, cubit),
                ),
              ),

              const SizedBox(height: 40),
            ],
          );
        },
      ),
    );
  }
}

void _showImportDialog(BuildContext context, PushupCubit cubit) {
  final controller = TextEditingController();
  showDialog<void>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: const Text('Import data'),
      content: TextField(
        controller: controller,
        maxLines: 8,
        decoration: const InputDecoration(
          hintText: 'Paste JSON here...',
          border: OutlineInputBorder(),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () async {
            final text = controller.text.trim();
            if (text.isEmpty) return;
            final error = await cubit.importAllDataFromJson(text);
            if (!ctx.mounted) return;
            Navigator.of(ctx).pop();
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(error ?? 'Data imported successfully'),
                duration: const Duration(seconds: 2),
              ),
            );
          },
          child: const Text('Import'),
        ),
      ],
    ),
  );
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: Colors.black.withValues(alpha: 0.35),
        letterSpacing: 2,
      ),
    );
  }
}

class _ToggleRow extends StatelessWidget {
  const _ToggleRow({
    required this.title,
    required this.value,
    required this.onChanged,
  });

  final String title;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
          ),
          const Spacer(),
          Switch(value: value, onChanged: onChanged),
        ],
      ),
    );
  }
}

class _SettingRow extends StatelessWidget {
  const _SettingRow({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          title,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
        ),
        const Spacer(),
        Text(
          subtitle,
          style: TextStyle(
            fontSize: 14,
            color: Colors.black.withValues(alpha: 0.5),
          ),
        ),
      ],
    );
  }
}
