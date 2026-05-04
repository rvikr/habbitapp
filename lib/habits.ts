import type { Habit, HabitCompletion } from "@/types/db";
import { supabase, isSupabaseConfigured } from "./supabase/client";
import { seedMilestones } from "./seed";

const today = () => new Date().toISOString().slice(0, 10);

async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getHabitsForToday() {
  if (!isSupabaseConfigured()) {
    return { habits: [] as Habit[], completedToday: new Set<string>(), profile: { displayName: "Demo", email: null } };
  }

  const user = await getUser();
  if (!user) return { habits: [] as Habit[], completedToday: new Set<string>(), profile: { displayName: "there", email: null } };

  const [{ data: habits }, { data: completions }] = await Promise.all([
    supabase.from("habits").select("*").is("archived_at", null).order("created_at", { ascending: true }),
    supabase.from("habit_completions").select("habit_id").eq("completed_on", today()),
  ]);

  const completedToday = new Set((completions ?? []).map((c) => c.habit_id as string));
  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "there";

  return { habits: (habits ?? []) as Habit[], completedToday, profile: { displayName, email: user.email ?? null } };
}

export async function getHabit(id: string) {
  const [{ data: habit }, { data: completions }] = await Promise.all([
    supabase.from("habits").select("*").eq("id", id).single(),
    supabase.from("habit_completions").select("*").eq("habit_id", id).order("completed_on", { ascending: false }).limit(60),
  ]);

  return {
    habit: habit as Habit | null,
    completions: (completions ?? []) as HabitCompletion[],
  };
}

export async function getStats() {
  const user = await getUser();
  if (!user) return null;

  const [{ count: totalCompletions }, { count: totalHabits }, { data: dateDocs }] = await Promise.all([
    supabase.from("habit_completions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("habits").select("id", { count: "exact", head: true }).is("archived_at", null).eq("user_id", user.id),
    supabase.from("habit_completions").select("completed_on").eq("user_id", user.id).order("completed_on", { ascending: false }),
  ]);

  const uniqueDates = [...new Set((dateDocs ?? []).map((d) => d.completed_on as string))].sort().reverse();
  let currentStreak = 0;
  const cursor = new Date();
  for (const day of uniqueDates) {
    const key = cursor.toISOString().slice(0, 10);
    if (day === key) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (day < key) {
      break;
    }
  }

  const completions = totalCompletions ?? 0;
  const habits = totalHabits ?? 0;
  const totalXp = completions * 10;
  const level = Math.floor(totalXp / 500) + 1;
  const xpInLevel = totalXp % 500;

  return {
    displayName: (user.user_metadata?.full_name as string | undefined) ?? user.email?.split("@")[0] ?? "there",
    email: user.email ?? null,
    level,
    xp: xpInLevel,
    totalXp,
    xpForNext: 500,
    currentStreak,
    totalCompletions: completions,
    totalHabits: habits,
  };
}

export function getMilestones() {
  return seedMilestones;
}

export function weekProgressFor(habitId: string, completions: HabitCompletion[]) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const days: { label: string; key: string; done: boolean; future: boolean }[] = [];
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const done = completions.some((c) => c.completed_on === key && c.habit_id === habitId);
    days.push({ label: labels[i], key, done, future: d > now });
  }
  return days;
}

export function streakFor(completions: HabitCompletion[]) {
  if (completions.length === 0) return 0;
  const sorted = [...completions].map((c) => c.completed_on).sort().reverse();
  let streak = 0;
  const cursor = new Date();
  for (const day of sorted) {
    const key = cursor.toISOString().slice(0, 10);
    if (day === key) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (day < key) {
      break;
    }
  }
  return streak;
}
