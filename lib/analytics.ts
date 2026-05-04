// Analytics wrapper. Lazy-loads PostHog so the app boots without the package
// installed during early development. Add EXPO_PUBLIC_POSTHOG_KEY to .env.local
// to enable, and optionally EXPO_PUBLIC_POSTHOG_HOST (defaults to PostHog cloud).
//
// Events: prefer past-tense verbs ("habit_completed", "signed_in", "habit_created").
// User identification happens automatically via supabase auth state change.

const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

let initialized = false;
type PostHogClient = {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  identify: (id: string, properties?: Record<string, unknown>) => void;
  reset: () => void;
};
let client: PostHogClient | null = null;

export async function initAnalytics(): Promise<void> {
  if (initialized || !KEY) return;
  try {
    const mod = await import("posthog-react-native");
    const { PostHog } = mod;
    client = new PostHog(KEY, { host: HOST }) as unknown as PostHogClient;
    initialized = true;
  } catch (e) {
    if (__DEV__) console.warn("Analytics init skipped:", e);
  }
}

export function track(event: string, properties?: Record<string, unknown>): void {
  if (__DEV__) console.log("[track]", event, properties);
  if (!initialized || !client) return;
  client.capture(event, properties);
}

export function identify(userId: string, properties?: Record<string, unknown>): void {
  if (!initialized || !client) return;
  client.identify(userId, properties);
}

export function resetAnalytics(): void {
  if (!initialized || !client) return;
  client.reset();
}
