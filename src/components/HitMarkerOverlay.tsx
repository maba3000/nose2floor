import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

interface Props {
  x: number;
  y: number;
  score: number;
  showScore: boolean;
}

export function HitMarkerOverlay({ x, y, score, showScore }: Props) {
  const arm = 24;
  const lineLength = arm * 2;
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.line,
          {
            left: x - 1.5,
            top: y - arm,
            height: lineLength,
            transform: [{ rotate: '45deg' }],
          },
        ]}
      />
      <View
        style={[
          styles.line,
          {
            left: x - 1.5,
            top: y - arm,
            height: lineLength,
            transform: [{ rotate: '-45deg' }],
          },
        ]}
      />
      {showScore && (
        <Text selectable={false} style={[styles.score, { left: x + 24, top: y - 34 }]}>
          +{score}
        </Text>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    line: {
      position: 'absolute',
      width: 5,
      backgroundColor: theme.text,
      borderRadius: 2,
      opacity: 0.85,
    },
    score: {
      position: 'absolute',
      color: theme.text,
      fontSize: 20,
      fontWeight: '500',
      opacity: 0.85,
    },
  });
