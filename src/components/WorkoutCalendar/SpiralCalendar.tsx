import { useMemo } from 'react';
import type { WorkoutSession } from '@/types/workout';
import { IS_CHINESE } from '@/components/workout/WorkoutUI';

const MONTH_NAMES_CN = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const MONTH_NAMES_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface Props {
  workouts: WorkoutSession[];
  year: string;
}

export default function SpiralCalendar({ workouts, year }: Props) {
  const data = useMemo(() => {
    // Build date → volume map for the given year
    const volMap: Record<string, number> = {};
    workouts.forEach((w) => {
      if (!w.start_time.startsWith(year)) return;
      const d = w.start_time.slice(0, 10);
      volMap[d] = (volMap[d] ?? 0) + w.total_volume_kg;
    });
    const maxVol = Math.max(...Object.values(volMap), 1);

    // Build day entries for all 12 months
    const months = Array.from({ length: 12 }, (_, mi) => {
      const daysInMonth = new Date(parseInt(year), mi + 1, 0).getDate();
      const days = Array.from({ length: daysInMonth }, (_, di) => {
        const d = `${year}-${String(mi + 1).padStart(2, '0')}-${String(di + 1).padStart(2, '0')}`;
        const vol = volMap[d] ?? 0;
        const today = new Date().toISOString().slice(0, 10);
        return { date: d, vol, ratio: vol / maxVol, isToday: d === today };
      });
      return days;
    });
    return months;
  }, [workouts, year]);

  // SVG spiral layout
  const SVG_SIZE = 320;
  const CX = SVG_SIZE / 2;
  const CY = SVG_SIZE / 2;
  const RING_GAP = 11;   // radial gap between months
  const R_INNER = 24;    // innermost ring radius
  const SEG_GAP_DEG = 0.8; // gap between day segments in degrees

  const getColor = (ratio: number) => {
    if (ratio === 0) return 'var(--wc-empty)';
    if (ratio < 0.25) return 'var(--wc-l1)';
    if (ratio < 0.55) return 'var(--wc-l2)';
    if (ratio < 0.80) return 'var(--wc-l3)';
    return 'var(--wc-l4)';
  };

  // For each month (ring), compute arc segments for each day
  const paths: Array<{
    d: string; color: string; date: string; isToday: boolean; label?: string; labelX?: number; labelY?: number;
  }> = [];
  const monthLabels: Array<{ x: number; y: number; text: string }> = [];

  data.forEach((days, mi) => {
    const r = R_INNER + (mi + 0.5) * RING_GAP;
    const rInner = R_INNER + mi * RING_GAP + 1;
    const rOuter = R_INNER + (mi + 1) * RING_GAP - 1;
    const n = days.length;
    const degPerDay = (360 / n);

    // Month label at start of ring
    const midAngleDeg = -90; // top
    const labelAngle = (midAngleDeg + 2) * (Math.PI / 180);
    const lr = r + RING_GAP * 0.45;
    monthLabels.push({
      x: CX + lr * Math.cos(labelAngle),
      y: CY + lr * Math.sin(labelAngle),
      text: (IS_CHINESE ? MONTH_NAMES_CN : MONTH_NAMES_EN)[mi],
    });

    days.forEach((day, di) => {
      const startDeg = -90 + di * degPerDay + SEG_GAP_DEG / 2;
      const endDeg   = -90 + (di + 1) * degPerDay - SEG_GAP_DEG / 2;
      const startRad = startDeg * (Math.PI / 180);
      const endRad   = endDeg   * (Math.PI / 180);

      const x1i = CX + rInner * Math.cos(startRad);
      const y1i = CY + rInner * Math.sin(startRad);
      const x2i = CX + rInner * Math.cos(endRad);
      const y2i = CY + rInner * Math.sin(endRad);
      const x1o = CX + rOuter * Math.cos(startRad);
      const y1o = CY + rOuter * Math.sin(startRad);
      const x2o = CX + rOuter * Math.cos(endRad);
      const y2o = CY + rOuter * Math.sin(endRad);

      const largeArc = (endDeg - startDeg) > 180 ? 1 : 0;

      const d = [
        `M ${x1i.toFixed(2)} ${y1i.toFixed(2)}`,
        `A ${rInner.toFixed(2)} ${rInner.toFixed(2)} 0 ${largeArc} 1 ${x2i.toFixed(2)} ${y2i.toFixed(2)}`,
        `L ${x2o.toFixed(2)} ${y2o.toFixed(2)}`,
        `A ${rOuter.toFixed(2)} ${rOuter.toFixed(2)} 0 ${largeArc} 0 ${x1o.toFixed(2)} ${y1o.toFixed(2)}`,
        'Z',
      ].join(' ');

      paths.push({
        d,
        color: getColor(day.ratio),
        date: day.date,
        isToday: day.isToday,
      });
    });
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} style={{ overflow: 'visible' }}>
        {/* Faint radial guides */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (-90 + i * 30) * (Math.PI / 180);
          const x2 = CX + (R_INNER + 12 * RING_GAP + 4) * Math.cos(angle);
          const y2 = CY + (R_INNER + 12 * RING_GAP + 4) * Math.sin(angle);
          return <line key={i} x1={CX} y1={CY} x2={x2} y2={y2} stroke="rgba(128,128,128,0.06)" strokeWidth={0.5} />;
        })}

        {/* Day segments */}
        {paths.map(({ d, color, date, isToday }) => (
          <path key={date} d={d} fill={color}
            stroke={isToday ? 'rgba(245,158,11,0.9)' : 'none'}
            strokeWidth={isToday ? 1.5 : 0}
          >
            <title>{date}</title>
          </path>
        ))}

        {/* Month labels */}
        {monthLabels.map(({ x, y, text }, i) => (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            fill="currentColor" fontSize={7} opacity={0.3} style={{ userSelect: 'none' }}>
            {text}
          </text>
        ))}

        {/* Center year */}
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle"
          fill="currentColor" fontSize={12} fontWeight={700} opacity={0.35} style={{ userSelect: 'none' }}>
          {year}
        </text>
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-1" style={{ fontSize: 9, opacity: 0.35 }}>
        <span>{IS_CHINESE ? '无' : 'None'}</span>
        {['var(--wc-empty)', 'var(--wc-l1)', 'var(--wc-l2)', 'var(--wc-l3)', 'var(--wc-l4)'].map((c, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
        ))}
        <span>{IS_CHINESE ? '强' : 'High'}</span>
      </div>
    </div>
  );
}
