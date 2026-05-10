"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin/audit";

async function getAdminEmail() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email ?? "unknown";
}

export async function toggleFeatureFlag(key: string, enabled: boolean) {
  const adminEmail = await getAdminEmail();
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("feature_flags")
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq("key", key);
    if (error) return { ok: false, error: error.message };
    await logAdminAction(adminEmail, `toggle_flag_${enabled ? "on" : "off"}`, "feature_flag", key, { enabled });
    revalidatePath("/admin/system");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

export async function createFeatureFlag(key: string, name: string, description: string) {
  const adminEmail = await getAdminEmail();
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("feature_flags").insert({ key, name, description, enabled: false });
    if (error) return { ok: false, error: error.message };
    await logAdminAction(adminEmail, "create_feature_flag", "feature_flag", key, { name });
    revalidatePath("/admin/system");
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

export async function sendGlobalNotification(title: string, body: string, type: string) {
  const adminEmail = await getAdminEmail();
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("global_notifications").insert({ title, body, type, active: true });
    if (error) return { ok: false, error: error.message };
    await logAdminAction(adminEmail, "send_global_notification", "notification", undefined, { title, type });
    revalidatePath("/admin/system");
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

export async function dismissNotification(id: string) {
  const adminEmail = await getAdminEmail();
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("global_notifications").update({ active: false }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await logAdminAction(adminEmail, "dismiss_notification", "notification", id);
    revalidatePath("/admin/system");
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}
