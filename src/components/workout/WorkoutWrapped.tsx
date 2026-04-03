import { useMemo, useEffect } from 'react';
import type { WorkoutSession } from '@/types/workout';
import { calcBestLifts, calcStreak, WARMUP_NAMES } from '@/utils/workoutCalcs';
import { translateExercise } from '@/utils/exerciseTranslations';
import { IS_CHINESE } from './WorkoutUI';

interface Props {
  workouts: WorkoutSession[];
  year: string;
  onClose: () => void;
}

export default function WorkoutWrapped({ workouts, year, onClose }: Props) {
  const yearWorkouts = useMemo(
    () => workouts.filter((w) => w.start_time.startsWith(year)),
    [workouts, year]
  );

  const stats = useMemo(() => {
    const count = yearWorkouts.length;
    const totalVolume = yearWorkouts.reduce((s, w) => s + w.total_volume_kg, 0);
    const totalSets   = yearWorkouts.reduce((s, w) => s + w.total_sets, 0);
    const { longest: streak } = calcStreak(yearWorkouts);

    // Best month
    const monthVol: Record<string, number> = {};
    yearWorkouts.forEach((w) => {
      const m = w.start_time.slice(0, 7);
      monthVol[m] = (monthVol[m] ?? 0) + w.total_volume_kg;
    });
    const bestMonth = Object.entries(monthVol).sort(([, a], [, b]) => b - a)[0];

    // Top 3 exercises by sets
    const exFreq: Record<string, number> = {};
    yearWorkouts.forEach((w) =>
      w.exercises.filter((e) => !WARMUP_NAMES.has(e.name.toLowerCase()))
        .forEach((e) => { exFreq[e.name] = (exFreq[e.name] ?? 0) + e.sets.length; })
    );
    const top3 = Object.entries(exFreq).sort(([, a], [, b]) => b - a).slice(0, 3).map(([name]) => name);

    // Best PR
    const bestLifts = calcBestLifts(yearWorkouts, 1);
    const bestPR = bestLifts[0] ?? null;

    // Total training days
    const trainedDays = new Set(yearWorkouts.map((w) => w.start_time.slice(0, 10))).size;

    return { count, totalVolume, totalSets, streak, bestMonth, top3, bestPR, trainedDays };
  }, [yearWorkouts]);

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const monthName = (ym: string) => {
    const [, m] = ym.split('-');
    return IS_CHINESE
      ? `${parseInt(m)}月`
      : new Date(ym + '-01').toLocaleString('en', { month: 'short' });
  };

  if (yearWorkouts.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 400,
          background: 'linear-gradient(160deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
          borderRadius: 24,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 0 80px rgba(99,102,241,0.3), 0 0 160px rgba(99,102,241,0.1)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Background decoration */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -40, left: -40,
          width: 160, height: 160, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="p-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div style={{ fontSize: 12, letterSpacing: '0.3em', opacity: 0.4, color: '#a5b4fc', marginBottom: 4 }}>
              {IS_CHINESE ? '年度训练总结' : 'ANNUAL RECAP'}
            </div>
            <div style={{
              fontSize: 52, fontWeight: 900, lineHeight: 1,
              background: 'linear-gradient(135deg, #f59e0b, #a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>{year}</div>
          </div>

          {/* Main stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              { label: IS_CHINESE ? '训练次数' : 'Sessions', value: stats.count, unit: '' },
              { label: IS_CHINESE ? '训练天数' : 'Active Days', value: stats.trainedDays, unit: '' },
              { label: IS_CHINESE ? '总出力' : 'Volume', value: (stats.totalVolume / 1000).toFixed(1), unit: 't' },
              { label: IS_CHINESE ? '总组数' : 'Sets', value: stats.totalSets, unit: '' },
            ].map(({ label, value, unit }) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,0.05)', borderRadius: 12,
                padding: '12px 16px', border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ fontSize: 9, opacity: 0.4, letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#e2e8f0' }}>
                  {value}<span style={{ fontSize: 13, opacity: 0.5 }}>{unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Highlight stats */}
          <div className="space-y-3">
            {/* Best month */}
            {stats.bestMonth && (
              <div style={{
                background: 'rgba(245,158,11,0.1)', borderRadius: 12, padding: '10px 16px',
                border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 20 }}>🔥</span>
                <div>
                  <div style={{ fontSize: 9, opacity: 0.5, marginBottom: 2 }}>
                    {IS_CHINESE ? '最强月份' : 'Best Month'}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>
                    {monthName(stats.bestMonth[0])} · {(stats.bestMonth[1] / 1000).toFixed(1)}t
                  </div>
                </div>
              </div>
            )}

            {/* Best PR */}
            {stats.bestPR && (
              <div style={{
                background: 'rgba(99,102,241,0.12)', borderRadius: 12, padding: '10px 16px',
                border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 20 }}>🏆</span>
                <div className="min-w-0 flex-1">
                  <div style={{ fontSize: 9, opacity: 0.5, marginBottom: 2 }}>
                    {IS_CHINESE ? '最强单组' : 'Best Lift'}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#a5b4fc' }} className="truncate">
                    {translateExercise(stats.bestPR.name)} {stats.bestPR.weight}×{stats.bestPR.reps} → {stats.bestPR.e1rm}kg e1RM
                  </div>
                </div>
              </div>
            )}

            {/* Longest streak */}
            <div style={{
              background: 'rgba(16,185,129,0.1)', borderRadius: 12, padding: '10px 16px',
              border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 20 }}>⚡</span>
              <div>
                <div style={{ fontSize: 9, opacity: 0.5, marginBottom: 2 }}>
                  {IS_CHINESE ? '最长连续' : 'Longest Streak'}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#34d399' }}>
                  {stats.streak} {IS_CHINESE ? '天' : 'days'}
                </div>
              </div>
            </div>

            {/* Top 3 exercises */}
            {stats.top3.length > 0 && (
              <div style={{
                background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 16px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ fontSize: 9, opacity: 0.4, marginBottom: 6 }}>
                  {IS_CHINESE ? '最常练的动作' : 'Favorite Exercises'}
                </div>
                <div className="space-y-1">
                  {stats.top3.map((name, i) => (
                    <div key={name} className="flex items-center gap-2">
                      <span style={{ fontSize: 11, opacity: 0.35, width: 14 }}>{i + 1}.</span>
                      <span style={{ fontSize: 12, color: '#cbd5e1' }}>{translateExercise(name)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <div style={{ fontSize: 9, opacity: 0.2, marginBottom: 12 }}>
              {IS_CHINESE ? '截图分享 · 继续超越自己' : 'Screenshot to share · Keep pushing'}
            </div>
            <button onClick={onClose} style={{
              padding: '8px 24px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
              fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
            }}>
              {IS_CHINESE ? '关闭' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
