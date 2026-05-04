import { supabase } from "./supabase/client";
import type { AvatarStyle } from "./avatar";
import { track, resetAnalytics } from "./analytics";

const today = () => new Date().toISOString().slice(0, 10);

async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error };
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: "habbitapp://confirm" },
  });
  return { data, error };
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "habbitapp://reset",
  });
  return { error };
}

export async function signOut() {
  await supabase.auth.signOut();
  resetAnalytics();
}

export async function logCompletion(habitId: string, value?: number) {
  const user = await getUser();
  if (!user) return { ok: false };
  await supabase.from("habit_completions").upsert(
    { habit_id: habitId, user_id: user.id, completed_on: today(), value: value ?? 1 },
    { onConflict: "habit_id,completed_on" },
  );
  return { ok: true };
}

export async function toggleHabit(habitId: string, currentlyDone: boolean) {
  const user = await getUser();
  if (!user) return { ok: false };
  if (currentlyDone) {
    await supabase.from("habit_completions").delete().eq("habit_id", habitId).eq("user_id", user.id).eq("completed_on", today());
    track("habit_uncompleted", { habit_id: habitId });
  } else {
    await supabase.from("habit_completions").upsert(
      { habit_id: habitId, user_id: user.id, completed_on: today(), value: 1 },
      { onConflict: "habit_id,completed_on" },
    );
    track("habit_completed", { habit_id: habitId });
  }
  return { ok: true };
}

export async function updateAvatar(style: AvatarStyle, seed: string) {
  await supabase.auth.updateUser({ data: { avatar_style: style, avatar_seed: seed } });
  return { ok: true };
}

export async function updateHabitReminders(habitId: string, data: { enabled: boolean; times: string[]; days: number[] }) {
  const user = await getUser();
  if (!user) return { ok: false };
  await supabase.from("habits").update({ reminders_enabled: data.enabled, reminder_times: data.times, reminder_days: data.days }).eq("id", habitId).eq("user_id", user.id);
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
  if (!user) return { ok: false, id: null };
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
  if (error) return { ok: false, id: null };
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
}) {
  const user = await getUser();
  if (!user) return { ok: false };
  await supabase.from("habits").update({
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
  return { ok: true };
}

export async function deleteHabit(habitId: string) {
  const user = await getUser();
  if (!user) return { ok: false };
  await supabase.from("habits").update({ archived_at: new Date().toISOString() }).eq("id", habitId).eq("user_id", user.id);
  return { ok: true };
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error };
}
