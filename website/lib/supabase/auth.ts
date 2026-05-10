import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function getCurrentUser(supabase: SupabaseClient): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user;
  } catch {
    return null;
  }
}
