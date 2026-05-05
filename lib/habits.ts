import type { Habit, HabitCompletion } from "@/types/db";
import { supabase, isSupabaseConfigured } from "./supabase/client";
import { addLocalDays, localDateKey } from "./date";
import type { Milestone } from "@/types/db";

const today = () => localDateKey();

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

  const [{ data: habits }, { data: completions }, { data: profile }] = await Promise.all([
    supabase.from("habits").select("*").is("archived_at", null).order("created_at", { ascending: true }),
    supabase.from("habit_completions").select("habit_id").eq("completed_on", today()),
    supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
  ]);

  const completedToday = new Set((completions ?? []).map((c) => c.habit_id as string));
  const displayName =
    (profile?.display_name as string | null | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "there";

  return { habits: (habits ?? []) as Habit[], completedToday, profile: { displayName, email: user.email ?? null } };
}

export async function getHabit(id: string) {
  if (!isSupabaseConfigured()) {
    return { habit: null, completions: [] as HabitCompletion[] };
  }

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
  if (!isSupabaseConfigured()) return null;
  const user = await getUser();
  if (!user) return null;

  const [{ count: totalCompletions }, { count: totalHabits }, { data: dateDocs }, { data: profile }] = await Promise.all([
    supabase.from("habit_completions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("habits").select("id", { count: "exact", head: true }).is("archived_at", null).eq("user_id", user.id),
    supabase.from("habit_completions").select("completed_on").eq("user_id", user.id).order("completed_on", { ascending: false }),
    supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
  ]);

  const uniqueDates = [...new Set((dateDocs ?? []).map((d) => d.completed_on as string))].sort().reverse();
  let currentStreak = 0;
  const cursor = new Date();
  for (const day of uniqueDates) {
    const key = localDateKey(cursor);
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
    displayName:
      (profile?.display_name as string | null | undefined) ??
      (user.user_metadata?.full_name as string | undefined) ??
      user.email?.split("@")[0] ??
      "there",
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

export function getMilestones(stats: Awaited<ReturnType<typeof getStats>> | null): Milestone[] {
  const totalCompletions = stats?.totalCompletions ?? 0;
  const currentStreak = stats?.currentStreak ?? 0;
  return [
    {
      id: "thirty-day",
      name: "30 Day Consistency",
      description: "Complete at least one habit every day for 30 days straight",
      progress: Math.min(currentStreak / 30, 1),
    },
    {
      id: "hundred-logs",
      name: "100 Logs",
      description: "Log 100 habit completions",
      progress: Math.min(totalCompletions / 100, 1),
    },
  ];
}

export function weekProgressFor(habitId: string, completions: HabitCompletion[]) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const days: { label: string; key: string; done: boolean; future: boolean }[] = [];
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  for (let i = 0; i < 7; i++) {
    const d = addLocalDays(monday, i);
    const key = localDateKey(d);
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
    const key = localDateKey(cursor);
    if (day === key) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (day < key) {
      break;
    }
  }
  return streak;
}
