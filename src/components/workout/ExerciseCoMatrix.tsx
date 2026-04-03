import { useState, useMemo } from 'react';
import type { WorkoutSession } from '@/types/workout';
import { calcExerciseCoMatrix } from '@/utils/workoutCalcs';
import { translateExercise } from '@/utils/exerciseTranslations';
import { IS_CHINESE, PanelLabel } from './WorkoutUI';

const TOP_N = 12;

// Interpolate rgba color from white→accent based on ratio
const heatColor = (ratio: number): string => {
  if (ratio <= 0) return 'rgba(128,128,128,0.08)';
  const a = 0.12 + ratio * 0.75;
  const r = Math.round(99 + ratio * (245 - 99));
  const g = Math.round(102 + ratio * (158 - 102));
  const b = Math.round(241 + ratio * (11 - 241));
  return `rgba(${r},${g},${b},${a.toFixed(2)})`;
};

export default function ExerciseCoMatrix({ workouts }: { workouts: WorkoutSession[] }) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  const { exercises, matrix, maxVal } = useMemo(() => {
    const { exercises, matrix } = calcExerciseCoMatrix(workouts, TOP_N);
    let maxVal = 0;
    matrix.forEach((row) => row.forEach((v) => { if (v > maxVal) maxVal = v; }));
    return { exercises, matrix, maxVal };
  }, [workouts]);

  if (exercises.length < 3) return null;

  const CELL = 30;
  const LABEL_W = 96;
  const n = exercises.length;
  const labels = exercises.map((e) => translateExercise(e));

  return (
    <div>
      <PanelLabel>{IS_CHINESE ? '动作搭配频率' : 'Exercise Co-Occurrence'}</PanelLabel>
      <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
        <div style={{ minWidth: LABEL_W + n * (CELL + 2), position: 'relative' }}>
          {/* Column headers (rotated) */}
          <div style={{ display: 'flex', marginLeft: LABEL_W, marginBottom: 2 }}>
            {labels.map((label, ci) => (
              <div key={ci}
                style={{
                  width: CELL, height: 80, display: 'flex', alignItems: 'flex-end',
                  justifyContent: 'center', marginRight: 2, flexShrink: 0,
                }}
              >
                <span style={{
                  fontSize: 11, opacity: hoveredCell?.col === ci ? 0.9 : 0.45,
                  writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                  whiteSpace: 'nowrap', maxHeight: 78, overflow: 'hidden',
                  transition: 'opacity 0.15s',
                }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Rows */}
          {exercises.map((exName, ri) => (
            <div key={ri} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
              {/* Row label */}
              <div style={{
                width: LABEL_W, flexShrink: 0, paddingRight: 8,
                fontSize: 11, opacity: hoveredCell?.row === ri ? 0.9 : 0.45,
                textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden',
                textOverflow: 'ellipsis', transition: 'opacity 0.15s',
              }}>
                {labels[ri]}
              </div>
              {/* Cells */}
              {matrix[ri].map((val, ci) => {
                const ratio = maxVal > 0 ? val / maxVal : 0;
                const isHovered = hoveredCell?.row === ri && hoveredCell?.col === ci;
                const isSelf = ri === ci;
                return (
                  <div key={ci}
                    title={val > 0 && !isSelf ? `${labels[ri]} + ${labels[ci]}: ${val}${IS_CHINESE ? '次同训' : ' times together'}` : undefined}
                    onMouseEnter={() => !isSelf && setHoveredCell({ row: ri, col: ci })}
                    onMouseLeave={() => setHoveredCell(null)}
                    style={{
                      width: CELL, height: CELL, borderRadius: 4, marginRight: 2, flexShrink: 0,
                      background: isSelf ? 'rgba(99,102,241,0.06)' : heatColor(ratio),
                      cursor: val > 0 && !isSelf ? 'default' : undefined,
                      outline: isHovered ? '2px solid rgba(99,102,241,0.6)' : undefined,
                      outlineOffset: 1,
                      transition: 'outline 0.1s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {val > 0 && !isSelf && (
                      <span style={{ fontSize: 10, opacity: 0.75, fontWeight: 600, color: ratio > 0.6 ? '#fff' : undefined }}>
                        {val}
                      </span>
                    )}
                    {isSelf && <span style={{ fontSize: 10, opacity: 0.15 }}>·</span>}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Tooltip */}
          {hoveredCell && matrix[hoveredCell.row][hoveredCell.col] > 0 && (
            <div style={{
              position: 'absolute', bottom: -28, left: LABEL_W,
              fontSize: 11, opacity: 0.6, pointerEvents: 'none',
            }}>
              {labels[hoveredCell.row]} + {labels[hoveredCell.col]}:{' '}
              <strong>{matrix[hoveredCell.row][hoveredCell.col]}</strong>
              {IS_CHINESE ? ' 次同训' : ' sessions together'}
            </div>
          )}
        </div>
      </div>
      <div style={{ marginTop: 36, fontSize: 10, opacity: 0.25 }}>
        {IS_CHINESE ? `颜色越深 = 同一训练课出现次数越多（前 ${n} 个动作）` : `Darker = more sessions trained together (top ${n} exercises)`}
      </div>
    </div>
  );
}
