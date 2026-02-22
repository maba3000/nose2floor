import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface Props {
  label: string;
  value: string;
  align?: ViewStyle['alignItems'];
}

export function CornerBadge({ label, value, align = 'flex-start' }: Props) {
  return (
    <View style={[styles.container, { alignItems: align }]}>
      <Text selectable={false} style={styles.label}>{label}</Text>
      <Text selectable={false} style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  label: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.38)',
    fontWeight: '400',
    letterSpacing: 1.5,
  },
  value: {
    marginTop: 2,
    fontSize: 26,
    fontWeight: '500',
    color: '#111',
  },
});
