import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSettingsStore } from '@/store/settingsStore';
import { useHistoryStore } from '@/store/historyStore';
import type { AppSettings } from '@/domain/entities';
import { exportData, importData } from '@/persistence/storage';
import { ScreenHeader } from '@/components/ScreenHeader';

export default function SettingsScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const replaceHistory = useHistoryStore((s) => s.replaceHistory);
  const history = useHistoryStore((s) => s.history);
  const [exportJson, setExportJson] = useState('');
  const [importJson, setImportJson] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  function handleExport() {
    const json = exportData(settings, history);
    setExportJson(json);
  }

  function handleImport() {
    const raw = importJson.trim();
    if (!raw) {
      setImportStatus('Paste JSON to import.');
      return;
    }
    try {
      const data = importData(raw);
      updateSettings(data.settings);
      replaceHistory(data.history);
      setImportStatus('Import successful.');
    } catch (e) {
      setImportStatus('Import failed: invalid JSON.');
    }
  }

  const hideAfterSeconds = Math.round(settings.hitMarkerAutoHideMs / 1000);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>Gameplay</Text>
        <Text>Hit cooldown: {settings.hitCooldownMs}ms</Text>
        <Slider
          minimumValue={100}
          maximumValue={1000}
          step={50}
          value={settings.hitCooldownMs}
          onValueChange={(v) => updateSettings({ hitCooldownMs: v })}
        />

        <Text style={styles.section}>Display</Text>
        {(
          [
            ['showHitCount', 'Show hit count'],
            ['showPoints', 'Show points'],
            ['showBullseye', "Show bull's-eye"],
            ['showTimer', 'Show timer'],
          ] as const
        ).map(([key, label]) => (
          <View key={key} style={styles.row}>
            <Text>{label}</Text>
            <Switch
              value={settings[key]}
              onValueChange={(v) => updateSettings({ [key]: v } as Partial<AppSettings>)}
            />
          </View>
        ))}

        {settings.showBullseye && (
          <>
            <Text style={styles.section}>Bull's-eye</Text>
            <Text>Size: {settings.bullseyeScale.toFixed(1)}×</Text>
            <Slider
              minimumValue={0.5}
              maximumValue={2.0}
              step={0.1}
              value={settings.bullseyeScale}
              onValueChange={(v) => updateSettings({ bullseyeScale: v })}
            />
          </>
        )}

        <Text style={styles.section}>Hit Markers</Text>
        <View style={styles.row}>
          <Text>Show hit markers</Text>
          <Switch
            value={settings.showHitMarkers}
            onValueChange={(v) => updateSettings({ showHitMarkers: v })}
          />
        </View>

        {settings.showHitMarkers && (
          <>
            <Text>Hide after: {hideAfterSeconds === 0 ? 'Never' : `${hideAfterSeconds}s`}</Text>
            <Slider
              minimumValue={0}
              maximumValue={10}
              step={1}
              value={hideAfterSeconds}
              onValueChange={(v) => updateSettings({ hitMarkerAutoHideMs: v * 1000 })}
            />
          </>
        )}

        <Text style={styles.section}>Data</Text>
        <Text style={styles.subLabel}>Export</Text>
        <Pressable style={styles.button} onPress={handleExport}>
          <Text style={styles.buttonLabel}>Generate export JSON</Text>
        </Pressable>
        <TextInput
          value={exportJson}
          editable={false}
          multiline
          placeholder="Export JSON will appear here"
          style={styles.textArea}
        />

        <Text style={styles.subLabel}>Import</Text>
        <TextInput
          value={importJson}
          onChangeText={setImportJson}
          multiline
          placeholder="Paste JSON here..."
          style={styles.textArea}
        />
        <Pressable style={styles.button} onPress={handleImport}>
          <Text style={styles.buttonLabel}>Import data</Text>
        </Pressable>
        {importStatus && <Text style={styles.status}>{importStatus}</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  content: { padding: 24, paddingTop: 8 },
  section: { fontSize: 16, fontWeight: '500', marginTop: 24, marginBottom: 8, color: '#2D3748' },
  subLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 6,
    color: 'rgba(0,0,0,0.55)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: 8,
  },
  buttonLabel: { fontSize: 14, fontWeight: '400', color: '#1A202C' },
  textArea: {
    minHeight: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#fff',
    padding: 10,
    fontSize: 13,
    color: '#1A202C',
    marginBottom: 8,
  },
  status: { fontSize: 13, color: 'rgba(0,0,0,0.6)', marginTop: 4 },
});
