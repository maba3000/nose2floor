import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { ScreenHeader } from '@/components/ScreenHeader';
import licensesAsset from '../assets/licenses.txt';

export default function LicensesScreen() {
  const [licenseText, setLicenseText] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        let text = '';
        if (Platform.OS === 'web') {
          const res = await fetch('/licenses.txt', { cache: 'no-store' });
          text = await res.text();
        } else {
          const asset = Asset.fromModule(licensesAsset);
          await asset.downloadAsync();
          const uri = asset.localUri ?? asset.uri;
          text = await FileSystem.readAsStringAsync(uri);
        }
        if (!cancelled) setLicenseText(text);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Licenses" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text selectable={false} style={styles.note}>
          This app includes open source software. Full license texts are generated from current
          dependencies and included with the build.
        </Text>
        <View style={styles.licenseBox}>
          <Text selectable={false} style={styles.licenseText}>
            {loadError
              ? 'Unable to load licenses. Please reinstall the app.'
              : (licenseText ?? 'Loading licenses...')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  content: { padding: 24, paddingTop: 8, paddingBottom: 32 },
  note: { fontSize: 13, color: 'rgba(0,0,0,0.65)', marginBottom: 12, lineHeight: 18 },
  licenseBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#fff',
    padding: 12,
  },
  licenseText: { fontSize: 12, lineHeight: 18, color: 'rgba(0,0,0,0.75)' },
});
