export type SetType = 'normal' | 'warmup' | 'dropset' | 'failure';
export type WorkoutSource = 'hevy' | 'strong' | 'fitbod' | 'generic';

export interface WorkoutSet {
  index: number;
  type: SetType;
  weight_kg?: number;
  reps?: number;
  distance_km?: number;
  duration_seconds?: number;
  rpe?: number;
}

export interface WorkoutExercise {
  name: string;
  notes?: string;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  title: string;
  start_time: string;       // ISO 8601: "2026-03-09T20:12:00"
  end_time: string;
  duration_seconds: number;
  description?: string;
  source: WorkoutSource;
  exercises: WorkoutExercise[];
  total_volume_kg: number;  // sum of weight * reps for normal/dropset/failure sets
  total_sets: number;
  exercise_count: number;
}
