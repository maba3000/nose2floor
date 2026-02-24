import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  TextInput,
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
  const upsertSession = useHistoryStore((s) => s.upsertSession);
  const replaceHistory = useHistoryStore((s) => s.replaceHistory);
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [undoSession, setUndoSession] = useState<WorkoutSession | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [draftHits, setDraftHits] = useState('');
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
    if (editingSessionId === session.id) {
      setEditingSessionId(null);
      setDraftHits('');
    }
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setUndoSession(null), 4000);
  };

  const confirmClearHistory = () => {
    const title = 'Clear all history?';
    const message = 'This cannot be undone.';
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      const ok = window.confirm(`${title}\n\n${message}`);
      if (ok) {
        replaceHistory([]);
        setEditingSessionId(null);
        setDraftHits('');
      }
      return;
    }
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          replaceHistory([]);
          setEditingSessionId(null);
          setDraftHits('');
        },
      },
    ]);
  };

  const handleUndo = () => {
    if (!undoSession) return;
    addSession(undoSession);
    setUndoSession(null);
  };

  const beginEdit = (session: WorkoutSession) => {
    setEditingSessionId(session.id);
    setDraftHits(String(session.reps));
  };

  const cancelEdit = () => {
    setEditingSessionId(null);
    setDraftHits('');
  };

  const showInvalidHitsError = () => {
    const title = 'Invalid hits value';
    const message = 'Enter a whole number of hits (0 or more).';
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  const saveEdit = (session: WorkoutSession) => {
    const trimmed = draftHits.trim();
    if (!/^\d+$/.test(trimmed)) {
      showInvalidHitsError();
      return;
    }

    const nextReps = Number(trimmed);
    if (!Number.isSafeInteger(nextReps) || nextReps < 0) {
      showInvalidHitsError();
      return;
    }

    let nextHits = session.hits;
    let nextTotalScore = session.totalScore;
    if (nextReps <= session.hits.length) {
      nextHits = session.hits.slice(0, nextReps);
      nextTotalScore = nextHits.reduce((sum, hit) => sum + hit.score, 0);
    }

    upsertSession({
      ...session,
      reps: nextReps,
      totalScore: nextTotalScore,
      hits: nextHits,
    });
    setEditingSessionId(null);
    setDraftHits('');
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
            <Text selectable={false} style={styles.headerHint}>
              Use Preview, Edit, or Delete for each session.
            </Text>
            <Pressable style={styles.clearButton} onPress={confirmClearHistory}>
              <Text selectable={false} style={styles.clearButtonText}>
                Clear history
              </Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.sessionItem}>
            <View style={styles.sessionRow}>
              <View style={styles.sessionMeta}>
                <Text selectable={false} style={styles.sessionDate}>
                  {new Date(item.startedAt).toLocaleString()}
                </Text>
                <Text selectable={false} style={styles.sessionStats}>
                  Hits: {item.reps} · Points: {item.totalScore}
                </Text>
              </View>

              <View style={styles.rowActions}>
                <Pressable onPress={() => router.push(`/history/${item.id}`)} style={styles.previewButton}>
                  <Text selectable={false} style={styles.previewLabel}>
                    Preview
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    editingSessionId === item.id ? cancelEdit() : beginEdit(item)
                  }
                  style={styles.editButton}
                >
                  <Text selectable={false} style={styles.editLabel}>
                    {editingSessionId === item.id ? 'Close' : 'Edit'}
                  </Text>
                </Pressable>

                <Pressable onPress={() => handleDelete(item)} style={styles.deleteButton}>
                  <Text selectable={false} style={styles.deleteLabel}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            </View>

            {editingSessionId === item.id && (
              <View style={styles.editPanel}>
                <Text selectable={false} style={styles.editInputLabel}>
                  Correct hits
                </Text>
                <TextInput
                  value={draftHits}
                  onChangeText={setDraftHits}
                  keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                  style={styles.editInput}
                  placeholder="0"
                  placeholderTextColor={theme.textFaint}
                />
                <Text selectable={false} style={styles.editHint}>
                  Lower values trim extra hit markers and recalculate points.
                </Text>
                <View style={styles.editPanelActions}>
                  <Pressable style={styles.cancelButton} onPress={cancelEdit}>
                    <Text selectable={false} style={styles.cancelLabel}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable style={styles.saveButton} onPress={() => saveEdit(item)}>
                    <Text selectable={false} style={styles.saveLabel}>
                      Save
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
      gap: 12,
    },
    headerHint: { flex: 1, fontSize: 12, color: theme.textSubtle },
    clearButton: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.dangerBorder,
      backgroundColor: theme.dangerBackground,
    },
    clearButtonText: { fontSize: 12, fontWeight: '500', color: theme.dangerText },
    sessionItem: { marginBottom: 8 },
    sessionRow: {
      padding: 12,
      backgroundColor: theme.card,
      borderRadius: 8,
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
    rowActions: { flexDirection: 'row', gap: 8 },
    previewButton: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.borderStrong,
      backgroundColor: theme.cardSoft,
    },
    previewLabel: { fontSize: 12, fontWeight: '500', color: theme.text },
    editButton: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.borderStrong,
      backgroundColor: theme.cardSoft,
    },
    editLabel: { fontSize: 12, fontWeight: '500', color: theme.text },
    deleteButton: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.dangerBorder,
      backgroundColor: theme.dangerBackground,
    },
    deleteLabel: { fontSize: 12, fontWeight: '500', color: theme.dangerText },
    editPanel: {
      marginTop: 8,
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.cardSoft,
    },
    editInputLabel: { fontSize: 12, color: theme.text, marginBottom: 4 },
    editInput: {
      borderWidth: 1,
      borderColor: theme.borderStrong,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 15,
      color: theme.text,
      backgroundColor: theme.card,
    },
    editHint: { fontSize: 12, color: theme.textSubtle, marginTop: 6 },
    editPanelActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
    cancelButton: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.borderStrong,
      backgroundColor: theme.card,
    },
    cancelLabel: { fontSize: 12, fontWeight: '500', color: theme.text },
    saveButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.actionPrimary,
      backgroundColor: theme.actionPrimary,
    },
    saveLabel: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
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
