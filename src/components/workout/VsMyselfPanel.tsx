import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { WorkoutSession } from '@/types/workout';
import { calcE1RM, WORKING_SET_TYPES, toLocalDate } from '@/utils/workoutCalcs';
import { IS_CHINESE, PanelLabel, TOOLTIP_STYLE } from './WorkoutUI';

type Period = 30 | 60 | 90;

const PERIODS: Period[] = [30, 60, 90];

const getRange = (daysBack: number) => {
  const end = new Date();
  const start = new Date(end.getTime() - daysBack * 86400000);
  return { start: toLocalDate(start), end: toLocalDate(end) };
};

const getLastYearRange = (daysBack: number) => {
  const end = new Date(Date.now() - 365 * 86400000);
  const start = new Date(end.getTime() - daysBack * 86400000);
  return { start: toLocalDate(start), end: toLocalDate(end) };
};

const periodStats = (sessions: WorkoutSession[]) => {
  const count = sessions.length;
  const volume = sessions.reduce((s, w) => s + w.total_volume_kg, 0);
  const sets = sessions.reduce((s, w) => s + w.total_sets, 0);
  let maxE1rm = 0;
  sessions.forEach((w) => {
    w.exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (WORKING_SET_TYPES.has(s.type) && s.weight_kg && s.reps) {
          const e1rm = calcE1RM(s.weight_kg, s.reps);
          if (e1rm > maxE1rm) maxE1rm = e1rm;
        }
      });
    });
  });
  return { count, volume: Math.round(volume), sets, maxE1rm };
};

export default function VsMyselfPanel({ workouts }: { workouts: WorkoutSession[] }) {
  const [period, setPeriod] = useState<Period>(30);

  const { now, past } = useMemo(() => {
    const nowRange = getRange(period);
    const pastRange = getLastYearRange(period);
    const nowSessions = workouts.filter((w) => {
      const d = w.start_time.slice(0, 10);
      return d >= nowRange.start && d <= nowRange.end;
    });
    const pastSessions = workouts.filter((w) => {
      const d = w.start_time.slice(0, 10);
      return d >= pastRange.start && d <= pastRange.end;
    });
    return { now: periodStats(nowSessions), past: periodStats(pastSessions) };
  }, [workouts, period]);

  const metrics = [
    {
      key: 'count',
      label: IS_CHINESE ? '训练次数' : 'Sessions',
      now: now.count,
      past: past.count,
      unit: '',
    },
    {
      key: 'volume',
      label: IS_CHINESE ? '总出力' : 'Volume',
      now: Math.round(now.volume / 100) / 10,
      past: Math.round(past.volume / 100) / 10,
      unit: IS_CHINESE ? '百kg' : '×100kg',
    },
    {
      key: 'sets',
      label: IS_CHINESE ? '总组数' : 'Sets',
      now: now.sets,
      past: past.sets,
      unit: '',
    },
    {
      key: 'e1rm',
      label: IS_CHINESE ? '最高 e1RM' : 'Peak e1RM',
      now: now.maxE1rm,
      past: past.maxE1rm,
      unit: 'kg',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <PanelLabel style={{ marginBottom: 0 }}>
          {IS_CHINESE ? '与过去的自己对战' : 'VS My Past Self'}
        </PanelLabel>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className="text-xs px-2 py-0.5 rounded-full transition-all"
              style={{
                background: period === p ? 'rgba(99,102,241,0.25)' : 'rgba(128,128,128,0.1)',
                color: period === p ? 'var(--wc-l3)' : undefined,
                border: period === p ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
              }}>
              {p}d
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--wo-chart-a)' }} />
          <span className="opacity-60">{IS_CHINESE ? `近 ${period} 天` : `Last ${period}d`}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--wo-chart-b)' }} />
          <span className="opacity-60">{IS_CHINESE ? '去年同期' : 'Same period last year'}</span>
        </div>
      </div>

      <div className="space-y-3">
        {metrics.map(({ key, label, now: nowVal, past: pastVal, unit }) => {
          const pct = pastVal > 0 ? Math.round(((nowVal - pastVal) / pastVal) * 100) : 0;
          const maxVal = Math.max(nowVal, pastVal, 0.01);
          const chartData = [
            { name: IS_CHINESE ? '现在' : 'Now', value: nowVal, fill: 'var(--wo-chart-a)' },
            { name: IS_CHINESE ? '去年' : 'Past', value: pastVal, fill: 'var(--wo-chart-b)' },
          ];
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 10, opacity: 0.5 }}>{label}</span>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 11, fontWeight: 600, color: pct > 0 ? 'var(--wo-positive)' : pct < 0 ? 'var(--wo-negative)' : undefined }}>
                    {pct > 0 ? `↑${pct}%` : pct < 0 ? `↓${Math.abs(pct)}%` : '—'}
                  </span>
                  <span style={{ fontSize: 11, opacity: 0.6 }}>{nowVal}{unit}</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={28}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[0, maxVal * 1.15]} hide />
                  <YAxis type="category" dataKey="name" hide width={0} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v}${unit}`, '']} />
                  <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={10}>
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}
