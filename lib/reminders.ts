import { supabase, isSupabaseConfigured } from "./supabase/client";

export type ScheduledReminder = {
  habitId: string;
  habitName: string;
  time: string;
  days: number[];
  icon: string;
};

export async function getReminderSchedule(): Promise<ScheduledReminder[]> {
  if (!isSupabaseConfigured()) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: habits } = await supabase
    .from("habits")
    .select("id, name, icon, reminder_times, reminder_days, reminders_enabled")
    .is("archived_at", null)
    .eq("reminders_enabled", true);

  const schedule: ScheduledReminder[] = [];
  for (const h of habits ?? []) {
    const times = (h.reminder_times ?? []) as string[];
    const days = ((h.reminder_days ?? [0, 1, 2, 3, 4, 5, 6]) as number[]);
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
