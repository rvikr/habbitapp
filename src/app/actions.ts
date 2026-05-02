"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AvatarStyle } from "@/lib/avatar";

const today = () => new Date().toISOString().slice(0, 10);

async function getUserOrRedirect() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function logCompletion(habitId: string, value?: number) {
  const { supabase, user } = await getUserOrRedirect();
  await supabase.from("habit_completions").upsert(
    {
      habit_id: habitId,
      user_id: user.id,
      completed_on: today(),
      value: value ?? 1,
    },
    { onConflict: "habit_id,completed_on" },
  );
  revalidatePath(`/habits/${habitId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function toggleHabit(habitId: string, currentlyDone: boolean) {
  const { supabase, user } = await getUserOrRedirect();
  if (currentlyDone) {
    await supabase
      .from("habit_completions")
      .delete()
      .eq("habit_id", habitId)
      .eq("user_id", user.id)
      .eq("completed_on", today());
  } else {
    await supabase.from("habit_completions").upsert(
      {
        habit_id: habitId,
        user_id: user.id,
        completed_on: today(),
        value: 1,
      },
      { onConflict: "habit_id,completed_on" },
    );
  }
  revalidatePath("/");
  revalidatePath(`/habits/${habitId}`);
  return { ok: true };
}

export async function updateAvatar(style: AvatarStyle, seed: string) {
  const { supabase } = await getUserOrRedirect();
  await supabase.auth.updateUser({
    data: { avatar_style: style, avatar_seed: seed },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateHabitReminders(
  habitId: string,
  data: {
    enabled: boolean;
    times: string[];
    days: number[];
  },
) {
  const { supabase, user } = await getUserOrRedirect();
  await supabase
    .from("habits")
    .update({
      reminders_enabled: data.enabled,
      reminder_times: data.times,
      reminder_days: data.days,
    })
    .eq("id", habitId)
    .eq("user_id", user.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateHabit(
  habitId: string,
  data: {
    name: string;
    description: string | null;
    icon: string;
    color: "primary" | "secondary" | "tertiary" | "neutral";
  },
) {
  const { supabase, user } = await getUserOrRedirect();
  await supabase
    .from("habits")
    .update(data)
    .eq("id", habitId)
    .eq("user_id", user.id);
  revalidatePath("/");
  revalidatePath(`/habits/${habitId}`);
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
  const { supabase, user } = await getUserOrRedirect();
  await supabase.from("habits").insert({
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
  });
  revalidatePath("/", "layout");
  redirect("/");
}

export async function updateHabitFull(
  habitId: string,
  data: {
    name: string;
    description: string | null;
    icon: string;
    color: "primary" | "secondary" | "tertiary" | "neutral";
    unit: string;
    target: number | null;
    remindersEnabled: boolean;
    reminderTimes: string[];
    reminderDays: number[];
  },
) {
  const { supabase, user } = await getUserOrRedirect();
  await supabase
    .from("habits")
    .update({
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      unit: data.unit || null,
      target: data.target ?? null,
      reminders_enabled: data.remindersEnabled,
      reminder_times: data.reminderTimes,
      reminder_days: data.reminderDays,
    })
    .eq("id", habitId)
    .eq("user_id", user.id);
  revalidatePath("/", "layout");
  redirect(`/habits/${habitId}`);
}

export async function deleteHabit(habitId: string) {
  const { supabase, user } = await getUserOrRedirect();
  await supabase
    .from("habits")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", habitId)
    .eq("user_id", user.id);
  revalidatePath("/", "layout");
  redirect("/");
}
