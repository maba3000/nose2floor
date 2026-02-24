import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSettingsStore } from '@/store/settingsStore';
import { useHistoryStore } from '@/store/historyStore';
import { DEFAULT_SETTINGS } from '@/domain/entities';
import { exportData, importData, type ExportData } from '@/persistence/storage';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppDialog } from '@/components/AppDialog';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

export default function DataScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const replaceHistory = useHistoryStore((s) => s.replaceHistory);
  const history = useHistoryStore((s) => s.history);
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [exportJson, setExportJson] = useState('');
  const [importJson, setImportJson] = useState('');
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [confirmImport, setConfirmImport] = useState<{
    mode: 'append' | 'overwrite';
    data: ExportData;
  } | null>(null);
  const exportTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (exportTimeout.current) clearTimeout(exportTimeout.current);
    },
    [],
  );

  function handleExport() {
    const json = exportData(settings, history);
    setExportJson(json);
    setExportStatus(null);
    setImportStatus(null);
  }

  const handleCopyExport = async () => {
    if (!exportJson) {
      setExportStatus('Generate export JSON first.');
      return;
    }
    try {
      await Clipboard.setStringAsync(exportJson);
      setExportStatus('Copied to clipboard.');
      if (exportTimeout.current) clearTimeout(exportTimeout.current);
      exportTimeout.current = setTimeout(() => setExportStatus(null), 1500);
    } catch {
      setExportStatus('Copy failed.');
    }
  };

  function parseImport() {
    const raw = importJson.trim();
    if (!raw) {
      setImportStatus('Paste JSON to import.');
      return null;
    }
    let data;
    try {
      data = importData(raw);
    } catch {
      setImportStatus('Import failed: invalid JSON.');
      return null;
    }
    return data;
  }

  const commitImport = (mode: 'append' | 'overwrite', data: ExportData) => {
    const nextSettings = { ...DEFAULT_SETTINGS, ...data.settings };
    if (mode === 'overwrite') {
      updateSettings(nextSettings);
      replaceHistory(data.history);
      setExportJson(exportData(nextSettings, data.history));
      setImportStatus('Import successful (overwritten).');
    } else {
      const merged = [...history, ...data.history]
        .reduce((acc, session) => {
          if (!acc.has(session.id)) acc.set(session.id, session);
          return acc;
        }, new Map<string, (typeof history)[number]>())
        .values();
      const nextHistory = Array.from(merged).sort((a, b) => b.startedAt - a.startedAt);
      replaceHistory(nextHistory);
      setExportJson(exportData(settings, nextHistory));
      setImportStatus('Import successful (appended).');
    }
    setImportJson('');
    setConfirmImport(null);
  };

  const applyImport = (mode: 'append' | 'overwrite') => {
    const data = parseImport();
    if (!data) return;
    setConfirmImport({ mode, data });
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Data" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text selectable={false} style={styles.note}>
          Export or import your data anytime. Imports can append history or overwrite settings and
          history.
        </Text>

        <Text selectable={false} style={styles.subLabel}>
          Export
        </Text>
        <Pressable style={styles.button} onPress={handleExport}>
          <Text selectable={false} style={styles.buttonLabel}>
            Generate export JSON
          </Text>
        </Pressable>
        <Pressable
          style={[styles.button, !exportJson && styles.buttonDisabled]}
          onPress={handleCopyExport}
          disabled={!exportJson}
        >
          <Text selectable={false} style={styles.buttonLabel}>
            Copy export JSON
          </Text>
        </Pressable>
        <TextInput
          value={exportJson}
          editable={false}
          multiline
          placeholder="Export JSON will appear here"
          placeholderTextColor={theme.textFaint}
          style={styles.textArea}
        />
        {exportStatus && (
          <Text selectable={false} style={styles.status}>
            {exportStatus}
          </Text>
        )}

        <Text selectable={false} style={styles.subLabel}>
          Import
        </Text>
        <TextInput
          value={importJson}
          onChangeText={setImportJson}
          multiline
          placeholder="Paste JSON here..."
          placeholderTextColor={theme.textFaint}
          style={styles.textArea}
        />
        <Pressable style={styles.button} onPress={() => applyImport('append')}>
          <Text selectable={false} style={styles.buttonLabel}>
            Append import
          </Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.buttonDanger]}
          onPress={() => applyImport('overwrite')}
        >
          <Text selectable={false} style={[styles.buttonLabel, styles.buttonDangerLabel]}>
            Overwrite import
          </Text>
        </Pressable>
        {importStatus && (
          <Text selectable={false} style={styles.status}>
            {importStatus}
          </Text>
        )}
      </ScrollView>
      <AppDialog
        visible={confirmImport !== null}
        title={confirmImport?.mode === 'overwrite' ? 'Overwrite data?' : 'Append data?'}
        message={
          confirmImport?.mode === 'overwrite'
            ? 'This will replace your current settings and history.'
            : 'This will keep your current settings and add history from the import.'
        }
        onRequestClose={() => setConfirmImport(null)}
        actions={[
          { label: 'Cancel', onPress: () => setConfirmImport(null) },
          {
            label: confirmImport?.mode === 'overwrite' ? 'Overwrite' : 'Append',
            tone: confirmImport?.mode === 'overwrite' ? 'danger' : 'default',
            onPress: () => confirmImport && commitImport(confirmImport.mode, confirmImport.data),
          },
        ]}
      />
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { padding: 24, paddingTop: 8 },
    note: { fontSize: 12, color: theme.textSubtle, marginBottom: 12, lineHeight: 18 },
    subLabel: {
      fontSize: 13,
      fontWeight: '500',
      marginTop: 8,
      marginBottom: 6,
      color: theme.textSubtle,
    },
    button: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: theme.cardSoft,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 8,
    },
    buttonLabel: { fontSize: 14, fontWeight: '400', color: theme.text },
    buttonDanger: {
      backgroundColor: theme.dangerBackground,
      borderColor: theme.dangerBorder,
    },
    buttonDangerLabel: { color: theme.dangerText },
    buttonDisabled: { opacity: 0.5 },
    textArea: {
      minHeight: 120,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card,
      padding: 10,
      fontSize: 13,
      color: theme.text,
      marginBottom: 8,
    },
    status: { fontSize: 13, color: theme.textSubtle, marginTop: 4 },
  });
