import React from 'react';
import { View, Text, Switch, StyleSheet, ScrollView } from 'react-native';
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
        <View style={styles.row}>
          <Text selectable={false}>Auto mode</Text>
          <Switch
            value={settings.sessionMode === 'auto'}
            onValueChange={(v) =>
              updateSettings({
                sessionMode: v ? 'auto' : 'manual',
                showIntro: v ? false : settings.showIntro,
              })
            }
          />
        </View>
        <Text selectable={false} style={styles.modeHint}>
          Auto mode starts when the app opens and saves as you go. Example: open the app, do
          push-ups, close it — everything is saved.
        </Text>
        <View style={styles.row}>
          <Text selectable={false}>Show intro on startup</Text>
          <Switch
            value={settings.sessionMode === 'auto' ? false : settings.showIntro}
            disabled={settings.sessionMode === 'auto'}
            onValueChange={(v) => updateSettings({ showIntro: v })}
          />
        </View>

        <Text selectable={false} style={styles.section}>
          Hit Timing
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
  modeHint: { fontSize: 12, color: 'rgba(0,0,0,0.55)', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
});
