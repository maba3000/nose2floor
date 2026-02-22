import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

interface Props {
  label: string;
  value: string;
}

export function StatCard({ label, value }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.card}>
      <Text selectable={false} style={styles.value}>
        {value}
      </Text>
      <Text selectable={false} style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.card,
      borderRadius: 10,
      padding: 12,
      flexBasis: '32%',
      flexGrow: 1,
      borderWidth: 1,
      borderColor: theme.border,
    },
    value: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.text,
    },
    label: {
      fontSize: 12,
      fontWeight: '400',
      color: theme.textFaint,
      marginTop: 2,
    },
  });
