import { createClient, isSupabaseConfigured } from "./supabase/server";

export type ScheduledReminder = {
  habitId: string;
  habitName: string;
  time: string; // HH:MM (24h)
  days: number[]; // 0-6, Sunday=0
  icon: string;
};

export async function getReminderSchedule(): Promise<ScheduledReminder[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: habits } = await supabase
    .from("habits")
    .select("id, name, icon, reminder_times, reminder_days, reminders_enabled")
    .is("archived_at", null)
    .eq("reminders_enabled", true);

  const schedule: ScheduledReminder[] = [];
  for (const h of habits ?? []) {
    const times = (h.reminder_times ?? []) as string[];
    const days =
      ((h.reminder_days ?? [0, 1, 2, 3, 4, 5, 6]) as number[]) ?? [];
    for (const time of times) {
      if (!/^\d{2}:\d{2}$/.test(time)) continue;
      schedule.push({
        habitId: h.id as string,
        habitName: h.name as string,
        icon: (h.icon as string) ?? "spa",
        time,
        days,
      });
    }
  }
  return schedule;
}
