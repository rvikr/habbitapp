# Habbit — A Quiet Habit Tracker

A mobile-first habit tracker built from the **Vivid Habit Tracker** Google Stitch design (the *Quiet Energy* theme: deep purple + soft teal + warm orange on a calm off-white canvas).

- **Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v3
- **Auth & data:** Supabase (Postgres + Auth, optional — app runs in demo mode without it)
- **Design tokens:** Material 3 palette baked into `tailwind.config.ts`

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — the app boots straight into demo mode with seed habits.

## Connect Supabase (optional, for persistence)

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the project URL and anon key into a new `.env.local` (use `.env.local.example` as a template):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
3. Open the SQL editor in Supabase and run `supabase/schema.sql` once.
4. Enable email + password sign-in under *Authentication → Providers*.
5. Restart `npm run dev`. Visit `/login` to create an account.

When env vars are missing or no user is signed in, every page falls back to seed data so the design always renders.

## Routes

| Route | Purpose |
|---|---|
| `/` | Dashboard — today's habits, ring + chips, weekly bento |
| `/habits/[id]` | Detail — streaks, weekly bars, recent entries |
| `/habits/new` | Create habit form |
| `/achievements` | Level + badges + locked milestones |
| `/settings` | Account, reminders, motivational previews, app prefs |
| `/login` | Email/password sign-in (Supabase) |

## Project layout

```
src/
├── app/                # App Router pages + server actions
│   ├── page.tsx        # Dashboard
│   ├── habits/[id]/    # Detail
│   ├── habits/new/     # Create habit
│   ├── achievements/   # Badges
│   ├── settings/       # Settings
│   ├── login/          # Auth
│   └── actions.ts      # Server actions (toggle habit)
├── components/         # Icon, BottomNav, TopAppBar, HabitCard, ProgressRing, …
├── lib/
│   ├── habits.ts       # Data access (Supabase or seed fallback)
│   ├── seed.ts         # Demo data
│   └── supabase/       # Browser + server clients
└── types/db.ts         # Habit / Completion / Badge types
```

## Design source

Generated from the Stitch project **Vivid Habit Tracker** (`projects/4310500496842726719`). Reference HTML lives in `.stitch-design/` (gitignored).
