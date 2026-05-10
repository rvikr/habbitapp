import { supabase, isSupabaseConfigured, getCurrentUser } from "./supabase/client";
import { localDateDaysAgo } from "./date";
import { streakFromDates } from "./streak";

export type ReminderContext = {
  streak: number;
  typicalHour: number | null;
  percentileAhead: number | null;
};

export type ScheduledReminder = {
  habitId: string;
  habitName: string;
  time: string;
  days: number[];
  icon: string;
  context: ReminderContext;
};

// Returns the hour (0-23) the user most often logs this habit, or null if too few data points.
function typicalHourFromTimestamps(timestamps: string[]): number | null {
  if (timestamps.length < 3) return null;
  const counts: Record<number, number> = {};
  for (const ts of timestamps) {
    const h = new Date(ts).getHours();
    counts[h] = (counts[h] ?? 0) + 1;
  }
  const top = Object.entries(counts).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
  return top ? parseInt(top[0], 10) : null;
}

export async function getReminderSchedule(): Promise<ScheduledReminder[]> {
  if (!isSupabaseConfigured()) return [];
  const user = await getCurrentUser();
  if (!user) return [];

  const cutoff = localDateDaysAgo(60);

  const [{ data: habits }, { data: completions }, { count: totalOnLeaderboard }, { data: myEntry }] =
    await Promise.all([
      supabase
        .from("habits")
        .select("id, name, icon, reminder_times, reminder_days, reminders_enabled")
        .is("archived_at", null)
        .eq("reminders_enabled", true),
      supabase
        .from("habit_completions")
        .select("habit_id, completed_on, created_at")
        .eq("user_id", user.id)
        .gte("completed_on", cutoff),
      supabase.from("leaderboard").select("user_id", { count: "exact", head: true }),
      supabase.from("leaderboard").select("total_xp").eq("user_id", user.id).maybeSingle(),
    ]);

  // Count users below me on the leaderboard to compute percentile.
  let percentileAhead: number | null = null;
  if (myEntry && totalOnLeaderboard && totalOnLeaderboard > 1) {
    const { count: belowMe } = await supabase
      .from("leaderboard")
      .select("user_id", { count: "exact", head: true })
      .lt("total_xp", (myEntry as { total_xp: number }).total_xp);
    percentileAhead = Math.round(((belowMe ?? 0) / totalOnLeaderboard) * 100);
  }

  // Group completions by habit for fast per-habit access.
  type Completion = { completed_on: string; created_at: string };
  const byHabit = new Map<string, Completion[]>();
  for (const c of completions ?? []) {
    const key = c.habit_id as string;
    if (!byHabit.has(key)) byHabit.set(key, []);
    byHabit.get(key)!.push({
      completed_on: c.completed_on as string,
      created_at: c.created_at as string,
    });
  }

  const schedule: ScheduledReminder[] = [];
  for (const h of habits ?? []) {
    const times = (h.reminder_times ?? []) as string[];
    const days = (h.reminder_days ?? [0, 1, 2, 3, 4, 5, 6]) as number[];
    const hc = byHabit.get(h.id as string) ?? [];
    const streak = streakFromDates(hc.map((c) => c.completed_on));
    const typicalHour = typicalHourFromTimestamps(hc.map((c) => c.created_at));

    for (const time of times) {
      if (!/^\d{2}:\d{2}$/.test(time)) continue;
      schedule.push({
        habitId: h.id as string,
        habitName: h.name as string,
        icon: (h.icon as string) ?? "spa",
        time,
        days,
        context: { streak, typicalHour, percentileAhead },
      });
    }
  }
  return schedule;
}
