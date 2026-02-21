import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { Hit } from '../domain/entities';

interface Props {
  size: number;
  scale: number;
  hits: Hit[];
}

const RING_COLORS = ['#FFFFFF', '#FFB74D', '#FF7043', '#E53935', '#D32F2F'];
const ZONES = [1.0, 0.8, 0.6, 0.4, 0.2];

export const HitMapCanvas = memo(({ size, hits }: Props) => {
  const cx = size / 2;
  const cy = size / 2;
  const fitRadius = (size / 2) * 0.9;
  const hitScale = fitRadius;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {RING_COLORS.map((color, i) => {
        const radius = fitRadius * ZONES[i];
        const diameter = radius * 2;
        return (
          <View
            key={i}
            style={[
              styles.ring,
              {
                width: diameter,
                height: diameter,
                borderRadius: diameter / 2,
                backgroundColor: color,
              },
            ]}
          />
        );
      })}
      <View
        style={[
          styles.crosshair,
          {
            left: cx - fitRadius,
            top: cy - 0.5,
            width: fitRadius * 2,
            height: 1,
          },
        ]}
      />
      <View
        style={[
          styles.crosshair,
          {
            left: cx - 0.5,
            top: cy - fitRadius,
            width: 1,
            height: fitRadius * 2,
          },
        ]}
      />
      {hits.map((hit, i) => (
        <View
          key={i}
          style={[
            styles.hit,
            {
              left: cx + hit.dx * hitScale - 5,
              top: cy + hit.dy * hitScale - 5,
            },
          ]}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  crosshair: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  hit: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
});
