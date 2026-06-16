import { useMemo } from 'react';
import type { WorkoutSession } from '@/types/workout';
import { calcBestLifts } from '@/utils/workoutCalcs';
import { translateExercise } from '@/utils/exerciseTranslations';

const PR_PALETTE = [
  'var(--wt-pr-color)',
  'var(--wo-series-1)',
  'var(--wo-series-2)',
  'var(--wo-series-3)',
  'var(--wo-series-4)',
  'var(--wo-series-5)',
  'var(--wo-series-6)',
  'var(--wo-series-8)',
];

const NeonPRWall = ({ workouts }: { workouts: WorkoutSession[] }) => {
  const allBests = useMemo(() => calcBestLifts(workouts, 60), [workouts]);
  if (allBests.length === 0) return null;

  const half = Math.ceil(allBests.length / 2);
  const leftCol = allBests.slice(0, half);
  const rightCol = allBests.slice(half);

  const Row = ({ name, weight, reps, e1rm, i }: {
    name: string; weight: number; reps: number; e1rm: number; i: number;
  }) => {
    const accent = PR_PALETTE[i % PR_PALETTE.length];
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 0',
        borderBottom: '1px solid var(--wo-section-line)',
        animation: `slideUp 0.35s ease ${i * 0.025}s both`,
      }}>
        <span style={{ color: 'var(--wo-axis-text)', fontSize: 13, width: 24, textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {String(i + 1).padStart(2, '0')}
        </span>
        <span style={{ flex: 1, color: 'var(--color-tx)', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {translateExercise(name)}
        </span>
        <span style={{ color: 'var(--wo-axis-text)', fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {weight}×{reps}
        </span>
        <span style={{
          color: accent, fontWeight: 900, fontSize: 18, whiteSpace: 'nowrap', flexShrink: 0,
          textShadow: `0 0 12px color-mix(in srgb, ${accent} 34%, transparent)`,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {e1rm}
        </span>
        <span style={{ color: accent, fontSize: 13, opacity: 0.7, flexShrink: 0 }}>kg</span>
      </div>
    );
  };

  return (
    <div className="px-4 sm:px-6" style={{
      background: 'linear-gradient(180deg, color-mix(in srgb, var(--wo-series-7) 18%, var(--color-bg)), color-mix(in srgb, var(--wo-series-6) 10%, var(--color-bg)))',
      border: '1px solid var(--wo-accent-soft-border)',
      borderRadius: 14,
      paddingTop: 22,
      paddingBottom: 18,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: 'var(--wo-accent-glow)',
    }}>
      {/* Soft scanline texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, color-mix(in srgb, var(--wo-series-8) 4%, transparent) 3px, color-mix(in srgb, var(--wo-series-8) 4%, transparent) 4px)',
      }} />

      {/* Accent sweep */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 2, zIndex: 3, pointerEvents: 'none',
        background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--wt-pr-color) 26%, transparent), color-mix(in srgb, var(--color-tx) 16%, transparent), color-mix(in srgb, var(--wt-pr-color) 26%, transparent), transparent)',
        animation: 'scanSweep 7s ease-in-out infinite',
      }} />

      {/* Ambient color blobs */}
      <div style={{ position: 'absolute', top: -60, left: '15%', width: 280, height: 280, borderRadius: '50%', background: 'color-mix(in srgb, var(--wo-series-2) 12%, transparent)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -60, right: '15%', width: 280, height: 280, borderRadius: '50%', background: 'color-mix(in srgb, var(--wo-series-8) 10%, transparent)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', left: '45%', width: 160, height: 160, borderRadius: '50%', background: 'color-mix(in srgb, var(--wt-pr-color) 8%, transparent)', filter: 'blur(40px)', pointerEvents: 'none' }} />

      {/* ── Header ── */}
      <div style={{ textAlign: 'center', marginBottom: 16, position: 'relative', zIndex: 2 }}>
        <div style={{
          fontSize: 12, letterSpacing: '0.3em', fontWeight: 800,
          color: 'var(--wc-l4)', opacity: 0.78, marginBottom: 6,
          wordBreak: 'break-word',
        }}>
          ✦ HALL OF FAME · 名人堂 ✦
        </div>

        <div style={{
          fontSize: 'clamp(18px, 5vw, 28px)', fontWeight: 900, letterSpacing: '0.06em', fontStyle: 'italic',
          background: 'linear-gradient(135deg, var(--wt-pr-color), var(--wo-series-3))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.1,
        }}>
          個人最高出力紀錄
        </div>

        <div style={{
          fontSize: 11, letterSpacing: '0.25em', marginTop: 5,
          color: 'var(--wo-axis-text)', opacity: 0.72, fontWeight: 700,
          wordBreak: 'break-word',
        }}>
          PERSONAL RECORDS · ALL TIME BEST
        </div>
      </div>

      <div style={{
        height: 1.5,
        background: 'linear-gradient(90deg, transparent 0%, var(--wo-series-6) 12%, var(--wo-series-3) 38%, var(--wt-pr-color) 50%, var(--wo-series-1) 74%, transparent 100%)',
        backgroundSize: '200% 100%',
        boxShadow: '0 0 8px color-mix(in srgb, var(--wt-pr-color) 22%, transparent)',
        marginBottom: 14, position: 'relative', zIndex: 2,
        animation: 'neonSweep 4s linear infinite',
      }} />

      {/* ── Two-column PR grid (single column on mobile) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '0 28px', position: 'relative', zIndex: 2 }}>
        <div>
          {leftCol.map((item, i) => (
            <Row key={item.name} {...item} i={i} />
          ))}
        </div>
        <div>
          {rightCol.map((item, i) => (
            <Row key={item.name} {...item} i={half + i} />
          ))}
        </div>
      </div>

      <div style={{
        height: 1.5,
        background: 'linear-gradient(90deg, transparent 0%, var(--wo-series-4) 10%, var(--wo-series-8) 30%, var(--wt-pr-color) 50%, var(--wo-series-2) 70%, var(--wo-series-6) 90%, transparent 100%)',
        backgroundSize: '200% 100%',
        marginTop: 14, marginBottom: 10, position: 'relative', zIndex: 2,
        animation: 'neonSweep 4s linear infinite reverse',
      }} />

      {/* Footer */}
      <div style={{
        textAlign: 'center', fontSize: 9.5, letterSpacing: '0.25em',
        color: 'var(--wo-axis-text)', position: 'relative', zIndex: 2,
        fontWeight: 600,
      }}>
        ✦ EPLEY FORMULA e1RM · 理論單次最大重量估算 · EST. 1-REP MAX ✦
      </div>
    </div>
  );
};

export default NeonPRWall;
