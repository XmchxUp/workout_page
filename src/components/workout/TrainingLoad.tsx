import { useMemo } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { WorkoutSession } from '@/types/workout';
import { calcTrainingLoadSeries } from '@/utils/workoutCalcs';
import { IS_CHINESE, TOOLTIP_STYLE } from './WorkoutUI';

const TrainingLoad = ({ workouts }: { workouts: WorkoutSession[] }) => {
  const data = useMemo(() =>
    calcTrainingLoadSeries(workouts).map((d) => ({
      ...d,
      date: d.date.slice(5).replace('-', '/'),
    })),
  [workouts]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold opacity-50">
          {IS_CHINESE ? '训练负荷 ATL/CTL/TSB' : 'Training Load'}
        </div>
        <div className="flex gap-3 text-xs opacity-60">
          <span style={{ color: 'var(--wo-fitness)' }}>── CTL 体能</span>
          <span style={{ color: 'var(--wo-fatigue)' }}>── ATL 疲劳</span>
          <span style={{ color: 'var(--wo-form)' }}>▪ TSB 状态</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--wo-grid)" />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, opacity: 0.35 }}
            tickLine={false}
            axisLine={false}
            interval={Math.floor(data.length / 6)}
          />
          <YAxis tick={{ fontSize: 9, opacity: 0.35 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v: number, name: string) => {
              const labels: Record<string, string> = {
                ctl: '体能(CTL)',
                atl: '疲劳(ATL)',
                tsb: '状态(TSB)',
                vol: '当日出力',
              };
              return [`${v}${name === 'vol' ? ' kg' : ''}`, labels[name] ?? name];
            }}
          />
          <ReferenceLine y={0} stroke="var(--wo-section-line)" />
          <Area
            dataKey="ctl"
            stroke="var(--wo-fitness)"
            fill="var(--wo-accent-soft-bg)"
            strokeWidth={2}
            dot={false}
          />
          <Line dataKey="atl" stroke="var(--wo-fatigue)" strokeWidth={1.5} dot={false} />
          <Bar
            dataKey="tsb"
            fill="var(--wo-form)"
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex justify-around mt-3">
        {[
          {
            label: IS_CHINESE ? '当前体能' : 'Fitness',
            val: data[data.length - 1]?.ctl ?? 0,
            color: 'var(--wo-fitness)',
          },
          {
            label: IS_CHINESE ? '当前疲劳' : 'Fatigue',
            val: data[data.length - 1]?.atl ?? 0,
            color: 'var(--wo-fatigue)',
          },
          {
            label: IS_CHINESE ? '当前状态' : 'Form',
            val: data[data.length - 1]?.tsb ?? 0,
            color: (data[data.length - 1]?.tsb ?? 0) >= 0 ? 'var(--wo-form)' : 'var(--wo-warning)',
          },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>
              {item.val > 0 ? '+' : ''}
              {item.val}
            </div>
            <div style={{ fontSize: 10, opacity: 0.4 }}>{item.label}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, opacity: 0.25, marginTop: 8, textAlign: 'center' }}>
        TSB &gt; 0 状态好 · TSB &lt; 0 疲劳 · 参考 Strava PMC 模型
      </div>
    </div>
  );
};

export default TrainingLoad;
