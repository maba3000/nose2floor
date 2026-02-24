import React, { useMemo } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

interface ScreenHeaderProps {
  title: string;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({ title, rightAction }: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={styles.backButton}
        hitSlop={10}
      >
        <Text selectable={false} style={styles.backLabel}>
          ←
        </Text>
      </Pressable>
      <Text selectable={false} style={styles.title}>
        {title}
      </Text>
      {rightAction}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 6,
    },
    backLabel: {
      color: theme.text,
      fontSize: 24,
      fontWeight: '500',
      lineHeight: 24,
    },
    title: {
      flex: 1,
      fontSize: 24,
      fontWeight: '600',
      color: theme.text,
    },
  });
