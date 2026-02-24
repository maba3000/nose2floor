import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { WorkoutSession } from '../domain/entities';
import { useTheme } from '../hooks/useTheme';

const MONTH_ROW_HEIGHT = 16;
const MAX_CELL = 18;
const MIN_CELL = 3;

const DAY_LABELS = ['M', '', 'W', '', 'F', '', ''];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// level 0 = no hits (neutral), 1–4 = white → yellow → orange → dark red
const LIGHT_COLORS = ['#EAE5E0', '#FFF9C4', '#FFD740', '#FF6D00', '#C62828'];
const DARK_COLORS = ['#2A2A2D', '#4A3728', '#F9A825', '#BF360C', '#7F0000'];

function toLocalDateKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfDayDate(ms: number): Date {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d;
}

function mondayOf(date: Date): Date {
  const d = new Date(date);
  const dow = d.getDay();
  const daysFromMonday = (dow + 6) % 7;
  d.setDate(d.getDate() - daysFromMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function getLevelFromThresholds(
  hits: number,
  thresholds: [number, number, number, number],
): number {
  if (hits <= 0) return 0;
  if (hits >= thresholds[3]) return 4;
  if (hits >= thresholds[2]) return 3;
  if (hits >= thresholds[1]) return 2;
  if (hits >= thresholds[0]) return 1;
  return 0;
}

interface Props {
  sessions: WorkoutSession[];
  startMs: number;
  endMs: number;
  availableWidth: number;
  dailyGoal: number;
  heatmapThresholds: [number, number, number, number];
  showGoalStar: boolean;
  showHitCount: boolean;
}

export function ActivityHeatmap({
  sessions,
  startMs,
  endMs,
  availableWidth,
  dailyGoal,
  heatmapThresholds,
  showGoalStar,
  showHitCount,
}: Props) {
  const theme = useTheme();
  const colors = theme.isDark ? DARK_COLORS : LIGHT_COLORS;

  const { weeks, showMonths, numWeeks, cellSize, gap, step } = useMemo(() => {
    const hitsMap: Record<string, number> = {};
    for (const s of sessions) {
      const key = toLocalDateKey(s.startedAt);
      hitsMap[key] = (hitsMap[key] ?? 0) + s.reps;
    }

    const startDay = startOfDayDate(startMs);
    const endDay = startOfDayDate(endMs);
    const gridStart = mondayOf(startDay);

    const rangeStartKey = toLocalDateKey(startMs);
    const rangeEndKey = toLocalDateKey(endMs);

    const msPerDay = 1000 * 60 * 60 * 24;
    const totalDays = Math.round((endDay.getTime() - gridStart.getTime()) / msPerDay) + 1;
    const numWeeks = Math.max(1, Math.ceil(totalDays / 7));

    const gap = numWeeks > 15 ? 1 : 2;
    const idealCell = Math.floor((availableWidth - (numWeeks - 1) * gap) / numWeeks);
    const cellSize = Math.max(MIN_CELL, Math.min(MAX_CELL, idealCell));
    const step = cellSize + gap;

    const monthLabelSet = new Set<string>();

    const weeks = Array.from({ length: numWeeks }, (_, w) => {
      let monthLabel: string | null = null;

      const days = Array.from({ length: 7 }, (_, d) => {
        const date = addDays(gridStart, w * 7 + d);
        const dateKey = toLocalDateKey(date.getTime());
        const inRange = dateKey >= rangeStartKey && dateKey <= rangeEndKey;
        const hits = hitsMap[dateKey] ?? 0;
        const level = inRange ? getLevelFromThresholds(hits, heatmapThresholds) : 0;
        const goalReached = inRange && dailyGoal > 0 && hits >= dailyGoal;

        if (inRange && !monthLabel) {
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          if (!monthLabelSet.has(monthKey)) {
            monthLabelSet.add(monthKey);
            monthLabel = MONTHS[date.getMonth()];
          }
        }

        return { dateKey, inRange, level, goalReached, hits };
      });

      return { colIndex: w, days, monthLabel };
    });

    const showMonths = numWeeks > 6;
    return { weeks, showMonths, numWeeks, cellSize, gap, step };
  }, [sessions, startMs, endMs, availableWidth, dailyGoal, heatmapThresholds]);

  const monthMarginTop = showMonths ? MONTH_ROW_HEIGHT + gap : 0;
  const starSize = Math.floor(cellSize * 0.62);

  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        {/* Fixed day labels column */}
        <View style={{ marginTop: monthMarginTop, paddingRight: 4 }}>
          {DAY_LABELS.map((label, i) => (
            <View
              key={i}
              style={{
                width: 12,
                height: cellSize,
                marginBottom: i < 6 ? gap : 0,
                justifyContent: 'center',
              }}
            >
              <Text
                selectable={false}
                style={{ fontSize: 9, color: theme.textFaint, textAlign: 'right' }}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* Scrollable grid */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ width: numWeeks * step }}>
            {/* Month label row */}
            {showMonths && (
              <View style={{ height: MONTH_ROW_HEIGHT, marginBottom: gap, position: 'relative' }}>
                {weeks.map((week) =>
                  week.monthLabel ? (
                    <Text
                      key={week.colIndex}
                      selectable={false}
                      style={{
                        position: 'absolute',
                        left: week.colIndex * step,
                        fontSize: 9,
                        color: theme.textFaint,
                        lineHeight: MONTH_ROW_HEIGHT,
                      }}
                    >
                      {week.monthLabel}
                    </Text>
                  ) : null,
                )}
              </View>
            )}

            {/* Week columns */}
            <View style={{ flexDirection: 'row' }}>
              {weeks.map((week) => (
                <View key={week.colIndex} style={{ marginRight: gap }}>
                  {week.days.map((day, rowIndex) => (
                    <View
                      key={day.dateKey}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        borderRadius: Math.max(1, Math.floor(cellSize / 5)),
                        marginBottom: rowIndex < 6 ? gap : 0,
                        backgroundColor: day.inRange ? colors[day.level] : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {day.inRange &&
                        cellSize >= 9 &&
                        (() => {
                          const wantStar = showGoalStar && day.goalReached;
                          const wantCount = showHitCount && day.hits > 0;
                          if (wantStar) {
                            return (
                              <Text
                                selectable={false}
                                style={{
                                  fontSize: starSize,
                                  lineHeight: starSize,
                                  color: 'rgba(255,255,255,0.9)',
                                }}
                              >
                                ★
                              </Text>
                            );
                          }
                          if (wantCount) {
                            return (
                              <Text
                                selectable={false}
                                style={{
                                  fontSize: Math.max(6, Math.floor(cellSize * 0.55)),
                                  lineHeight: cellSize,
                                  color: 'rgba(255,255,255,0.9)',
                                }}
                              >
                                {day.hits}
                              </Text>
                            );
                          }
                          return null;
                        })()}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Legend */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          marginTop: 6,
        }}
      >
        <Text selectable={false} style={{ fontSize: 9, color: theme.textFaint, marginRight: 4 }}>
          Less
        </Text>
        {[0, 1, 2, 3, 4].map((level) => (
          <View
            key={level}
            style={{
              width: 9,
              height: 9,
              borderRadius: 2,
              backgroundColor: colors[level],
              marginRight: 2,
            }}
          />
        ))}
        <Text selectable={false} style={{ fontSize: 9, color: theme.textFaint, marginLeft: 2 }}>
          More
        </Text>
      </View>
    </View>
  );
}
