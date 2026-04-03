import { useMemo } from 'react';
import type { WorkoutSession } from '@/types/workout';
import { IS_CHINESE, PanelLabel } from './WorkoutUI';

const TrainingHeartbeat = ({ workouts }: { workouts: WorkoutSession[] }) => {
  const DAYS = 90;
  const { pts, maxVol, trainedCount } = useMemo(() => {
    const vol: Record<string, number> = {};
    workouts.forEach((w) => { const d = w.start_time.slice(0, 10); vol[d] = (vol[d] || 0) + w.total_volume_kg; });
    const maxVol = Math.max(1, ...Object.values(vol));
    const pts = Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(Date.now() - (DAYS - 1 - i) * 86400000);
      const ds = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
      return { ds, v: (vol[ds] || 0) / maxVol };
    });
    return { pts, maxVol, trainedCount: pts.filter((p) => p.v > 0).length };
  }, [workouts]);

  const W = 500, H = 56, BASE = H - 8;
  const sx = W / (DAYS - 1);

  const pathD = useMemo(() => {
    let d = '';
    pts.forEach((p, i) => {
      const x = i * sx;
      const y = p.v > 0 ? BASE - p.v * (H - 16) : BASE;
      if (i === 0) { d = `M ${x} ${y}`; return; }
      const prev = pts[i - 1];
      const px = (i - 1) * sx, py = prev.v > 0 ? BASE - prev.v * (H - 16) : BASE;
      d += ` C ${px + sx * 0.5} ${py} ${x - sx * 0.5} ${y} ${x} ${y}`;
    });
    return d;
  }, [pts, sx]);

  const areaD = `${pathD} L ${(DAYS - 1) * sx} ${BASE} L 0 ${BASE} Z`;
  const pathLen = W * 2.2; // approximate

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <PanelLabel>{IS_CHINESE ? '训练心跳图 (近90天)' : 'Training Pulse (90d)'}</PanelLabel>
        <span className="text-xs opacity-35 tabular-nums">{trainedCount}/{DAYS}d</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible', display: 'block' }}>
        <defs>
          <linearGradient id="hbGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--wc-l3)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--wc-l3)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hbLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--wc-l2)" />
            <stop offset="60%" stopColor="var(--wc-l4)" />
            <stop offset="100%" stopColor="rgba(165,180,252,0.4)" />
          </linearGradient>
        </defs>
        {/* Baseline */}
        <line x1={0} y1={BASE} x2={W} y2={BASE} stroke="rgba(128,128,128,0.12)" strokeWidth="0.8" />
        {/* Area fill */}
        <path d={areaD} fill="url(#hbGrad)" />
        {/* Animated waveform */}
        <path d={pathD} fill="none" stroke="url(#hbLine)" strokeWidth="1.8" strokeLinecap="round"
          style={{
            strokeDasharray: pathLen,
            strokeDashoffset: pathLen,
            animation: 'pulseDrawIn 2.4s cubic-bezier(0.4,0,0.2,1) forwards',
          }} />
        {/* Spike dots for high-volume days */}
        {pts.map((p, i) => p.v > 0.7 ? (
          <circle key={i} cx={i * sx} cy={BASE - p.v * (H - 16)} r={2.5}
            fill="var(--wc-l4)" opacity={0.9} />
        ) : null)}
        {/* Today marker */}
        <line x1={(DAYS - 1) * sx} y1={4} x2={(DAYS - 1) * sx} y2={BASE}
          stroke="rgba(165,180,252,0.35)" strokeWidth="1" strokeDasharray="3 2" />
      </svg>
      <div className="flex justify-between mt-1" style={{ fontSize: 9, opacity: 0.28 }}>
        <span>{pts[0].ds.slice(5)}</span>
        <span>{IS_CHINESE ? '今天' : 'Today'}</span>
      </div>
    </div>
  );
};

export default TrainingHeartbeat;
