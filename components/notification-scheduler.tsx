import { useEffect } from "react";
import { syncScheduledReminders } from "@/lib/reminder-sync";

export default function NotificationScheduler() {
  useEffect(() => {
    syncScheduledReminders();
  }, []);

  return null;
}
