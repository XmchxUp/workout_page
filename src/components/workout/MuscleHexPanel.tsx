import { useState, useMemo } from 'react';
import type { WorkoutSession } from '@/types/workout';
import { HEXA_AXES, getExerciseMuscles, type HexaKey } from '@/utils/workoutMuscles';
import { WARMUP_NAMES, WORKING_SET_TYPES, toLocalDate } from '@/utils/workoutCalcs';
import { IS_CHINESE } from './WorkoutUI';

export const hexaVolumes = (workouts: WorkoutSession[]): Record<HexaKey, number> => {
  const vol: Record<string, number> = {};
  workouts.forEach((w) => {
    w.exercises.forEach((ex) => {
      if (WARMUP_NAMES.has(ex.name.toLowerCase())) return;
      const muscles = getExerciseMuscles(ex.name);
      const sets = ex.sets.filter((s) => WORKING_SET_TYPES.has(s.type));
      const v = sets.reduce((s, set) => s + (set.weight_kg ?? 0) * (set.reps ?? 0), 0);
      const contrib = v > 0 ? v : sets.length * 50;
      muscles.forEach((m) => { vol[m] = (vol[m] || 0) + contrib; });
    });
  });
  return Object.fromEntries(
    HEXA_AXES.map(({ key, muscles }) => [key, muscles.reduce((s, m) => s + (vol[m] || 0), 0)])
  ) as Record<HexaKey, number>;
};

const MuscleHexPanel = ({ workouts }: { workouts: WorkoutSession[] }) => {
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [showPrev, setShowPrev] = useState(false);

  const splitWorkouts = useMemo(() => {
    if (period === 'all') return { curr: workouts, prev: [] as WorkoutSession[] };
    const now = Date.now();
    const ms = period === 'week' ? 7 * 86400000 : 30 * 86400000;
    const cutCurr = toLocalDate(new Date(now - ms));
    const cutPrev = toLocalDate(new Date(now - 2 * ms));
    return {
      curr: workouts.filter((w) => w.start_time.slice(0, 10) >= cutCurr),
      prev: workouts.filter((w) => {
        const d = w.start_time.slice(0, 10); return d >= cutPrev && d < cutCurr;
      }),
    };
  }, [workouts, period]);

  const currVol = useMemo(() => hexaVolumes(splitWorkouts.curr), [splitWorkouts.curr]);
  const prevVol = useMemo(() => hexaVolumes(splitWorkouts.prev), [splitWorkouts.prev]);

  const maxVol = Math.max(1, ...Object.values(currVol));
  const normalize = (vol: Record<string, number>) =>
    HEXA_AXES.map(({ key }) => Math.min((vol[key] || 0) / maxVol, 1));
  const currN = normalize(currVol);
  const prevN  = normalize(prevVol);

  // Balance score: 100 if perfectly even, lower if skewed
  const balanceScore = useMemo(() => {
    const vals = currN.filter((v) => v > 0);
    if (vals.length < 2) return 0;
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
    const std  = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length);
    return Math.round(Math.max(0, (1 - Math.min(std / (mean || 1), 1)) * 100));
  }, [currN]);

  const grade = balanceScore >= 85 ? 'S' : balanceScore >= 70 ? 'A' : balanceScore >= 55 ? 'B' : 'C';
  const gradeColor = grade === 'S' ? '#ffcc00' : grade === 'A' ? '#34d399' : grade === 'B' ? '#60a5fa' : '#f87171';

  // SVG helpers
  const CX = 108, CY = 106, R = 78;
  const pt = (i: number, r: number) => {
    const a = Math.PI / 2 - (i * Math.PI * 2) / 6;
    return { x: CX + r * Math.cos(a), y: CY - r * Math.sin(a) };
  };
  const poly = (vals: number[]) => vals.map((v, i) => { const p = pt(i, v * R); return `${p.x},${p.y}`; }).join(' ');

  const hasCurr = currN.some((v) => v > 0);
  const totalVol = Object.values(currVol).reduce((s, v) => s + v, 0) || 1;

  const PERIOD_TABS: Array<['week' | 'month' | 'all', string]> = [
    ['week',  IS_CHINESE ? '近7天' : '7d'],
    ['month', IS_CHINESE ? '近30天' : '30d'],
    ['all',   IS_CHINESE ? '全部' : 'All'],
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="text-xs font-semibold uppercase tracking-[0.1em] opacity-40">
          {IS_CHINESE ? '六边形肌群分布' : 'Muscle Hexagram'}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1">
            {PERIOD_TABS.map(([key, lbl]) => (
              <button key={key} onClick={() => setPeriod(key)}
                className="text-xs px-2.5 py-1 rounded-lg transition-all"
                style={period === key
                  ? { background: 'var(--wc-l3)', color: '#fff', fontWeight: 600 }
                  : { background: 'var(--wt-chip-bg)', opacity: 0.55 }}>
                {lbl}
              </button>
            ))}
          </div>
          {period !== 'all' && (
            <button onClick={() => setShowPrev((p) => !p)}
              className="text-xs px-2.5 py-1 rounded-lg transition-all"
              style={showPrev
                ? { background: 'rgba(99,102,241,0.18)', color: 'var(--wc-l4)', border: '1px solid rgba(99,102,241,0.3)' }
                : { background: 'var(--wt-chip-bg)', opacity: 0.5 }}>
              {IS_CHINESE ? (showPrev ? '隐藏上期' : '对比上期') : (showPrev ? 'Hide prev' : 'vs prev')}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-5 items-start">

        {/* Hexagon SVG */}
        <div className="shrink-0 mx-auto sm:mx-0" style={{ width: 216 }}>
          <svg viewBox="0 0 216 212" width="216" height="212" style={{ overflow: 'visible' }}>
            <defs>
              <radialGradient id="hxFill" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(165,180,252,0.25)" />
                <stop offset="100%" stopColor="rgba(99,102,241,0.07)" />
              </radialGradient>
              <filter id="hxGlow" x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Grid rings (33 / 66 / 100%) */}
            {[0.33, 0.66, 1.0].map((lvl) => (
              <polygon key={lvl} points={poly(Array(6).fill(lvl))} fill="none"
                stroke={lvl === 1.0 ? 'rgba(128,128,128,0.2)' : 'rgba(128,128,128,0.1)'}
                strokeWidth={lvl === 1.0 ? 1 : 0.7}
                strokeDasharray={lvl < 1.0 ? '3 3' : undefined} />
            ))}

            {/* Axis spokes */}
            {HEXA_AXES.map((_, i) => {
              const p = pt(i, R);
              return <line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y}
                stroke="rgba(128,128,128,0.13)" strokeWidth="0.8" />;
            })}

            {/* Previous period ghost */}
            {showPrev && prevN.some((v) => v > 0) && (
              <polygon points={poly(prevN)} fill="rgba(99,102,241,0.05)"
                stroke="rgba(99,102,241,0.35)" strokeWidth="1.2" strokeDasharray="3 2" />
            )}

            {/* Main fill */}
            {hasCurr && (
              <polygon points={poly(currN)} fill="url(#hxFill)"
                stroke="rgba(165,180,252,0.9)" strokeWidth="2"
                filter="url(#hxGlow)"
                style={{ animation: 'slideUp 0.5s ease both' }} />
            )}

            {/* Vertex dots */}
            {hasCurr && currN.map((v, i) => {
              if (v < 0.03) return null;
              const p = pt(i, v * R);
              return (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r={6} fill="rgba(165,180,252,0.12)" />
                  <circle cx={p.x} cy={p.y} r={3.5} fill="rgba(165,180,252,0.95)" />
                </g>
              );
            })}

            {/* Prev period dots */}
            {showPrev && prevN.map((v, i) => {
              if (v < 0.03) return null;
              const p = pt(i, v * R);
              return <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="rgba(99,102,241,0.6)" />;
            })}

            {/* Axis labels */}
            {HEXA_AXES.map(({ label, color }, i) => {
              const p = pt(i, R + 22);
              const anchor = p.x > CX + 5 ? 'start' : p.x < CX - 5 ? 'end' : 'middle';
              return (
                <text key={i} x={p.x} y={p.y} textAnchor={anchor} dominantBaseline="middle"
                  fontSize="10.5" fontWeight={700} fill={color} opacity={0.85}>
                  {label}
                </text>
              );
            })}

            {/* % values at vertices */}
            {hasCurr && currN.map((v, i) => {
              if (v < 0.1) return null;
              const inner = pt(i, v * R - 14);
              const anchor = pt(i, 1).x > CX + 5 ? 'start' : pt(i, 1).x < CX - 5 ? 'end' : 'middle';
              return (
                <text key={i} x={inner.x} y={inner.y} textAnchor={anchor} dominantBaseline="middle"
                  fontSize="8" fontWeight={700} fill="rgba(224,231,255,0.9)">
                  {Math.round(v * 100)}%
                </text>
              );
            })}
          </svg>

          {/* Legend */}
          {showPrev && (
            <div className="flex items-center justify-center gap-4 mt-1" style={{ fontSize: 10, opacity: 0.4 }}>
              <span className="flex items-center gap-1">
                <span style={{ display: 'inline-block', width: 14, height: 2, background: 'rgba(165,180,252,0.9)', borderRadius: 1 }} />
                {IS_CHINESE ? '当前' : 'Current'}
              </span>
              <span className="flex items-center gap-1">
                <span style={{ display: 'inline-block', width: 14, height: 0, borderTop: '1.5px dashed rgba(99,102,241,0.55)' }} />
                {IS_CHINESE ? '上期' : 'Previous'}
              </span>
            </div>
          )}
        </div>

        {/* Right panel: score + axis breakdown */}
        <div className="flex-1 min-w-0 space-y-3">

          {/* Balance grade + score bar */}
          <div className="flex items-center gap-4 rounded-xl px-4 py-3"
            style={{ background: 'var(--wt-chip-bg)', border: '1px solid var(--wo-card-border)' }}>
            <div className="text-center shrink-0" style={{ minWidth: 44 }}>
              <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1, color: gradeColor,
                textShadow: `0 0 12px ${gradeColor}99`,
                animation: 'glowPulse 2.5s ease-in-out infinite' }}>
                {grade}
              </div>
              <div style={{ fontSize: 9, opacity: 0.35, marginTop: 2, letterSpacing: '0.05em' }}>
                {IS_CHINESE ? '均衡度' : 'Balance'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-end gap-1.5 mb-1.5">
                <span style={{ fontSize: 24, fontWeight: 800, lineHeight: 1, color: gradeColor }}>{balanceScore}</span>
                <span style={{ fontSize: 11, opacity: 0.35, marginBottom: 2 }}>/100</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(128,128,128,0.15)' }}>
                <div className="h-full rounded-full" style={{
                  width: `${balanceScore}%`,
                  background: `linear-gradient(90deg, ${gradeColor}77, ${gradeColor})`,
                  transition: 'width 0.7s ease',
                }} />
              </div>
              <div style={{ fontSize: 10, opacity: 0.32, marginTop: 4 }}>
                {grade === 'S' ? (IS_CHINESE ? '训练极均衡，非常出色' : 'Excellent balance')
                  : grade === 'A' ? (IS_CHINESE ? '训练较均衡' : 'Good balance')
                  : grade === 'B' ? (IS_CHINESE ? '部分肌群训练不足' : 'Some muscles undertrained')
                  : (IS_CHINESE ? '训练偏科较严重' : 'Highly imbalanced')}
              </div>
            </div>
          </div>

          {/* Per-axis rows */}
          <div className="space-y-2">
            {HEXA_AXES.map(({ key, label, color }, i) => {
              const v    = currN[i];
              const pv   = prevN[i];
              const sharePct = Math.round((currVol[key] / totalVol) * 100);
              const trend = showPrev && pv > 0 ? Math.round(((v - pv) / pv) * 100) : null;
              return (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: color, display: 'inline-block' }} />
                  <span className="w-10 shrink-0 opacity-65 font-medium">{label}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(128,128,128,0.12)' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${Math.round(v * 100)}%`,
                      background: `linear-gradient(90deg, ${color}66, ${color})`,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <span className="w-7 text-right tabular-nums" style={{ opacity: 0.4 }}>{sharePct}%</span>
                  {trend !== null && (
                    <span className="w-11 text-right tabular-nums font-semibold"
                      style={{ color: trend > 5 ? '#34d399' : trend < -5 ? '#f87171' : 'rgba(128,128,128,0.45)' }}>
                      {trend > 0 ? '+' : ''}{trend}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MuscleHexPanel;
