import { useMemo } from 'react';
import workouts from '@/static/workouts.json';
import type { WorkoutSession } from '@/types/workout';

const RAW_WORKOUTS = workouts as WorkoutSession[];

const MONTH_INDEX: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

const formatLocalDateTime = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;

const parseWorkoutDateTime = (value: string): Date | null => {
  const sourceMatch = value.match(/^([A-Z][a-z]{2}) (\d{1,2}), (\d{4}), (\d{1,2}):(\d{2}) (AM|PM)$/);
  if (sourceMatch) {
    const [, monthLabel, day, year, hour12, minute, meridiem] = sourceMatch;
    const monthIndex = MONTH_INDEX[monthLabel];
    if (monthIndex === undefined) return null;
    const hour = Number(hour12) % 12 + (meridiem === 'PM' ? 12 : 0);
    return new Date(Number(year), monthIndex, Number(day), hour, Number(minute), 0, 0);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeDateTime = (value: string): string => {
  const parsed = parseWorkoutDateTime(value);
  return parsed ? formatLocalDateTime(parsed) : value;
};

const resolveDurationSeconds = (workout: WorkoutSession): number => {
  if (workout.duration_seconds > 0) return workout.duration_seconds;

  const start = parseWorkoutDateTime(workout.start_time);
  const end = parseWorkoutDateTime(workout.end_time);
  if (!start || !end) return 0;

  const diffSeconds = Math.round((end.getTime() - start.getTime()) / 1000);
  return diffSeconds > 0 ? diffSeconds : 0;
};

const allWorkouts = RAW_WORKOUTS.map((workout) => ({
  ...workout,
  start_time: normalizeDateTime(workout.start_time),
  end_time: normalizeDateTime(workout.end_time),
  duration_seconds: resolveDurationSeconds(workout),
}))
.sort((a:WorkoutSession, b:WorkoutSession) => (new Date(b.start_time)).getTime() - (new Date(a.start_time)).getTime());

const useWorkouts = () => {
  const processedData = useMemo(() => {
    const years: Set<string> = new Set();

    allWorkouts.forEach((w) => {
      const year = w.start_time.slice(0, 4);
      years.add(year);
    });

    const yearsArray = [...years].sort().reverse();
    const thisYear = yearsArray[0] || '';

    return {
      workouts: allWorkouts,
      years: yearsArray,
      thisYear,
    };
  }, []);

  return processedData;
};

export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export default useWorkouts;
