import { z } from "zod";

export const emailSchema = z.object({
  email: z.string().email("Enter a valid email."),
});
export type EmailInput = z.infer<typeof emailSchema>;

export const inviteClientSchema = z.object({
  full_name: z.string().min(1, "Name is required."),
  email: z.string().email("Enter a valid email."),
});
export type InviteClientInput = z.infer<typeof inviteClientSchema>;

export const mealSchema = z.object({
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  description: z.string().min(1, "Add a short description."),
  calories: z.coerce.number().int().nonnegative().optional().nullable(),
  protein_g: z.coerce.number().int().nonnegative().optional().nullable(),
  carbs_g: z.coerce.number().int().nonnegative().optional().nullable(),
  fat_g: z.coerce.number().int().nonnegative().optional().nullable(),
});
export type MealInput = z.infer<typeof mealSchema>;

export const profileSchema = z.object({
  full_name: z.string().min(1).optional().nullable(),
  goals: z.string().optional().nullable(),
  height_cm: z.coerce.number().positive().optional().nullable(),
  starting_weight_kg: z.coerce.number().positive().optional().nullable(),
  training_history: z.string().optional().nullable(),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const macrosSchema = z.object({
  daily_calorie_target: z.coerce.number().int().nonnegative().optional().nullable(),
  daily_protein_target_g: z.coerce.number().int().nonnegative().optional().nullable(),
  daily_carbs_target_g: z.coerce.number().int().nonnegative().optional().nullable(),
  daily_fat_target_g: z.coerce.number().int().nonnegative().optional().nullable(),
});
export type MacrosInput = z.infer<typeof macrosSchema>;

export const templateExerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.coerce.number().int().positive().optional().nullable(),
  reps: z.string().optional().nullable(),
  load: z.string().optional().nullable(),
  tempo: z.string().optional().nullable(),
  rest_seconds: z.coerce.number().int().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
  video_url: z.string().url().optional().nullable().or(z.literal("")),
});
export type TemplateExerciseInput = z.infer<typeof templateExerciseSchema>;

export const messageSchema = z.object({
  body: z.string().min(1).max(4000),
});
export type MessageInput = z.infer<typeof messageSchema>;
