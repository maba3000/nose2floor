import React from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSettingsStore } from '@/store/settingsStore';
import type { AppSettings } from '@/domain/entities';
import { ScreenHeader } from '@/components/ScreenHeader';

export default function SettingsScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const hideAfterSeconds = Math.round(settings.hitMarkerAutoHideMs / 1000);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text selectable={false} style={styles.section}>
          Session
        </Text>
        <View style={styles.modeRow}>
          {(
            [
              ['manual', 'Manual'],
              ['auto', 'Auto'],
            ] as const
          ).map(([value, label]) => {
            const active = settings.sessionMode === value;
            return (
              <Pressable
                key={value}
                onPress={() => updateSettings({ sessionMode: value })}
                style={[styles.modePill, active && styles.modePillActive]}
              >
                <Text selectable={false} style={[styles.modeText, active && styles.modeTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text selectable={false} style={styles.modeHint}>
          Auto starts a session when the app opens and saves continuously.
        </Text>

        <Text selectable={false} style={styles.section}>
          Gameplay
        </Text>
        <Text selectable={false}>Hit cooldown: {settings.hitCooldownMs}ms</Text>
        <Slider
          minimumValue={100}
          maximumValue={1000}
          step={50}
          value={settings.hitCooldownMs}
          onValueChange={(v) => updateSettings({ hitCooldownMs: v })}
        />

        <Text selectable={false} style={styles.section}>
          Display
        </Text>
        {(
          [
            ['showHitCount', 'Show hit count'],
            ['showPoints', 'Show points'],
            ['showBullseye', "Show bull's-eye"],
            ['showTimer', 'Show timer'],
          ] as const
        ).map(([key, label]) => (
          <View key={key} style={styles.row}>
            <Text selectable={false}>{label}</Text>
            <Switch
              value={settings[key]}
              onValueChange={(v) => updateSettings({ [key]: v } as Partial<AppSettings>)}
            />
          </View>
        ))}

        {settings.showBullseye && (
          <>
            <Text selectable={false} style={styles.section}>
              Bull's-eye
            </Text>
            <Text selectable={false}>Size: {settings.bullseyeScale.toFixed(1)}×</Text>
            <Slider
              minimumValue={0.5}
              maximumValue={2.0}
              step={0.1}
              value={settings.bullseyeScale}
              onValueChange={(v) => updateSettings({ bullseyeScale: v })}
            />
          </>
        )}

        <Text selectable={false} style={styles.section}>
          Hit Markers
        </Text>
        <View style={styles.row}>
          <Text selectable={false}>Show hit markers</Text>
          <Switch
            value={settings.showHitMarkers}
            onValueChange={(v) => updateSettings({ showHitMarkers: v })}
          />
        </View>

        {settings.showHitMarkers && (
          <>
            <Text selectable={false}>
              Hide after: {hideAfterSeconds === 0 ? 'Never' : `${hideAfterSeconds}s`}
            </Text>
            <Slider
              minimumValue={0}
              maximumValue={10}
              step={1}
              value={hideAfterSeconds}
              onValueChange={(v) => updateSettings({ hitMarkerAutoHideMs: v * 1000 })}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  content: { padding: 24, paddingTop: 8 },
  section: { fontSize: 16, fontWeight: '500', marginTop: 24, marginBottom: 8, color: '#2D3748' },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  modePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  modePillActive: { backgroundColor: '#1A202C', borderColor: '#1A202C' },
  modeText: { fontSize: 13, color: '#1A202C', fontWeight: '500' },
  modeTextActive: { color: '#fff' },
  modeHint: { fontSize: 12, color: 'rgba(0,0,0,0.55)' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
});
