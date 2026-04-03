import type { WorkoutSession } from '@/types/workout';

// Shared filter constants — avoids repeated inline arrays throughout the codebase
export const WARMUP_NAMES = new Set(['warm up', 'warmup']);
export const WORKING_SET_TYPES = new Set(['normal', 'dropset', 'failure']);

// Local date string — avoids toISOString() UTC offset shifting the date in UTC+8
export const toLocalDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ─────────────────────────────────────────────────────────────────────────────
// Linear regression — least squares (single-pass, was 5 separate reduce calls)
// ─────────────────────────────────────────────────────────────────────────────
export const linearRegression = (
  pts: Array<{ x: number; y: number }>
): { slope: number; intercept: number } => {
  const n = pts.length;
  if (n < 2) return { slope: 0, intercept: pts[0]?.y ?? 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (const p of pts) { sumX += p.x; sumY += p.y; sumXY += p.x * p.y; sumXX += p.x * p.x; }
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
};

// ─────────────────────────────────────────────────────────────────────────────
// Exercise stem — strip parenthetical variant  e.g. "Bench Press (Barbell)" → "Bench Press"
// ─────────────────────────────────────────────────────────────────────────────
export const getExerciseStem = (name: string): string =>
  name.replace(/\s*\([^)]*\)\s*/g, '').trim();

// ─────────────────────────────────────────────────────────────────────────────
// Exercise co-occurrence matrix
// ─────────────────────────────────────────────────────────────────────────────
export const calcExerciseCoMatrix = (
  workouts: WorkoutSession[], topN = 15
): { exercises: string[]; matrix: number[][] } => {
  // count how many sessions each exercise appears in
  const freq: Record<string, number> = {};
  workouts.forEach((w) => {
    const names = [...new Set(w.exercises.map((e) => e.name))];
    names.forEach((n) => { freq[n] = (freq[n] ?? 0) + 1; });
  });
  const top = Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN)
    .map(([name]) => name);
  const idx = Object.fromEntries(top.map((n, i) => [n, i]));
  const matrix: number[][] = Array.from({ length: top.length }, () => Array(top.length).fill(0));
  workouts.forEach((w) => {
    const names = [...new Set(w.exercises.map((e) => e.name))].filter((n) => idx[n] !== undefined);
    for (let i = 0; i < names.length; i++) {
      for (let j = 0; j < names.length; j++) {
        if (i !== j) matrix[idx[names[i]]][idx[names[j]]]++;
      }
    }
  });
  return { exercises: top, matrix };
};

// Exercises where lower weight = stronger (assisted resistance helps less = harder)
const ASSISTED_PATTERN = /assisted/i;
export const isAssisted = (name: string): boolean => ASSISTED_PATTERN.test(name);

// ─────────────────────────────────────────────────────────────────────────────
// e1RM — Epley formula
// ─────────────────────────────────────────────────────────────────────────────
export const calcE1RM = (weight: number, reps: number): number => {
  if (reps <= 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
};

// ─────────────────────────────────────────────────────────────────────────────
// Streak
// ─────────────────────────────────────────────────────────────────────────────
export const calcStreak = (workouts: WorkoutSession[]): { current: number; longest: number } => {
  if (workouts.length === 0) return { current: 0, longest: 0 };
  const toLocal = (d: Date) => {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const dates = [...new Set(workouts.map((w) => w.start_time.slice(0, 10)))].sort();
  let longest = 1, streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000;
    if (diff === 1) { streak++; longest = Math.max(longest, streak); } else streak = 1;
  }
  const today = toLocal(new Date()), yesterday = toLocal(new Date(Date.now() - 86400000));
  const dateSet = new Set(dates);
  let current = 0;
  if (dateSet.has(today) || dateSet.has(yesterday)) {
    let d = new Date(dateSet.has(today) ? today : yesterday);
    while (dateSet.has(toLocal(d))) { current++; d = new Date(d.getTime() - 86400000); }
  }
  return { current, longest: Math.max(longest, 1) };
};

// ─────────────────────────────────────────────────────────────────────────────
// Best lifts — non-assisted ranked by e1RM desc, assisted by e1RM asc (lower = harder)
// ─────────────────────────────────────────────────────────────────────────────
export const calcBestLifts = (
  workouts: WorkoutSession[], topN = 6
): Array<{ name: string; weight: number; reps: number; e1rm: number; date: string }> => {
  const best: Record<string, { weight: number; reps: number; e1rm: number; date: string }> = {};
  [...workouts].sort((a, b) => a.start_time.localeCompare(b.start_time)).forEach((w) => {
    w.exercises.forEach((ex) => {
      if (WARMUP_NAMES.has(ex.name.toLowerCase())) return;
      ex.sets.forEach((s) => {
        if (!WORKING_SET_TYPES.has(s.type)) return;
        const kg = s.weight_kg ?? 0, reps = s.reps ?? 1;
        if (kg > 0) {
          const e1rm = calcE1RM(kg, reps);
          if (isAssisted(ex.name) ? e1rm < (best[ex.name]?.e1rm ?? Infinity) : e1rm > (best[ex.name]?.e1rm ?? 0))
            best[ex.name] = { weight: kg, reps, e1rm, date: w.start_time.slice(0, 10) };
        }
      });
    });
  });
  const entries = Object.entries(best).map(([name, d]) => ({ name, ...d }));
  const normal = entries.filter((e) => !isAssisted(e.name)).sort((a, b) => b.e1rm - a.e1rm);
  const assisted = entries.filter((e) => isAssisted(e.name)).sort((a, b) => a.e1rm - b.e1rm);
  return [...normal, ...assisted].slice(0, topN);
};

// ─────────────────────────────────────────────────────────────────────────────
// Exercise history helper
// ─────────────────────────────────────────────────────────────────────────────
export type ExHistory = Record<string, Array<{ date: string; e1rm: number; weight: number; reps: number; sessionVol: number }>>;

export const buildExerciseHistory = (workouts: WorkoutSession[]): ExHistory => {
  const history: ExHistory = {};
  [...workouts].sort((a, b) => a.start_time.localeCompare(b.start_time)).forEach((w) => {
    w.exercises.forEach((ex) => {
      if (WARMUP_NAMES.has(ex.name.toLowerCase())) return;
      const assisted = isAssisted(ex.name);
      // For assisted exercises, the "hardest" set has the LOWEST e1RM (least assistance used)
      let bestE1rm = assisted ? Infinity : 0, bestWeight = 0, bestReps = 0, sessionVol = 0;
      ex.sets.forEach((s) => {
        if (!WORKING_SET_TYPES.has(s.type)) return;
        if (s.weight_kg && s.reps) {
          const e1rm = calcE1RM(s.weight_kg, s.reps);
          sessionVol += s.weight_kg * s.reps;
          const better = assisted ? e1rm < bestE1rm : e1rm > bestE1rm;
          if (better) { bestE1rm = e1rm; bestWeight = s.weight_kg; bestReps = s.reps; }
        }
      });
      if (bestE1rm > 0 && bestE1rm !== Infinity) {
        if (!history[ex.name]) history[ex.name] = [];
        history[ex.name].push({ date: w.start_time.slice(0, 10), e1rm: bestE1rm, weight: bestWeight, reps: bestReps, sessionVol });
      }
    });
  });
  return history;
};

// ─────────────────────────────────────────────────────────────────────────────
// Session scores  (0–100)
// ─────────────────────────────────────────────────────────────────────────────
export const calcSessionScores = (workouts: WorkoutSession[]): Record<string, number> => {
  if (workouts.length === 0) return {};
  const vols = workouts.map((w) => w.total_volume_kg);
  const sets = workouts.map((w) => w.total_sets);
  const effs = workouts.filter((w) => w.total_volume_kg > 0 && w.duration_seconds > 0)
    .map((w) => w.total_volume_kg / (w.duration_seconds / 60));
  const [minVol, maxVol] = [Math.min(...vols), Math.max(...vols)];
  const [minSets, maxSets] = [Math.min(...sets), Math.max(...sets)];
  const [minEff, maxEff] = effs.length ? [Math.min(...effs), Math.max(...effs)] : [0, 1];
  const scores: Record<string, number> = {};
  workouts.forEach((w) => {
    const volScore  = maxVol  > minVol  ? ((w.total_volume_kg - minVol)  / (maxVol  - minVol))  * 50 : 25;
    const setsScore = maxSets > minSets ? ((w.total_sets      - minSets) / (maxSets - minSets)) * 30 : 15;
    const eff       = w.duration_seconds > 0 ? w.total_volume_kg / (w.duration_seconds / 60) : 0;
    const effScore  = maxEff  > minEff  ? ((eff - minEff)  / (maxEff  - minEff))  * 20 : 10;
    scores[w.id] = Math.round(volScore + setsScore + effScore);
  });
  return scores;
};

// ─────────────────────────────────────────────────────────────────────────────
// Stagnation — accepts optional pre-built history to avoid duplicate computation
// ─────────────────────────────────────────────────────────────────────────────
export const calcStagnation = (workouts: WorkoutSession[], threshold = 3, history?: ExHistory) => {
  const h = history ?? buildExerciseHistory(workouts);
  const result: Array<{ name: string; sessionsSincePR: number; bestE1rm: number; lastPRDate: string }> = [];
  for (const [name, sessions] of Object.entries(h)) {
    if (sessions.length < threshold) continue;
    const assisted = isAssisted(name);
    // For assisted exercises, progress = lower e1RM (less assistance = harder)
    let runningBest = assisted ? Infinity : 0, lastPRIndex = -1;
    sessions.forEach((s, i) => {
      const better = assisted ? s.e1rm < runningBest : s.e1rm > runningBest;
      if (better) { runningBest = s.e1rm; lastPRIndex = i; }
    });
    const sessionsSincePR = sessions.length - 1 - lastPRIndex;
    if (sessionsSincePR >= threshold)
      result.push({ name, sessionsSincePR, bestE1rm: runningBest, lastPRDate: sessions[lastPRIndex].date });
  }
  return result.sort((a, b) => b.sessionsSincePR - a.sessionsSincePR);
};

// ─────────────────────────────────────────────────────────────────────────────
// Progressive overload — accepts optional pre-built history to avoid duplicate computation
// ─────────────────────────────────────────────────────────────────────────────
export const calcProgressiveOverload = (workouts: WorkoutSession[], history?: ExHistory) => {
  const h = history ?? buildExerciseHistory(workouts);
  return Object.entries(h)
    .filter(([, sessions]) => sessions.length >= 3)
    .map(([name, sessions]) => {
      const assisted = isAssisted(name);
      const firstE1rm = sessions[0].e1rm, lastE1rm = sessions[sessions.length - 1].e1rm;
      const rawPct = Math.round(((lastE1rm - firstE1rm) / firstE1rm) * 100);
      // For assisted exercises: lower e1rm over time = less assistance used = real progress
      // Invert the sign so the UI correctly shows green for improvement
      const pctChange = assisted ? -rawPct : rawPct;
      return { name, firstE1rm, lastE1rm, pctChange, sessions: sessions.length, assisted };
    })
    .filter((x) => x.pctChange !== 0)
    .sort((a, b) => b.pctChange - a.pctChange);
};

// ─────────────────────────────────────────────────────────────────────────────
// PR timeline
// ─────────────────────────────────────────────────────────────────────────────
export const buildPRTimeline = (workouts: WorkoutSession[]) => {
  const events: Array<{ date: string; exercise: string; e1rm: number; weight: number; reps: number; prevE1rm: number | null }> = [];
  const allTimeBest: Record<string, number> = {};
  [...workouts].sort((a, b) => a.start_time.localeCompare(b.start_time)).forEach((w) => {
    w.exercises.forEach((ex) => {
      if (WARMUP_NAMES.has(ex.name.toLowerCase())) return;
      const assisted = isAssisted(ex.name);
      // For assisted: hardest set = lowest e1rm (least assistance used)
      let bestE1rm = assisted ? Infinity : 0, bestWeight = 0, bestReps = 0;
      ex.sets.forEach((s) => {
        if (!WORKING_SET_TYPES.has(s.type)) return;
        if (s.weight_kg && s.reps) {
          const e1rm = calcE1RM(s.weight_kg, s.reps);
          const better = assisted ? e1rm < bestE1rm : e1rm > bestE1rm;
          if (better) { bestE1rm = e1rm; bestWeight = s.weight_kg; bestReps = s.reps; }
        }
      });
      if (bestE1rm > 0 && bestE1rm !== Infinity && (assisted ? bestE1rm < (allTimeBest[ex.name] ?? Infinity) : bestE1rm > (allTimeBest[ex.name] ?? 0))) {
        events.push({ date: w.start_time.slice(0, 10), exercise: ex.name, e1rm: bestE1rm, weight: bestWeight, reps: bestReps, prevE1rm: allTimeBest[ex.name] ?? null });
        allTimeBest[ex.name] = bestE1rm;
      }
    });
  });
  return events.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
};
