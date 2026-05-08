import { useEffect } from "react";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { syncScheduledReminders } from "@/lib/reminder-sync";

export default function NotificationScheduler() {
  const router = useRouter();

  useEffect(() => {
    syncScheduledReminders();

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const habitId = response.notification.request.content.data?.habitId as string | undefined;
      if (habitId) {
        router.push(`/habits/${habitId}`);
      }
    });

    return () => sub.remove();
  }, []);

  return null;
}
