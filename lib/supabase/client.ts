import { createClient as _createClient } from "@supabase/supabase-js";
import { secureStorage } from "@/lib/secure-storage";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
const FALLBACK_SUPABASE_URL = "https://not-configured.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY = "not-configured";

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export const supabase = _createClient(
  isSupabaseConfigured() ? SUPABASE_URL : FALLBACK_SUPABASE_URL,
  isSupabaseConfigured() ? SUPABASE_ANON_KEY : FALLBACK_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: secureStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

export function configurationError() {
  return {
    message: "Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY before signing in.",
  };
}
