import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, ReferenceArea,
} from 'recharts';
import type { WorkoutSession } from '@/types/workout';
import { WARMUP_NAMES, WORKING_SET_TYPES } from '@/utils/workoutCalcs';
import { IS_CHINESE, TOOLTIP_STYLE } from './WorkoutUI';

export default function FatigueCurve({ workouts }: { workouts: WorkoutSession[] }) {
  const { data, goldenEnd } = useMemo(() => {
    // For each session, compute relative exercise volume vs session's first exercise
    const positions: Record<number, number[]> = {}; // position (1-based) → relative vol values

    workouts.forEach((w) => {
      const exs = w.exercises.filter((e) => {
        if (WARMUP_NAMES.has(e.name.toLowerCase())) return false;
        const hasWeight = e.sets.some((s) => WORKING_SET_TYPES.has(s.type) && s.weight_kg && s.reps);
        return hasWeight;
      });
      if (exs.length < 2) return;

      const vols = exs.map((ex) => {
        let v = 0;
        ex.sets.forEach((s) => {
          if (WORKING_SET_TYPES.has(s.type) && s.weight_kg && s.reps)
            v += s.weight_kg * s.reps;
        });
        return v;
      });

      const baseVol = vols[0];
      if (baseVol <= 0) return;

      vols.forEach((vol, i) => {
        const pos = i + 1;
        const rel = Math.round((vol / baseVol) * 100);
        if (!positions[pos]) positions[pos] = [];
        positions[pos].push(rel);
      });
    });

    // Build chart data from positions 1-8
    const chartData = Array.from({ length: 8 }, (_, i) => {
      const pos = i + 1;
      const vals = positions[pos] ?? [];
      if (vals.length === 0) return null;
      const avg = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
      const sorted = [...vals].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      return { pos: `${IS_CHINESE ? '第' : '#'}${pos}`, avg, median, n: vals.length };
    }).filter(Boolean) as Array<{ pos: string; avg: number; median: number; n: number }>;

    // Find golden window: consecutive positions where avg >= 85%
    let goldenEnd = 1;
    for (let i = 0; i < chartData.length; i++) {
      if (chartData[i].avg >= 85) goldenEnd = i + 1;
      else break;
    }

    return { data: chartData, goldenEnd };
  }, [workouts]);

  if (data.length < 2) return (
    <div className="text-xs opacity-30 text-center py-4">
      {IS_CHINESE ? '需要更多训练数据' : 'Need more training sessions'}
    </div>
  );

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.1em] opacity-40 mb-1">
        {IS_CHINESE ? '组内疲劳曲线' : 'Intra-Session Fatigue'}
      </div>
      <div style={{ fontSize: 9, opacity: 0.28, marginBottom: 10 }}>
        {IS_CHINESE
          ? `基于 ${workouts.length} 次训练 · 每个动作出力相对第一个动作的百分比`
          : `Based on ${workouts.length} sessions · Volume relative to 1st exercise`}
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="var(--wo-series-2)" stopOpacity={0.24} />
              <stop offset="95%" stopColor="var(--wo-series-2)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--wo-grid)" />
          {/* Golden window */}
          {goldenEnd > 0 && (
            <ReferenceArea
              x1={data[0].pos} x2={data[Math.min(goldenEnd - 1, data.length - 1)].pos}
              fill="var(--wo-positive-bg)"
              stroke="color-mix(in srgb, var(--wo-positive) 22%, transparent)"
              strokeDasharray="4 2"
              label={{ value: IS_CHINESE ? '黄金窗口' : 'Golden', fontSize: 9, fill: 'var(--wo-positive)', opacity: 0.6, position: 'insideTopLeft' }}
            />
          )}
          <ReferenceLine y={100} stroke="var(--wo-section-line)" strokeDasharray="4 2" />
          <ReferenceLine y={85} stroke="color-mix(in srgb, var(--wo-warning) 28%, transparent)" strokeDasharray="3 3" />
          <XAxis dataKey="pos" tick={{ fontSize: 9, opacity: 0.4 }} axisLine={false} tickLine={false} />
          <YAxis domain={[50, 110]} tick={{ fontSize: 9, opacity: 0.35 }} unit="%" axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE}
            formatter={(v: number, key: string) => [
              `${v}%`,
              key === 'avg' ? (IS_CHINESE ? '平均' : 'Avg') : (IS_CHINESE ? '中位' : 'Median'),
            ]}
            labelFormatter={(label) => `${IS_CHINESE ? '动作位置' : 'Position'} ${label}`}
          />
          <Area type="monotone" dataKey="avg" stroke="var(--wo-series-2)" strokeWidth={2}
            fill="url(#fatGrad)" dot={{ r: 3, fill: 'var(--wo-series-2)' }} />
          <Area type="monotone" dataKey="median" stroke="var(--wo-accent-line-soft)" strokeWidth={1.5}
            strokeDasharray="4 2" fill="none" dot={false} />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-2 flex-wrap" style={{ fontSize: 9, opacity: 0.4 }}>
        <span><span style={{ color: 'var(--wo-series-2)' }}>——</span> {IS_CHINESE ? '平均' : 'Avg'}</span>
        <span><span style={{ color: 'var(--wo-accent-line-soft)' }}>- -</span> {IS_CHINESE ? '中位' : 'Median'}</span>
        <span style={{ color: 'var(--wo-positive)' }}>■ {IS_CHINESE ? '黄金窗口 (>85%)' : 'Golden window (>85%)'}</span>
        <span style={{ color: 'var(--wo-warning)' }}>- - 85%</span>
      </div>
    </div>
  );
}
