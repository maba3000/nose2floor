import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useHistoryStore } from '@/store/historyStore';
import { HitMapCanvas } from '@/components/HitMapCanvas';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useHistoryStore((s) => s.history.find((h) => h.id === id));
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!session) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Session" />
        <View style={styles.empty}>
          <Text selectable={false} style={styles.emptyText}>
            Session not found.
          </Text>
        </View>
      </View>
    );
  }

  const date = new Date(session.startedAt);
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const mins = Math.floor(session.durationSeconds / 60);
  const secs = session.durationSeconds % 60;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Session" />
      <Text selectable={false} style={styles.subHeader}>
        {dateStr}
      </Text>

      <View style={styles.statsRow}>
        <Stat label="HITS" value={`${session.reps}`} />
        <Stat label="PTS" value={`${session.totalScore}`} />
        <Stat label="TIME" value={`${mins}m ${secs}s`} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.canvasWrapper}>
          <HitMapCanvas size={300} scale={session.bullseyeScale} hits={session.hits} />
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text selectable={false} style={styles.statValue}>
        {value}
      </Text>
      <Text selectable={false} style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    subHeader: {
      paddingHorizontal: 24,
      paddingBottom: 8,
      fontSize: 14,
      color: theme.textSubtle,
    },
    statsRow: { flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 8 },
    stat: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: '500', color: theme.text },
    statLabel: { fontSize: 12, letterSpacing: 1, color: theme.textFaint },
    content: { alignItems: 'center', paddingBottom: 24 },
    canvasWrapper: { marginTop: 16 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontSize: 16, color: theme.textFaint },
  });
