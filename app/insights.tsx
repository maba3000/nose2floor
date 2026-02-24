import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useHistoryStore } from '@/store/historyStore';
import { useSettingsStore } from '@/store/settingsStore';
import { buildInsights, filterByRange, getRangeMs, type RangeKey } from '@/analytics/insights';
import { ActivityHeatmap } from '@/components/ActivityHeatmap';
import { HitMapCanvas } from '@/components/HitMapCanvas';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

const RANGE_PILLS: { key: RangeKey; label: string }[] = [
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'custom', label: 'Custom' },
];

const HEATMAP_LIGHT_COLORS = ['#FFF9C4', '#FFD740', '#FF6D00', '#C62828'];
const HEATMAP_DARK_COLORS = ['#4A3728', '#F9A825', '#BF360C', '#7F0000'];

function toDateString(ms: number): string {
  const d = new Date(ms);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function toDisplayDate(ms: number): string {
  const d = new Date(ms);
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    d.getFullYear(),
  ].join('-');
}

function parseLocalDate(s: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const parts = s.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date.getTime();
}

export default function InsightsScreen() {
  const history = useHistoryStore((s) => s.history);
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width: windowWidth } = useWindowDimensions();
  const [heatmapCardWidth, setHeatmapCardWidth] = useState(0);
  const fallbackHeatmapWidth = windowWidth - 92;
  const heatmapAvailableWidth =
    heatmapCardWidth > 0 ? Math.max(120, heatmapCardWidth - 28 - 16) : fallbackHeatmapWidth;
  const previewMapSize = Math.max(220, Math.min(windowWidth - 72, 320));

  const [range, setRange] = useState<RangeKey>('month');
  const [showSettings, setShowSettings] = useState(false);
  const [customFrom, setCustomFrom] = useState(() => {
    if (history.length === 0) return toDateString(Date.now());
    const oldestMs = history.reduce((min, s) => Math.min(min, s.startedAt), Infinity);
    return toDateString(oldestMs);
  });
  const [customTo, setCustomTo] = useState(() => toDateString(Date.now()));

  const [startMs, endMs] = useMemo(() => {
    if (range === 'custom') {
      const fromMs = parseLocalDate(customFrom);
      const toMs = parseLocalDate(customTo);
      if (fromMs !== null && toMs !== null) {
        const toEndMs = toMs + 23 * 3600 * 1000 + 59 * 60 * 1000 + 59 * 1000 + 999;
        return [fromMs, toEndMs] as [number, number];
      }
      if (history.length === 0) return getRangeMs('all');
      const minStart = history.reduce((min, s) => Math.min(min, s.startedAt), Infinity);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      return [minStart, endOfToday.getTime()] as [number, number];
    }
    return getRangeMs(range);
  }, [range, customFrom, customTo, history]);

  const filtered = useMemo(() => filterByRange(history, startMs, endMs), [history, startMs, endMs]);
  const combinedHits = useMemo(() => filtered.flatMap((session) => session.hits), [filtered]);
  const combinedPoints = useMemo(
    () => filtered.reduce((sum, session) => sum + session.totalScore, 0),
    [filtered],
  );
  const combinedReps = useMemo(
    () => filtered.reduce((sum, session) => sum + session.reps, 0),
    [filtered],
  );
  const missingHitMapCount = useMemo(
    () =>
      filtered.reduce((sum, session) => sum + Math.max(0, session.reps - session.hits.length), 0),
    [filtered],
  );

  const stats = useMemo(() => buildInsights(filtered), [filtered]);
  const rangeLabel = useMemo(
    () => `${toDisplayDate(startMs)} - ${toDisplayDate(endMs)}`,
    [startMs, endMs],
  );

  const swatchColors = theme.isDark ? HEATMAP_DARK_COLORS : HEATMAP_LIGHT_COLORS;

  const gearButton = (
    <Pressable
      onPress={() => setShowSettings((v) => !v)}
      hitSlop={10}
      style={[styles.gearBtn, showSettings && styles.gearBtnActive]}
    >
      <Ionicons
        name="settings-outline"
        size={19}
        color={showSettings ? theme.background : theme.textMuted}
      />
    </Pressable>
  );

  const handleHeatmapCardLayout = (e: LayoutChangeEvent) => {
    setHeatmapCardWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Insights" rightAction={gearButton} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Inline settings panel */}
        {showSettings && (
          <View style={styles.settingsPanel}>
            <View style={styles.panelSection}>
              <Text selectable={false} style={styles.panelLabel}>
                Sections
              </Text>
              <View style={styles.switchRow}>
                <Text selectable={false} style={styles.panelValue}>
                  Show preview
                </Text>
                <Switch
                  value={settings.insightsShowPreview}
                  onValueChange={(v) => updateSettings({ insightsShowPreview: v })}
                />
              </View>
              <View style={styles.switchRow}>
                <Text selectable={false} style={styles.panelValue}>
                  Show activity
                </Text>
                <Switch
                  value={settings.insightsShowActivity}
                  onValueChange={(v) => updateSettings({ insightsShowActivity: v })}
                />
              </View>
              <View style={styles.switchRow}>
                <Text selectable={false} style={styles.panelValue}>
                  Show stats
                </Text>
                <Switch
                  value={settings.insightsShowStats}
                  onValueChange={(v) => updateSettings({ insightsShowStats: v })}
                />
              </View>
            </View>

            <View style={[styles.panelSection, styles.panelSectionBorder]}>
              <Text selectable={false} style={styles.panelLabel}>
                Daily goal
              </Text>
              <Text selectable={false} style={styles.panelValue}>
                {settings.dailyGoal} hits
              </Text>
              <Slider
                minimumValue={1}
                maximumValue={200}
                step={1}
                value={settings.dailyGoal}
                onValueChange={(v) => updateSettings({ dailyGoal: v })}
              />
            </View>

            <View style={[styles.panelSection, styles.panelSectionBorder]}>
              <Text selectable={false} style={styles.panelLabel}>
                Activity tiles
              </Text>
              <View style={styles.switchRow}>
                <Text selectable={false} style={styles.panelValue}>
                  Show goal star
                </Text>
                <Switch
                  value={settings.heatmapShowGoalStar}
                  onValueChange={(v) => updateSettings({ heatmapShowGoalStar: v })}
                />
              </View>
              <View style={styles.switchRow}>
                <Text selectable={false} style={styles.panelValue}>
                  Show hit count
                </Text>
                <Switch
                  value={settings.heatmapShowHitCount}
                  onValueChange={(v) => updateSettings({ heatmapShowHitCount: v })}
                />
              </View>
            </View>

            <View style={[styles.panelSection, styles.panelSectionBorder]}>
              <Text selectable={false} style={styles.panelLabel}>
                Heatmap levels
              </Text>
              {([0, 1, 2, 3] as const).map((i) => (
                <React.Fragment key={i}>
                  <View style={styles.thresholdRow}>
                    <View style={[styles.swatch, { backgroundColor: swatchColors[i] }]} />
                    <Text selectable={false} style={styles.panelValue}>
                      Level {i + 1}: {settings.heatmapThresholds[i]}+ hits
                    </Text>
                  </View>
                  <Slider
                    minimumValue={1}
                    maximumValue={200}
                    step={1}
                    value={settings.heatmapThresholds[i]}
                    onValueChange={(v) => {
                      const next = [...settings.heatmapThresholds] as [
                        number,
                        number,
                        number,
                        number,
                      ];
                      next[i] = v;
                      updateSettings({ heatmapThresholds: next });
                    }}
                  />
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        {/* Range pills */}
        <View style={styles.pillRow}>
          {RANGE_PILLS.map(({ key, label }) => {
            const active = range === key;
            return (
              <Pressable
                key={key}
                onPress={() => setRange(key)}
                style={[styles.pill, active && styles.pillActive]}
              >
                <Text selectable={false} style={[styles.pillText, active && styles.pillTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Custom date inputs */}
        {range === 'custom' && (
          <View style={styles.customRow}>
            <TextInput
              style={styles.dateInput}
              placeholder="From YYYY-MM-DD"
              placeholderTextColor={theme.textFaint}
              value={customFrom}
              onChangeText={setCustomFrom}
              autoCorrect={false}
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
            />
            <TextInput
              style={styles.dateInput}
              placeholder="To YYYY-MM-DD"
              placeholderTextColor={theme.textFaint}
              value={customTo}
              onChangeText={setCustomTo}
              autoCorrect={false}
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
            />
          </View>
        )}

        {settings.insightsShowPreview && (
          <>
            <Text style={styles.sectionLabel}>Preview</Text>
            <View style={styles.previewCard}>
              <Text selectable={false} style={styles.previewTitle}>
                {rangeLabel}
              </Text>
              {filtered.length === 0 ? (
                <Text selectable={false} style={styles.previewHint}>
                  No sessions in this range.
                </Text>
              ) : (
                <>
                  <Text selectable={false} style={styles.previewHint}>
                    Sessions: {filtered.length} · Hits: {combinedReps} · Points: {combinedPoints}
                  </Text>
                  <View style={styles.previewCanvasWrap}>
                    <HitMapCanvas size={previewMapSize} scale={1} hits={combinedHits} />
                  </View>
                  {missingHitMapCount > 0 && (
                    <Text selectable={false} style={styles.previewHint}>
                      * {missingHitMapCount} hits with no data
                    </Text>
                  )}
                </>
              )}
            </View>
          </>
        )}

        {settings.insightsShowActivity && (
          <>
            <Text style={styles.sectionLabel}>Activity</Text>
            <View style={styles.heatmapCard} onLayout={handleHeatmapCardLayout}>
              <ActivityHeatmap
                sessions={filtered}
                startMs={startMs}
                endMs={endMs}
                availableWidth={heatmapAvailableWidth}
                dailyGoal={settings.dailyGoal}
                heatmapThresholds={settings.heatmapThresholds}
                showGoalStar={settings.heatmapShowGoalStar}
                showHitCount={settings.heatmapShowHitCount}
              />
            </View>
          </>
        )}

        {settings.insightsShowStats && (
          <>
            <Text style={styles.sectionLabel}>Stats</Text>
            <View style={styles.grid}>
              {stats.map((stat) => (
                <View key={stat.label} style={styles.card}>
                  <Text selectable={false} style={styles.cardLabel}>
                    {stat.label}
                  </Text>
                  <Text selectable={false} style={styles.cardValue}>
                    {stat.value}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { padding: 24, paddingTop: 8, paddingBottom: 40 },

    // Gear button
    gearBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
    },
    gearBtnActive: {
      backgroundColor: theme.text,
    },

    // Settings panel
    settingsPanel: {
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: theme.cardSoft,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 16,
    },
    panelSection: {
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    panelSectionBorder: {
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    panelLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSubtle,
      textTransform: 'uppercase',
      letterSpacing: 0.7,
      marginBottom: 4,
    },
    panelValue: {
      fontSize: 13,
      color: theme.text,
    },
    thresholdRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 6,
    },
    swatch: { width: 12, height: 12, borderRadius: 3 },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },

    // Pills
    pillRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
      flexWrap: 'wrap',
    },
    pill: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: theme.cardSoft,
      borderWidth: 1,
      borderColor: theme.border,
    },
    pillActive: {
      backgroundColor: theme.text,
      borderColor: theme.text,
    },
    pillText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.textMuted,
    },
    pillTextActive: {
      color: theme.background,
    },

    // Custom date inputs
    customRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    dateInput: {
      flex: 1,
      height: 38,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: theme.cardSoft,
      borderWidth: 1,
      borderColor: theme.border,
      color: theme.text,
      fontSize: 13,
    },

    // Section labels
    sectionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSubtle,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 10,
    },

    // Heatmap card
    previewCard: {
      padding: 14,
      borderRadius: 12,
      backgroundColor: theme.cardSoft,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 20,
    },
    previewTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
      textTransform: 'capitalize',
    },
    previewHint: {
      fontSize: 12,
      color: theme.textSubtle,
    },
    previewCanvasWrap: {
      alignItems: 'center',
      marginTop: 12,
      marginBottom: 8,
    },
    heatmapCard: {
      padding: 14,
      borderRadius: 12,
      backgroundColor: theme.cardSoft,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 20,
    },

    // Stats grid
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    card: {
      width: '48%',
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: theme.cardSoft,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardLabel: { fontSize: 12, fontWeight: '400', color: theme.textSubtle },
    cardValue: { fontSize: 22, fontWeight: '600', color: theme.text, marginTop: 6 },
  });
