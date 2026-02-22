import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { useSettingsStore } from '@/store/settingsStore';
import { useHistoryStore } from '@/store/historyStore';
import { DEFAULT_SETTINGS } from '@/domain/entities';
import { exportData, importData } from '@/persistence/storage';
import { ScreenHeader } from '@/components/ScreenHeader';
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
  const [importStatus, setImportStatus] = useState<string | null>(null);

  function handleExport() {
    const json = exportData(settings, history);
    setExportJson(json);
    setImportStatus(null);
  }

  function handleImport() {
    const raw = importJson.trim();
    if (!raw) {
      setImportStatus('Paste JSON to import.');
      return;
    }
    try {
      const data = importData(raw);
      const nextSettings = { ...DEFAULT_SETTINGS, ...data.settings };
      updateSettings(nextSettings);
      replaceHistory(data.history);
      setImportJson('');
      setExportJson(exportData(nextSettings, data.history));
      setImportStatus('Import successful.');
    } catch (e) {
      setImportStatus('Import failed: invalid JSON.');
    }
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Data" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text selectable={false} style={styles.note}>
          Export or import your data anytime. Imports replace your current settings and history.
        </Text>

        <Text selectable={false} style={styles.subLabel}>
          Export
        </Text>
        <Pressable style={styles.button} onPress={handleExport}>
          <Text selectable={false} style={styles.buttonLabel}>
            Generate export JSON
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
        <Pressable style={styles.button} onPress={handleImport}>
          <Text selectable={false} style={styles.buttonLabel}>
            Import data
          </Text>
        </Pressable>
        {importStatus && (
          <Text selectable={false} style={styles.status}>
            {importStatus}
          </Text>
        )}
      </ScrollView>
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
