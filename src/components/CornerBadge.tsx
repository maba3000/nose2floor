import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

interface Props {
  label: string;
  value: string;
  align?: ViewStyle['alignItems'];
}

export function CornerBadge({ label, value, align = 'flex-start' }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.container, { alignItems: align }]}>
      <Text selectable={false} style={styles.label}>
        {label}
      </Text>
      <Text selectable={false} style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: theme.cardSoft,
      borderWidth: 1,
      borderColor: theme.border,
    },
    label: {
      fontSize: 12,
      color: theme.textFaint,
      fontWeight: '400',
      letterSpacing: 1.5,
    },
    value: {
      marginTop: 2,
      fontSize: 26,
      fontWeight: '500',
      color: theme.text,
    },
  });
