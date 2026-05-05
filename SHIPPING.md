# Shipping checklist

Everything you need to do (and pay for) before the first app store submission and web
deploy. Items marked **(automatable)** I've already wired into the codebase; items marked
**(you)** require manual setup, accounts, or creative work.

---

## 1. Developer accounts

| Item | Who | Cost | Notes |
|---|---|---|---|
| Apple Developer Program | you | $99/yr | https://developer.apple.com/programs/ — required for App Store. Allow 1–2 days for verification. |
| Google Play Developer | you | $25 one-time | https://play.google.com/console/signup — required for Play Store. |
| Expo / EAS account | you | Free / paid | https://expo.dev — free tier covers small apps. `npx eas-cli login` after sign-up. |
| Supabase production project | you | Free / paid | Create a *separate* project for production (don't reuse dev). Apply `supabase/schema.sql`, then `supabase/migrations/` in order. |
| Sentry | you | Free | https://sentry.io — create a React Native project, copy DSN to `EXPO_PUBLIC_SENTRY_DSN`. |
| PostHog | you | Free | https://posthog.com — copy project key to `EXPO_PUBLIC_POSTHOG_KEY`. |
| Vercel / Netlify (for web) | you | Free | Either works. Free tier handles low traffic. |
| Privacy policy generator | you | Free | https://termly.io or https://www.freeprivacypolicy.com. Required by Apple/Google/CCPA. |

---

## 2. Visual assets

The required app/PWA PNGs are present under `assets/` and `public/`. Regenerate them from
source artwork before submission if the branding changes.

| File | Size | Notes |
|---|---|---|
| `assets/icon.png` | 1024 × 1024 | App icon (square, no transparency for iOS, rounded automatically) |
| `assets/adaptive-icon.png` | 1024 × 1024 | Android foreground (transparent background, centered logo) |
| `assets/splash.png` | 2048 × 2048 | Centered logo on solid bg — fills screen |
| `assets/notification-icon.png` | 96 × 96 | Android: white/monochrome on transparent |
| `assets/favicon.png` | 192 × 192 | Web — referenced by PWA manifest |
| `assets/og-image.png` | 1200 × 630 | OG share preview (Twitter, Slack, etc.) |

Suggested tools: Figma (free), Icon Kitchen (https://icon.kitchen) for adaptive icons.

---

## 3. Store listing assets

### App Store (iOS)
- Screenshots — 6.7" iPhone (Pro Max) **required**, 5.5" iPhone optional. iPad screenshots are not needed while `supportsTablet=false`.
- App preview videos optional
- App description (max 4000 chars) + promotional text (170 chars) + keywords (100 chars total, comma-separated)
- Support URL + Marketing URL + Privacy Policy URL
- Age rating questionnaire
- App Store category (Health & Fitness recommended)

### Play Store (Android)
- Screenshots — minimum 2, max 8, phone + tablet
- Feature graphic — 1024 × 500 (shown at top of listing)
- High-res icon — 512 × 512
- Short description (80 chars) + full description (4000 chars)
- Privacy policy URL
- Content rating questionnaire
- Target audience and content settings

---

## 4. Code-side prep (automatable, mostly done)

- ✅ TypeScript clean (`npx tsc --noEmit`)
- ✅ `eas.json` exists; submit credentials are intentionally not committed
- ✅ `app.json` configured with bundleId, package, version, buildNumber, versionCode
- ✅ iOS privacy strings (NSUserNotificationsUsageDescription, NSUserTrackingUsageDescription)
- ✅ Android permissions minimised + blocked list
- ✅ ErrorBoundary at app root
- ✅ Sentry + PostHog wired (lazy-loaded — uses env vars)
- ✅ expo-updates configured for OTA
- ✅ PWA manifest + meta tags for web
- ✅ Forgot password + email confirmation flow
- ✅ In-app Privacy & Data screen with export and account deletion request

**Still TODO before submission (you):**

- [ ] Configure App Store Connect credentials locally or in EAS before `eas submit -p ios`
- [ ] Add `play-service-account.json` locally or configure Google Play credentials in EAS before `eas submit -p android`
- [ ] Confirm `com.habbitapp.app` bundle ID is unique to you (or change to your reverse domain)
- [ ] Set production env vars in EAS: Supabase URL/key, privacy policy URL, Sentry DSN, and PostHog key/host

---

## 5. Build & submit walkthrough

```bash
# 0. One-time setup
npx eas-cli login
npx eas-cli init                      # creates EAS project, fills projectId in app.json

# 1. Build for internal testing (preview profile)
npx eas-cli build -p ios --profile preview        # iOS simulator build for QA
npx eas-cli build -p android --profile preview    # Android internal APK
# Test thoroughly with QA.md

# 2. Production build
npx eas-cli build -p ios --profile production
npx eas-cli build -p android --profile production

# 3. Submit
npx eas-cli submit -p ios       # → App Store Connect (TestFlight first)
npx eas-cli submit -p android   # → Play Console internal track
# Promote through TestFlight / Play Console testing tracks before public release.

# 4. Web deploy
npx expo export -p web
npx vercel --prod ./dist        # or `netlify deploy --prod --dir=dist`

# 5. After release: OTA hotfixes
npx eas-cli update --branch production --message "Fix streak counter rollover"
```

---

## 6. Post-launch monitoring

- **Sentry dashboard** → check daily for new error spikes
- **PostHog dashboard** → watch DAU, habit_completed events, funnel drop-offs
- **App Store Connect / Play Console** → review crashes, ANRs, ratings
- **Supabase dashboard** → table size, auth usage, free tier quota

---

## 7. Compliance notes

- **GDPR / CCPA**: privacy policy must list the data you collect (email, habit logs, device
  identifiers via PostHog/Sentry). Provide a delete-account flow if collecting personal data
  in the EU/CA — Supabase makes this easy via `supabase.auth.admin.deleteUser`.
- **Apple App Tracking Transparency**: PostHog uses IDFA on iOS — `NSUserTrackingUsageDescription`
  is set in `app.json`. The OS prompt appears on first launch.
- **Children's privacy (COPPA)**: don't market the app to under-13s without consent flow.
- **Data Safety form (Play Store)**: declare what you collect (email, app usage). Be honest —
  Google audits this.

---

## 8. Pricing & monetization

The app currently has no purchase flow. If you add IAP later:
- Use `expo-in-app-purchases` or `react-native-iap`
- Apple takes 30% (15% for under $1M/yr revenue)
- Google takes 30% (15% for first $1M/yr per developer)
- Subscriptions need server-side validation — Supabase Edge Functions can verify receipts.
