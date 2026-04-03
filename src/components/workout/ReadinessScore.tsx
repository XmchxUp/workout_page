import { useMemo } from 'react';
import type { WorkoutSession } from '@/types/workout';
import { getExerciseMuscles, MUSCLE_PATTERNS } from '@/utils/workoutMuscles';
import { WORKING_SET_TYPES, toLocalDate } from '@/utils/workoutCalcs';
import { IS_CHINESE } from './WorkoutUI';

// ── Reuse same recovery model as MuscleRecovery (sets + time decay) ─────────
const UNIQUE_MUSCLES = MUSCLE_PATTERNS.map(({ muscle }) => muscle);
const MUSCLE_WEIGHTS: Record<string, number> = {
  chest: 1.2, back: 1.3, shoulders: 1.0, biceps: 0.7, triceps: 0.7,
  abs: 0.6, quads: 1.3, hamstrings: 1.1, glutes: 1.0, calves: 0.6,
};

const recoveryHoursFromSets = (sets: number): number => {
  if (sets >= 12) return 72;
  if (sets >= 8)  return 60;
  if (sets >= 4)  return 48;
  return 36;
};

function calcMuscleRecovery(workouts: WorkoutSession[]): number {
  const now = Date.now();
  const sorted = [...workouts].sort((a, b) => b.start_time.localeCompare(a.start_time));
  let weightedSum = 0, totalWeight = 0;

  for (const muscle of UNIQUE_MUSCLES) {
    const muscleWeight = MUSCLE_WEIGHTS[muscle] ?? 1;
    const relevantSessions = sorted.filter((w) =>
      w.exercises.some((ex) => getExerciseMuscles(ex.name).includes(muscle))
    );
    if (relevantSessions.length === 0) {
      weightedSum += 100 * muscleWeight; totalWeight += muscleWeight; continue;
    }
    const hoursAgo = (now - new Date(relevantSessions[0].start_time).getTime()) / 3600000;
    let effectiveSets = 0;
    for (const w of relevantSessions) {
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
    const recoveryH = recoveryHoursFromSets(Math.round(effectiveSets));
    const pct = Math.min(100, Math.round((hoursAgo / recoveryH) * 100));
    weightedSum += pct * muscleWeight;
    totalWeight += muscleWeight;
  }
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 100;
}

function calcTSB(workouts: WorkoutSession[]): number {
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

function tsbToScore(tsb: number): number {
  if (tsb > 15) return 100;
  if (tsb > 5)  return 80 + ((tsb - 5) / 10) * 20;
  if (tsb > -5) return 50 + ((tsb + 5) / 10) * 30;
  if (tsb > -15) return 20 + ((tsb + 15) / 10) * 30;
  return Math.max(0, 20 + ((tsb + 15) / 10) * 20);
}

function densityScore(workouts: WorkoutSession[]): number {
  const cutoff = toLocalDate(new Date(Date.now() - 7 * 86400000));
  const days = new Set(workouts.filter((w) => w.start_time.slice(0, 10) >= cutoff).map((w) => w.start_time.slice(0, 10))).size;
  if (days === 0) return 60;
  if (days <= 2) return 80;
  if (days === 3) return 100;
  if (days === 4) return 90;
  if (days === 5) return 70;
  return 40; // 6-7 days = may be overtraining
}

const GAUGE_SIZE = 180;
const CX = GAUGE_SIZE / 2, CY = GAUGE_SIZE / 2 + 10;
const R = 72;
const START_DEG = 135, END_DEG = 405; // 270° sweep

function polarToXY(deg: number, r: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function arcPath(startDeg: number, endDeg: number, r: number, _strokeW: number) {
  const s = polarToXY(startDeg, r);
  const e = polarToXY(endDeg, r);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

const STATUS_LABELS = IS_CHINESE
  ? { peak: '巅峰状态', good: '状态良好', ok: '略感疲劳', tired: '需要恢复', rest: '建议休息' }
  : { peak: 'Peak', good: 'Good', ok: 'Moderate', tired: 'Fatigued', rest: 'Rest' };

function scoreToStatus(score: number) {
  if (score >= 85) return { key: 'peak' as const, color: 'var(--wo-form)' };
  if (score >= 65) return { key: 'good' as const, color: 'var(--wo-positive)' };
  if (score >= 45) return { key: 'ok'   as const, color: 'var(--wo-warning)' };
  if (score >= 25) return { key: 'tired' as const, color: 'var(--wo-negative)' };
  return { key: 'rest' as const, color: 'var(--wo-negative)' };
}

export default function ReadinessScore({ workouts }: { workouts: WorkoutSession[] }) {
  const { score, tsbScore, recoveryScore, densScore, tsb } = useMemo(() => {
    const tsb = calcTSB(workouts);
    const tsbScore = Math.round(tsbToScore(tsb));
    const recoveryScore = calcMuscleRecovery(workouts);
    const densScore = densityScore(workouts);
    const score = Math.round(0.4 * tsbScore + 0.4 * recoveryScore + 0.2 * densScore);
    return { score, tsbScore, recoveryScore, densScore, tsb };
  }, [workouts]);

  const status = scoreToStatus(score);
  const fillDeg = START_DEG + (score / 100) * 270;

  // Gauge gradient stops (135°→405°): red at 135, yellow at 270, green at 405
  const trackPath  = arcPath(START_DEG, END_DEG, R, 12);
  const fillPath   = score > 0 ? arcPath(START_DEG, fillDeg, R, 12) : '';
  const needlePos  = polarToXY(fillDeg, R);

  const subItems = [
    { label: IS_CHINESE ? '状态指数 TSB' : 'Form (TSB)', val: tsbScore, raw: `${tsb > 0 ? '+' : ''}${tsb}` },
    { label: IS_CHINESE ? '肌肉恢复'    : 'Muscle Recovery', val: recoveryScore, raw: `${recoveryScore}%` },
    { label: IS_CHINESE ? '训练密度'    : 'Density', val: densScore, raw: '' },
  ];

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.1em] opacity-40 mb-4">
        {IS_CHINESE ? '今日准备度' : 'Readiness Score'}
      </div>

      <div className="flex flex-col items-center">
        {/* Gauge SVG */}
        <svg width={GAUGE_SIZE} height={GAUGE_SIZE * 0.78} viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE * 0.78}`}>
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#ef4444" />
              <stop offset="40%"  stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          {/* Track */}
          <path d={trackPath} fill="none" stroke="rgba(128,128,128,0.12)" strokeWidth={12} strokeLinecap="round" />
          {/* Fill */}
          {fillPath && (
            <path d={fillPath} fill="none" stroke="url(#gaugeGrad)" strokeWidth={12} strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 6px ${status.color}88)` }} />
          )}
          {/* Needle dot */}
          {score > 0 && (
            <circle cx={needlePos.x} cy={needlePos.y} r={7} fill={status.color}
              style={{ filter: `drop-shadow(0 0 8px ${status.color})` }} />
          )}
          {/* Center score */}
          <text x={CX} y={CY - 8} textAnchor="middle" fill={status.color}
            fontSize={40} fontWeight={900} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {score}
          </text>
          <text x={CX} y={CY + 14} textAnchor="middle" fill={status.color} fontSize={11} fontWeight={600} opacity={0.85}>
            {STATUS_LABELS[status.key]}
          </text>
        </svg>

        {/* Sub-scores */}
        <div className="w-full mt-4 space-y-2">
          {subItems.map(({ label, val, raw }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-0.5">
                <span style={{ fontSize: 10, opacity: 0.45 }}>{label}</span>
                <span style={{ fontSize: 10, opacity: 0.55, fontVariantNumeric: 'tabular-nums' }}>
                  {raw || `${val}`}
                </span>
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: 4, background: 'rgba(128,128,128,0.12)' }}>
                <div style={{
                  width: `${val}%`, height: '100%', borderRadius: 9999,
                  background: val >= 70 ? 'var(--wo-positive)' : val >= 45 ? 'var(--wo-warning)' : 'var(--wo-negative)',
                  transition: 'width 0.8s ease',
                }} />
              </div>
            </div>
          ))}
        </div>

        {score < 40 && (
          <div className="mt-3 w-full rounded-lg px-3 py-2 text-xs text-center"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>
            {IS_CHINESE ? '建议今天休息或轻度训练，让身体充分恢复' : 'Consider rest or light training today'}
          </div>
        )}
      </div>
    </div>
  );
}
