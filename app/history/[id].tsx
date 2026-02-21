import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useHistoryStore } from '@/store/historyStore';
import { HitMapCanvas } from '@/components/HitMapCanvas';
import { ScreenHeader } from '@/components/ScreenHeader';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useHistoryStore((s) => s.history.find((h) => h.id === id));

  if (!session) return <Text>Session not found.</Text>;

  const date = new Date(session.startedAt);
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const mins = Math.floor(session.durationSeconds / 60);
  const secs = session.durationSeconds % 60;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Session" />
      <Text style={styles.subHeader}>{dateStr}</Text>

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
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  subHeader: { paddingHorizontal: 24, paddingBottom: 8, fontSize: 14, color: 'rgba(0,0,0,0.6)' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 8 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '500', color: '#111' },
  statLabel: { fontSize: 12, letterSpacing: 1, color: 'rgba(0,0,0,0.4)' },
  content: { alignItems: 'center', paddingBottom: 24 },
  canvasWrapper: { marginTop: 16 },
});
