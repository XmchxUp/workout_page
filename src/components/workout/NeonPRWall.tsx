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
      background: 'var(--wo-card-bg)',
      border: '1px solid var(--wo-accent-soft-border)',
      borderRadius: 14,
      paddingTop: 22,
      paddingBottom: 18,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: 'none',
    }}>
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
          color: 'var(--wt-pr-color)',
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
        background: 'var(--wo-accent-line-soft)',
        marginBottom: 14, position: 'relative', zIndex: 2,
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
        background: 'var(--wo-section-line)',
        marginTop: 14, marginBottom: 10, position: 'relative', zIndex: 2,
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
