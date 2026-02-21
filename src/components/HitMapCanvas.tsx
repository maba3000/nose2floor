import React, { memo } from 'react';
import { Canvas, Circle, Line } from '@shopify/react-native-skia';
import { Platform, View, StyleSheet } from 'react-native';
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

  if (Platform.OS === 'web') {
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
  }

  return (
    <Canvas style={{ width: size, height: size }}>
      {RING_COLORS.map((color, i) => (
        <Circle key={`ring-${i}`} cx={cx} cy={cy} r={fitRadius * ZONES[i]} color={color} />
      ))}
      {ZONES.map((z, i) => (
        <Circle
          key={`border-${i}`}
          cx={cx}
          cy={cy}
          r={fitRadius * z}
          color="rgba(0,0,0,0.12)"
          style="stroke"
          strokeWidth={1}
        />
      ))}
      <Line
        p1={{ x: cx - fitRadius, y: cy }}
        p2={{ x: cx + fitRadius, y: cy }}
        color="rgba(0,0,0,0.06)"
        strokeWidth={1}
      />
      <Line
        p1={{ x: cx, y: cy - fitRadius }}
        p2={{ x: cx, y: cy + fitRadius }}
        color="rgba(0,0,0,0.06)"
        strokeWidth={1}
      />
      {hits.map((hit, i) => (
        <React.Fragment key={`hit-${i}`}>
          <Circle
            cx={cx + hit.dx * hitScale}
            cy={cy + hit.dy * hitScale}
            r={5}
            color="rgba(0,0,0,0.7)"
          />
          <Circle
            cx={cx + hit.dx * hitScale}
            cy={cy + hit.dy * hitScale}
            r={5}
            color="#FFFFFF"
            style="stroke"
            strokeWidth={1.5}
          />
        </React.Fragment>
      ))}
    </Canvas>
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
