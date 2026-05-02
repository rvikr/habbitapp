"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./icon";
import {
  notificationPermission,
  requestNotificationPermission,
} from "./notification-scheduler";

export function NotificationPermissionCard() {
  const router = useRouter();
  const [perm, setPerm] = useState<
    "default" | "granted" | "denied" | "unsupported"
  >("default");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setPerm(notificationPermission());
  }, []);

  const isOn = perm === "granted";
  const blocked = perm === "denied";
  const unsupported = perm === "unsupported";

  function ask() {
    startTransition(async () => {
      const result = await requestNotificationPermission();
      if (result === "granted" || result === "denied" || result === "default") {
        setPerm(result);
      }
      router.refresh();
    });
  }

  return (
    <div className="bg-white rounded-xl p-md shadow-soft-purple-md flex items-center justify-between gap-md">
      <div className="flex items-center gap-md min-w-0">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isOn
              ? "bg-secondary-container/40 text-secondary"
              : "bg-primary-fixed/30 text-primary"
          }`}
        >
          <Icon name={isOn ? "notifications_active" : "notifications"} filled />
        </div>
        <div className="min-w-0">
          <p className="text-label-lg">Browser notifications</p>
          <p className="text-label-sm text-outline">
            {unsupported
              ? "Not supported in this browser."
              : blocked
                ? "Blocked. Enable from your browser site settings."
                : isOn
                  ? "Enabled — reminders will fire while the app is open."
                  : "Allow to receive habit reminders."}
          </p>
        </div>
      </div>
      {isOn ? (
        <span className="text-label-sm font-bold uppercase text-secondary">
          On
        </span>
      ) : blocked || unsupported ? (
        <span className="text-label-sm font-bold uppercase text-outline">
          {unsupported ? "—" : "Off"}
        </span>
      ) : (
        <button
          type="button"
          onClick={ask}
          disabled={pending}
          className="px-md py-2 rounded-full bg-primary text-on-primary text-label-sm font-bold active:scale-95 transition disabled:opacity-50"
        >
          {pending ? "…" : "Enable"}
        </button>
      )}
    </div>
  );
}
