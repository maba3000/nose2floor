#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function lcg(seed) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function toLocalDateString(ms) {
  const date = new Date(ms);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function main() {
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);

  const days = Number(process.env.DEMO_DAYS || 209);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (days - 1));

  const seed = endDate.getFullYear() * 10000 + (endDate.getMonth() + 1) * 100 + endDate.getDate();
  const random = lcg(seed);
  const randomFloat = (min, max) => min + random() * (max - min);
  const randomInt = (min, max) => Math.floor(randomFloat(min, max + 1));

  const dayMs = 24 * 3600 * 1000;
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / dayMs) + 1;

  function dayTarget(index) {
    const progress = index / Math.max(1, totalDays - 1);

    let base;
    if (progress < 0.2) {
      base = lerp(6, 14, progress / 0.2);
    } else if (progress < 0.45) {
      base = lerp(14, 35, (progress - 0.2) / 0.25);
    } else if (progress < 0.7) {
      base = lerp(35, 65, (progress - 0.45) / 0.25);
    } else if (progress < 0.88) {
      base = lerp(65, 110, (progress - 0.7) / 0.18);
    } else {
      base = lerp(110, 165, (progress - 0.88) / 0.12);
    }

    const weeklyWave = Math.sin(index * ((Math.PI * 2) / 7)) * (base * 0.08);
    const noise = randomFloat(-base * 0.1, base * 0.1);
    const isWeekend = index % 7 === 0 || index % 7 === 6;
    const weekendPenalty = isWeekend ? base * 0.12 : 0;

    return Math.round(clamp(base + weeklyWave + noise - weekendPenalty, 5, 220));
  }

  function splitIntoSessions(dayTotal, progress) {
    let sessionCount;
    if (progress < 0.25) sessionCount = randomInt(1, 2);
    else if (progress < 0.6) sessionCount = randomInt(1, 3);
    else sessionCount = randomInt(2, 4);

    const parts = [];
    let remaining = dayTotal;

    for (let i = 0; i < sessionCount; i += 1) {
      const left = sessionCount - i;
      if (left === 1) {
        parts.push(remaining);
        break;
      }

      const minForThis = Math.max(3, Math.floor(dayTotal * 0.12));
      const maxForThis = Math.max(minForThis, Math.floor(remaining - (left - 1) * 3));
      const value = randomInt(minForThis, maxForThis);
      parts.push(value);
      remaining -= value;
    }

    return parts.filter((v) => v > 0);
  }

  function makeHit(startedAt, hitIndex, skill) {
    const spread = lerp(0.95, 0.42, skill);
    const dx = Number(randomFloat(-spread, spread).toFixed(3));
    const dy = Number(randomFloat(-spread, spread).toFixed(3));
    const distance = Number(Math.sqrt(dx * dx + dy * dy).toFixed(3));
    const score = clamp(Math.round((1.2 - Math.min(distance, 1.2)) * 10), 0, 12);

    return {
      dx,
      dy,
      distance,
      score,
      timestamp: startedAt + hitIndex * randomInt(220, 980),
    };
  }

  const history = [];
  const dailyStats = [];

  for (let dayIndex = 0; dayIndex < totalDays; dayIndex += 1) {
    const dayStart = startDate.getTime() + dayIndex * dayMs;
    const progress = dayIndex / Math.max(1, totalDays - 1);
    const dayTotal = dayTarget(dayIndex);
    const sessions = splitIntoSessions(dayTotal, progress);

    let dayReps = 0;

    sessions.forEach((reps, sessionIndex) => {
      const missingProbability = lerp(0.14, 0.04, progress);
      const maxMissing = Math.min(4, Math.floor(reps * 0.12));
      const missing = random() < missingProbability ? randomInt(1, Math.max(1, maxMissing)) : 0;

      const hitCount = Math.max(0, reps - missing);
      const hour = 6 + sessionIndex * 5 + randomInt(0, 2);
      const minute = randomInt(0, 55);
      const startedAt = dayStart + (hour * 60 + minute) * 60 * 1000;

      const hits = Array.from({ length: hitCount }, (_, i) => makeHit(startedAt, i, progress));
      const totalScore = hits.reduce((sum, h) => sum + h.score, 0);

      const dayKey = toLocalDateString(dayStart);
      const hh = String(Math.floor((startedAt % dayMs) / (3600 * 1000))).padStart(2, '0');
      const mm = String(Math.floor((startedAt % (3600 * 1000)) / (60 * 1000))).padStart(2, '0');

      history.push({
        id: `demo-${dayKey}-${hh}${mm}-${sessionIndex + 1}`,
        startedAt,
        durationSeconds: randomInt(90, 1200),
        reps,
        totalScore,
        hits,
        bullseyeScale: 1,
      });

      dayReps += reps;
    });

    dailyStats.push({ day: toLocalDateString(dayStart), reps: dayReps, sessions: sessions.length });
  }

  history.sort((a, b) => b.startedAt - a.startedAt);

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: {
      hitCooldownMs: 300,
      sessionMode: 'manual',
      showIntro: false,
      hapticsEnabled: true,
      themeMode: 'system',
      corners: { topLeft: 'hits', topRight: 'points', bottomLeft: 'goal' },
      dailyGoal: 100,
      heatmapThresholds: [1, 20, 60, 120],
      heatmapShowGoalStar: true,
      heatmapShowHitCount: false,
      insightsShowPreview: true,
      insightsShowActivity: true,
      insightsShowStats: true,
      showBullseye: true,
      bullseyeScale: 1,
      showHitMarkers: true,
      hitMarkerAutoHideMs: 2500,
      showInputDebug: false,
    },
    history,
  };

  const root = path.resolve(__dirname, '..');
  const outFile = path.join(root, 'demo', 'demo-import.json');
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`);

  const totalReps = history.reduce((sum, s) => sum + s.reps, 0);
  const totalMappedHits = history.reduce((sum, s) => sum + s.hits.length, 0);
  const minDay = dailyStats.reduce((min, d) => Math.min(min, d.reps), Infinity);
  const maxDay = dailyStats.reduce((max, d) => Math.max(max, d.reps), -Infinity);
  const middle = dailyStats[Math.floor(dailyStats.length / 2)];

  console.log(
    JSON.stringify(
      {
        file: path.relative(root, outFile),
        days: dailyStats.length,
        sessions: history.length,
        totalReps,
        totalMappedHits,
        minDayReps: minDay,
        maxDayReps: maxDay,
        sample: {
          first: dailyStats[0],
          middle,
          last: dailyStats[dailyStats.length - 1],
        },
      },
      null,
      2,
    ),
  );
}

main();
