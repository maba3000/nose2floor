import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useHistoryStore } from '@/store/historyStore';
import { buildInsights } from '@/analytics/insights';
import { ScreenHeader } from '@/components/ScreenHeader';

export default function InsightsScreen() {
  const history = useHistoryStore((s) => s.history);

  const stats = useMemo(() => buildInsights(history), [history]);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Insights" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.card}>
              <Text selectable={false} style={styles.cardLabel}>{stat.label}</Text>
              <Text selectable={false} style={styles.cardValue}>{stat.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
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
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  cardLabel: { fontSize: 12, fontWeight: '400', color: 'rgba(0,0,0,0.6)' },
  cardValue: { fontSize: 22, fontWeight: '600', color: '#1A202C', marginTop: 6 },
});
