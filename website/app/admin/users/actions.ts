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

export async function grantPro(userId: string) {
  const adminEmail = await getAdminEmail();
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("profiles").update({ is_pro: true }).eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    await logAdminAction(adminEmail, "grant_pro", "user", userId);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

export async function revokePro(userId: string) {
  const adminEmail = await getAdminEmail();
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("profiles").update({ is_pro: false }).eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    await logAdminAction(adminEmail, "revoke_pro", "user", userId);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

export async function resetPasswordForUser(email: string) {
  const adminEmail = await getAdminEmail();
  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
    });
    if (error) return { ok: false, error: error.message };
    await logAdminAction(adminEmail, "reset_password", "user", email);
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

export async function verifyUserEmail(userId: string) {
  const adminEmail = await getAdminEmail();
  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });
    if (error) return { ok: false, error: error.message };
    await logAdminAction(adminEmail, "verify_email", "user", userId);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

export async function hardDeleteUser(userId: string, userEmail: string) {
  const adminEmail = await getAdminEmail();
  try {
    const admin = createAdminClient();
    // Delete all user data first (in case cascade isn't set up)
    await Promise.all([
      admin.from("habit_completions").delete().eq("user_id", userId),
      admin.from("habits").delete().eq("user_id", userId),
      admin.from("profiles").delete().eq("user_id", userId),
    ]);
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) return { ok: false, error: error.message };
    await logAdminAction(adminEmail, "hard_delete_user", "user", userId, { email: userEmail });
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}
