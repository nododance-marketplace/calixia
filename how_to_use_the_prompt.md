# How to use the one-shot prompt

You don't need to be technical for this — just patient. Follow these steps in order.

## Step 1 — Create a Supabase project (5 min)

Supabase is the "back-end-as-a-service" that handles your database, login emails, file storage, and real-time messaging. The free tier is more than enough for v1.

1. Go to **supabase.com** and sign up (Google login is fine here, just not in our app).
2. Click **New project**. Name it `calixia-coach`. Pick the region closest to you (probably US East). Choose a strong database password and save it somewhere — you may need it.
3. Wait ~2 minutes for the project to spin up.
4. Once ready, click the gear icon (bottom-left) → **API**. Keep this tab open. You'll need:
   - **Project URL** (the `https://xxxxx.supabase.co` one)
   - **anon public** key
   - **service_role secret** key (treat this like a password — never share)

## Step 2 — Install Claude Code (one-time, 3 min)

Claude Code is the agent that will actually build the app.

1. Install Node.js from **nodejs.org** if you don't have it (pick the LTS version).
2. Open your terminal:
   - Mac: open the **Terminal** app.
   - Windows: open **PowerShell**.
3. Run: `npm install -g @anthropic-ai/claude-code`
4. Run: `claude` and follow the prompts to sign in.

## Step 3 — Create a new project folder and start Claude Code

In your terminal:
```
cd Desktop
mkdir calixia-coach
cd calixia-coach
claude
```

You're now inside Claude Code, sitting in an empty folder.

## Step 4 — Paste the prompt

1. Open `claude_code_one_shot_prompt.md` (it's in the same folder as this file).
2. Copy **everything from the `---` line onward** to the end of the file.
3. Paste it into the Claude Code prompt and hit enter.

Claude Code will start scaffolding the app. Expect it to take a while — probably 10–30 minutes — and to ask permission to run commands. Say yes when it asks to install packages or run builds.

## Step 5 — Drop in your brand files

When Claude Code finishes scaffolding, copy these three files from your existing branding folder into `calixia-coach/public/brand/` and rename them:

| From | To |
|---|---|
| The turquoise wordmark logo (transparent background) | `public/brand/calixia_wordmark.png` |
| The square dark logo (used for app icons) | `public/brand/calixia_square.png` |
| The helmet/visor hero image | `public/brand/calixia_helmet_hero.png` |

## Step 6 — Wire up Supabase

Claude Code will have created a `.env.example` file. Make a copy named `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL` — the Project URL from Step 1
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the anon public key
- `SUPABASE_SERVICE_ROLE_KEY` — the service_role secret
- `NEXT_PUBLIC_SITE_URL` — leave as `http://localhost:3000` for now
- `TRAINER_EMAIL` — your email (the one you'll log in with)

## Step 7 — Set up the database

In Supabase, click the **SQL** icon (left sidebar).

1. Open `supabase/migrations/0001_init.sql` from your project folder.
2. Copy its contents, paste into Supabase SQL editor, click **Run**.
3. Open `supabase/seed.sql`, do the same.

Then in your terminal (still inside `calixia-coach/`):
```
npx tsx scripts/set-trainer.ts
```
This tells the database that *your* email is the trainer.

## Step 8 — Boot it up

```
npm run dev
```

Open `http://localhost:3000` in your browser. Enter your email, click the magic link in your inbox, and you should land on the trainer dashboard.

## Step 9 — Deploy to Vercel (when you're ready to share with clients)

1. Push the project to GitHub.
2. Go to **vercel.com**, click **New Project**, import your GitHub repo.
3. In the deploy settings, paste the same env vars from `.env.local` (Vercel calls them "Environment Variables").
4. Once deployed, copy the production URL.
5. Update `NEXT_PUBLIC_SITE_URL` in Vercel to that URL.
6. In Supabase: **Authentication → URL Configuration** → add the production URL to "Site URL" and the redirect URLs list.
7. Redeploy.

Now your app is live. Invite clients from `/admin/clients/new`.

---

## If something goes wrong

- **The prompt errors out partway through** — that's normal in a one-shot. In Claude Code, just type "continue" or "finish the last route" and it'll keep going.
- **Build fails** — paste the error back into Claude Code and ask it to fix.
- **Magic link goes to spam** — check spam first; if it persists, you can configure Supabase to use a custom SMTP (Resend has a generous free tier).
- **Anything weird with auth in production** — 90% of the time it's the Supabase redirect URLs config from Step 9.6.
