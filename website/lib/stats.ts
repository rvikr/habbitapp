import { createClient } from "@supabase/supabase-js";

export interface PublicStats {
  userCount: number;
  habitCount: number;
  checkInCount: number;
}

export async function getPublicStats(): Promise<PublicStats> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase.rpc("get_public_stats");
    if (data) {
      return {
        userCount: data.user_count ?? 0,
        habitCount: data.habits_count ?? 0,
        checkInCount: data.completions_count ?? 0,
      };
    }
  } catch {}
  return { userCount: 0, habitCount: 0, checkInCount: 0 };
}

export function formatCount(n: number): string {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M+`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k+`;
  return String(n);
}
