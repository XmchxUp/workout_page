import { useMemo } from 'react';
import workouts from '@/static/workouts.json';
import { WorkoutSession } from '@/types/workout';

const allWorkouts = workouts as WorkoutSession[];

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
