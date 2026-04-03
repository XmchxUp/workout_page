import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { WorkoutSession } from '@/types/workout';
import {
  getExerciseMuscles,
  MUSCLE_LABELS_CN,
  MUSCLE_CHART_COLORS,
  PUSH_MUSCLES,
  PULL_MUSCLES,
  LEGS_MUSCLES,
  CORE_MUSCLES,
} from '@/utils/workoutMuscles';
import { WARMUP_NAMES, WORKING_SET_TYPES } from '@/utils/workoutCalcs';
import { IS_CHINESE, TOOLTIP_STYLE } from './WorkoutUI';

type MDistPeriod = 'week' | 'month' | 'year';

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const MuscleDistributionPanel = ({ workouts }: { workouts: WorkoutSession[] }) => {
  const [period, setPeriod] = useState<MDistPeriod>('month');

  const getBucket = (dateStr: string, p: MDistPeriod): string => {
    if (p === 'year')  return dateStr.slice(0, 4);
    if (p === 'month') return dateStr.slice(0, 7);
    const d = new Date(dateStr);
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const wk = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(wk).padStart(2, '00')}`;
  };
  const fmtBucket = (key: string, p: MDistPeriod) => {
    if (p === 'year')  return key;
    if (p === 'month') return IS_CHINESE ? `${parseInt(key.slice(5, 7))}月` : MONTH_SHORT[parseInt(key.slice(5, 7)) - 1];
    return key.slice(5); // "W03"
  };

  const { chartData, totals } = useMemo(() => {
    const buckets: Record<string, Record<string, number>> = {};
    const active = new Set<string>();
    workouts.forEach((w) => {
      const key = getBucket(w.start_time.slice(0, 10), period);
      if (!buckets[key]) buckets[key] = {};
      w.exercises.forEach((ex) => {
        if (WARMUP_NAMES.has(ex.name.toLowerCase())) return;
        const muscles = getExerciseMuscles(ex.name);
        if (!muscles.length) return;
        const sets = ex.sets.filter((s) => WORKING_SET_TYPES.has(s.type));
        const vol = sets.reduce((s, set) => s + (set.weight_kg ?? 0) * (set.reps ?? 0), 0);
        const contrib = vol > 0 ? vol / 1000 : sets.length * 0.05;
        muscles.forEach((m) => { active.add(m); buckets[key][m] = (buckets[key][m] || 0) + contrib; });
      });
    });
    const limit = period === 'year' ? 10 : 12;
    const keys = Object.keys(buckets).sort().slice(-limit);
    const chartData = keys.map((key) => ({
      label: fmtBucket(key, period),
      ...Object.fromEntries([...active].map((m) => [m, Math.round((buckets[key][m] || 0) * 10) / 10])),
    }));
    const totals: Record<string, number> = {};
    Object.values(buckets).forEach((b) => Object.entries(b).forEach(([m, v]) => { totals[m] = (totals[m] || 0) + v; }));
    return { chartData, totals };
  }, [workouts, period]);

  // Trend: recent half vs earlier half
  const trends = useMemo(() => {
    if (chartData.length < 4) return {} as Record<string, number>;
    const half = Math.floor(chartData.length / 2);
    const sum = (arr: typeof chartData, m: string) => arr.reduce((s, d) => s + (((d as unknown as Record<string, number>)[m]) || 0), 0);
    const result: Record<string, number> = {};
    Object.keys(MUSCLE_CHART_COLORS).forEach((m) => {
      const e = sum(chartData.slice(0, half), m);
      const r = sum(chartData.slice(half), m);
      if (e > 0) result[m] = Math.round(((r - e) / e) * 100);
    });
    return result;
  }, [chartData]);

  // Push/Pull/Legs/Core balance
  const balance = useMemo(() => {
    const push = PUSH_MUSCLES.reduce((s, m) => s + (totals[m] || 0), 0);
    const pull = PULL_MUSCLES.reduce((s, m) => s + (totals[m] || 0), 0);
    const legs = LEGS_MUSCLES.reduce((s, m) => s + (totals[m] || 0), 0);
    const core = CORE_MUSCLES.reduce((s, m) => s + (totals[m] || 0), 0);
    const total = push + pull + legs + core || 1;
    return { push, pull, legs, core, total, ppRatio: pull > 0 ? push / pull : null };
  }, [totals]);

  // Muscles with zero volume in this period
  const neglected = useMemo(() =>
    Object.keys(MUSCLE_CHART_COLORS)
      .filter((m) => !totals[m])
      .map((m) => IS_CHINESE ? (MUSCLE_LABELS_CN[m] ?? m) : m),
    [totals]);

  const activeMuscles = Object.keys(MUSCLE_CHART_COLORS).filter((m) => totals[m] > 0);
  if (chartData.length === 0) return null;

  const pct = (v: number) => Math.round((v / balance.total) * 100);
  const totalVol = Object.values(totals).reduce((s, v) => s + v, 0) || 1;

  const PERIOD_TABS: Array<[MDistPeriod, string]> = [
    ['week',  IS_CHINESE ? '按周' : 'Weekly'],
    ['month', IS_CHINESE ? '按月' : 'Monthly'],
    ['year',  IS_CHINESE ? '按年' : 'Yearly'],
  ];

  return (
    <div>
      {/* Header + period tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-semibold uppercase tracking-[0.1em] opacity-40">
          {IS_CHINESE ? '肌群分布趋势' : 'Muscle Distribution'}
        </div>
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
      </div>

      {/* Stacked bar chart */}
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" />
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'currentColor', opacity: 0.4 }} />
          <YAxis tick={{ fontSize: 9, fill: 'currentColor', opacity: 0.35 }} unit="t" />
          <Tooltip contentStyle={TOOLTIP_STYLE}
            formatter={(v: number, name: string) =>
              [`${v}t`, IS_CHINESE ? (MUSCLE_LABELS_CN[name] ?? name) : name]} />
          {activeMuscles.map((m, i) => (
            <Bar key={m} dataKey={m} stackId="a" fill={MUSCLE_CHART_COLORS[m]} opacity={0.88}
              radius={i === activeMuscles.length - 1 ? [2, 2, 0, 0] : undefined} />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* Three-column analysis section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5 pt-4" style={{ borderTop: '1px solid var(--wo-section-line)' }}>

        {/* Column 1: Push / Pull / Legs / Core balance */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider opacity-35 mb-3">
            {IS_CHINESE ? '训练平衡' : 'Balance'}
          </div>
          <div className="space-y-2.5">
            {([
              { lbl: IS_CHINESE ? '推(Push)' : 'Push', val: balance.push, color: '#a855f7' },
              { lbl: IS_CHINESE ? '拉(Pull)' : 'Pull', val: balance.pull, color: '#6366f1' },
              { lbl: IS_CHINESE ? '腿部'     : 'Legs', val: balance.legs, color: '#ec4899' },
              { lbl: IS_CHINESE ? '核心'     : 'Core', val: balance.core, color: '#06b6d4' },
            ] as const).map(({ lbl, val, color }) => (
              <div key={lbl} className="flex items-center gap-2 text-xs">
                <span className="w-14 shrink-0 opacity-55 text-right">{lbl}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--wt-chip-bg)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct(val)}%`, background: color, transition: 'width 0.4s' }} />
                </div>
                <span className="w-7 text-right opacity-40 tabular-nums">{pct(val)}%</span>
              </div>
            ))}
          </div>
          {balance.ppRatio !== null && (
            <div className="mt-3 text-xs rounded-lg px-2.5 py-1.5"
              style={{
                background: balance.ppRatio > 1.3 || balance.ppRatio < 0.75 ? 'rgba(239,68,68,0.07)' : 'rgba(34,197,94,0.07)',
                border: `1px solid ${balance.ppRatio > 1.3 || balance.ppRatio < 0.75 ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.15)'}`,
              }}>
              <span className="opacity-50">{IS_CHINESE ? '推拉比 ' : 'P/P ratio '}</span>
              <span className="font-semibold">{balance.ppRatio.toFixed(2)}</span>
              <span className="opacity-40 ml-1.5">
                {balance.ppRatio > 1.3 ? (IS_CHINESE ? '⚠ 多推少拉' : '⚠ Too much push')
                  : balance.ppRatio < 0.75 ? (IS_CHINESE ? '⚠ 多拉少推' : '⚠ Too much pull')
                  : (IS_CHINESE ? '✓ 均衡' : '✓ Balanced')}
              </span>
            </div>
          )}
        </div>

        {/* Column 2: Trend arrows (recent vs earlier) */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider opacity-35 mb-3">
            {IS_CHINESE ? '趋势对比 (近/早)' : 'Trend (Recent vs Prior)'}
          </div>
          <div className="space-y-1.5">
            {Object.entries(trends)
              .filter(([m]) => totals[m] > 0)
              .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
              .slice(0, 7)
              .map(([m, t]) => (
                <div key={m} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: MUSCLE_CHART_COLORS[m], display: 'inline-block' }} />
                  <span className="flex-1 opacity-60">{IS_CHINESE ? (MUSCLE_LABELS_CN[m] ?? m) : m}</span>
                  <span className="font-semibold tabular-nums w-12 text-right"
                    style={{ color: t > 0 ? '#34d399' : '#f87171' }}>
                    {t > 0 ? '↑' : '↓'}{Math.abs(t)}%
                  </span>
                </div>
              ))}
          </div>
          {Object.keys(trends).length === 0 && (
            <div className="text-xs opacity-30">{IS_CHINESE ? '数据不足（需至少4个周期）' : 'Need ≥4 periods'}</div>
          )}
        </div>

        {/* Column 3: Insights & suggestions */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider opacity-35 mb-3">
            {IS_CHINESE ? '训练建议' : 'Insights'}
          </div>
          <div className="space-y-2 text-xs">
            {/* Top muscle */}
            {(() => {
              const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
              if (!top) return null;
              const topPct = Math.round((top[1] / totalVol) * 100);
              return (
                <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <span className="opacity-45">{IS_CHINESE ? '训练最多 · ' : 'Most trained · '}</span>
                  <span className="font-semibold" style={{ color: 'var(--wc-l4)' }}>
                    {IS_CHINESE ? (MUSCLE_LABELS_CN[top[0]] ?? top[0]) : top[0]}
                  </span>
                  <span className="opacity-35 ml-1">{topPct}%</span>
                </div>
              );
            })()}
            {/* Neglected */}
            {neglected.length > 0 && (
              <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.2)' }}>
                <div style={{ color: 'rgba(234,179,8,0.85)' }} className="font-semibold mb-0.5">
                  ⚠ {IS_CHINESE ? '缺乏数据' : 'No data'}
                </div>
                <div className="opacity-50">{neglected.slice(0, 5).join(' · ')}</div>
              </div>
            )}
            {/* Push/pull imbalance advisory */}
            {balance.ppRatio !== null && balance.ppRatio > 1.3 && (
              <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <span style={{ color: 'rgba(239,68,68,0.85)' }}>
                  {IS_CHINESE ? '建议增加背部/二头训练' : 'Add more back/biceps'}
                </span>
              </div>
            )}
            {/* Leg ratio advisory */}
            {balance.legs / balance.total < 0.15 && balance.total > 0 && (
              <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <span style={{ color: 'rgba(239,68,68,0.85)' }}>
                  {IS_CHINESE ? '建议增加腿部训练比例' : 'Add more leg work'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Color legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-4 pt-3" style={{ borderTop: '1px solid var(--wo-section-line)' }}>
        {activeMuscles.map((m) => (
          <div key={m} className="flex items-center gap-1 text-xs opacity-50">
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: MUSCLE_CHART_COLORS[m], display: 'inline-block' }} />
            {IS_CHINESE ? (MUSCLE_LABELS_CN[m] ?? m) : m}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MuscleDistributionPanel;
