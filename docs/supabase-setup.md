# Connecting the poll to Supabase (about 10 minutes)

The poll, dashboard and presentation mode are built and deployed. Until these steps are done, the
live site says "The poll isn't connected yet" (it never pretends to save votes).

## 1. Create the database
1. Go to https://supabase.com, sign in, and click **New project** (the free plan is enough).
2. Name it `sleep-smart-mru`. For **Region**, pick **Canada (Central)**. Choose a strong database
   password and save it in your password manager.
3. Wait about 2 minutes for it to finish setting up.

## 2. Create the tables
1. In the project, open **SQL Editor** → **New query**.
2. Paste the whole file `supabase/migrations/0001_poll.sql` and click **Run**. It should say
   "Success. No rows returned."

## 3. Add the keys to Vercel (don't paste them into chat)
In Supabase, open **Project Settings → API** (or **Data API / API Keys**) and find:
- **Project URL** → `SUPABASE_URL`
- **anon / public** key → `SUPABASE_ANON_KEY`
- **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (secret: server only, never share it)

Then add them, plus an admin passcode you choose, in a terminal from the project folder. Each
command asks you to paste the value:

```bash
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add ADMIN_PASSCODE production
```

(Or use the Vercel dashboard: Project → Settings → Environment Variables.)

## 4. Tell Claude "keys are in"
Claude redeploys, checks the poll end to end, and loads the demo data. You can also load it
yourself from the dashboard: **Organizer tools** → enter the passcode → **Reload demo data**.

## Before your talk
- Open `/dashboard`, go to **Organizer tools** and click **Reset live responses**. This clears test
  votes so the class starts from zero.
- Open `/present` on the projector. Classmates scan the QR code and the chart updates live.
- Supabase's free projects pause after about a week without activity. Open the dashboard the
  morning of your presentation to make sure it's awake.
