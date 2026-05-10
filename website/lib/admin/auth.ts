import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export async function requireAdmin(): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  const email = user?.email?.toLowerCase() ?? "";

  if (!user || !email || !ADMIN_EMAILS.includes(email)) {
    return { ok: false, error: "Forbidden" };
  }

  return { ok: true, email: user.email ?? email };
}
