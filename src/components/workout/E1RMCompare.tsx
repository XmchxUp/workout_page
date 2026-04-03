import { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { WorkoutSession } from '@/types/workout';
import { translateExercise } from '@/utils/exerciseTranslations';
import { isAssisted, calcE1RM, WARMUP_NAMES, WORKING_SET_TYPES } from '@/utils/workoutCalcs';
import { IS_CHINESE } from './WorkoutUI';

const LINE_COLORS = [
  'var(--wo-series-1)', 'var(--wo-series-2)', 'var(--wo-series-3)', 'var(--wo-series-4)',
  'var(--wo-series-5)', 'var(--wo-series-6)', 'var(--wo-series-7)', 'var(--wo-series-8)',
];

const TOOLTIP_STYLE: React.CSSProperties = {
  background: 'var(--wo-card-bg)',
  border: '1px solid var(--wo-card-border)',
  borderRadius: 10,
  fontSize: 12,
};

const E1RMCompare = ({ workouts }: { workouts: WorkoutSession[] }) => {
  // Find top exercises by appearance count
  const topExercises = useMemo(() => {
    const freq: Record<string, number> = {};
    workouts.forEach((w) => {
      w.exercises.forEach((ex) => {
        if (WARMUP_NAMES.has(ex.name.toLowerCase())) return;
        const hasSets = ex.sets.some((s) => WORKING_SET_TYPES.has(s.type) && s.weight_kg && s.weight_kg > 0);
        if (!hasSets) return;
        freq[ex.name] = (freq[ex.name] || 0) + 1;
      });
    });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([name]) => name);
  }, [workouts]);

  const [selected, setSelected] = useState<string[]>(() => topExercises.slice(0, 3));

  // Update selected when topExercises changes
  useEffect(() => {
    setSelected(topExercises.slice(0, 3));
  }, [topExercises]);

  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : prev.length < 4 ? [...prev, name] : prev
    );
  };

  // Build time series: per date, max e1RM per selected exercise
  const chartData = useMemo(() => {
    if (selected.length === 0) return [];
    const byDate: Record<string, Record<string, number>> = {};
    [...workouts].sort((a, b) => a.start_time.localeCompare(b.start_time)).forEach((w) => {
      const date = w.start_time.slice(0, 10);
      w.exercises.forEach((ex) => {
        if (!selected.includes(ex.name)) return;
        const assisted = isAssisted(ex.name);
        ex.sets.forEach((s) => {
          if (!WORKING_SET_TYPES.has(s.type)) return;
          if (!s.weight_kg || !s.reps) return;
          const e1rm = Math.round(calcE1RM(s.weight_kg, s.reps));
          if (!byDate[date]) byDate[date] = {};
          // For assisted exercises: lower e1RM = less assistance = harder = progress
          if (assisted) {
            byDate[date][ex.name] = Math.min(byDate[date][ex.name] ?? Infinity, e1rm);
          } else {
            byDate[date][ex.name] = Math.max(byDate[date][ex.name] ?? 0, e1rm);
          }
        });
      });
    });
    // Forward fill: carry last known e1RM for each exercise
    const dates = Object.keys(byDate).sort();
    const last: Record<string, number> = {};
    return dates.map((date) => {
      const row: Record<string, number | string> = { date: date.slice(5) }; // MM-DD
      selected.forEach((ex) => {
        if (byDate[date][ex]) last[ex] = byDate[date][ex];
        if (last[ex]) row[ex] = last[ex];
      });
      return row;
    });
  }, [workouts, selected]);

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.1em] opacity-40 mb-3">
        {IS_CHINESE ? 'e1RM 多动作对比' : 'e1RM Comparison'}
      </div>
      {/* Exercise selector chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {topExercises.map((name) => {
          const sel = selected.includes(name);
          const color = LINE_COLORS[selected.indexOf(name) % LINE_COLORS.length] || 'var(--wo-axis-text)';
          return (
            <button
              key={name}
              onClick={() => toggle(name)}
              style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 99,
                border: `1px solid ${sel ? color : 'rgba(128,128,128,0.2)'}`,
                background: sel ? color + '20' : 'transparent',
                color: sel ? color : 'inherit',
                cursor: selected.length >= 4 && !sel ? 'not-allowed' : 'pointer',
                opacity: selected.length >= 4 && !sel ? 0.4 : 1,
                transition: 'all 0.15s',
                fontWeight: sel ? 600 : 400,
              }}
            >
              {translateExercise(name)}
            </button>
          );
        })}
      </div>
      {selected.length === 0 ? (
        <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3, fontSize: 13 }}>
          {IS_CHINESE ? '选择动作查看对比' : 'Select exercises to compare'}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, opacity: 0.4 }} tickLine={false} axisLine={false}
              interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, opacity: 0.4 }} tickLine={false} axisLine={false}
              tickFormatter={(v) => `${v}kg`} width={46} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ opacity: 0.5, marginBottom: 4 }}
              formatter={(v: number, name: string) => [`${v} kg`, translateExercise(name)]} />
            {selected.map((ex, i) => (
              <Line
                key={ex}
                dataKey={ex}
                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
      <div style={{ fontSize: 10, opacity: 0.3, marginTop: 6, textAlign: 'right' }}>
        {IS_CHINESE ? '最多同时对比4个动作' : 'Compare up to 4 exercises'}
      </div>
    </div>
  );
};

export default E1RMCompare;
