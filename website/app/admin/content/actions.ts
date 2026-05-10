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

export async function createSuggestedHabit(formData: FormData) {
  const adminEmail = await getAdminEmail();
  const name        = (formData.get("name") as string).trim();
  const description = (formData.get("description") as string | null)?.trim() ?? null;
  const icon        = (formData.get("icon") as string).trim() || "star";
  const sort_order  = parseInt(formData.get("sort_order") as string, 10) || 0;

  if (!name) return { ok: false, error: "Name is required" };

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("suggested_habits").insert({ name, description, icon, sort_order, enabled: true });
    if (error) return { ok: false, error: error.message };
    await logAdminAction(adminEmail, "create_suggested_habit", "suggested_habit", undefined, { name });
    revalidatePath("/admin/content");
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

export async function updateSuggestedHabit(id: string, formData: FormData) {
  const adminEmail = await getAdminEmail();
  const name        = (formData.get("name") as string).trim();
  const description = (formData.get("description") as string | null)?.trim() ?? null;
  const icon        = (formData.get("icon") as string).trim() || "star";
  const sort_order  = parseInt(formData.get("sort_order") as string, 10) || 0;

  if (!name) return { ok: false, error: "Name is required" };

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("suggested_habits").update({ name, description, icon, sort_order }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await logAdminAction(adminEmail, "update_suggested_habit", "suggested_habit", id, { name });
    revalidatePath("/admin/content");
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

export async function toggleSuggestedHabit(id: string, enabled: boolean) {
  const adminEmail = await getAdminEmail();
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("suggested_habits").update({ enabled }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await logAdminAction(adminEmail, `${enabled ? "enable" : "disable"}_suggested_habit`, "suggested_habit", id);
    revalidatePath("/admin/content");
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

export async function deleteSuggestedHabit(id: string) {
  const adminEmail = await getAdminEmail();
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("suggested_habits").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    await logAdminAction(adminEmail, "delete_suggested_habit", "suggested_habit", id);
    revalidatePath("/admin/content");
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}
