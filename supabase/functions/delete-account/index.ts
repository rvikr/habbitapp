// Supabase Edge Function — permanently deletes the calling user's account
// and all of their data (habits, completions, profile), while preserving a
// completed account-deletion audit row.
//
// Deploy:    npx supabase functions deploy delete-account
// Invoke:    supabase.functions.invoke('delete-account')
//
// The function authenticates via the caller's JWT, verifies the user, then
// uses the service-role key to perform the cross-table delete. Service-role
// access is required to call auth.admin.deleteUser.

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing authorization header" }, 401);

  // Verify the caller using their JWT.
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: "Unauthorized" }, 401);

  const userId = user.id;

  // Optional reason from the request body (non-fatal if missing).
  let reason: string | null = null;
  try {
    const body = await req.json();
    if (typeof body?.reason === "string" && body.reason.trim().length > 0) {
      reason = body.reason.trim();
    }
  } catch {
    // No body or invalid JSON — ignore.
  }

  // Service-role client for the actual deletion.
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Audit row first so we have a trail even if a later step fails.
  const { data: auditRow, error: auditError } = await admin
    .from("account_deletion_requests")
    .insert({ user_id: userId, email: user.email ?? null, reason, status: "processing" })
    .select("id")
    .single();
  if (auditError) return json({ error: `Failed to create deletion request: ${auditError.message}` }, 500);

  const auditId = auditRow.id;

  // Best-effort cascade. The auth.users delete cascades via FK to habits,
  // habit_completions, profiles, account_deletion_requests, etc., but we
  // delete app rows explicitly so partial failures are visible.
  const cascades: Array<[string, any]> = [
    ["sleep_entries",     admin.from("sleep_entries").delete().eq("user_id", userId)],
    ["habit_completions", admin.from("habit_completions").delete().eq("user_id", userId)],
    ["habits",            admin.from("habits").delete().eq("user_id", userId)],
    ["profiles",          admin.from("profiles").delete().eq("user_id", userId)],
  ];
  for (const [table, builder] of cascades) {
    const { error } = await builder;
    if (error) {
      await admin
        .from("account_deletion_requests")
        .update({ status: "requested" })
        .eq("id", auditId);
      return json({ error: `Failed to delete ${table}: ${error.message}` }, 500);
    }
  }

  // Delete the auth user last. After this point the JWT is invalid.
  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    await admin
      .from("account_deletion_requests")
      .update({ status: "requested" })
      .eq("id", auditId);
    return json({ error: `Failed to delete auth user: ${authError.message}` }, 500);
  }

  const { error: completeError } = await admin
    .from("account_deletion_requests")
    .update({ status: "completed", processed_at: new Date().toISOString() })
    .eq("id", auditId);
  if (completeError) {
    return json({ error: `Account deleted, but failed to update deletion audit: ${completeError.message}` }, 500);
  }

  return json({ ok: true });
});
