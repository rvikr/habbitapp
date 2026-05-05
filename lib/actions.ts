import { supabase, isSupabaseConfigured, configurationError } from "./supabase/client";
import type { AvatarStyle } from "./avatar";
import { track, resetAnalytics } from "./analytics";
import { authCallbackUrl } from "./auth-redirect";
import { localDateKey } from "./date";
import { cancelHabitReminders, syncScheduledReminders } from "./reminder-sync";

type ActionResult = { ok: boolean; error?: string };

async function getUser() {
  if (!isSupabaseConfigured()) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function notSignedIn(): ActionResult {
  return { ok: false, error: "You need to sign in again." };
}

function mutationResult(error: { message?: string } | null | undefined): ActionResult {
  return error ? { ok: false, error: error.message ?? "Something went wrong." } : { ok: true };
}

export async function signIn(email: string, password: string) {
  if (!isSupabaseConfigured()) return { error: configurationError() };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error };
}

export async function signUp(email: string, password: string) {
  if (!isSupabaseConfigured()) return { data: null, error: configurationError() };
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: authCallbackUrl() },
  });
  return { data, error };
}

export async function resetPassword(email: string) {
  if (!isSupabaseConfigured()) return { error: configurationError() };
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: authCallbackUrl(),
  });
  return { error };
}

export async function signOut() {
  if (isSupabaseConfigured()) await supabase.auth.signOut();
  resetAnalytics();
}

export async function logCompletion(habitId: string, value?: number, note?: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return notSignedIn();
  const { error } = await supabase.from("habit_completions").upsert(
    {
      habit_id: habitId,
      user_id: user.id,
      completed_on: localDateKey(),
      value: value ?? 1,
      note: note?.trim() || null,
    },
    { onConflict: "habit_id,completed_on" },
  );
  return mutationResult(error);
}

export async function toggleHabit(habitId: string, currentlyDone: boolean): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return notSignedIn();

  if (currentlyDone) {
    const { error } = await supabase
      .from("habit_completions")
      .delete()
      .eq("habit_id", habitId)
      .eq("user_id", user.id)
      .eq("completed_on", localDateKey());
    if (error) return mutationResult(error);
    track("habit_uncompleted", { habit_id: habitId });
    return { ok: true };
  }

  const { error } = await supabase.from("habit_completions").upsert(
    { habit_id: habitId, user_id: user.id, completed_on: localDateKey(), value: 1 },
    { onConflict: "habit_id,completed_on" },
  );
  if (error) return mutationResult(error);
  track("habit_completed", { habit_id: habitId });
  return { ok: true };
}

export async function updateAvatar(style: AvatarStyle, seed: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return notSignedIn();
  const { error } = await supabase.auth.updateUser({ data: { avatar_style: style, avatar_seed: seed } });
  if (error) return mutationResult(error);

  await supabase
    .from("profiles")
    .update({ avatar_style: style, avatar_seed: seed, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);
  return { ok: true };
}

export async function updateHabitReminders(habitId: string, data: { enabled: boolean; times: string[]; days: number[] }): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return notSignedIn();
  const { error } = await supabase
    .from("habits")
    .update({ reminders_enabled: data.enabled, reminder_times: data.times, reminder_days: data.days })
    .eq("id", habitId)
    .eq("user_id", user.id);
  if (error) return mutationResult(error);

  if (data.enabled) await syncScheduledReminders();
  else await cancelHabitReminders(habitId);
  return { ok: true };
}

export async function createHabit(data: {
  name: string;
  description: string | null;
  icon: string;
  color: "primary" | "secondary" | "tertiary" | "neutral";
  unit: string;
  target: number | null;
  remindersEnabled: boolean;
  reminderTimes: string[];
  reminderDays: number[];
}) {
  const user = await getUser();
  if (!user) return { ok: false, id: null, error: "You need to sign in again." };
  const { data: row, error } = await supabase.from("habits").insert({
    user_id: user.id,
    name: data.name,
    description: data.description,
    icon: data.icon,
    color: data.color,
    unit: data.unit || null,
    target: data.target ?? null,
    reminders_enabled: data.remindersEnabled,
    reminder_times: data.reminderTimes,
    reminder_days: data.reminderDays,
  }).select("id").single();
  if (error) return { ok: false, id: null, error: error.message };

  if (data.remindersEnabled) await syncScheduledReminders();
  track("habit_created", { color: data.color, has_target: data.target != null });
  return { ok: true, id: row?.id as string };
}

export async function updateHabitFull(habitId: string, data: {
  name: string;
  description: string | null;
  icon: string;
  color: "primary" | "secondary" | "tertiary" | "neutral";
  unit: string;
  target: number | null;
  remindersEnabled: boolean;
  reminderTimes: string[];
  reminderDays: number[];
}): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return notSignedIn();
  const { error } = await supabase.from("habits").update({
    name: data.name,
    description: data.description,
    icon: data.icon,
    color: data.color,
    unit: data.unit || null,
    target: data.target ?? null,
    reminders_enabled: data.remindersEnabled,
    reminder_times: data.reminderTimes,
    reminder_days: data.reminderDays,
  }).eq("id", habitId).eq("user_id", user.id);
  if (error) return mutationResult(error);

  if (data.remindersEnabled) await syncScheduledReminders();
  else await cancelHabitReminders(habitId);
  return { ok: true };
}

export async function deleteHabit(habitId: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return notSignedIn();
  const { error } = await supabase
    .from("habits")
    .update({ archived_at: new Date().toISOString(), reminders_enabled: false })
    .eq("id", habitId)
    .eq("user_id", user.id);
  if (error) return mutationResult(error);

  await cancelHabitReminders(habitId);
  return { ok: true };
}

export async function updatePassword(newPassword: string) {
  if (!isSupabaseConfigured()) return { error: configurationError() };
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error };
}

export async function requestAccountDeletion(reason?: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return notSignedIn();
  const { error } = await supabase.from("account_deletion_requests").insert({
    user_id: user.id,
    email: user.email ?? null,
    reason: reason?.trim() || null,
  });
  return mutationResult(error);
}
