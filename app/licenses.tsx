import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Linking } from 'react-native';
import { ScreenHeader } from '@/components/ScreenHeader';

export default function LicensesScreen() {
  const licensesUrl =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? `${window.location.origin}/licenses.txt`
      : '';

  const handleOpen = () => {
    if (!licensesUrl) return;
    Linking.openURL(licensesUrl);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Licenses" />
      <View style={styles.content}>
        <Text selectable={false} style={styles.note}>
          This app includes open source software. The full license texts are available in a
          dedicated file.
        </Text>
        <Pressable
          style={[styles.button, !licensesUrl && styles.buttonDisabled]}
          onPress={handleOpen}
          disabled={!licensesUrl}
        >
          <Text selectable={false} style={styles.buttonLabel}>Open full licenses</Text>
        </Pressable>
        {!licensesUrl && (
          <Text selectable={false} style={styles.subNote}>
            Licenses are available on the web build at `/licenses.txt`.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  content: { padding: 24, paddingTop: 8 },
  note: { fontSize: 13, color: 'rgba(0,0,0,0.65)', marginBottom: 12, lineHeight: 18 },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonLabel: { fontSize: 14, fontWeight: '500', color: '#1A202C' },
  subNote: { fontSize: 12, color: 'rgba(0,0,0,0.5)' },
});
