-- ============================================================================
-- Calixia Coach — initial schema
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- app_settings (single source of truth for trainer email)
-- ----------------------------------------------------------------------------
create table if not exists app_settings (
  key text primary key,
  value text not null
);
insert into app_settings (key, value)
values ('trainer_email', 'CHANGE_ME@example.com')
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- profiles (extends auth.users)
-- ----------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('trainer','client')),
  full_name text,
  email text not null,
  avatar_url text,
  goals text,
  height_cm numeric,
  starting_weight_kg numeric,
  training_history text,
  trainer_notes text,
  daily_calorie_target int,
  daily_protein_target_g int,
  daily_carbs_target_g int,
  daily_fat_target_g int,
  timezone text default 'America/New_York',
  created_at timestamptz default now()
);

create index if not exists profiles_role_idx on profiles(role);

-- ----------------------------------------------------------------------------
-- week_templates
-- ----------------------------------------------------------------------------
create table if not exists week_templates (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now()
);

create index if not exists week_templates_trainer_idx on week_templates(trainer_id);

create table if not exists template_workouts (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references week_templates(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  name text not null,
  description text
);

create index if not exists template_workouts_template_idx on template_workouts(template_id);

create table if not exists template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_workout_id uuid not null references template_workouts(id) on delete cascade,
  position int not null,
  name text not null,
  sets int,
  reps text,
  load text,
  tempo text,
  rest_seconds int,
  notes text,
  video_url text
);

create index if not exists template_exercises_workout_idx on template_exercises(template_workout_id);

-- ----------------------------------------------------------------------------
-- scheduled workouts (real dates, real clients)
-- ----------------------------------------------------------------------------
create table if not exists scheduled_workouts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id) on delete cascade,
  scheduled_date date not null,
  name text not null,
  description text,
  status text not null default 'pending' check (status in ('pending','completed','skipped')),
  difficulty_rating int check (difficulty_rating between 1 and 5),
  client_comment text,
  completed_at timestamptz,
  source_template_id uuid references week_templates(id) on delete set null,
  created_at timestamptz default now(),
  unique (client_id, scheduled_date)
);

create index if not exists scheduled_workouts_client_date_idx on scheduled_workouts(client_id, scheduled_date);

create table if not exists scheduled_exercises (
  id uuid primary key default gen_random_uuid(),
  scheduled_workout_id uuid not null references scheduled_workouts(id) on delete cascade,
  position int not null,
  name text not null,
  prescribed_sets int,
  prescribed_reps text,
  prescribed_load text,
  tempo text,
  rest_seconds int,
  notes text,
  video_url text
);

create index if not exists scheduled_exercises_workout_idx on scheduled_exercises(scheduled_workout_id);

create table if not exists exercise_logs (
  id uuid primary key default gen_random_uuid(),
  scheduled_exercise_id uuid not null references scheduled_exercises(id) on delete cascade,
  set_number int not null,
  completed_reps int,
  completed_load text,
  notes text,
  logged_at timestamptz default now()
);

create index if not exists exercise_logs_exercise_idx on exercise_logs(scheduled_exercise_id);
create unique index if not exists exercise_logs_unique_set on exercise_logs(scheduled_exercise_id, set_number);

-- ----------------------------------------------------------------------------
-- meals
-- ----------------------------------------------------------------------------
create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id) on delete cascade,
  meal_date date not null,
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  description text not null,
  calories int,
  protein_g int,
  carbs_g int,
  fat_g int,
  photo_url text,
  logged_at timestamptz default now()
);

create index if not exists meals_client_date_idx on meals(client_id, meal_date);

-- ----------------------------------------------------------------------------
-- messages
-- ----------------------------------------------------------------------------
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists messages_sender_idx on messages(sender_id);
create index if not exists messages_recipient_idx on messages(recipient_id);
create index if not exists messages_created_idx on messages(created_at desc);

-- ============================================================================
-- handle_new_user trigger
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trainer_email text;
  v_role text;
begin
  select value into v_trainer_email from public.app_settings where key = 'trainer_email';
  if new.email = v_trainer_email then
    v_role := 'trainer';
  else
    v_role := 'client';
  end if;
  insert into public.profiles (id, role, email, full_name)
  values (
    new.id,
    v_role,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- supabase_auth_admin executes the trigger; grant what it needs.
grant usage on schema public to supabase_auth_admin;
grant execute on function public.handle_new_user() to supabase_auth_admin;
grant select on public.app_settings to supabase_auth_admin;
grant insert, select on public.profiles to supabase_auth_admin;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- is_trainer helper
-- ============================================================================
create or replace function is_trainer()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'trainer'
  );
$$ language sql stable security definer;

-- ============================================================================
-- RLS
-- ============================================================================
alter table profiles enable row level security;
alter table app_settings enable row level security;
alter table week_templates enable row level security;
alter table template_workouts enable row level security;
alter table template_exercises enable row level security;
alter table scheduled_workouts enable row level security;
alter table scheduled_exercises enable row level security;
alter table exercise_logs enable row level security;
alter table meals enable row level security;
alter table messages enable row level security;

-- app_settings: trainer only
drop policy if exists app_settings_trainer_all on app_settings;
create policy app_settings_trainer_all on app_settings
  for all using (is_trainer()) with check (is_trainer());

-- profiles
drop policy if exists profiles_self_read on profiles;
create policy profiles_self_read on profiles
  for select using (id = auth.uid() or is_trainer());

drop policy if exists profiles_self_update on profiles;
create policy profiles_self_update on profiles
  for update using (id = auth.uid() or is_trainer())
  with check (id = auth.uid() or is_trainer());

drop policy if exists profiles_trainer_insert on profiles;
create policy profiles_trainer_insert on profiles
  for insert with check (is_trainer() or id = auth.uid());

drop policy if exists profiles_trainer_delete on profiles;
create policy profiles_trainer_delete on profiles
  for delete using (is_trainer());

-- Column protection for clients: prevent them from changing macros/notes/role
create or replace function prevent_client_field_changes()
returns trigger as $$
begin
  if is_trainer() then
    return new;
  end if;
  -- Client trying to modify their own row: lock down restricted fields
  if new.id = auth.uid() then
    new.role := old.role;
    new.trainer_notes := old.trainer_notes;
    new.daily_calorie_target := old.daily_calorie_target;
    new.daily_protein_target_g := old.daily_protein_target_g;
    new.daily_carbs_target_g := old.daily_carbs_target_g;
    new.daily_fat_target_g := old.daily_fat_target_g;
    new.email := old.email;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists profiles_lock_fields on profiles;
create trigger profiles_lock_fields
  before update on profiles
  for each row execute function prevent_client_field_changes();

-- week_templates / template_workouts / template_exercises: trainer only
drop policy if exists week_templates_trainer_all on week_templates;
create policy week_templates_trainer_all on week_templates
  for all using (is_trainer()) with check (is_trainer());

drop policy if exists template_workouts_trainer_all on template_workouts;
create policy template_workouts_trainer_all on template_workouts
  for all using (is_trainer()) with check (is_trainer());

drop policy if exists template_exercises_trainer_all on template_exercises;
create policy template_exercises_trainer_all on template_exercises
  for all using (is_trainer()) with check (is_trainer());

-- scheduled_workouts: client reads/updates own; trainer all
drop policy if exists scheduled_workouts_select on scheduled_workouts;
create policy scheduled_workouts_select on scheduled_workouts
  for select using (client_id = auth.uid() or is_trainer());

drop policy if exists scheduled_workouts_insert on scheduled_workouts;
create policy scheduled_workouts_insert on scheduled_workouts
  for insert with check (is_trainer());

drop policy if exists scheduled_workouts_update on scheduled_workouts;
create policy scheduled_workouts_update on scheduled_workouts
  for update using (client_id = auth.uid() or is_trainer())
  with check (client_id = auth.uid() or is_trainer());

drop policy if exists scheduled_workouts_delete on scheduled_workouts;
create policy scheduled_workouts_delete on scheduled_workouts
  for delete using (is_trainer());

-- scheduled_exercises: read if you can read the parent workout; trainer mutates
drop policy if exists scheduled_exercises_select on scheduled_exercises;
create policy scheduled_exercises_select on scheduled_exercises
  for select using (
    exists (
      select 1 from scheduled_workouts sw
      where sw.id = scheduled_workout_id
        and (sw.client_id = auth.uid() or is_trainer())
    )
  );

drop policy if exists scheduled_exercises_write on scheduled_exercises;
create policy scheduled_exercises_write on scheduled_exercises
  for all using (is_trainer()) with check (is_trainer());

-- exercise_logs: client CRUDs their own; trainer reads all
drop policy if exists exercise_logs_select on exercise_logs;
create policy exercise_logs_select on exercise_logs
  for select using (
    exists (
      select 1 from scheduled_exercises se
      join scheduled_workouts sw on sw.id = se.scheduled_workout_id
      where se.id = scheduled_exercise_id
        and (sw.client_id = auth.uid() or is_trainer())
    )
  );

drop policy if exists exercise_logs_insert on exercise_logs;
create policy exercise_logs_insert on exercise_logs
  for insert with check (
    exists (
      select 1 from scheduled_exercises se
      join scheduled_workouts sw on sw.id = se.scheduled_workout_id
      where se.id = scheduled_exercise_id
        and sw.client_id = auth.uid()
    ) or is_trainer()
  );

drop policy if exists exercise_logs_update on exercise_logs;
create policy exercise_logs_update on exercise_logs
  for update using (
    exists (
      select 1 from scheduled_exercises se
      join scheduled_workouts sw on sw.id = se.scheduled_workout_id
      where se.id = scheduled_exercise_id
        and (sw.client_id = auth.uid() or is_trainer())
    )
  ) with check (
    exists (
      select 1 from scheduled_exercises se
      join scheduled_workouts sw on sw.id = se.scheduled_workout_id
      where se.id = scheduled_exercise_id
        and (sw.client_id = auth.uid() or is_trainer())
    )
  );

drop policy if exists exercise_logs_delete on exercise_logs;
create policy exercise_logs_delete on exercise_logs
  for delete using (
    exists (
      select 1 from scheduled_exercises se
      join scheduled_workouts sw on sw.id = se.scheduled_workout_id
      where se.id = scheduled_exercise_id
        and (sw.client_id = auth.uid() or is_trainer())
    )
  );

-- meals: client CRUDs own; trainer reads all
drop policy if exists meals_select on meals;
create policy meals_select on meals
  for select using (client_id = auth.uid() or is_trainer());

drop policy if exists meals_insert on meals;
create policy meals_insert on meals
  for insert with check (client_id = auth.uid() or is_trainer());

drop policy if exists meals_update on meals;
create policy meals_update on meals
  for update using (client_id = auth.uid() or is_trainer())
  with check (client_id = auth.uid() or is_trainer());

drop policy if exists meals_delete on meals;
create policy meals_delete on meals
  for delete using (client_id = auth.uid() or is_trainer());

-- messages: must be sender or recipient
drop policy if exists messages_select on messages;
create policy messages_select on messages
  for select using (sender_id = auth.uid() or recipient_id = auth.uid() or is_trainer());

drop policy if exists messages_insert on messages;
create policy messages_insert on messages
  for insert with check (sender_id = auth.uid());

drop policy if exists messages_update on messages;
create policy messages_update on messages
  for update using (recipient_id = auth.uid() or is_trainer())
  with check (recipient_id = auth.uid() or is_trainer());

-- ============================================================================
-- Storage buckets (must be created via dashboard or by service role)
-- avatars, meal-photos
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('avatars','avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('meal-photos','meal-photos', true)
on conflict (id) do nothing;

-- Storage policies: authenticated users can upload to their own user-id folder
drop policy if exists "avatars_read_all" on storage.objects;
create policy "avatars_read_all" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_write_self" on storage.objects;
create policy "avatars_write_self" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_self" on storage.objects;
create policy "avatars_update_self" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "meal_photos_read_all" on storage.objects;
create policy "meal_photos_read_all" on storage.objects
  for select using (bucket_id = 'meal-photos');

drop policy if exists "meal_photos_write_self" on storage.objects;
create policy "meal_photos_write_self" on storage.objects
  for insert with check (
    bucket_id = 'meal-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
