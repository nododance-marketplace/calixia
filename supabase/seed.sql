-- ============================================================================
-- Seed: Beginner Foundations week template
-- Safe to run multiple times.
-- ============================================================================

do $$
declare
  v_trainer_id uuid;
  v_template_id uuid;
  v_mon_id uuid;
  v_wed_id uuid;
  v_fri_id uuid;
begin
  -- Find the trainer profile. If none exists yet, exit cleanly.
  select id into v_trainer_id from profiles where role = 'trainer' limit 1;
  if v_trainer_id is null then
    raise notice 'No trainer profile found. Log in as the trainer once, then re-run seed.';
    return;
  end if;

  -- Skip if the template already exists for this trainer
  select id into v_template_id
  from week_templates
  where trainer_id = v_trainer_id
    and name = 'Beginner Foundations — Week 1'
  limit 1;

  if v_template_id is not null then
    raise notice 'Beginner Foundations seed already present, skipping.';
    return;
  end if;

  insert into week_templates (trainer_id, name, description)
  values (v_trainer_id, 'Beginner Foundations — Week 1', '3 sessions, Monday / Wednesday / Friday.')
  returning id into v_template_id;

  -- ---------------- Monday ----------------
  insert into template_workouts (template_id, day_of_week, name, description)
  values (v_template_id, 0, 'Session One — Foundations', 'Full-body foundations: push, pull, legs, core.')
  returning id into v_mon_id;

  insert into template_exercises (template_workout_id, position, name, sets, reps, load, rest_seconds, notes) values
    (v_mon_id, 1, 'Wall pushup', 3, '8-10', 'bodyweight', 60, 'Hands at chest height, slow tempo.'),
    (v_mon_id, 2, 'Incline pushup, chest-height bar', 3, '6-8', 'bodyweight', 60, 'Bar or solid surface around chest height.'),
    (v_mon_id, 3, 'Australian pull-up', 3, '8', 'bodyweight', 90, 'Body straight, chest to bar.'),
    (v_mon_id, 4, 'Band pull-apart or face pull', 3, '12', 'band', 60, 'Slow, controlled.'),
    (v_mon_id, 5, 'Hip thrust (shoulders on bench)', 3, '10', 'bodyweight', 75, 'Pause briefly at top.'),
    (v_mon_id, 6, 'Ass-to-ground squat (pole assist if needed)', 3, '8', 'bodyweight', 90, 'Use a pole or doorframe for balance.'),
    (v_mon_id, 7, 'Dead bug', 3, '6/side', 'bodyweight', 45, 'Low back pressed into floor.'),
    (v_mon_id, 8, 'Hollow body hold', 3, '15-20s', 'bodyweight', 45, 'Lower back stays flat.');

  -- ---------------- Wednesday ----------------
  insert into template_workouts (template_id, day_of_week, name, description)
  values (v_template_id, 2, 'Session Two — Tempo', 'Slow eccentrics and scapular control.')
  returning id into v_wed_id;

  insert into template_exercises (template_workout_id, position, name, sets, reps, load, tempo, rest_seconds, notes) values
    (v_wed_id, 1, 'Incline pushup on bench', 3, '6-8', 'bodyweight', null, 60, null),
    (v_wed_id, 2, 'Wall pushup, 3-sec eccentric', 3, '6', 'bodyweight', '3-0-1', 60, '3 seconds down, 1 up.'),
    (v_wed_id, 3, 'Dead hang from bar', 3, 'max comfortable', 'bodyweight', null, 90, 'Stop with 2 reps in reserve.'),
    (v_wed_id, 4, 'Leaning band row, scap focus', 3, '10', 'band', null, 60, 'Focus on retracting shoulder blades.'),
    (v_wed_id, 5, 'Bulgarian split squat', 3, '6/leg', 'bodyweight', null, 75, 'Back foot elevated.'),
    (v_wed_id, 6, 'Single-leg glute bridge', 3, '8/leg', 'bodyweight', null, 60, null),
    (v_wed_id, 7, 'Bird dog', 3, '6/side', 'bodyweight', null, 45, 'Hold each rep 2 seconds.'),
    (v_wed_id, 8, 'Side plank on knee', 3, '15-20s/side', 'bodyweight', null, 45, null);

  -- ---------------- Friday ----------------
  insert into template_workouts (template_id, day_of_week, name, description)
  values (v_template_id, 4, 'Session Three — Unilateral', 'Single-side strength and stability.')
  returning id into v_fri_id;

  insert into template_exercises (template_workout_id, position, name, sets, reps, load, rest_seconds, notes) values
    (v_fri_id, 1, 'Knee pushup', 3, '6', 'bodyweight', 60, null),
    (v_fri_id, 2, 'Pike pushup against wall (shallow)', 3, '5', 'bodyweight', 75, 'Shallow angle to start.'),
    (v_fri_id, 3, 'Australian pull-up, feet further forward', 3, '6', 'bodyweight', 90, 'Harder variation.'),
    (v_fri_id, 4, 'Single-arm ring/TRX row', 3, '8/arm', 'bodyweight', 75, null),
    (v_fri_id, 5, 'Assisted pistol squat (pole/TRX)', 3, '3-5/leg', 'bodyweight', 90, 'Use a pole or TRX for assist.'),
    (v_fri_id, 6, 'Hip thrust, 2-sec pause at top', 3, '8', 'bodyweight', 75, '2-second pause at the top.'),
    (v_fri_id, 7, 'Knee plank', 3, '20-30s', 'bodyweight', 45, null),
    (v_fri_id, 8, 'Heel taps', 3, '10/side', 'bodyweight', 45, null);

  raise notice 'Seeded Beginner Foundations — Week 1.';
end $$;
