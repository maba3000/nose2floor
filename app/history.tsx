import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useHistoryStore } from '@/store/historyStore';
import { ScreenHeader } from '@/components/ScreenHeader';

export default function HistoryScreen() {
  const router = useRouter();
  const history = useHistoryStore((s) => s.history);
  const deleteSession = useHistoryStore((s) => s.deleteSession);

  if (history.length === 0) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="History" />
        <View style={styles.empty}>
          <Text selectable={false} style={styles.emptyText}>
            No sessions yet.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="History" />

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
            <View style={styles.sessionMeta}>
              <Text selectable={false} style={styles.sessionDate}>
                {new Date(item.startedAt).toLocaleString()}
              </Text>
              <Text selectable={false}>
                Hits: {item.reps} · Points: {item.totalScore}
              </Text>
            </View>
            <Pressable
              onPress={(e) => {
                // Prevent row press on web.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (e as any).stopPropagation?.();
                deleteSession(item.id);
              }}
              style={styles.deleteButton}
            >
              <Text selectable={false} style={styles.deleteLabel}>
                Delete
              </Text>
            </Pressable>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  sessionRow: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sessionMeta: { flex: 1 },
  sessionDate: { fontWeight: '500', marginBottom: 4 },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: '#F7E7E2',
  },
  deleteLabel: { fontSize: 12, fontWeight: '500', color: '#6B1A0D' },
  empty: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  emptyText: { fontSize: 16, color: 'rgba(0,0,0,0.4)' },
});
