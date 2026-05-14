# Calixia Coach — v1 Feature Spec

**Tagline:** Calisthenics · Xtended · Intelligent · Assistant
**Goal:** A simple but complete coaching app for Bobby and his current clients — similar in spirit to Trainerize / Everfit, but stripped to what matters now.
**Target users:** 1 trainer (Bobby), a handful of clients.

---

## Platform decision

A **single Next.js web app** (PWA-installable) hosted on Vercel, backed by Supabase. No native apps in v1. Clients open it in their phone browser and tap "Add to Home Screen" — it then feels like a native app.

Rationale: one codebase, instant deploys, no App Store, Supabase gives us magic-link auth + database + realtime messaging + file storage in one box.

---

## Roles

- **Trainer (admin)** — just Bobby. Locked to one specific email in env vars.
- **Client** — invited by Bobby. Logs in via magic link. Cannot self-register.

---

## Core features

### Auth
- Magic-link login only (Supabase Auth).
- Trainer invites a client by entering their name + email in the admin dashboard.
- Client receives a magic-link email, taps the link, and is logged in.
- No passwords. No Google sign-in (yet).

### Client experience

**Today view (default landing for clients)**
- Today's workout displayed prominently (or "Rest day" / "No workout assigned").
- Quick links to log nutrition and message coach.
- Adherence indicator (this week: 3/3 completed, etc.).

**Calendar view**
- Shows today + the rest of this week (Mon–Sun).
- Each day shows: workout name + status (pending / completed / skipped).
- Tap any day to view that workout.
- Future weeks aren't visible until trainer assigns them.

**Workout detail / logging**
- List of exercises with prescribed sets/reps/load/tempo/rest/notes/video link.
- For each set, client logs: completed reps, completed weight (if applicable).
- At end of workout, client provides: difficulty rating (1–5), open text comment, marks workout completed or skipped.

**Nutrition tracking**
- Daily view: 4 meal slots (breakfast, lunch, dinner, snacks).
- Each meal entry: description + calories + protein (g). Carbs and fat optional.
- Daily totals shown vs. targets set by trainer.
- Simple weekly summary.

**Messaging**
- 1-on-1 chat thread with the trainer.
- Real-time updates (Supabase Realtime).
- Read/unread state.

**Profile**
- Basic info: name, goals, height, starting weight, training history.
- Editable by client.
- Macros targets visible (read-only, set by trainer).

### Trainer experience (admin)

**Dashboard home**
- Quick overview: number of active clients, recent feedback, unread messages.

**Clients list**
- Card per client with name, photo (if uploaded), this-week adherence, unread messages indicator.

**Client detail**
- Profile info + private trainer notes (not visible to client).
- Macros targets (editable here).
- Recent workout feedback & nutrition logs.
- Direct link to message them.
- Direct link to assign workouts to their calendar.

**Week templates**
- Create reusable week templates (e.g. "Beginner Foundations — Week 1").
- A template is a named container with workouts assigned to specific days of the week (Mon, Wed, Fri).
- Each workout has structured exercises (name, sets, reps, weight, tempo, rest, notes, video link).
- Edit templates anytime.

**Assigning workouts**
- On a client's calendar page, pick a Monday and assign a week template starting that Monday.
- System copies the template's workouts to that client's calendar for that week.
- Trainer can override / edit any individual workout per client after assignment.

**Messages**
- Inbox-style view of all client conversations.
- Real-time updates.

---

## Branding

- **Dark mode only** (no light mode toggle for v1).
- **Background:** very dark navy / near-black (e.g. `#0F1419`).
- **Surface (cards):** slightly lighter (e.g. `#1A1F26`).
- **Accent:** turquoise/cyan (e.g. `#5FF6F0`).
- **Text:** off-white primary, muted gray secondary.
- **Logo:** the existing `calixia_wordmark_turquoise_transparent.png` in headers; `calixia_square_logo_dark.png` as favicon/PWA icon.
- **Hero image:** `calixia_helmet_hero.png` on the login page.
- **Tone of voice:** the same as the Beginner Foundations PDF — calm, confident, direct. No hype. No exclamation marks.

---

## Explicitly OUT of v1

- Payments / billing (Stripe, subscriptions, invoicing).
- Trainer-uploaded videos (YouTube/Vimeo URL links are fine; no native upload).
- Push / native mobile notifications (email only).
- Public marketing pages (no `/about`, `/pricing` — app is login-only).
- Multi-trainer support.
- Progress photos.
- Body measurement tracking.
- PR / lift tracking as a dedicated feature.
- Searchable food database.

These can be added in v2 once v1 is in the hands of real clients.

---

## Tech stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui components, lucide-react icons.
- **Backend:** Supabase — Postgres database, Auth (magic link), Realtime (messaging), Storage (avatars, meal photos).
- **Hosting:** Vercel (free tier works for v1).
- **Email:** Supabase's built-in auth emails for magic links; Resend (or Supabase Edge Functions) for transactional notifications.

---

## Success criteria for v1

Bobby can:
1. Invite a real client and have them log in via magic link.
2. Build a week template once and assign it to that client.
3. See when the client completes a workout, what they actually did, and how hard they rated it.
4. See what the client has been eating this week.
5. Message the client back and forth in real time.

If those five things work end-to-end, v1 ships.
