import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useHistoryStore } from '@/store/historyStore';
import { buildInsights } from '@/analytics/insights';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

export default function InsightsScreen() {
  const history = useHistoryStore((s) => s.history);
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const stats = useMemo(() => buildInsights(history), [history]);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Insights" />
      <ScrollView contentContainerStyle={styles.content}>
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
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { padding: 24, paddingTop: 8 },
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
