import { getItem, removeItem, setItem } from "@/lib/storage";
import { getReminderSchedule } from "@/lib/reminders";
import { cancelScheduledReminder, getPermissionStatus, scheduleHabitReminder } from "@/lib/notifications";

const STORAGE_KEY = "habbit:scheduled-reminder-ids";

type ReminderIdMap = Record<string, string[]>;

export async function syncScheduledReminders(): Promise<void> {
  const status = await getPermissionStatus();
  if (status !== "granted") return;

  await cancelStoredReminders();
  const schedule = await getReminderSchedule();
  const next: ReminderIdMap = {};

  for (const reminder of schedule) {
    const ids = await scheduleHabitReminder(reminder.habitId, reminder.habitName, reminder.time, reminder.days);
    next[reminder.habitId] = [...(next[reminder.habitId] ?? []), ...ids];
  }

  await setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function cancelHabitReminders(habitId: string): Promise<void> {
  const map = await readReminderIds();
  const ids = map[habitId] ?? [];
  await Promise.all(ids.map((id) => cancelScheduledReminder(id)));
  delete map[habitId];

  if (Object.keys(map).length === 0) await removeItem(STORAGE_KEY);
  else await setItem(STORAGE_KEY, JSON.stringify(map));
}

async function cancelStoredReminders(): Promise<void> {
  const map = await readReminderIds();
  const ids = Object.values(map).flat();
  await Promise.all(ids.map((id) => cancelScheduledReminder(id)));
  await removeItem(STORAGE_KEY);
}

async function readReminderIds(): Promise<ReminderIdMap> {
  const raw = await getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as ReminderIdMap;
  } catch {
    return {};
  }
}
