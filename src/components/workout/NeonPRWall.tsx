import { useMemo } from 'react';
import type { WorkoutSession } from '@/types/workout';
import { calcBestLifts } from '@/utils/workoutCalcs';
import { translateExercise } from '@/utils/exerciseTranslations';

const NEON_PALETTE = ['#ff2d78', '#00f5ff', '#ffcc00', '#bf5fff', '#ff6b00', '#00ff99', '#ff9900', '#4dffdb'];

const NeonPRWall = ({ workouts }: { workouts: WorkoutSession[] }) => {
  const allBests = useMemo(() => calcBestLifts(workouts, 60), [workouts]);
  if (allBests.length === 0) return null;

  const half = Math.ceil(allBests.length / 2);
  const leftCol = allBests.slice(0, half);
  const rightCol = allBests.slice(half);

  const Row = ({ name, weight, reps, e1rm, date, i }: {
    name: string; weight: number; reps: number; e1rm: number; date: string; i: number;
  }) => {
    const neon = NEON_PALETTE[i % NEON_PALETTE.length];
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        animation: `slideUp 0.35s ease ${i * 0.025}s both`,
      }}>
        <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 13, width: 24, textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {String(i + 1).padStart(2, '0')}
        </span>
        <span style={{ flex: 1, color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {translateExercise(name)}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {weight}×{reps}
        </span>
        <span style={{
          color: neon, fontWeight: 900, fontSize: 18, whiteSpace: 'nowrap', flexShrink: 0,
          textShadow: `0 0 6px ${neon}, 0 0 14px ${neon}70`,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {e1rm}
        </span>
        <span style={{ color: neon, fontSize: 13, opacity: 0.7, flexShrink: 0 }}>kg</span>
      </div>
    );
  };

  return (
    <div className="px-4 sm:px-6" style={{
      background: '#04000c',
      border: '1px solid #ff2d78',
      borderRadius: 14,
      paddingTop: 22,
      paddingBottom: 18,
      position: 'relative',
      overflow: 'hidden',
      animation: 'borderChase 5s linear infinite',
    }}>
      {/* CRT scanlines overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 4px)',
      }} />

      {/* Scan sweep line */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 2, zIndex: 3, pointerEvents: 'none',
        background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.25), rgba(255,255,255,0.12), rgba(0,245,255,0.25), transparent)',
        animation: 'scanSweep 7s ease-in-out infinite',
      }} />

      {/* Ambient color blobs */}
      <div style={{ position: 'absolute', top: -60, left: '15%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,45,120,0.07)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -60, right: '15%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(0,245,255,0.05)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', left: '45%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,204,0,0.04)', filter: 'blur(40px)', pointerEvents: 'none' }} />

      {/* ── Header ── */}
      <div style={{ textAlign: 'center', marginBottom: 16, position: 'relative', zIndex: 2 }}>
        <div style={{
          fontSize: 12, letterSpacing: '0.3em', fontWeight: 800,
          color: '#ff2d78', opacity: 0.85, marginBottom: 6,
          animation: 'neonFlicker 8s infinite',
          wordBreak: 'break-word',
        }}>
          ✦ HALL OF FAME · 名人堂 ✦
        </div>

        {/* Main title — gold neon, pulsing glow */}
        <div style={{
          fontSize: 'clamp(18px, 5vw, 28px)', fontWeight: 900, letterSpacing: '0.06em', fontStyle: 'italic',
          color: '#ffcc00',
          textShadow: '0 0 8px #ffcc00, 0 0 20px #ffcc00, 0 0 40px rgba(255,204,0,0.5)',
          lineHeight: 1.1,
          animation: 'neonPulse 3s ease-in-out infinite',
        }}>
          個人最高出力紀錄
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: 11, letterSpacing: '0.25em', marginTop: 5,
          color: '#00f5ff', opacity: 0.55, fontWeight: 700,
          textShadow: '0 0 8px #00f5ff',
          animation: 'neonFlicker 12s infinite 2s',
          wordBreak: 'break-word',
        }}>
          PERSONAL RECORDS · ALL TIME BEST
        </div>
      </div>

      {/* Rainbow divider — animated sweep */}
      <div style={{
        height: 1.5,
        background: 'linear-gradient(90deg, transparent 0%, #ff2d78 10%, #ffcc00 30%, #00f5ff 50%, #bf5fff 70%, #ff6b00 90%, transparent 100%)',
        backgroundSize: '200% 100%',
        boxShadow: '0 0 8px rgba(255,204,0,0.35)',
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

      {/* Bottom divider — animated */}
      <div style={{
        height: 1.5,
        background: 'linear-gradient(90deg, transparent 0%, #bf5fff 10%, #00f5ff 30%, #ffcc00 50%, #ff2d78 70%, #ff6b00 90%, transparent 100%)',
        backgroundSize: '200% 100%',
        marginTop: 14, marginBottom: 10, position: 'relative', zIndex: 2,
        animation: 'neonSweep 4s linear infinite reverse',
      }} />

      {/* Footer */}
      <div style={{
        textAlign: 'center', fontSize: 9.5, letterSpacing: '0.25em',
        color: 'rgba(255,255,255,0.18)', position: 'relative', zIndex: 2,
        fontWeight: 600,
      }}>
        ✦ EPLEY FORMULA e1RM · 理論單次最大重量估算 · EST. 1-REP MAX ✦
      </div>
    </div>
  );
};

export default NeonPRWall;
