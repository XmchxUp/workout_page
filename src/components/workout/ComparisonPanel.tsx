import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { WorkoutSession } from '@/types/workout';
import { formatDuration } from '@/hooks/useWorkouts';
import { IS_CHINESE } from './WorkoutUI';
import { toLocalDate } from '@/utils/workoutCalcs';

type Period = 'month' | 'year' | 'quarter';

const TOOLTIP_STYLE: React.CSSProperties = {
  background: 'var(--wo-card-bg)',
  border: '1px solid var(--wo-card-border)',
  borderRadius: 10,
  fontSize: 11,
};

const getPeriodDates = (
  period: Period,
): { curr: [string, string]; prev: [string, string]; label: [string, string] } => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed

  if (period === 'month') {
    const currStart = toLocalDate(new Date(y, m, 1));
    const currEnd = toLocalDate(now);
    const prevStart = toLocalDate(new Date(y, m - 1, 1));
    const prevEnd = toLocalDate(new Date(y, m, 0));
    const monthNames = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月',
    ];
    return {
      curr: [currStart, currEnd],
      prev: [prevStart, prevEnd],
      label: [monthNames[m], monthNames[(m - 1 + 12) % 12]],
    };
  } else if (period === 'quarter') {
    const qStart = toLocalDate(new Date(y, Math.floor(m / 3) * 3, 1));
    const currEnd = toLocalDate(now);
    const pqStart = toLocalDate(new Date(y, Math.floor(m / 3) * 3 - 3, 1));
    const pqEnd = toLocalDate(new Date(y, Math.floor(m / 3) * 3, 0));
    return {
      curr: [qStart, currEnd],
      prev: [pqStart, pqEnd],
      label: [`Q${Math.floor(m / 3) + 1}`, `Q${Math.floor(m / 3)}`],
    };
  } else {
    return {
      curr: [`${y}-01-01`, toLocalDate(now)],
      prev: [`${y - 1}-01-01`, `${y - 1}-12-31`],
      label: [`${y}年`, `${y - 1}年`],
    };
  }
};

const calcPeriodStats = (workouts: WorkoutSession[], start: string, end: string) => {
  const ws = workouts.filter(
    (w) => w.start_time.slice(0, 10) >= start && w.start_time.slice(0, 10) <= end,
  );
  return {
    sessions: ws.length,
    volume: ws.reduce((s, w) => s + w.total_volume_kg, 0),
    sets: ws.reduce((s, w) => s + w.total_sets, 0),
    duration: ws.reduce((s, w) => s + w.duration_seconds, 0),
  };
};

const Delta = ({ curr, prev }: { curr: number; prev: number; unit?: string }) => {
  if (prev === 0) return null;
  const pct = Math.round(((curr - prev) / prev) * 100);
  const up = pct > 0;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: up ? '#22c55e' : '#ef4444', marginLeft: 4 }}>
      {up ? '↑' : '↓'}
      {Math.abs(pct)}%
    </span>
  );
};

const ComparisonPanel = ({ workouts }: { workouts: WorkoutSession[] }) => {
  const [period, setPeriod] = useState<Period>('month');

  const { curr: currRange, prev: prevRange, label } = useMemo(() => getPeriodDates(period), [period]);
  const currStats = useMemo(
    () => calcPeriodStats(workouts, currRange[0], currRange[1]),
    [workouts, currRange],
  );
  const prevStats = useMemo(
    () => calcPeriodStats(workouts, prevRange[0], prevRange[1]),
    [workouts, prevRange],
  );

  const barData = [
    {
      name: IS_CHINESE ? '训练次数' : 'Sessions',
      curr: currStats.sessions,
      prev: prevStats.sessions,
    },
    {
      name: IS_CHINESE ? '总组数' : 'Sets',
      curr: Math.round(currStats.sets / 10),
      prev: Math.round(prevStats.sets / 10),
      unit: '×10',
    },
    {
      name: IS_CHINESE ? '出力(百kg)' : 'Vol/100',
      curr: Math.round(currStats.volume / 100),
      prev: Math.round(prevStats.volume / 100),
    },
  ];

  const tabs: Array<{ key: Period; label: string }> = [
    { key: 'month', label: IS_CHINESE ? '月' : 'Month' },
    { key: 'quarter', label: IS_CHINESE ? '季' : 'Quarter' },
    { key: 'year', label: IS_CHINESE ? '年' : 'Year' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold uppercase tracking-[0.1em] opacity-40">
          {IS_CHINESE ? '训练对比' : 'Comparison'}
        </div>
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setPeriod(t.key)}
              style={{
                fontSize: 11,
                padding: '2px 10px',
                borderRadius: 99,
                background: period === t.key ? 'var(--wc-l3)' : 'transparent',
                color: period === t.key ? '#fff' : 'inherit',
                border: `1px solid ${period === t.key ? 'transparent' : 'rgba(128,128,128,0.2)'}`,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Period labels */}
      <div className="flex gap-3 mb-3 text-xs">
        <span style={{ color: '#6366f1', fontWeight: 600 }}>▪ {label[0]}</span>
        <span style={{ opacity: 0.4, fontWeight: 600 }}>▪ {label[1]}</span>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          {
            label: IS_CHINESE ? '训练次数' : 'Sessions',
            c: currStats.sessions,
            p: prevStats.sessions,
            fmt: (v: number) => String(v),
          },
          {
            label: IS_CHINESE ? '总出力' : 'Volume',
            c: currStats.volume,
            p: prevStats.volume,
            fmt: (v: number) => `${(v / 1000).toFixed(1)}t`,
          },
          {
            label: IS_CHINESE ? '总组数' : 'Sets',
            c: currStats.sets,
            p: prevStats.sets,
            fmt: (v: number) => String(v),
          },
          {
            label: IS_CHINESE ? '训练时长' : 'Duration',
            c: currStats.duration,
            p: prevStats.duration,
            fmt: (v: number) => formatDuration(v),
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{ background: 'rgba(128,128,128,0.05)', borderRadius: 10, padding: '8px 12px' }}
          >
            <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              {item.fmt(item.c)}
              <Delta curr={item.c} prev={item.p} />
            </div>
            <div style={{ fontSize: 10, opacity: 0.3 }}>
              {IS_CHINESE ? '上期：' : 'Prev: '}
              {item.fmt(item.p)}
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart comparison */}
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 40 }}>
          <XAxis
            type="number"
            tick={{ fontSize: 9, opacity: 0.3 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 10, opacity: 0.5 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="curr" name={label[0]} fill="#6366f1" radius={[0, 4, 4, 0]} barSize={8} />
          <Bar
            dataKey="prev"
            name={label[1]}
            fill="rgba(128,128,128,0.25)"
            radius={[0, 4, 4, 0]}
            barSize={8}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComparisonPanel;
