import { useMemo } from 'react';
import type { WorkoutSession } from '@/types/workout';
import { getExerciseMuscles } from '@/utils/workoutMuscles';
import { toLocalDate } from '@/utils/workoutCalcs';
import { IS_CHINESE } from './WorkoutUI';

// RP-based volume landmarks (sets/week)
const LANDMARKS: Record<string, { label: string; labelCN: string; mev: number; mavLo: number; mavHi: number; mrv: number; color: string }> = {
  chest:      { label: 'Chest',      labelCN: '胸部', mev: 8,  mavLo: 12, mavHi: 20, mrv: 22, color: '#6366f1' },
  back:       { label: 'Back',       labelCN: '背部', mev: 10, mavLo: 14, mavHi: 22, mrv: 25, color: '#8b5cf6' },
  shoulders:  { label: 'Shoulders',  labelCN: '肩部', mev: 6,  mavLo: 16, mavHi: 22, mrv: 26, color: '#3b82f6' },
  biceps:     { label: 'Biceps',     labelCN: '二头', mev: 6,  mavLo: 14, mavHi: 20, mrv: 26, color: '#14b8a6' },
  triceps:    { label: 'Triceps',    labelCN: '三头', mev: 4,  mavLo: 10, mavHi: 14, mrv: 18, color: '#10b981' },
  quads:      { label: 'Quads',      labelCN: '股四',  mev: 8,  mavLo: 12, mavHi: 18, mrv: 20, color: '#f59e0b' },
  hamstrings: { label: 'Hamstrings', labelCN: '腘绳', mev: 6,  mavLo: 10, mavHi: 16, mrv: 20, color: '#f97316' },
  glutes:     { label: 'Glutes',     labelCN: '臀部', mev: 0,  mavLo: 4,  mavHi: 12, mrv: 16, color: '#ec4899' },
  abs:        { label: 'Core',       labelCN: '核心', mev: 0,  mavLo: 16, mavHi: 20, mrv: 25, color: '#06b6d4' },
};

export default function VolumeLandmarks({ workouts }: { workouts: WorkoutSession[] }) {
  const weeklyVol = useMemo(() => {
    // Use last 4 weeks of data
    const cutoff = toLocalDate(new Date(Date.now() - 28 * 86400000));
    const recent = workouts.filter((w) => w.start_time.slice(0, 10) >= cutoff);
    const setsPerMuscle: Record<string, number> = {};
    recent.forEach((w) => {
      w.exercises.forEach((ex) => {
        const muscles = getExerciseMuscles(ex.name);
        const sets = ex.sets.filter((s) => ['normal', 'dropset', 'failure'].includes(s.type)).length;
        muscles.forEach((m) => {
          setsPerMuscle[m] = (setsPerMuscle[m] ?? 0) + sets;
        });
      });
    });
    // avg per week (4 weeks)
    return Object.fromEntries(Object.entries(setsPerMuscle).map(([k, v]) => [k, Math.round(v / 4)]));
  }, [workouts]);

  const MAX_DISPLAY = 30; // max sets displayed on bar

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.1em] opacity-40 mb-1">
        {IS_CHINESE ? '训练量临界点 (周均组数)' : 'Volume Landmarks (sets/week)'}
      </div>
      <div style={{ fontSize: 9, opacity: 0.3, marginBottom: 12 }}>
        {IS_CHINESE ? '基于 RP 科学训练理论  · 数据来源近 4 周' : 'Based on Renaissance Periodization · Last 4 weeks'}
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-3 flex-wrap" style={{ fontSize: 9, opacity: 0.5 }}>
        {[
          { color: 'rgba(128,128,128,0.3)', label: IS_CHINESE ? '不足 MEV' : 'Sub-MEV' },
          { color: 'rgba(245,158,11,0.4)', label: IS_CHINESE ? '次优区间' : 'Sub-optimal' },
          { color: 'rgba(16,185,129,0.5)', label: IS_CHINESE ? '最优 MAV' : 'MAV Optimal' },
          { color: 'rgba(239,68,68,0.4)', label: IS_CHINESE ? '超出 MRV' : 'Over MRV' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div style={{ width: 10, height: 6, background: color, borderRadius: 2 }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {Object.entries(LANDMARKS).map(([muscle, { label, labelCN, mev, mavLo, mavHi, mrv, color }]) => {
          const cur = weeklyVol[muscle] ?? 0;
          const display = Math.min(cur, MAX_DISPLAY);
          const pct = (v: number) => `${Math.min((v / MAX_DISPLAY) * 100, 100)}%`;

          // Determine zone color
          let zoneColor = 'rgba(128,128,128,0.35)'; // sub-MEV
          if (cur > mrv) zoneColor = 'rgba(239,68,68,0.7)';
          else if (cur >= mavLo && cur <= mavHi) zoneColor = 'rgba(16,185,129,0.75)';
          else if (cur > mev) zoneColor = 'rgba(245,158,11,0.65)';

          return (
            <div key={muscle}>
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 10, opacity: 0.6, width: 52, flexShrink: 0 }}>
                  {IS_CHINESE ? labelCN : label}
                </span>
                <div className="flex-1 relative mx-2" style={{ height: 14 }}>
                  {/* Track */}
                  <div className="absolute inset-0 rounded-full" style={{ background: 'rgba(128,128,128,0.1)' }} />
                  {/* Zone bands */}
                  {/* Sub-MEV: 0 → MEV */}
                  <div className="absolute top-0 bottom-0 rounded-l-full" style={{
                    left: 0, width: pct(mev), background: 'rgba(128,128,128,0.2)',
                  }} />
                  {/* MAV zone */}
                  <div className="absolute top-0 bottom-0" style={{
                    left: pct(mavLo), width: `${((mavHi - mavLo) / MAX_DISPLAY) * 100}%`,
                    background: 'rgba(16,185,129,0.18)',
                  }} />
                  {/* MEV line */}
                  <div className="absolute top-0 bottom-0" style={{ left: pct(mev), width: 1, background: 'rgba(245,158,11,0.5)' }} />
                  {/* MRV line */}
                  <div className="absolute top-0 bottom-0" style={{ left: pct(mrv), width: 1, background: 'rgba(239,68,68,0.5)' }} />
                  {/* User bar */}
                  {cur > 0 && (
                    <div className="absolute top-1 bottom-1 rounded-full" style={{
                      left: 0, width: pct(display),
                      background: zoneColor,
                      transition: 'width 0.6s ease',
                      boxShadow: `0 0 6px ${zoneColor}`,
                    }} />
                  )}
                  {/* User needle */}
                  {cur > 0 && (
                    <div className="absolute top-0 bottom-0" style={{
                      left: `calc(${pct(display)} - 1px)`,
                      width: 2, background: 'white', opacity: 0.8, borderRadius: 1,
                    }} />
                  )}
                </div>
                <span style={{ fontSize: 10, opacity: 0.5, width: 28, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {cur}/{mrv}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex gap-4 text-xs opacity-30 flex-wrap">
        <span>MEV={IS_CHINESE ? '最低有效量' : 'Min Effective'}</span>
        <span>MAV={IS_CHINESE ? '最佳适应量' : 'Max Adaptive'}</span>
        <span>MRV={IS_CHINESE ? '最大可恢复量' : 'Max Recoverable'}</span>
      </div>
    </div>
  );
}
