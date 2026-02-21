import React, { memo } from 'react';
import { Canvas, Circle, Line } from '@shopify/react-native-skia';

interface Props {
  width: number;
  height: number;
  maxRadius: number;
}

const RING_COLORS = ['#FFFFFF', '#FFB74D', '#FF7043', '#E53935', '#D32F2F'];
const ZONES = [1.0, 0.8, 0.6, 0.4, 0.2];

export const BullseyeCanvas = memo(({ width, height, maxRadius }: Props) => {
  const cx = width / 2;
  const cy = height / 2;

  return (
    <Canvas style={{ width, height }}>
      {RING_COLORS.map((color, i) => (
        <Circle key={`ring-${i}`} cx={cx} cy={cy} r={maxRadius * ZONES[i]} color={color} />
      ))}
      {ZONES.map((z, i) => (
        <Circle
          key={`border-${i}`}
          cx={cx}
          cy={cy}
          r={maxRadius * z}
          color="rgba(0,0,0,0.12)"
          style="stroke"
          strokeWidth={1}
        />
      ))}
      <Line
        p1={{ x: cx - maxRadius, y: cy }}
        p2={{ x: cx + maxRadius, y: cy }}
        color="rgba(0,0,0,0.06)"
        strokeWidth={1}
      />
      <Line
        p1={{ x: cx, y: cy - maxRadius }}
        p2={{ x: cx, y: cy + maxRadius }}
        color="rgba(0,0,0,0.06)"
        strokeWidth={1}
      />
    </Canvas>
  );
});
