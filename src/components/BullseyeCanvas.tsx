import React, { memo, useMemo } from 'react';
import { Canvas, Circle, Line } from '@shopify/react-native-skia';
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
  const borderColor = theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  const crosshairColor = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <Canvas style={{ width, height }}>
      {ringColors.map((color, i) => (
        <Circle key={`ring-${i}`} cx={cx} cy={cy} r={maxRadius * ZONES[i]} color={color} />
      ))}
      {ZONES.map((z, i) => (
        <Circle
          key={`border-${i}`}
          cx={cx}
          cy={cy}
          r={maxRadius * z}
          color={borderColor}
          style="stroke"
          strokeWidth={1}
        />
      ))}
      <Line
        p1={{ x: cx - maxRadius, y: cy }}
        p2={{ x: cx + maxRadius, y: cy }}
        color={crosshairColor}
        strokeWidth={1}
      />
      <Line
        p1={{ x: cx, y: cy - maxRadius }}
        p2={{ x: cx, y: cy + maxRadius }}
        color={crosshairColor}
        strokeWidth={1}
      />
    </Canvas>
  );
});
