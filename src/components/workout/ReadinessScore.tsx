import { useMemo } from 'react';
import type { WorkoutSession } from '@/types/workout';
import { MUSCLE_PATTERNS } from '@/utils/workoutMuscles';
import { calcTSB, getMuscleRecoveryPct, toLocalDate } from '@/utils/workoutCalcs';
import { IS_CHINESE } from './WorkoutUI';

const UNIQUE_MUSCLES = MUSCLE_PATTERNS.map(({ muscle }) => muscle);
const MUSCLE_WEIGHTS: Record<string, number> = {
  chest: 1.2, back: 1.3, shoulders: 1.0, biceps: 0.7, triceps: 0.7,
  abs: 0.6, quads: 1.3, hamstrings: 1.1, glutes: 1.0, calves: 0.6,
};

function calcMuscleRecovery(workouts: WorkoutSession[]): number {
  let weightedSum = 0, totalWeight = 0;
  for (const muscle of UNIQUE_MUSCLES) {
    const w = MUSCLE_WEIGHTS[muscle] ?? 1;
    weightedSum += getMuscleRecoveryPct(workouts, muscle) * w;
    totalWeight += w;
  }
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 100;
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

function arcPath(startDeg: number, endDeg: number, r: number) {
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
  const trackPath  = arcPath(START_DEG, END_DEG, R);
  const fillPath   = score > 0 ? arcPath(START_DEG, fillDeg, R) : '';
  const needlePos  = polarToXY(fillDeg, R);

  const subItems = [
    { label: IS_CHINESE ? '状态指数 TSB' : 'Form (TSB)', val: tsbScore, raw: `${tsb > 0 ? '+' : ''}${tsb}` },
    { label: IS_CHINESE ? '肌肉恢复'    : 'Muscle Recovery', val: recoveryScore, raw: `${recoveryScore}%` },
    { label: IS_CHINESE ? '训练密度'    : 'Density', val: densScore, raw: '' },
  ];

  return (
    <div>
      <div className="text-xs font-semibold opacity-50 mb-4">
        {IS_CHINESE ? '今日准备度' : 'Readiness Score'}
      </div>

      <div className="flex flex-col items-center">
        {/* Gauge SVG */}
        <svg width={GAUGE_SIZE} height={GAUGE_SIZE * 0.78} viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE * 0.78}`}>
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="var(--wo-negative)" />
              <stop offset="40%"  stopColor="var(--wo-warning)" />
              <stop offset="100%" stopColor="var(--wo-positive)" />
            </linearGradient>
          </defs>
          {/* Track */}
          <path d={trackPath} fill="none" stroke="var(--wt-chip-bg)" strokeWidth={12} strokeLinecap="round" />
          {/* Fill */}
          {fillPath && (
            <path d={fillPath} fill="none" stroke="url(#gaugeGrad)" strokeWidth={12} strokeLinecap="round"
              style={{}} />
          )}
          {/* Needle dot */}
          {score > 0 && (
            <circle cx={needlePos.x} cy={needlePos.y} r={7} fill={status.color}
              style={{}} />
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
              <div className="rounded-full overflow-hidden" style={{ height: 4, background: 'var(--wt-chip-bg)' }}>
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
            style={{ background: 'var(--wo-negative-bg)', border: '1px solid color-mix(in srgb, var(--wo-negative) 24%, transparent)', color: 'var(--wo-negative)' }}>
            {IS_CHINESE ? '建议今天休息或轻度训练，让身体充分恢复' : 'Consider rest or light training today'}
          </div>
        )}
      </div>
    </div>
  );
}
