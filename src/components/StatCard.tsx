import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
  value: string;
}

export function StatCard({ label, value }: Props) {
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    flexBasis: '32%',
    flexGrow: 1,
  },
  value: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A202C',
  },
  label: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(0,0,0,0.4)',
    marginTop: 2,
  },
});
