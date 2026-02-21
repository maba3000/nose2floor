import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useHistoryStore } from '@/store/historyStore';
import { StatCard } from '@/components/StatCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { buildInsights } from '@/analytics/insights';

export default function HistoryScreen() {
  const router = useRouter();
  const history = useHistoryStore((s) => s.history);
  const deleteSession = useHistoryStore((s) => s.deleteSession);

  if (history.length === 0) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="History" />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No sessions yet.</Text>
        </View>
      </View>
    );
  }

  const stats = buildInsights(history);

  return (
    <View style={styles.container}>
      <ScreenHeader title="History" />

      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={String(stat.value)} />
        ))}
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => item.reps > 0 && router.push(`/history/${item.id}`)}
            onLongPress={() => deleteSession(item.id)}
            style={styles.sessionRow}
          >
            <Text style={styles.sessionDate}>{new Date(item.startedAt).toLocaleString()}</Text>
            <Text>
              Hits: {item.reps} · Points: {item.totalScore}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  sessionRow: { padding: 12, backgroundColor: '#fff', borderRadius: 8, marginBottom: 8 },
  sessionDate: { fontWeight: '500', marginBottom: 4 },
  empty: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  emptyText: { fontSize: 16, color: 'rgba(0,0,0,0.4)' },
});
