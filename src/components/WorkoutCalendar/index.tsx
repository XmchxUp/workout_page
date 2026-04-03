import { useMemo } from 'react';
import { WorkoutSession } from '@/types/workout';
import styles from './style.module.css';

interface WorkoutCalendarProps {
  workouts: WorkoutSession[];
  year: string;
  onDayClick?: (date: string) => void;
}

const CELL_SIZE = 13;
const CELL_GAP = 3;
const CELL_STEP = CELL_SIZE + CELL_GAP;
const LEFT_PAD = 28;
const TOP_PAD = 24;

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const toLocalDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const TODAY = toLocalDate(new Date());

const levelClass = (count: number, max: number): string => {
  if (count === 0) return styles.empty;
  const r = count / max;
  if (r < 0.25) return styles.level1;
  if (r < 0.5)  return styles.level2;
  if (r < 0.75) return styles.level3;
  return styles.level4;
};

const WorkoutCalendar = ({ workouts, year, onDayClick }: WorkoutCalendarProps) => {
  const dateMap = useMemo(() => {
    const map: Record<string, number> = {};
    workouts.forEach((w) => {
      if (w.start_time.startsWith(year)) {
        const d = w.start_time.slice(0, 10);
        map[d] = (map[d] || 0) + 1;
      }
    });
    return map;
  }, [workouts, year]);

  const maxCount = useMemo(() => Math.max(1, ...Object.values(dateMap)), [dateMap]);

  const grid = useMemo(() => {
    const startDate = new Date(`${year}-01-01`);
    const startDow = (startDate.getDay() + 6) % 7; // Monday=0
    const cells: Array<{
      date: string; count: number; weekIndex: number; dayIndex: number;
    }> = [];
    let weekIndex = 0;
    let dayIndex = startDow;
    const endDate = new Date(`${year}-12-31`);
    const cur = new Date(startDate);

    while (cur <= endDate) {
      const dateStr = toLocalDate(cur);
      cells.push({ date: dateStr, count: dateMap[dateStr] || 0, weekIndex, dayIndex });
      dayIndex++;
      if (dayIndex === 7) { dayIndex = 0; weekIndex++; }
      cur.setDate(cur.getDate() + 1);
    }
    return cells;
  }, [year, dateMap]);

  const monthLabels = useMemo(() => {
    const labels: Array<{ text: string; x: number }> = [];
    let last = -1;
    grid.forEach((c) => {
      const m = parseInt(c.date.slice(5, 7), 10) - 1;
      if (m !== last) { last = m; labels.push({ text: MONTH_NAMES[m], x: c.weekIndex * CELL_STEP }); }
    });
    return labels;
  }, [grid]);

  const totalWorkouts = Object.values(dateMap).reduce((a, b) => a + b, 0);
  const svgWidth = 53 * CELL_STEP + LEFT_PAD;
  const svgHeight = 7 * CELL_STEP + TOP_PAD;

  const SWATCH_CLASSES = [
    styles.swatchEmpty, styles.swatchL1, styles.swatchL2, styles.swatchL3, styles.swatchL4,
  ];

  return (
    <div className="mt-4">
      <div className="mb-2 text-sm opacity-60">
        {totalWorkouts} workout{totalWorkouts !== 1 ? 's' : ''} in {year}
      </div>
      <div className="overflow-x-auto">
        <svg width={svgWidth} height={svgHeight} style={{ display: 'block' }}>
          {/* Month labels */}
          {monthLabels.map(({ text, x }) => (
            <text
              key={text + x}
              x={LEFT_PAD + x}
              y={TOP_PAD - 8}
              fontSize={10}
              fill="currentColor"
              opacity={0.5}
            >{text}</text>
          ))}

          {/* Day labels */}
          {DAY_LABELS.map((label, i) =>
            label ? (
              <text
                key={i}
                x={LEFT_PAD - 4}
                y={TOP_PAD + i * CELL_STEP + CELL_SIZE - 2}
                fontSize={9}
                textAnchor="end"
                fill="currentColor"
                opacity={0.4}
              >{label}</text>
            ) : null
          )}

          {/* Cells */}
          {grid.map((cell) => {
            const x = LEFT_PAD + cell.weekIndex * CELL_STEP;
            const y = TOP_PAD + cell.dayIndex * CELL_STEP;
            const isToday = cell.date === TODAY;
            return (
              <g key={cell.date}>
                <rect
                  x={x} y={y}
                  width={CELL_SIZE} height={CELL_SIZE}
                  rx={2}
                  className={`${styles.cell} ${levelClass(cell.count, maxCount)} ${cell.count > 0 ? styles.cellClickable : ''}`}
                  onClick={() => cell.count > 0 && onDayClick?.(cell.date)}
                >
                  <title>
                    {cell.date}
                    {cell.count > 0 ? `: ${cell.count} workout${cell.count > 1 ? 's' : ''}` : ''}
                    {isToday ? ' (today)' : ''}
                  </title>
                </rect>
                {/* Today ring */}
                {isToday && (
                  <rect
                    x={x} y={y}
                    width={CELL_SIZE} height={CELL_SIZE}
                    rx={2}
                    className={styles.todayRing}
                    style={{ pointerEvents: 'none' }}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-1.5 text-xs opacity-50">
        <span>Less</span>
        {SWATCH_CLASSES.map((cls, i) => (
          <span
            key={i}
            className={cls}
            style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, flexShrink: 0 }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
};

export default WorkoutCalendar;
