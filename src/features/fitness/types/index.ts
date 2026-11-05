export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'quadriceps'
  | 'hamstrings'
  | 'calves'
  | 'glutes'
  | 'core';

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Peitoral',
  back: 'Costas / Dorsais',
  shoulders: 'Ombros (Deltoides)',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearms: 'Antebraços',
  quadriceps: 'Quadríceps (Coxas)',
  hamstrings: 'Posteriores de Coxa',
  calves: 'Panturrilhas',
  glutes: 'Glúteos',
  core: 'Abdômen & Core',
};

export interface Exercise {
  id: string;
  name: string;
  english_name?: string;
  target_muscle: MuscleGroup;
  secondary_muscles: MuscleGroup[];
  gif_url?: string;
  thumbnail_url?: string;
  category: 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight';
  instructions: string[];
  is_custom?: boolean;
}

export type ExerciseTechnique = 'normal' | 'biset' | 'superset' | 'dropset' | 'upset';

export interface WorkoutPlanExercise {
  id: string;
  exercise_id: string;
  exercise: Exercise;
  target_sets: number;
  min_reps: number;
  max_reps: number;
  order_index: number;
  rest_seconds?: number;
  technique?: ExerciseTechnique;
  technique_notes?: string;
}

export interface WorkoutPlanDay {
  id: string;
  plan_id: string;
  day_name: string; // Ex: "Treino A - Peito e Tríceps"
  order_index: number;
  exercises: WorkoutPlanExercise[];
}

export interface WorkoutPlan {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  duration_weeks: number;
  is_active: boolean;
  days: WorkoutPlanDay[];
  created_at: string;
}

export interface WorkoutSetLog {
  id: string;
  set_number: number;
  weight_kg: number;
  reps_performed: number;
  rpe?: number; // 1 a 10
  completed: boolean;
}

export interface ExerciseSessionLog {
  exercise_id: string;
  sets: WorkoutSetLog[];
}

export interface WorkoutSession {
  id: string;
  user_id?: string;
  plan_day_id?: string;
  plan_day_title: string;
  started_at: string;
  completed_at?: string;
  duration_minutes?: number;
  notes?: string;
  exercises_logs: Record<string, WorkoutSetLog[]>; // exercise_id -> sets
}

export interface BodyMeasurement {
  id: string;
  recorded_at: string;
  date?: string;
  weight_kg: number;
  height_cm?: number;
  body_fat_pct?: number;
  body_fat_percentage?: number;
  biceps_cm?: number;
  biceps_right_cm?: number;
  biceps_left_cm?: number;
  chest_cm?: number;
  shoulders_cm?: number;
  arms_cm?: number;
  arm_right_cm?: number;
  arm_left_cm?: number;
  waist_cm?: number;
  abdomen_cm?: number;
  glutes_cm?: number;
  thighs_cm?: number;
  thigh_right_cm?: number;
  thigh_left_cm?: number;
  calves_cm?: number;
  calf_right_cm?: number;
  calf_left_cm?: number;
  notes?: string;
}

export interface ProgressionInput {
  targetMinReps: number;
  targetMaxReps: number;
  lastSessionSets: Array<{ weight_kg: number; reps_performed: number }>;
  isUpperBody?: boolean;
}

export interface ProgressionRecommendation {
  suggestedWeight: number;
  suggestedWeightKg?: number;
  suggestedRepsTarget: number;
  rationale: string;
  reason?: string;
  status: 'INCREASE_WEIGHT' | 'INCREASE_REPS' | 'MAINTAIN' | 'DELOAD';
  shouldIncreaseWeight?: boolean;
}

export interface MuscleVolumeScore {
  muscle?: MuscleGroup;
  score: number; // 0 a 100
  totalVolumeLoad?: number;
  total_volume_kg?: number;
  totalSets?: number;
  total_sets_completed?: number;
  lastTrainedDaysAgo?: number;
  last_trained_date?: string;
}
