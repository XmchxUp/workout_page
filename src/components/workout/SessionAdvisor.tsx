import { useMemo } from 'react';
import type { WorkoutSession } from '@/types/workout';
import { calcE1RM, WARMUP_NAMES, WORKING_SET_TYPES, toLocalDate } from '@/utils/workoutCalcs';
import { getExerciseMuscles, PUSH_MUSCLES, PULL_MUSCLES, LEGS_MUSCLES } from '@/utils/workoutMuscles';
import { translateExercise } from '@/utils/exerciseTranslations';
import { IS_CHINESE } from './WorkoutUI';

// Reuse TSB calc
function calcCurrentTSB(workouts: WorkoutSession[]): number {
  const volMap: Record<string, number> = {};
  workouts.forEach((w) => {
    const d = w.start_time.slice(0, 10);
    volMap[d] = (volMap[d] ?? 0) + w.total_volume_kg;
  });
  const k7 = 1 - Math.exp(-1 / 7);
  const k42 = 1 - Math.exp(-1 / 42);
  let atl = 0, ctl = 0;
  const now = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const key = toLocalDate(d);
    const vol = volMap[key] ?? 0;
    atl = atl * (1 - k7) + vol * k7;
    ctl = ctl * (1 - k42) + vol * k42;
  }
  return Math.round(ctl - atl);
}

// Muscle recovery: sets + exponential time decay (same model as MuscleRecovery.tsx)
const _recoveryHoursFromSets = (sets: number): number =>
  sets >= 12 ? 72 : sets >= 8 ? 60 : sets >= 4 ? 48 : 36;

function getMuscleRecoveryPct(workouts: WorkoutSession[], muscle: string): number {
  const now = Date.now();
  const sorted = [...workouts]
    .filter((w) => w.exercises.some((ex) => getExerciseMuscles(ex.name).includes(muscle)))
    .sort((a, b) => b.start_time.localeCompare(a.start_time));
  if (!sorted.length) return 100;
  const hoursAgo = (now - new Date(sorted[0].start_time).getTime()) / 3600000;
  let effectiveSets = 0;
  for (const w of sorted) {
    const sessionHoursAgo = (now - new Date(w.start_time).getTime()) / 3600000;
    if (sessionHoursAgo > 96) break;
    const decayFactor = Math.pow(0.5, sessionHoursAgo / 24);
    let sessionSets = 0;
    w.exercises.forEach((ex) => {
      if (getExerciseMuscles(ex.name).includes(muscle))
        sessionSets += ex.sets.filter((s) => WORKING_SET_TYPES.has(s.type)).length;
    });
    effectiveSets += sessionSets * decayFactor;
  }
  const rH = _recoveryHoursFromSets(Math.round(effectiveSets));
  return Math.min(100, Math.round((hoursAgo / rH) * 100));
}

type SplitType = 'push' | 'pull' | 'legs' | 'full';

function recommendSplit(recoveries: Record<string, number>): SplitType {
  const pushAvg = PUSH_MUSCLES.reduce((s, m) => s + (recoveries[m] ?? 100), 0) / PUSH_MUSCLES.length;
  const pullAvg = PULL_MUSCLES.reduce((s, m) => s + (recoveries[m] ?? 100), 0) / PULL_MUSCLES.length;
  const legsAvg = LEGS_MUSCLES.reduce((s, m) => s + (recoveries[m] ?? 100), 0) / LEGS_MUSCLES.length;
  const best = Math.max(pushAvg, pullAvg, legsAvg);
  if (best < 70) return 'full'; // nothing great, do full body light
  if (pushAvg >= pullAvg && pushAvg >= legsAvg) return 'push';
  if (pullAvg >= legsAvg) return 'pull';
  return 'legs';
}

interface ExerciseRec {
  name: string;
  targetWeight: number;
  targetSets: number;
  targetReps: number;
  reason: string;
}

function buildRecommendations(workouts: WorkoutSession[], split: SplitType, tsb: number): ExerciseRec[] {
  // Collect relevant muscles for split
  const splitMuscles = split === 'push' ? PUSH_MUSCLES
    : split === 'pull' ? PULL_MUSCLES
    : split === 'legs' ? LEGS_MUSCLES
    : [...PUSH_MUSCLES, ...PULL_MUSCLES, ...LEGS_MUSCLES];

  // Exercise frequency + last performance per exercise
  const exStats: Record<string, { sets: number; lastWeight: number; lastReps: number; lastSets: number; lastDate: string; bestE1rm: number; stagnant: boolean }> = {};

  const sorted = [...workouts].sort((a, b) => a.start_time.localeCompare(b.start_time));
  const prMap: Record<string, number> = {};

  sorted.forEach((w) => {
    w.exercises.forEach((ex) => {
      if (WARMUP_NAMES.has(ex.name.toLowerCase())) return;
      const muscles = getExerciseMuscles(ex.name);
      if (!splitMuscles.some((m) => muscles.includes(m))) return;

      let bestE1rm = 0, bestW = 0, bestR = 0;
      const normalSets = ex.sets.filter((s) => WORKING_SET_TYPES.has(s.type));
      normalSets.forEach((s) => {
        if (s.weight_kg && s.reps) {
          const e1rm = calcE1RM(s.weight_kg, s.reps);
          if (e1rm > bestE1rm) { bestE1rm = e1rm; bestW = s.weight_kg; bestR = s.reps; }
        }
      });
      if (bestE1rm === 0) return;

      const wasStagnant = bestE1rm <= (prMap[ex.name] ?? 0);
      prMap[ex.name] = Math.max(prMap[ex.name] ?? 0, bestE1rm);

      if (!exStats[ex.name]) {
        exStats[ex.name] = { sets: 0, lastWeight: bestW, lastReps: bestR, lastSets: normalSets.length, lastDate: w.start_time.slice(0, 10), bestE1rm: prMap[ex.name], stagnant: false };
      }
      exStats[ex.name].sets++;
      exStats[ex.name].lastWeight = bestW;
      exStats[ex.name].lastReps = bestR;
      exStats[ex.name].lastSets = normalSets.length;
      exStats[ex.name].lastDate = w.start_time.slice(0, 10);
      exStats[ex.name].bestE1rm = prMap[ex.name];
      exStats[ex.name].stagnant = wasStagnant;
    });
  });

  // Pick top 4 exercises by frequency
  const topEx = Object.entries(exStats)
    .sort(([, a], [, b]) => b.sets - a.sets)
    .slice(0, 4);

  const isDeload = tsb < -15;

  return topEx.map(([name, stats]) => {
    let targetWeight = stats.lastWeight;
    let targetSets = stats.lastSets;
    let targetReps = stats.lastReps;
    let reason = '';

    if (isDeload) {
      targetWeight = Math.round(stats.lastWeight * 0.9 * 2) / 2;
      targetSets = Math.max(2, stats.lastSets - 1);
      reason = IS_CHINESE ? '退量周，减重恢复' : 'Deload: reduce weight';
    } else if (stats.stagnant && stats.sets > 3) {
      // stagnating — suggest slight weight bump or rep target
      if (stats.lastReps >= 8) {
        targetWeight = stats.lastWeight + (stats.lastWeight > 80 ? 5 : 2.5);
        reason = IS_CHINESE ? '停滞 3 课以上，尝试加重' : 'Stagnant >3 sessions, try adding weight';
      } else {
        targetReps = stats.lastReps + 1;
        reason = IS_CHINESE ? '先加次数再加重' : 'Add reps before weight';
      }
    } else if (stats.lastReps >= 6 && stats.lastSets >= 3) {
      // progressing normally — add 2.5-5kg
      targetWeight = stats.lastWeight + (stats.lastWeight > 80 ? 5 : 2.5);
      reason = IS_CHINESE ? '上次完成目标，可以加重了' : 'Previous target met, add weight';
    } else {
      reason = IS_CHINESE ? '保持当前重量，专注动作质量' : 'Maintain weight, focus on form';
    }

    return { name, targetWeight, targetSets, targetReps, reason };
  });
}

const SPLIT_LABELS = {
  push: { cn: '推（胸 + 肩 + 三头）', en: 'Push (Chest + Shoulder + Triceps)', icon: '💪' },
  pull: { cn: '拉（背 + 二头）',       en: 'Pull (Back + Biceps)',              icon: '🏋️' },
  legs: { cn: '腿（股四 + 腘绳 + 臀）', en: 'Legs (Quads + Hamstrings + Glutes)', icon: '🦵' },
  full: { cn: '全身轻训',              en: 'Full Body Light',                   icon: '🔄' },
};

export default function SessionAdvisor({ workouts }: { workouts: WorkoutSession[] }) {
  const { tsb, split, recs } = useMemo(() => {
    const tsb = calcCurrentTSB(workouts);
    const recoveries: Record<string, number> = {};
    [...PUSH_MUSCLES, ...PULL_MUSCLES, ...LEGS_MUSCLES].forEach((m) => {
      recoveries[m] = getMuscleRecoveryPct(workouts, m);
    });
    const split = recommendSplit(recoveries);
    const recs = buildRecommendations(workouts, split, tsb);
    return { tsb, split, recs };
  }, [workouts]);

  const isDeload = tsb < -15;
  const splitInfo = SPLIT_LABELS[split];

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.1em] opacity-40 mb-3">
        {IS_CHINESE ? '今日训练建议' : 'Session Advisor'}
      </div>

      {/* Recommended split */}
      <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-4"
        style={{ background: isDeload ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.12)', border: `1px solid ${isDeload ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)'}` }}>
        <span style={{ fontSize: 24 }}>{splitInfo.icon}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: isDeload ? '#ef4444' : 'var(--wc-l3)' }}>
            {IS_CHINESE ? splitInfo.cn : splitInfo.en}
          </div>
          <div style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>
            {isDeload
              ? (IS_CHINESE ? '⚠️ TSB 过低，建议退量恢复' : '⚠️ Low TSB — deload recommended')
              : (IS_CHINESE ? `TSB ${tsb > 0 ? '+' : ''}${tsb} · 基于恢复状态推荐` : `TSB ${tsb > 0 ? '+' : ''}${tsb} · Based on recovery state`)}
          </div>
        </div>
      </div>

      {/* Exercise recommendations */}
      {recs.length > 0 ? (
        <div className="space-y-2">
          {recs.map(({ name, targetWeight, targetSets, targetReps, reason }) => (
            <div key={name} className="rounded-lg px-3 py-2.5"
              style={{ background: 'rgba(128,128,128,0.06)', border: '1px solid rgba(128,128,128,0.1)' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85 }} className="truncate">
                    {translateExercise(name)}
                  </div>
                  <div style={{ fontSize: 9, opacity: 0.4, marginTop: 2 }}>{reason}</div>
                </div>
                <div className="shrink-0 text-right">
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--wc-l3)', fontVariantNumeric: 'tabular-nums' }}>
                    {targetWeight}kg
                  </span>
                  <span style={{ fontSize: 10, opacity: 0.5 }}> × {targetSets} × {targetReps}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs opacity-30 text-center py-4">
          {IS_CHINESE ? '暂无足够历史数据生成建议' : 'Not enough history to generate advice'}
        </div>
      )}

      <div style={{ fontSize: 9, opacity: 0.22, marginTop: 12 }}>
        {IS_CHINESE ? '建议基于恢复状态、渐进超负荷原则和历史数据自动生成' : 'Auto-generated from recovery state, progressive overload & history'}
      </div>
    </div>
  );
}
