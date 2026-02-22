import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenHeader } from '@/components/ScreenHeader';

export default function PrivacyScreen() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Privacy" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text selectable={false} style={styles.title}>
            Data stays on your device
          </Text>
          <Text selectable={false} style={styles.body}>
            Your progress, settings, and scores are stored locally on your device or in your
            browser. We do not receive this data.
          </Text>
        </View>

        <View style={styles.card}>
          <Text selectable={false} style={styles.title}>
            No tracking or ads
          </Text>
          <Text selectable={false} style={styles.body}>
            The app does not include analytics, advertising, or tracking technologies.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  content: { padding: 24, paddingTop: 8, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  title: { fontSize: 16, fontWeight: '600', color: '#1A202C', marginBottom: 6 },
  body: { fontSize: 14, color: 'rgba(0,0,0,0.7)', lineHeight: 20 },
});
