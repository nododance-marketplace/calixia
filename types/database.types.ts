// Hand-authored types matching supabase/migrations/0001_init.sql.
// Replace with `supabase gen types typescript` output once the project is linked.

export type Role = "trainer" | "client";
export type WorkoutStatus = "pending" | "completed" | "skipped";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface Profile {
  id: string;
  role: Role;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  goals: string | null;
  height_cm: number | null;
  starting_weight_kg: number | null;
  training_history: string | null;
  trainer_notes: string | null;
  daily_calorie_target: number | null;
  daily_protein_target_g: number | null;
  daily_carbs_target_g: number | null;
  daily_fat_target_g: number | null;
  timezone: string | null;
  created_at: string;
}

export interface WeekTemplate {
  id: string;
  trainer_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface TemplateWorkout {
  id: string;
  template_id: string;
  day_of_week: number;
  name: string;
  description: string | null;
}

export interface TemplateExercise {
  id: string;
  template_workout_id: string;
  position: number;
  name: string;
  sets: number | null;
  reps: string | null;
  load: string | null;
  tempo: string | null;
  rest_seconds: number | null;
  notes: string | null;
  video_url: string | null;
}

export interface ScheduledWorkout {
  id: string;
  client_id: string;
  scheduled_date: string;
  name: string;
  description: string | null;
  status: WorkoutStatus;
  difficulty_rating: number | null;
  client_comment: string | null;
  completed_at: string | null;
  source_template_id: string | null;
  created_at: string;
}

export interface ScheduledExercise {
  id: string;
  scheduled_workout_id: string;
  position: number;
  name: string;
  prescribed_sets: number | null;
  prescribed_reps: string | null;
  prescribed_load: string | null;
  tempo: string | null;
  rest_seconds: number | null;
  notes: string | null;
  video_url: string | null;
}

export interface ExerciseLog {
  id: string;
  scheduled_exercise_id: string;
  set_number: number;
  completed_reps: number | null;
  completed_load: string | null;
  notes: string | null;
  logged_at: string;
}

export interface Meal {
  id: string;
  client_id: string;
  meal_date: string;
  meal_type: MealType;
  description: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  photo_url: string | null;
  logged_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}
