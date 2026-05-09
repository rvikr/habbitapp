import { createClient } from "@/lib/supabase/server";
import type { Habit, HabitCompletion } from "@/types/db";

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

export async function getHabitsForToday() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      habits: [] as Habit[],
      completedToday: new Set<string>(),
      displayName: "there",
      email: null as string | null,
    };

  const [{ data: habits }, { data: completions }, { data: profile }] =
    await Promise.all([
      supabase
        .from("habits")
        .select("*")
        .is("archived_at", null)
        .order("created_at", { ascending: true }),
      supabase
        .from("habit_completions")
        .select("habit_id")
        .eq("completed_on", todayKey()),
      supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  const completedToday = new Set(
    (completions ?? []).map((c) => c.habit_id as string)
  );
  const displayName =
    (profile?.display_name as string | null | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "there";

  return {
    habits: (habits ?? []) as Habit[],
    completedToday,
    displayName,
    email: user.email ?? null,
  };
}

export async function getStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [{ count: totalCompletions }, { count: totalHabits }, { data: recent }] =
    await Promise.all([
      supabase
        .from("habit_completions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("habits")
        .select("id", { count: "exact", head: true })
        .is("archived_at", null)
        .eq("user_id", user.id),
      supabase
        .from("habit_completions")
        .select("completed_on")
        .eq("user_id", user.id)
        .gte("completed_on", thirtyDaysAgo.toISOString().split("T")[0])
        .order("completed_on", { ascending: false }),
    ]);

  // Compute streak
  const activeDates = new Set((recent ?? []).map((r) => r.completed_on));
  let streak = 0;
  const cursor = new Date();
  while (true) {
    const key = cursor.toISOString().split("T")[0];
    if (activeDates.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    totalCompletions: totalCompletions ?? 0,
    totalHabits: totalHabits ?? 0,
    streak,
    activeDates: Array.from(activeDates),
  };
}

export async function getWeeklyCompletions(): Promise<HabitCompletion[]> {
  const supabase = await createClient();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const { data } = await supabase
    .from("habit_completions")
    .select("*")
    .gte("completed_on", sevenDaysAgo.toISOString().split("T")[0])
    .order("completed_on", { ascending: true });

  return (data ?? []) as HabitCompletion[];
}
