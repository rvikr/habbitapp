# HabbitApp

A cross-platform habit tracker for iOS, Android, and the web. Build daily habits, track
streaks, log progress, and earn badges.

**Stack:** Expo SDK 54 · React Native 0.81 · React 19 · TypeScript · NativeWind v4
(Tailwind) · Expo Router v6 · Supabase (auth + Postgres) · Sentry · PostHog

---

## Quick start

```bash
# 1. Install
npm install --legacy-peer-deps

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local with your Supabase project URL/key

# 3. Apply DB schema + migrations (one time, in Supabase SQL editor)
# Run supabase/schema.sql, then each file in supabase/migrations/ in order.
# The migrations include leaderboard, admin, feedback, public stats, and deletion audit support.

# 4. Run
npx expo start
# Then press `i` (iOS), `a` (Android), or `w` (web)
```

### Environment variables

`.env.local`:

```
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_SENTRY_DSN=                # optional — leave empty to disable crash reporting
EXPO_PUBLIC_POSTHOG_KEY=               # optional — leave empty to disable analytics
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://your-domain.example/privacy
EXPO_PUBLIC_ACCOUNT_DELETION_URL=https://your-domain.example/account-deletion
EXPO_PUBLIC_SUPPORT_EMAIL=support@your-domain.example
```

All `EXPO_PUBLIC_*` vars are bundled into the client at build time. Don't put service-role
keys here.

`website/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
ADMIN_EMAILS=admin@example.com,owner@example.com
NEXT_PUBLIC_ACCOUNT_DELETION_CONTACT_EMAIL=privacy@your-domain.example
```

The service-role key is server-only for the Next admin app. Never expose it through
`NEXT_PUBLIC_*` variables.

---

## Project layout

```
app/                       Expo Router screens (file-based routing)
  _layout.tsx              Root: ErrorBoundary, ThemeProvider, Auth guard
  +html.tsx                Static-rendering HTML shell; SPA export uses public/index.html
  login.tsx                Auth screen (sign in / sign up / forgot password)
  (tabs)/                  Bottom tab group
    index.tsx              Dashboard (today's habits, progress ring)
    achievements.tsx       Badges + XP/level
    settings/              Settings stack (profile, reminders, security)
  habits/                  Habit detail / create / edit (modal-style)

components/                React Native components (NativeWind className)
  error-boundary.tsx       Catches uncaught render errors → Sentry + retry UI
  habit-card.tsx, ...

lib/                       Shared logic (no UI)
  supabase/client.ts       Single Supabase client (SecureStore on native, localStorage on web)
  habits.ts                Read queries (getHabitsForToday, getHabit, getStats)
  actions.ts               Mutations (toggle, create, update, delete)
  reminders.ts             Reminder schedule builder
  password.ts              validatePassword(): rule helper
  sentry.ts                Crash reporting wrapper (lazy-loaded)
  analytics.ts             PostHog wrapper (lazy-loaded)
  storage.{native,web}.ts  Platform storage adapter
  haptics.{native,web}.ts  Platform haptics adapter
  notifications.{native,web}.ts  Platform notifications adapter
  secure-storage.{native,web}.ts SecureStore-backed token storage

types/db.ts                Shared TypeScript types (Habit, HabitCompletion, Badge)
supabase/schema.sql        Postgres schema + RLS policies
supabase/migrations/       Ordered SQL migrations for app, web, and admin features
supabase/functions/        Edge Functions (e.g. delete-account)

assets/                    App icons, splash, notification icon, share image
public/                    Web-only static files (manifest, favicon, PWA icons, OG image)
  index.html               Expo web SPA template with PWA/OG/Apple metadata
website/                   Separate Next.js admin + marketing site (own package.json)
```

The platform-specific files (`*.native.ts` / `*.web.ts`) are picked automatically by Metro
at bundle time. The accompanying `*.ts` files are TypeScript stubs.

### Two apps in one repo

This repository contains two separately-built apps that share the same Supabase backend:

- **Root (`app/`, `components/`, `lib/`, etc.)** — the Expo SDK 54 universal app for iOS,
  Android, and the web. This is what `npm start` / `expo start` runs.
- **`website/`** — a Next.js 15 admin and marketing site with its own `package.json`,
  `tsconfig.json`, and dependencies. Build it with `cd website && npm run build`. It is
  excluded from the Expo TypeScript project (see root `tsconfig.json` `exclude`).

If you only want to work on the mobile/web app, ignore the `website/` directory entirely.

---

## Common commands

```bash
# Development
npx expo start                  # Dev server with QR code
npx expo start --web            # Web only
npx expo start --clear          # Clear bundler cache

# Quality
npx tsc --noEmit                # Typecheck
npm test                        # Unit tests

# Next website/admin
cd website
npm run typecheck
npm run lint
npm run build

# Builds (requires `npx eas-cli login`)
npx eas-cli build -p ios --profile preview
npx eas-cli build -p android --profile preview
npx eas-cli build -p all --profile production

# OTA updates
npx eas-cli update --branch preview --message "Fix dashboard refresh"
npx eas-cli update --branch production

# Submit to stores
npx eas-cli submit -p ios
npx eas-cli submit -p android

# Web export (deploy dist/ to Vercel / Netlify / Cloudflare Pages)
npx expo export -p web
```

---

## Before publishing

See **`SHIPPING.md`** for the full submission checklist (developer accounts, app icons,
screenshots, privacy policy, store listings).

See **`QA.md`** for the manual test plan to run through every release.

---

## Architecture notes

- **Auth tokens** stored via `expo-secure-store` (native) or `localStorage` (web) using
  the `secureStorage` adapter in `lib/secure-storage.{native,web}.ts`.
- **Configuration guard**: when Supabase environment variables are missing, the app shows
  a clear configuration error instead of crashing during startup.
- **Theme**: `ThemeProvider` reads system color scheme by default and persists user override
  in storage. NativeWind's `dark:` modifier handles the rest.
- **Error handling**: `ErrorBoundary` at the root catches uncaught render errors, forwards
  them to Sentry, and shows a friendly fallback with a retry button.
- **OTA updates**: published via `eas update`. Fallback timeout is 30s — if the updated
  bundle can't be fetched, the app uses the embedded one.

---

## License

Private project — no license granted.
