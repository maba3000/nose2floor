import React, { useMemo } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSettingsStore } from '@/store/settingsStore';
import type { AppSettings } from '@/domain/entities';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useTheme } from '@/hooks/useTheme';
import type { Theme, ThemeMode } from '@/theme';

export default function SettingsScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const hideAfterSeconds = Math.round(settings.hitMarkerAutoHideMs / 1000);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text selectable={false} style={styles.section}>
          Session
        </Text>
        <View style={styles.row}>
          <Text selectable={false} style={styles.rowLabel}>
            Auto mode
          </Text>
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
          Auto mode starts when the app opens and saves automatically. Manual mode uses “Hold to
          Start” and “Hold to Stop.”
        </Text>

        <Text selectable={false} style={styles.section}>
          Appearance
        </Text>
        <View style={styles.appearanceRow}>
          {(
            [
              ['light', 'Light'],
              ['dark', 'Dark'],
              ['system', 'System'],
            ] as const
          ).map(([value, label]) => {
            const active = settings.themeMode === value;
            return (
              <Pressable
                key={value}
                onPress={() => updateSettings({ themeMode: value as ThemeMode })}
                style={[styles.appearancePill, active && styles.appearancePillActive]}
              >
                <Text
                  selectable={false}
                  style={[styles.appearanceText, active && styles.appearanceTextActive]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.row}>
          <Text selectable={false} style={styles.rowLabel}>
            Show intro on startup
          </Text>
          <Switch
            value={settings.sessionMode === 'auto' ? false : settings.showIntro}
            disabled={settings.sessionMode === 'auto'}
            onValueChange={(v) => updateSettings({ showIntro: v })}
          />
        </View>
        <View style={styles.row}>
          <Text selectable={false} style={styles.rowLabel}>
            Haptic feedback
          </Text>
          <Switch
            value={settings.hapticsEnabled}
            onValueChange={(v) => updateSettings({ hapticsEnabled: v })}
          />
        </View>

        <Text selectable={false} style={styles.section}>
          Hit Timing
        </Text>
        <Text selectable={false} style={styles.rowLabel}>
          Hit cooldown: {settings.hitCooldownMs}ms
        </Text>
        <Slider
          minimumValue={100}
          maximumValue={1000}
          step={50}
          value={settings.hitCooldownMs}
          onValueChange={(v) => updateSettings({ hitCooldownMs: v })}
        />
        <Text selectable={false} style={styles.helpText}>
          Lower is more sensitive. Higher reduces accidental double hits.
        </Text>

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
            <Text selectable={false} style={styles.rowLabel}>
              {label}
            </Text>
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
            <Text selectable={false} style={styles.rowLabel}>
              Size: {settings.bullseyeScale.toFixed(1)}×
            </Text>
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
          <Text selectable={false} style={styles.rowLabel}>
            Show hit markers
          </Text>
          <Switch
            value={settings.showHitMarkers}
            onValueChange={(v) => updateSettings({ showHitMarkers: v })}
          />
        </View>

        {settings.showHitMarkers && (
          <>
            <Text selectable={false} style={styles.rowLabel}>
              Hide after: {hideAfterSeconds === 0 ? 'Never' : `${hideAfterSeconds}s`}
            </Text>
            <Slider
              minimumValue={0}
              maximumValue={10}
              step={1}
              value={hideAfterSeconds}
              onValueChange={(v) => updateSettings({ hitMarkerAutoHideMs: v * 1000 })}
            />
            <Text selectable={false} style={styles.helpText}>
              Set to Never to keep markers on screen.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { padding: 24, paddingTop: 8 },
    section: { fontSize: 16, fontWeight: '500', marginTop: 24, marginBottom: 8, color: theme.text },
    modeHint: { fontSize: 12, color: theme.textSubtle, marginBottom: 8 },
    helpText: { fontSize: 12, color: theme.textSubtle, marginTop: 4 },
    rowLabel: { fontSize: 14, color: theme.text },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 8,
    },
    appearanceRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    appearancePill: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.borderStrong,
      backgroundColor: theme.cardSoft,
    },
    appearancePillActive: { backgroundColor: theme.text, borderColor: theme.text },
    appearanceText: { fontSize: 13, color: theme.text, fontWeight: '500' },
    appearanceTextActive: { color: theme.card },
  });
