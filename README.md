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
# Run supabase/schema.sql, then each file in supabase/migrations/ in order

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
```

All `EXPO_PUBLIC_*` vars are bundled into the client at build time. Don't put service-role
keys here.

---

## Project layout

```
app/                       Expo Router screens (file-based routing)
  _layout.tsx              Root: ErrorBoundary, ThemeProvider, Auth guard
  +html.tsx                Web HTML shell (PWA manifest, OG tags, SEO)
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

assets/                    App icons, splash, notification icon, share image
public/                    Web-only static files (manifest, favicon, PWA icons, OG image)
```

The platform-specific files (`*.native.ts` / `*.web.ts`) are picked automatically by Metro
at bundle time. The accompanying `*.ts` files are TypeScript stubs.

---

## Common commands

```bash
# Development
npx expo start                  # Dev server with QR code
npx expo start --web            # Web only
npx expo start --clear          # Clear bundler cache

# Quality
npx tsc --noEmit                # Typecheck

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
