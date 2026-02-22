import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  x: number;
  y: number;
  score: number;
  showScore: boolean;
}

export function HitMarkerOverlay({ x, y, score, showScore }: Props) {
  const arm = 24;
  const lineLength = arm * 2;

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

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    width: 5,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 2,
  },
  score: {
    position: 'absolute',
    color: 'rgba(0,0,0,0.85)',
    fontSize: 20,
    fontWeight: '500',
  },
});
