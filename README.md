# Calixia Coach

A private coaching app for one trainer and their clients. The trainer assigns workouts and macros; clients log workouts and meals; both sides message each other.

Built with Next.js 14 (App Router), TypeScript, Tailwind, Supabase (Postgres + Auth + Realtime + Storage), and shadcn-style components.

---

## One-time setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Copy environment variables** into a new `.env.local` file at the project root:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   TRAINER_EMAIL=you@example.com
   ```
   `TRAINER_EMAIL` is the email of the single trainer account. Anyone signing in with that email is promoted to `trainer`; every other invited user becomes a `client`.

3. **Apply the migration.** Open the Supabase dashboard → SQL editor → paste and run the contents of `supabase/migrations/0001_init.sql`. It creates the schema, RLS policies, the `handle_new_user` trigger, and the `avatars` / `meal-photos` storage buckets.

4. **Set the trainer email** in `app_settings`:
   ```bash
   npm install
   npm run set-trainer
   ```
   This upserts the row `('trainer_email', '<your email>')` so the `handle_new_user` trigger knows which incoming auth user is the trainer.

5. **Seed the starter template** (optional but recommended). Sign in once as the trainer (step 7 below) so a `profiles` row exists with `role = 'trainer'`, then paste and run `supabase/seed.sql` in the SQL editor. It inserts the Beginner Foundations week (Mon/Wed/Fri).

6. **Configure Auth redirects** in Supabase → Authentication → URL Configuration:
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs:** `http://localhost:3000/auth/callback`
   - Add the production URL too once you deploy.

7. **Start the dev server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000), log in with the trainer email, click the magic-link in your inbox, and you're in.

8. **Add brand assets**. The app expects three files under `public/brand/`:
   - `calixia_square.png` — square logo / PWA icon
   - `calixia_wordmark.png` — header logo (used on login + nav)
   - `calixia_helmet_hero.png` — hero image on the login page

   Defaults are already copied in. Replace any of them with your own preferred crop or background-transparent version.

---

## Inviting clients

1. Go to **/admin/clients/new**.
2. Enter the client's name and email and submit.
3. They receive a magic-link email and land in the app on first click. The `handle_new_user` trigger creates their `profiles` row as `client`.
4. Open their client detail page to set macros, assign workouts, and message them.

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import the project in Vercel and add the same env vars from `.env.local`, including `SUPABASE_SERVICE_ROLE_KEY`.
3. Set `NEXT_PUBLIC_SITE_URL` to the production URL (e.g. `https://calixia.vercel.app`).
4. In Supabase → Auth → URL Configuration, add the production URL to **Site URL** and as a **Redirect URL**.
5. Deploy.

The app is installable as a PWA on mobile — use the browser's "Add to Home Screen" prompt.

---

## Project layout

```
app/                    Next.js App Router routes
  (client)/             Client-facing routes (bottom-nav shell)
  (admin)/              Trainer-facing routes (side-nav shell)
  auth/callback/        Magic-link callback handler
  login/                Login page
components/             Shared UI
lib/supabase/           Browser, server, middleware Supabase clients
lib/                    Utilities, zod schemas
supabase/migrations/    Schema + RLS + triggers
supabase/seed.sql       Beginner Foundations week template
public/brand/           Logo + hero image
scripts/                One-off Node scripts (set-trainer, etc.)
types/                  TypeScript types matching the DB
```

---

## Useful scripts

| Command            | What it does                                  |
| ------------------ | --------------------------------------------- |
| `npm run dev`      | Local dev server with hot reload              |
| `npm run build`    | Production build                              |
| `npm run start`    | Run the production build                      |
| `npm run lint`     | Lint                                          |
| `npm run set-trainer` | Upsert `app_settings.trainer_email` from env |
