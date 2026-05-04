import { useEffect } from "react";
import { getReminderSchedule } from "@/lib/reminders";
import { cancelAllReminders, scheduleHabitReminder, getPermissionStatus } from "@/lib/notifications";

export default function NotificationScheduler() {
  useEffect(() => {
    async function sync() {
      const status = await getPermissionStatus();
      if (status !== "granted") return;
      await cancelAllReminders();
      const schedule = await getReminderSchedule();
      for (const reminder of schedule) {
        await scheduleHabitReminder(reminder.habitId, reminder.habitName, reminder.time, reminder.days);
      }
    }
    sync();
  }, []);

  return null;
}
