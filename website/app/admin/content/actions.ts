"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/auth";

export async function createSuggestedHabit(formData: FormData) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const name        = (formData.get("name") as string).trim();
  const description = (formData.get("description") as string | null)?.trim() ?? null;
  const icon        = (formData.get("icon") as string).trim() || "star";
  const sort_order  = parseInt(formData.get("sort_order") as string, 10) || 0;

  if (!name) return { ok: false, error: "Name is required" };

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("suggested_habits").insert({ name, description, icon, sort_order, enabled: true });
    if (error) return { ok: false, error: error.message };
    await logAdminAction(auth.email, "create_suggested_habit", "suggested_habit", undefined, { name });
    revalidatePath("/admin/content");
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

export async function updateSuggestedHabit(id: string, formData: FormData) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const name        = (formData.get("name") as string).trim();
  const description = (formData.get("description") as string | null)?.trim() ?? null;
  const icon        = (formData.get("icon") as string).trim() || "star";
  const sort_order  = parseInt(formData.get("sort_order") as string, 10) || 0;

  if (!name) return { ok: false, error: "Name is required" };

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("suggested_habits").update({ name, description, icon, sort_order }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await logAdminAction(auth.email, "update_suggested_habit", "suggested_habit", id, { name });
    revalidatePath("/admin/content");
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

export async function toggleSuggestedHabit(id: string, enabled: boolean) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("suggested_habits").update({ enabled }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await logAdminAction(auth.email, `${enabled ? "enable" : "disable"}_suggested_habit`, "suggested_habit", id);
    revalidatePath("/admin/content");
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

export async function deleteSuggestedHabit(id: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("suggested_habits").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    await logAdminAction(auth.email, "delete_suggested_habit", "suggested_habit", id);
    revalidatePath("/admin/content");
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}
