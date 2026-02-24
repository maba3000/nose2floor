import React, { useMemo, useState } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSettingsStore } from '@/store/settingsStore';
import type { CornerWidget } from '@/domain/entities';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useTheme } from '@/hooks/useTheme';
import type { Theme, ThemeMode } from '@/theme';

const THEME_OPTIONS = [
  ['light', 'Light'],
  ['dark', 'Dark'],
  ['system', 'System'],
] as const;

const CORNER_OPTIONS: CornerWidget[] = ['none', 'hits', 'points', 'timer', 'goal'];
const CORNER_POSITIONS = [
  ['topLeft', 'Top-left'],
  ['topRight', 'Top-right'],
  ['bottomLeft', 'Bottom-left'],
] as const;

export default function SettingsScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hideAfterSeconds = Math.round(settings.hitMarkerAutoHideMs / 1000);
  const introDisabled = settings.sessionMode === 'auto';

  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text selectable={false} style={styles.sectionTitle}>
          Everyday
        </Text>
        <View style={styles.card}>
          <View style={styles.cardBlock}>
            <View style={styles.row}>
              <Text selectable={false} style={styles.rowLabel}>
                Auto mode
              </Text>
              <Switch
                value={settings.sessionMode === 'auto'}
                onValueChange={(value) =>
                  updateSettings({
                    sessionMode: value ? 'auto' : 'manual',
                    showIntro: value ? false : settings.showIntro,
                  })
                }
              />
            </View>
            <Text selectable={false} style={styles.helpText}>
              Auto mode starts and saves automatically. Manual mode uses Hold to Start and Hold to
              Stop.
            </Text>
          </View>

          <View style={[styles.cardBlock, styles.cardBlockBorder]}>
            <View style={styles.row}>
              <Text selectable={false} style={styles.rowLabel}>
                Haptic feedback
              </Text>
              <Switch
                value={settings.hapticsEnabled}
                onValueChange={(value) => updateSettings({ hapticsEnabled: value })}
              />
            </View>
          </View>

          <View style={[styles.cardBlock, styles.cardBlockBorder]}>
            <Text selectable={false} style={styles.blockLabel}>
              Theme
            </Text>
            <View style={styles.appearanceRow}>
              {THEME_OPTIONS.map(([value, label]) => {
                const active = settings.themeMode === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => updateSettings({ themeMode: value as ThemeMode })}
                    style={[styles.pill, active && styles.pillActive]}
                  >
                    <Text selectable={false} style={[styles.pillText, active && styles.pillTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={[styles.cardBlock, styles.cardBlockBorder]}>
            <Text selectable={false} style={styles.blockLabel}>
              Daily goal: {settings.dailyGoal} reps
            </Text>
            <Slider
              minimumValue={1}
              maximumValue={200}
              step={1}
              value={settings.dailyGoal}
              onValueChange={(value) => updateSettings({ dailyGoal: value })}
            />
            <Text selectable={false} style={styles.helpText}>
              Set one corner widget to Goal to see remaining reps for today.
            </Text>
          </View>
        </View>

        <Pressable style={styles.advancedToggle} onPress={() => setShowAdvanced((value) => !value)}>
          <View style={styles.advancedText}>
            <Text selectable={false} style={styles.advancedTitle}>
              Advanced
            </Text>
            <Text selectable={false} style={styles.advancedHint}>
              Display overlays, corner widgets, and timing calibration.
            </Text>
          </View>
          <Text selectable={false} style={styles.advancedArrow}>
            {showAdvanced ? 'v' : '>'}
          </Text>
        </Pressable>

        {showAdvanced && (
          <View style={styles.card}>
            <View style={styles.cardBlock}>
              <View style={styles.row}>
                <Text selectable={false} style={styles.rowLabel}>
                  Show intro on startup
                </Text>
                <Switch
                  value={introDisabled ? false : settings.showIntro}
                  disabled={introDisabled}
                  onValueChange={(value) => updateSettings({ showIntro: value })}
                />
              </View>
              {introDisabled && (
                <Text selectable={false} style={styles.helpText}>
                  Disabled while auto mode is on.
                </Text>
              )}
            </View>

            <View style={[styles.cardBlock, styles.cardBlockBorder]}>
              <Text selectable={false} style={styles.blockLabel}>
                Display overlays
              </Text>
              <View style={styles.row}>
                <Text selectable={false} style={styles.rowLabel}>
                  Show bull&apos;s-eye
                </Text>
                <Switch
                  value={settings.showBullseye}
                  onValueChange={(value) => updateSettings({ showBullseye: value })}
                />
              </View>
              {settings.showBullseye && (
                <>
                  <Text selectable={false} style={styles.rowLabel}>
                    Bull&apos;s-eye size: {settings.bullseyeScale.toFixed(1)}x
                  </Text>
                  <Slider
                    minimumValue={0.5}
                    maximumValue={2.0}
                    step={0.1}
                    value={settings.bullseyeScale}
                    onValueChange={(value) => updateSettings({ bullseyeScale: value })}
                  />
                </>
              )}

              <View style={[styles.row, styles.innerRowBorder]}>
                <Text selectable={false} style={styles.rowLabel}>
                  Show hit markers
                </Text>
                <Switch
                  value={settings.showHitMarkers}
                  onValueChange={(value) => updateSettings({ showHitMarkers: value })}
                />
              </View>
              {settings.showHitMarkers && (
                <>
                  <Text selectable={false} style={styles.rowLabel}>
                    Marker hide after: {hideAfterSeconds === 0 ? 'Never' : `${hideAfterSeconds}s`}
                  </Text>
                  <Slider
                    minimumValue={0}
                    maximumValue={10}
                    step={1}
                    value={hideAfterSeconds}
                    onValueChange={(value) => updateSettings({ hitMarkerAutoHideMs: value * 1000 })}
                  />
                </>
              )}
            </View>

            <View style={[styles.cardBlock, styles.cardBlockBorder]}>
              <Text selectable={false} style={styles.blockLabel}>
                Corner widgets
              </Text>
              {CORNER_POSITIONS.map(([corner, label]) => (
                <View key={corner} style={styles.cornerRow}>
                  <Text selectable={false} style={styles.rowLabel}>
                    {label}
                  </Text>
                  <View style={styles.cornerPills}>
                    {CORNER_OPTIONS.map((widget) => {
                      const active = settings.corners[corner] === widget;
                      const widgetLabel = widget.charAt(0).toUpperCase() + widget.slice(1);
                      return (
                        <Pressable
                          key={widget}
                          onPress={() =>
                            updateSettings({ corners: { ...settings.corners, [corner]: widget } })
                          }
                          style={[styles.pill, active && styles.pillActive]}
                        >
                          <Text
                            selectable={false}
                            style={[styles.pillText, active && styles.pillTextActive]}
                          >
                            {widgetLabel}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.cardBlock, styles.cardBlockBorder]}>
              <Text selectable={false} style={styles.blockLabel}>
                Timing calibration
              </Text>
              <Text selectable={false} style={styles.rowLabel}>
                Hit cooldown: {settings.hitCooldownMs}ms
              </Text>
              <Slider
                minimumValue={100}
                maximumValue={1000}
                step={50}
                value={settings.hitCooldownMs}
                onValueChange={(value) => updateSettings({ hitCooldownMs: value })}
              />
              <Text selectable={false} style={styles.helpText}>
                Lower is more sensitive. Higher reduces accidental double hits.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { padding: 24, paddingTop: 8, paddingBottom: 24 },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSubtle,
      marginBottom: 8,
      marginLeft: 2,
    },
    card: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.cardSoft,
      overflow: 'hidden',
      marginBottom: 16,
    },
    cardBlock: { paddingHorizontal: 12, paddingVertical: 12 },
    cardBlockBorder: { borderTopWidth: 1, borderTopColor: theme.border },
    blockLabel: { fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    innerRowBorder: { borderTopWidth: 1, borderTopColor: theme.border, marginTop: 8, paddingTop: 12 },
    rowLabel: { fontSize: 14, color: theme.text },
    helpText: { fontSize: 12, color: theme.textSubtle, marginTop: 4 },
    appearanceRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    pill: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.borderStrong,
      backgroundColor: theme.card,
    },
    pillActive: { backgroundColor: theme.text, borderColor: theme.text },
    pillText: { fontSize: 13, color: theme.text, fontWeight: '500' },
    pillTextActive: { color: theme.card },
    advancedToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.cardSoft,
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginBottom: 12,
    },
    advancedText: { flex: 1 },
    advancedTitle: { fontSize: 16, fontWeight: '500', color: theme.text },
    advancedHint: { fontSize: 12, color: theme.textSubtle, marginTop: 2 },
    advancedArrow: { fontSize: 20, color: theme.textFaint, marginLeft: 12 },
    cornerRow: { marginTop: 10 },
    cornerPills: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 6 },
  });
