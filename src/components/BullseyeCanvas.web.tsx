import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  width: number;
  height: number;
  maxRadius: number;
}

const RING_COLORS_LIGHT = ['#FFFFFF', '#FFB74D', '#FF7043', '#E53935', '#D32F2F'];
const RING_COLORS_DARK = ['#2A2A2D', '#6F4B1E', '#7C3A25', '#7A1E1B', '#5E1412'];
const ZONES = [1.0, 0.8, 0.6, 0.4, 0.2];

export const BullseyeCanvas = memo(({ width, height, maxRadius }: Props) => {
  const cx = width / 2;
  const cy = height / 2;
  const theme = useTheme();
  const ringColors = useMemo(
    () => (theme.isDark ? RING_COLORS_DARK : RING_COLORS_LIGHT),
    [theme.isDark],
  );
  const ringBorder = theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  const crosshairColor = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <View style={[styles.container, { width, height }]}>
      {ringColors.map((color, i) => {
        const radius = maxRadius * ZONES[i];
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
            left: cx - maxRadius,
            top: cy - 0.5,
            width: maxRadius * 2,
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
            top: cy - maxRadius,
            width: 1,
            height: maxRadius * 2,
            backgroundColor: crosshairColor,
          },
        ]}
      />
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
});
