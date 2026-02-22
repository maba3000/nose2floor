import React, { memo, useMemo } from 'react';
import { Canvas, Circle, Line } from '@shopify/react-native-skia';
import type { Hit } from '../domain/entities';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  size: number;
  scale: number;
  hits: Hit[];
}

const RING_COLORS_LIGHT = ['#FFFFFF', '#FFB74D', '#FF7043', '#E53935', '#D32F2F'];
const RING_COLORS_DARK = ['#2A2A2D', '#6F4B1E', '#7C3A25', '#7A1E1B', '#5E1412'];
const ZONES = [1.0, 0.8, 0.6, 0.4, 0.2];

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
  const borderColor = theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  const crosshairColor = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const hitFill = theme.isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)';
  const hitStroke = theme.isDark ? 'rgba(0,0,0,0.6)' : '#FFFFFF';

  return (
    <Canvas style={{ width: size, height: size }}>
      {ringColors.map((color, i) => (
        <Circle key={`ring-${i}`} cx={cx} cy={cy} r={fitRadius * ZONES[i]} color={color} />
      ))}
      {ZONES.map((z, i) => (
        <Circle
          key={`border-${i}`}
          cx={cx}
          cy={cy}
          r={fitRadius * z}
          color={borderColor}
          style="stroke"
          strokeWidth={1}
        />
      ))}
      <Line
        p1={{ x: cx - fitRadius, y: cy }}
        p2={{ x: cx + fitRadius, y: cy }}
        color={crosshairColor}
        strokeWidth={1}
      />
      <Line
        p1={{ x: cx, y: cy - fitRadius }}
        p2={{ x: cx, y: cy + fitRadius }}
        color={crosshairColor}
        strokeWidth={1}
      />
      {hits.map((hit, i) => (
        <React.Fragment key={`hit-${i}`}>
          <Circle cx={cx + hit.dx * hitScale} cy={cy + hit.dy * hitScale} r={5} color={hitFill} />
          <Circle
            cx={cx + hit.dx * hitScale}
            cy={cy + hit.dy * hitScale}
            r={5}
            color={hitStroke}
            style="stroke"
            strokeWidth={1.5}
          />
        </React.Fragment>
      ))}
    </Canvas>
  );
});
