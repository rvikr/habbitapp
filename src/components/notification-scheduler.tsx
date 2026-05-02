"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ScheduledReminder } from "@/lib/reminders";

const PERMISSION_KEY = "habbit:notify:permission-asked";

export function NotificationScheduler({
  schedule,
}: {
  schedule: ScheduledReminder[];
}) {
  const router = useRouter();
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];

    if (schedule.length === 0) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const now = new Date();
    const todayDow = now.getDay();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowDow = tomorrow.getDay();

    function scheduleOne(
      reminder: ScheduledReminder,
      target: Date,
      dow: number,
    ) {
      if (!reminder.days.includes(dow)) return;
      const delay = target.getTime() - Date.now();
      if (delay <= 0 || delay > 24 * 60 * 60 * 1000) return;
      const id = window.setTimeout(() => fire(reminder), delay);
      timersRef.current.push(id);
    }

    function fire(reminder: ScheduledReminder) {
      try {
        const note = new Notification(`Time for: ${reminder.habitName}`, {
          body: "Tap to log it",
          tag: `habit-${reminder.habitId}-${reminder.time}`,
          badge: undefined,
          requireInteraction: false,
        });
        note.onclick = () => {
          window.focus();
          router.push(`/habits/${reminder.habitId}?prompt=log`);
          note.close();
        };
      } catch {
        // Some browsers throw if document is hidden — ignore.
      }
    }

    schedule.forEach((reminder) => {
      const [h, m] = reminder.time.split(":").map(Number);
      const today = new Date();
      today.setHours(h, m, 0, 0);
      const tmrw = new Date(today);
      tmrw.setDate(today.getDate() + 1);
      scheduleOne(reminder, today, todayDow);
      scheduleOne(reminder, tmrw, tomorrowDow);
    });

    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, [schedule, router]);

  return null;
}

export function notificationsAvailable() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission():
  | "default"
  | "granted"
  | "denied"
  | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window))
    return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window))
    return "unsupported" as const;
  try {
    const result = await Notification.requestPermission();
    window.localStorage.setItem(PERMISSION_KEY, "1");
    return result;
  } catch {
    return "denied" as const;
  }
}
