import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useHistoryStore } from '@/store/historyStore';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { WorkoutSession } from '@/domain/entities';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

export default function HistoryScreen() {
  const router = useRouter();
  const history = useHistoryStore((s) => s.history);
  const deleteSession = useHistoryStore((s) => s.deleteSession);
  const addSession = useHistoryStore((s) => s.addSession);
  const replaceHistory = useHistoryStore((s) => s.replaceHistory);
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [undoSession, setUndoSession] = useState<WorkoutSession | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    },
    [],
  );

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

  const handleDelete = (session: WorkoutSession) => {
    deleteSession(session.id);
    setUndoSession(session);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setUndoSession(null), 4000);
  };

  const confirmDelete = (session: WorkoutSession) => {
    const title = 'Delete session?';
    const message = 'This will remove the session from history.';
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      const ok = window.confirm(`${title}\n\n${message}`);
      if (ok) handleDelete(session);
      return;
    }
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => handleDelete(session) },
    ]);
  };

  const confirmClearHistory = () => {
    const title = 'Clear all history?';
    const message = 'This cannot be undone.';
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      const ok = window.confirm(`${title}\n\n${message}`);
      if (ok) replaceHistory([]);
      return;
    }
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => replaceHistory([]),
      },
    ]);
  };

  const handleUndo = () => {
    if (!undoSession) return;
    addSession(undoSession);
    setUndoSession(null);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="History" />

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Pressable style={styles.clearButton} onPress={confirmClearHistory}>
              <Text selectable={false} style={styles.clearButtonText}>
                Clear history
              </Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => item.reps > 0 && router.push(`/history/${item.id}`)}
            onLongPress={() => confirmDelete(item)}
            style={styles.sessionRow}
          >
            <View style={styles.sessionMeta}>
              <Text selectable={false} style={styles.sessionDate}>
                {new Date(item.startedAt).toLocaleString()}
              </Text>
              <Text selectable={false} style={styles.sessionStats}>
                Hits: {item.reps} · Points: {item.totalScore}
              </Text>
            </View>
            <Pressable
              onPress={(e) => {
                // Prevent row press on web.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (e as any).stopPropagation?.();
                confirmDelete(item);
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
      {undoSession && (
        <View style={styles.undoBanner}>
          <Text selectable={false} style={styles.undoText}>
            Session deleted.
          </Text>
          <Pressable onPress={handleUndo} style={styles.undoButton}>
            <Text selectable={false} style={styles.undoButtonText}>
              Undo
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    listContent: {
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 72,
    },
    listHeader: {
      alignItems: 'flex-end',
      marginBottom: 8,
    },
    clearButton: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.dangerBorder,
      backgroundColor: theme.dangerBackground,
    },
    clearButtonText: { fontSize: 12, fontWeight: '500', color: theme.dangerText },
    sessionRow: {
      padding: 12,
      backgroundColor: theme.card,
      borderRadius: 8,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sessionMeta: { flex: 1 },
    sessionDate: { fontWeight: '500', marginBottom: 4, color: theme.text },
    sessionStats: { color: theme.textSubtle },
    deleteButton: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.dangerBorder,
      backgroundColor: theme.dangerBackground,
    },
    deleteLabel: { fontSize: 12, fontWeight: '500', color: theme.dangerText },
    undoBanner: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 16,
      backgroundColor: theme.card,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    undoText: { fontSize: 13, color: theme.text },
    undoButton: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.borderStrong,
      backgroundColor: theme.cardSoft,
    },
    undoButtonText: { fontSize: 12, fontWeight: '500', color: theme.text },
    empty: { alignItems: 'center', justifyContent: 'center', flex: 1 },
    emptyText: { fontSize: 16, color: theme.textFaint },
  });
