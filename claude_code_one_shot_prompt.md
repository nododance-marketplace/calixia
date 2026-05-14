# Calixia Coach — Claude Code One-Shot Prompt

> Copy everything below the `---` line into Claude Code. It is written to be executable in a single pass.

---

You are building **Calixia Coach**, a personal-training web app for a calisthenics coach and his clients. Ship a working, deployable Next.js + Supabase app in this single session. Take your time, do it right, and surface clarifying questions only when truly blocked.

## 1. Product summary

Calixia Coach is a private coaching app. One trainer (the app owner) assigns workouts and nutrition targets to his clients; clients log their workouts and meals; both sides message each other. It's a pared-down spiritual cousin of Trainerize/Everfit, scoped to one trainer.

- **Roles:** `trainer` (one, hardcoded by env email) and `client` (invite-only).
- **Auth:** Magic-link only (Supabase Auth). No passwords. No OAuth. Clients cannot self-register.
- **Form factor:** Single Next.js web app, mobile-first, PWA-installable.

## 2. Tech stack (use exactly these)

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Supabase** for Postgres, Auth (magic link), Realtime (messaging), Storage (avatars, meal photos)
- **shadcn/ui** components (install on demand)
- **lucide-react** for icons
- **date-fns** for date math
- **react-hook-form** + **zod** for forms and validation
- **@supabase/ssr** for server-side auth helpers
- **next-pwa** (or equivalent) to make the app installable

Deployment target: **Vercel**. Make sure the project is Vercel-ready.

## 3. Branding (non-negotiable — follow exactly)

- **Dark mode only.** Do not implement a light/dark toggle.
- **Palette (define as Tailwind theme tokens and CSS variables):**
  - `--background` (page background): `#0F1419`
  - `--surface` (cards, panels): `#1A1F26`
  - `--surface-2` (hover, elevated): `#222932`
  - `--border`: `#2A323D`
  - `--accent` (turquoise): `#5FF6F0`
  - `--accent-hover`: `#7EFFFA`
  - `--text-primary`: `#E8EEF2`
  - `--text-secondary`: `#8B95A1`
  - `--success`: `#5FF6A8`
  - `--danger`: `#F66F6F`
- **Typography:** Use Inter from Google Fonts. Headings: light weight (300–400), tight letter-spacing. The aesthetic in the existing brand assets is airy and technical, not heavy.
- **Logo assets** (place in `/public/brand/`):
  - `calixia_wordmark.png` — header logo (turquoise wordmark on transparent)
  - `calixia_square.png` — favicon / PWA icon (square logo)
  - `calixia_helmet_hero.png` — hero image on the login page
  - Note: the user will drop these files into `/public/brand/` from their existing brand folder. Reference them by those paths.
- **Tagline:** "Calisthenics · Xtended · Intelligent · Assistant" — render small under the wordmark on login.
- **Tone of voice in copy:** calm, direct, confident, no exclamation marks, no hype. Examples: "Today's session." "Mark complete." "How hard was it?" Not "Crush your workout!"

## 4. Data model (Supabase Postgres)

Generate a single SQL migration file at `supabase/migrations/0001_init.sql` that creates the schema below. Use `uuid` primary keys (default `gen_random_uuid()`), `created_at timestamptz default now()`, and add appropriate indexes on foreign keys and date columns.

```sql
-- Extends auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('trainer','client')),
  full_name text,
  email text not null,
  avatar_url text,
  goals text,
  height_cm numeric,
  starting_weight_kg numeric,
  training_history text,
  trainer_notes text, -- private to trainer; never returned to client
  daily_calorie_target int,
  daily_protein_target_g int,
  daily_carbs_target_g int,
  daily_fat_target_g int,
  timezone text default 'America/New_York',
  created_at timestamptz default now()
);

-- A reusable week (Mon–Sun) of workouts
create table week_templates (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- Workouts inside a template, slotted to a day of the week (0=Mon..6=Sun)
create table template_workouts (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references week_templates(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  name text not null,
  description text
);

-- Exercises inside a template workout
create table template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_workout_id uuid not null references template_workouts(id) on delete cascade,
  position int not null,
  name text not null,
  sets int,
  reps text, -- text so we can store '8-10' or 'max'
  load text, -- text so we can store 'bodyweight', '20kg', 'band'
  tempo text,
  rest_seconds int,
  notes text,
  video_url text
);

-- Workouts assigned to a real date for a real client (copied from a template at assignment time)
create table scheduled_workouts (
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
  unique (client_id, scheduled_date) -- one workout per client per day in v1
);

create table scheduled_exercises (
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

-- One row per set actually performed
create table exercise_logs (
  id uuid primary key default gen_random_uuid(),
  scheduled_exercise_id uuid not null references scheduled_exercises(id) on delete cascade,
  set_number int not null,
  completed_reps int,
  completed_load text,
  notes text,
  logged_at timestamptz default now()
);

create table meals (
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

create table messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- Trigger: when a new auth user is created, insert a profile.
-- The trainer email (from env via a settings table or hard-check) becomes 'trainer'; everyone else is 'client'.
create table app_settings (
  key text primary key,
  value text not null
);
-- The migration should INSERT a row: ('trainer_email', '<placeholder>') that the user fills in.
```

### Row-Level Security
Enable RLS on every table. Write policies so that:

- **Trainer** can do everything (read + write) on all tables.
- **Client** can:
  - read and update their own row in `profiles` (but not `trainer_notes` or any `*_target_*` columns — enforce via column-level grants or a `profiles_public` view).
  - read their own `scheduled_workouts`, `scheduled_exercises`, and `exercise_logs`; insert/update `exercise_logs` for their own scheduled workouts; update `status`, `difficulty_rating`, `client_comment`, `completed_at` on their own `scheduled_workouts`.
  - CRUD their own `meals`.
  - read and insert `messages` where they are either `sender_id` or `recipient_id`, with the trainer as the other side.
  - read `week_templates`/`template_*`/`app_settings`: deny.

Detect "is trainer" by checking `(select role from profiles where id = auth.uid()) = 'trainer'`. Create a SQL helper function `is_trainer()` to keep policies tidy.

### Trigger to auto-create profile

```sql
create or replace function handle_new_user()
returns trigger as $$
declare
  trainer_email text;
begin
  select value into trainer_email from app_settings where key = 'trainer_email';
  insert into profiles (id, role, email, full_name)
  values (
    new.id,
    case when new.email = trainer_email then 'trainer' else 'client' end,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

## 5. Routes & pages

Use the App Router. Pages live under `app/`. Mark all `/app/**` and `/admin/**` routes as protected via middleware that checks Supabase session.

```
app/
  layout.tsx                     -- root layout (dark theme, fonts, PWA meta)
  page.tsx                       -- redirects to /login if no session, else routes by role
  login/
    page.tsx                     -- magic link form (email input), hero image, wordmark, tagline
  auth/
    callback/route.ts            -- handles the magic-link callback
  (client)/
    layout.tsx                   -- client-facing shell with bottom nav (Today / Calendar / Nutrition / Messages / Profile)
    today/page.tsx
    calendar/page.tsx
    workout/[id]/page.tsx        -- logging interface
    nutrition/page.tsx           -- today's meals, log meal modal
    nutrition/history/page.tsx   -- past 14 days summary
    messages/page.tsx
    profile/page.tsx
  (admin)/
    layout.tsx                   -- trainer shell with side nav (Dashboard / Clients / Templates / Messages)
    admin/page.tsx               -- dashboard summary
    admin/clients/page.tsx
    admin/clients/new/page.tsx   -- invite a client (name + email)
    admin/clients/[id]/page.tsx  -- client profile, notes, macros, recent activity
    admin/clients/[id]/calendar/page.tsx -- assign workouts to this client
    admin/templates/page.tsx
    admin/templates/new/page.tsx
    admin/templates/[id]/page.tsx -- edit template (days of week, workouts, exercises)
    admin/messages/page.tsx
    admin/messages/[clientId]/page.tsx
```

Middleware (`middleware.ts`) enforces:
- Unauthed users → `/login` (except `/auth/callback`, `/login`, static assets).
- Authed clients accessing `/admin/**` → redirect to `/today`.
- Authed trainer accessing `/(client)/**` → redirect to `/admin`.
- Authed users hitting `/` → redirect to `/today` (client) or `/admin` (trainer).

## 6. Feature behavior

### 6.1 Login
- Single email input. Submit → Supabase `signInWithOtp({ email, options: { emailRedirectTo: ${origin}/auth/callback } })`.
- Show "Check your email" confirmation state on submit.
- Below the form, display the helmet hero image and the tagline.

### 6.2 Client — Today view
- Header: greeting ("Good morning, {first_name}.") and today's date.
- Card: today's scheduled workout name, exercise count, est. duration if available. Tap → workout detail page.
- If no workout: "Rest day." muted text.
- Below: nutrition snapshot — today's totals vs. targets, "Log a meal" CTA.
- Below: messages snapshot — last message preview + unread badge.
- Adherence widget: "This week: 2/3 completed" with small dots for M/W/F.

### 6.3 Client — Calendar
- Horizontal scroll of the 7 days of this week (Mon–Sun). Today highlighted.
- Tap a day → that day's workout detail. Days without a scheduled workout show "Rest" and aren't tappable.
- "This week" only — no scrolling to future weeks.

### 6.4 Client — Workout detail (logging)
- Top: workout name, prescribed description, status pill (pending/completed/skipped).
- For each `scheduled_exercise` (ordered by `position`):
  - Show prescribed: sets × reps @ load, tempo, rest, notes, video link (if any).
  - For each prescribed set, render a row with inputs for `completed_reps` and `completed_load`. Save on blur → upsert into `exercise_logs`.
- Sticky bottom bar: 1–5 difficulty stars, expandable text comment, two buttons: **Mark complete** and **Mark skipped**. On submit, set `status`, `difficulty_rating`, `client_comment`, `completed_at` and route back to Today.

### 6.5 Client — Nutrition
- Today view by default. Four sections: Breakfast, Lunch, Dinner, Snacks.
- Each section: "+ Add meal" button → modal with description (text), calories, protein, carbs (optional), fat (optional). Optional photo upload to Supabase storage (bucket `meal-photos`).
- Top of page: daily totals card showing kcal / protein / carbs / fat vs. targets, with progress bars.
- History tab: list of past 14 days, one row per day with totals + dot indicators if targets hit.

### 6.6 Client — Messages
- Single thread with trainer. Bubble UI. Trainer messages left, own messages right.
- Subscribe to Supabase Realtime for live updates.
- Mark inbound messages as read on view.
- Composer at bottom (textarea + send button).

### 6.7 Client — Profile
- Editable: full_name, goals, height_cm, starting_weight_kg, training_history, avatar (upload to `avatars` bucket).
- Read-only: email, macros targets (with a small "Set by your coach" note).

### 6.8 Trainer — Dashboard (`/admin`)
- Top cards: # active clients, # workouts completed this week across all clients, unread messages count.
- Recent activity feed (last 20 events): "{Client} completed {Workout} • 2h ago • rated 4/5". Each item links to the client.

### 6.9 Trainer — Clients list (`/admin/clients`)
- Card per client: avatar, name, this-week adherence (e.g. "2/3"), last activity timestamp, unread message badge.
- Top-right: **+ Invite client** → `/admin/clients/new`.

### 6.10 Trainer — Invite client (`/admin/clients/new`)
- Form: full_name, email. Submit → Supabase admin invite (`supabase.auth.admin.inviteUserByEmail(email, { data: { full_name } })`). This sends a magic-link email and creates the auth user; the `handle_new_user` trigger creates the profile as a client.
- Use a server action with the Supabase **service role key** (server-only env var). Never expose service role to the client.

### 6.11 Trainer — Client detail (`/admin/clients/[id]`)
- Tabs: **Overview**, **Workouts**, **Nutrition**, **Notes**.
- Overview: profile info, macros targets (editable here), recent feedback (last 5 completed workouts with rating + comment), recent nutrition logs.
- Workouts: list of scheduled workouts (next 7 days + last 14). Each links to a read-only view of what the client saw / logged.
- Nutrition: last 14 days, same shape as the client's history view.
- Notes: textarea for `trainer_notes` (private). Autosave.
- Top buttons: **Message** (→ messages thread), **Assign workouts** (→ calendar page).

### 6.12 Trainer — Assign workouts to client (`/admin/clients/[id]/calendar`)
- Calendar grid (this month + ability to flip months).
- Sidebar: list of week templates. Select one, then pick a Monday on the calendar → assign.
- On assign: read the template's `template_workouts` and `template_exercises`, create `scheduled_workouts` and `scheduled_exercises` for that client with `scheduled_date` set to the Monday + day_of_week. Skip dates already assigned (alert the trainer if there's a conflict).
- Click an existing scheduled workout → drawer to edit just that one workout for this client (rename, edit exercises). Edits do not touch the original template.

### 6.13 Trainer — Templates (`/admin/templates`)
- List of templates with name, description, # workouts. New template button.

### 6.14 Trainer — Template editor (`/admin/templates/[id]`)
- Tabs across the top: Mon | Tue | Wed | Thu | Fri | Sat | Sun. Each tab either shows the workout for that day or an empty state with "Add workout" button.
- A workout has: name, description, ordered list of exercises with fields {name, sets, reps, load, tempo, rest_seconds, notes, video_url}. Drag to reorder (use dnd-kit if convenient, otherwise up/down arrows). Add / remove exercises inline. Save is automatic on field blur.

### 6.15 Trainer — Messages (`/admin/messages`, `/admin/messages/[clientId]`)
- List view: one row per client (sorted by last message timestamp), with unread indicator.
- Thread view: same bubble UI as client side, with Realtime subscription. Composer at bottom.

## 7. Components & UX rules

- Mobile-first. Bottom nav for client (5 icons: Today, Calendar, Nutrition, Messages, Profile). Side nav for admin on `md:` and up; bottom nav on small screens.
- Rounded corners: `rounded-2xl` for cards, `rounded-full` for pills/buttons.
- Buttons: primary is solid turquoise on dark, with `text-[#0F1419]`. Secondary is outlined with the accent color.
- Form inputs: dark surface, 1px border that turns turquoise on focus.
- Loading: subtle pulse on skeleton cards. No spinner overlays.
- Empty states are first-class — every list view should have a clean empty state with a one-line copy and an action.

## 8. PWA & metadata

- Add a `manifest.json` with name "Calixia Coach", short_name "Calixia", theme_color `#0F1419`, background_color `#0F1419`, display `standalone`, icon `/brand/calixia_square.png` at 192 and 512.
- Add `<meta name="theme-color" content="#0F1419">` in the root layout.
- Apple touch icon: same square logo.

## 9. Seed data

Create `supabase/seed.sql` that inserts ONE week template based on the existing Beginner Foundations PDF:

- Template name: "Beginner Foundations — Week 1", description "3 sessions, Monday / Wednesday / Friday."
- Monday workout: "Session One — Foundations"
  - Push: Wall pushup 3×8–10; Incline pushup, chest-height bar 3×6–8
  - Pull: Australian pull-up 3×8; Band pull-apart or face pull 3×12
  - Legs: Hip thrust (shoulders on bench) 3×10; Ass-to-ground squat (pole assist if needed) 3×8
  - Core: Dead bug 3×6/side; Hollow body hold 3×15–20s
- Wednesday workout: "Session Two — Tempo"
  - Push: Incline pushup on bench 3×6–8; Wall pushup, 3-sec eccentric 3×6
  - Pull: Dead hang from bar 3×max comfortable; Leaning band row, scap focus 3×10
  - Legs: Bulgarian split squat 3×6/leg; Single-leg glute bridge 3×8/leg
  - Core: Bird dog 3×6/side; Side plank on knee 3×15–20s/side
- Friday workout: "Session Three — Unilateral"
  - Push: Knee pushup 3×6; Pike pushup against wall (shallow) 3×5
  - Pull: Australian pull-up, feet further forward 3×6; Single-arm ring/TRX row 3×8/arm
  - Legs: Assisted pistol squat (pole/TRX) 3×3–5/leg; Hip thrust, 2-sec pause at top 3×8
  - Core: Knee plank 3×20–30s; Heel taps 3×10/side

The seed should be safe to run multiple times (use `on conflict do nothing` or wrap in checks).

## 10. Environment variables

Create `.env.example` documenting:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
TRAINER_EMAIL=
```

The `TRAINER_EMAIL` is the single source of truth for who is the trainer. The migration's `app_settings` row should be set during setup via a small one-time script (`scripts/set-trainer.ts`) that reads `TRAINER_EMAIL` and upserts the row.

## 11. Project structure

```
/app                  -- Next.js routes
/components           -- shared UI
/components/ui        -- shadcn components
/lib
  /supabase
    client.ts         -- browser client
    server.ts         -- server client
    middleware.ts     -- session helper
  utils.ts
  validations.ts      -- zod schemas
/public/brand         -- the logo & hero files
/supabase
  /migrations/0001_init.sql
  seed.sql
/scripts/set-trainer.ts
/types/database.types.ts -- run `supabase gen types` later
middleware.ts
next.config.js
tailwind.config.ts
postcss.config.js
README.md
```

## 12. README

The README must include, in plain language:

1. What this app is.
2. One-time setup:
   - Create a Supabase project at supabase.com.
   - Copy URL + anon key + service role key into `.env.local`.
   - Set `TRAINER_EMAIL` to the coach's email.
   - Run `supabase db push` (or paste the migration into the Supabase SQL editor).
   - Run `npx tsx scripts/set-trainer.ts`.
   - Run `npx supabase db seed` (or paste `seed.sql`).
   - Run `npm install` then `npm run dev`.
   - Open localhost:3000, log in with the trainer email, magic-link arrives, click it.
3. Inviting the first client:
   - Go to /admin/clients/new, enter their name and email, submit.
   - They receive a magic-link email and are taken straight into the app on first click.
4. Deploying to Vercel:
   - Push to GitHub, import in Vercel, paste env vars, deploy.
   - Set `NEXT_PUBLIC_SITE_URL` to the production URL.
   - In Supabase Auth settings, add the production URL to "Site URL" and "Redirect URLs".

## 13. Code quality bar

- Strict TypeScript, no `any` unless commented.
- Server components for data fetching where possible; client components only for interactivity.
- Use server actions for mutations.
- All forms use react-hook-form + zod.
- Errors surface as toast notifications, not blank pages.
- Mobile-first: every page must be usable at 375px width without horizontal scroll.

## 14. Test as you go

After scaffolding:
1. `npm run build` must pass.
2. `npm run dev` must boot.
3. Verify the login page renders with the helmet image and wordmark.
4. Verify protected routes redirect to `/login`.

Do not ask the user to run anything until the build is clean.

## 15. Final notes

- The brand assets are not in the repo yet — leave clear placeholder `<img src="/brand/calixia_wordmark.png" />` references and the README tells the user to copy three files into `/public/brand/`.
- This is v1. Resist scope creep. If you find yourself wanting to add features not in this brief (progress photos, lift tracking, group messaging, etc.) — don't. They are explicitly out.
- Optimize for the path: trainer invites client → trainer assigns workout → client logs workout → trainer sees the log. That path must be flawless.

Begin.
