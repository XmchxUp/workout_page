import { useState, useMemo, useEffect } from 'react';
import { WorkoutSession, WorkoutExercise } from '@/types/workout';
import { formatDuration } from '@/hooks/useWorkouts';
import { translateExercise } from '@/utils/exerciseTranslations';
import styles from './style.module.css';

// Exercises where lower weight = stronger (assisted resistance helps less = harder)
const ASSISTED_PATTERN = /assisted/i;
const isAssisted = (name: string): boolean => ASSISTED_PATTERN.test(name);

interface WorkoutTableProps {
  workouts: WorkoutSession[];
  highlightDate?: string;
  scoreMap?: Record<string, number>;
  doubleSessionDates?: Set<string>;
}

// ---------------------------------------------------------------------------
// Compute per-exercise all-time PR weight map from the full (unfiltered) list
// passed in from parent. Here we compute it from the workouts prop (filtered)
// but the parent always passes the year-filtered list, which is fine.
// ---------------------------------------------------------------------------
const buildPRMap = (workouts: WorkoutSession[]): Record<string, { weight: number; date: string }> => {
  const prMap: Record<string, { weight: number; date: string }> = {};
  // Process in chronological order to track when each PR was first set
  [...workouts]
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .forEach((w) => {
      w.exercises.forEach((ex) => {
        ex.sets.forEach((s) => {
          if (!['normal', 'dropset', 'failure'].includes(s.type)) return;
          const w_kg = s.weight_kg ?? 0;
          const assisted = isAssisted(ex.name);
          if (w_kg > 0 && (assisted ? w_kg < (prMap[ex.name]?.weight ?? Infinity) : w_kg > (prMap[ex.name]?.weight ?? 0))) {
            prMap[ex.name] = { weight: w_kg, date: w.start_time.slice(0, 10) };
          }
        });
      });
    });
  return prMap;
};

// ---------------------------------------------------------------------------
// ExerciseDetail: shows sets for one exercise, with PR star on the top set
// ---------------------------------------------------------------------------
const ExerciseDetail = ({
  exercise,
  isPRSession,
  prWeight,
}: {
  exercise: WorkoutExercise;
  isPRSession: boolean;
  prWeight: number;
}) => {
  const normalSets = exercise.sets.filter(
    (s) => s.type === 'normal' || s.type === 'dropset' || s.type === 'failure'
  );
  const warmupSets = exercise.sets.filter((s) => s.type === 'warmup');

  return (
    <div className={styles.exerciseDetail}>
      <span className={styles.exerciseName}>
        {translateExercise(exercise.name)}
        {isPRSession && (
          <span className={styles.prBadge} title={`PR: ${prWeight}kg`}>
            ★ PR
          </span>
        )}
      </span>
      <span className={styles.exerciseSets}>
        {warmupSets.length > 0 && (
          <span className={styles.warmupBadge}>{warmupSets.length}w</span>
        )}
        {normalSets.map((s, i) => {
          const isTopSet = s.weight_kg === prWeight && isPRSession;
          if (s.weight_kg !== undefined && s.reps !== undefined) {
            return (
              <span key={i} className={`${styles.setChip} ${isTopSet ? styles.prChip : ''}`}>
                {s.weight_kg}kg×{s.reps}
              </span>
            );
          }
          if (s.reps !== undefined) {
            return (
              <span key={i} className={styles.setChip}>
                ×{s.reps}
              </span>
            );
          }
          if (s.duration_seconds !== undefined) {
            return (
              <span key={i} className={styles.setChip}>
                {formatDuration(s.duration_seconds)}
              </span>
            );
          }
          return null;
        })}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// WorkoutRow
// ---------------------------------------------------------------------------
const SCORE_COLOR = (s: number) =>
  s >= 70 ? 'rgba(34,197,94,0.9)' : s >= 45 ? 'rgba(234,179,8,0.85)' : 'rgba(128,128,128,0.5)';

const WorkoutRow = ({
  workout,
  isHighlighted,
  prMap,
  prSessions,
  score,
  isDoubleDay,
}: {
  workout: WorkoutSession;
  isHighlighted: boolean;
  prMap: Record<string, { weight: number; date: string }>;
  prSessions: Set<string>;
  score?: number;
  isDoubleDay?: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);

  const date = workout.start_time.slice(0, 10);
  const time = workout.start_time.slice(11, 16);
  const hasPR = prSessions.has(workout.id);

  const mainExercises = workout.exercises.filter(
    (ex) => !['warm up', 'warmup'].includes(ex.name.toLowerCase())
  );

  return (
    <>
      <tr
        className={`${styles.workoutRow} ${isHighlighted ? styles.highlighted : ''}`}
        onClick={() => setExpanded((e) => !e)}
        style={{ cursor: 'pointer' }}
      >
        <td className={styles.expandIcon}>{expanded ? '▾' : '▸'}</td>
        <td className={styles.dateCell}>
          <div>{date}</div>
          <div className={styles.timeLabel}>{time}</div>
        </td>
        <td className={styles.titleCell}>
          {isDoubleDay && <span title="Double session day" style={{ marginRight: 4 }}>⚡</span>}
          {workout.title}
          {hasPR && <span className={styles.rowPrBadge}>★</span>}
          {score !== undefined && (
            <span style={{
              marginLeft: 6, fontSize: 10, fontWeight: 700,
              color: SCORE_COLOR(score), opacity: 0.9,
            }}>{score}</span>
          )}
        </td>
        <td className={styles.metaCell}>{formatDuration(workout.duration_seconds)}</td>
        <td className={styles.metaCell}>{mainExercises.length} exercises</td>
        <td className={styles.metaCell}>{workout.total_sets} sets</td>
        <td className={styles.metaCell}>
          {workout.total_volume_kg > 0
            ? `${workout.total_volume_kg.toLocaleString()} kg`
            : '—'}
        </td>
      </tr>
      {expanded && (
        <tr className={styles.detailRow}>
          <td colSpan={7}>
            <div className={styles.exerciseList}>
              {mainExercises.map((ex, i) => {
                const pr = prMap[ex.name];
                const maxInThisSession = Math.max(
                  ...ex.sets.map((s) => s.weight_kg ?? 0)
                );
                const isPRSession = !!(pr && pr.date === date && maxInThisSession === pr.weight);
                return (
                  <ExerciseDetail
                    key={i}
                    exercise={ex}
                    isPRSession={isPRSession}
                    prWeight={pr?.weight ?? 0}
                  />
                );
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// WorkoutTable
// ---------------------------------------------------------------------------
const INITIAL_VISIBLE = 50;

const WorkoutTable = ({ workouts, highlightDate, scoreMap, doubleSessionDates }: WorkoutTableProps) => {
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const filteredWorkouts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return workouts;
    return workouts.filter(
      (w) =>
        w.title.toLowerCase().includes(q) ||
        w.exercises.some((ex) => ex.name.toLowerCase().includes(q))
    );
  }, [workouts, search]);

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [search]);

  // When search is active show all results, otherwise paginate
  const visibleWorkouts = search.trim() ? filteredWorkouts : filteredWorkouts.slice(0, visibleCount);

  // Build PR map from the displayed workouts (chronological)
  const prMap = useMemo(() => buildPRMap(workouts), [workouts]);

  // Which workout sessions contain at least one PR
  const prSessions = useMemo(() => {
    const set = new Set<string>();
    [...workouts]
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .forEach((w) => {
        w.exercises.forEach((ex) => {
          const pr = prMap[ex.name];
          if (!pr) return;
          const maxInSession = Math.max(...ex.sets.map((s) => s.weight_kg ?? 0));
          if (maxInSession === pr.weight && w.start_time.slice(0, 10) === pr.date) {
            set.add(w.id);
          }
        });
      });
    return set;
  }, [workouts, prMap]);

  return (
    <div className={styles.tableContainer}>
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search by workout or exercise…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        <span className={styles.searchCount}>
          {search
            ? `${filteredWorkouts.length} / ${workouts.length}`
            : `显示 ${visibleWorkouts.length} / ${workouts.length}`}
        </span>
      </div>
      <table className={styles.workoutTable} cellSpacing="0" cellPadding="0">
        <thead>
          <tr>
            <th />
            <th>Date</th>
            <th>Workout</th>
            <th>Duration</th>
            <th>Exercises</th>
            <th>Sets</th>
            <th>Volume</th>
          </tr>
        </thead>
        <tbody>
          {visibleWorkouts.map((w) => (
            <WorkoutRow
              key={w.id}
              workout={w}
              isHighlighted={!!highlightDate && w.start_time.startsWith(highlightDate)}
              prMap={prMap}
              prSessions={prSessions}
              score={scoreMap?.[w.id]}
              isDoubleDay={doubleSessionDates?.has(w.start_time.slice(0, 10))}
            />
          ))}
        </tbody>
      </table>
      {!search.trim() && filteredWorkouts.length > visibleCount && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <button
            onClick={() => setVisibleCount((c) => c + INITIAL_VISIBLE)}
            style={{
              background: 'var(--wo-card-bg, rgba(255,255,255,0.04))',
              border: '1px solid rgba(128,128,128,0.2)',
              borderRadius: 10,
              padding: '8px 20px',
              fontSize: 13,
              cursor: 'pointer',
              color: 'inherit',
              opacity: 0.75,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.75'; }}
          >
            显示更多 ({filteredWorkouts.length - visibleCount} 条剩余)
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkoutTable;
