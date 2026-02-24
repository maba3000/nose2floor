import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

const SOURCE_URL = 'https://github.com/maba3000/nose2floor';
const VERSION = '1.0.0';

type NavItem = {
  label: string;
  hint: string;
  onPress?: () => void;
};

export default function MoreScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [copied, setCopied] = useState(false);
  const copiedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copiedTimeout.current) clearTimeout(copiedTimeout.current);
    },
    [],
  );

  const handleCopySource = async () => {
    try {
      await Clipboard.setStringAsync(SOURCE_URL);
      setCopied(true);
      if (copiedTimeout.current) clearTimeout(copiedTimeout.current);
      copiedTimeout.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const quickStartItems: NavItem[] = [
    {
      label: 'Settings',
      hint: 'Start here: personalize session and display',
      onPress: () => router.push('/settings'),
    },
    { label: 'Insights', hint: 'Progress and trends', onPress: () => router.push('/insights') },
    { label: 'History', hint: 'Session history', onPress: () => router.push('/history') },
  ];

  const dataAndPrivacyItems: NavItem[] = [
    { label: 'Backup & Restore', hint: 'Export and import your data', onPress: () => router.push('/data') },
    { label: 'Privacy', hint: 'How your data is handled', onPress: () => router.push('/privacy') },
  ];

  const aboutItems: NavItem[] = [
    { label: 'Licenses', hint: 'Open-source attributions', onPress: () => router.push('/licenses') },
    {
      label: 'Support & Source Code',
      hint: copied ? 'Copied to clipboard' : SOURCE_URL,
      onPress: handleCopySource,
    },
  ];

  const renderRows = (items: NavItem[]) =>
    items.map((item, index) => (
      <Pressable
        key={item.label}
        style={[styles.navRow, index > 0 && styles.navRowBorder]}
        onPress={item.onPress}
      >
        <View style={styles.navText}>
          <Text selectable={false} style={styles.navLabel}>
            {item.label}
          </Text>
          <Text selectable={false} style={styles.navHint}>
            {item.hint}
          </Text>
        </View>
        <Text selectable={false} style={styles.navArrow}>
          ›
        </Text>
      </Pressable>
    ));

  return (
    <View style={styles.container}>
      <ScreenHeader title="More" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text selectable={false} style={styles.sectionTitle}>
          Quick Start
        </Text>
        <View style={styles.sectionCard}>{renderRows(quickStartItems)}</View>

        <Text selectable={false} style={styles.sectionTitle}>
          Data & Privacy
        </Text>
        <View style={styles.sectionCard}>{renderRows(dataAndPrivacyItems)}</View>

        <Text selectable={false} style={styles.sectionTitle}>
          About
        </Text>
        <View style={styles.sectionCard}>
          {renderRows(aboutItems)}
          <View style={[styles.navRow, styles.navRowBorder]}>
            <View style={styles.navText}>
              <Text selectable={false} style={styles.navLabel}>
                Version
              </Text>
              <Text selectable={false} style={styles.navHint}>
                {VERSION}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { padding: 24, paddingTop: 8 },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSubtle,
      marginBottom: 8,
      marginLeft: 2,
    },
    sectionCard: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.cardSoft,
      marginBottom: 16,
      overflow: 'hidden',
    },
    navRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    navRowBorder: { borderTopWidth: 1, borderTopColor: theme.border },
    navText: { flex: 1 },
    navLabel: { fontSize: 16, fontWeight: '500', color: theme.text },
    navHint: { fontSize: 12, fontWeight: '400', color: theme.textSubtle, marginTop: 2 },
    navArrow: { fontSize: 20, color: theme.textFaint, marginLeft: 12 },
  });
