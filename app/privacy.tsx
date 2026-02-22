import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

export default function PrivacyScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { padding: 24, paddingTop: 8, gap: 12 },
    card: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    title: { fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 6 },
    body: { fontSize: 14, color: theme.textMuted, lineHeight: 20 },
  });
