import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { Hit } from '../domain/entities';
import { useTheme } from '@/hooks/useTheme';
import { RING_COLORS_LIGHT, RING_COLORS_DARK, ZONES } from './bullseyeColors';

interface Props {
  size: number;
  scale: number;
  hits: Hit[];
}

export const HitMapCanvas = memo(({ size, hits }: Props) => {
  const cx = size / 2;
  const cy = size / 2;
  const fitRadius = (size / 2) * 0.9;
  const hitScale = fitRadius;
  const theme = useTheme();
  const ringColors = useMemo(
    () => (theme.isDark ? RING_COLORS_DARK : RING_COLORS_LIGHT),
    [theme.isDark],
  );
  const ringBorder = theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  const crosshairColor = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const hitFill = theme.isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)';
  const hitBorder = theme.isDark ? 'rgba(0,0,0,0.6)' : '#fff';
  const displayHits = useMemo(() => {
    const maxHits = 500;
    if (hits.length <= maxHits) return hits;
    const step = Math.ceil(hits.length / maxHits);
    return hits.filter((_, index) => index % step === 0);
  }, [hits]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {ringColors.map((color, i) => {
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
                borderColor: ringBorder,
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
            backgroundColor: crosshairColor,
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
            backgroundColor: crosshairColor,
          },
        ]}
      />
      {displayHits.map((hit, i) => (
        <View
          key={i}
          style={[
            styles.hit,
            {
              left: cx + hit.dx * hitScale - 5,
              top: cy + hit.dy * hitScale - 5,
              backgroundColor: hitFill,
              borderColor: hitBorder,
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
  },
  crosshair: {
    position: 'absolute',
  },
  hit: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
});
