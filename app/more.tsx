import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';

export default function MoreScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScreenHeader title="More" />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.navRow} onPress={() => router.push('/settings')}>
          <View style={styles.navText}>
            <Text selectable={false} style={styles.navLabel}>Settings</Text>
            <Text selectable={false} style={styles.navHint}>Preferences and display</Text>
          </View>
          <Text selectable={false} style={styles.navArrow}>›</Text>
        </Pressable>

        <Pressable style={styles.navRow} onPress={() => router.push('/history')}>
          <View style={styles.navText}>
            <Text selectable={false} style={styles.navLabel}>History</Text>
            <Text selectable={false} style={styles.navHint}>Sessions and exports</Text>
          </View>
          <Text selectable={false} style={styles.navArrow}>›</Text>
        </Pressable>

        <Pressable style={styles.navRow} onPress={() => router.push('/insights')}>
          <View style={styles.navText}>
            <Text selectable={false} style={styles.navLabel}>Insights</Text>
            <Text selectable={false} style={styles.navHint}>Progress and trends</Text>
          </View>
          <Text selectable={false} style={styles.navArrow}>›</Text>
        </Pressable>

        <Pressable style={styles.navRow} onPress={() => router.push('/privacy')}>
          <View style={styles.navText}>
            <Text selectable={false} style={styles.navLabel}>Privacy</Text>
            <Text selectable={false} style={styles.navHint}>How your data is handled</Text>
          </View>
          <Text selectable={false} style={styles.navArrow}>›</Text>
        </Pressable>

        <Pressable style={styles.navRow} onPress={() => router.push('/licenses')}>
          <View style={styles.navText}>
            <Text selectable={false} style={styles.navLabel}>Licenses</Text>
            <Text selectable={false} style={styles.navHint}>Open-source attributions</Text>
          </View>
          <Text selectable={false} style={styles.navArrow}>›</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  content: { padding: 24, paddingTop: 8 },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: 12,
  },
  navText: { flex: 1 },
  navLabel: { fontSize: 16, fontWeight: '500', color: '#1A202C' },
  navHint: { fontSize: 12, fontWeight: '400', color: 'rgba(0,0,0,0.55)', marginTop: 2 },
  navArrow: { fontSize: 20, color: 'rgba(0,0,0,0.35)', marginLeft: 12 },
});
