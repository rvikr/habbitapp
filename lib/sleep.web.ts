import { getSleepDashboardData, manualLogSleep } from "./sleep-data";
import type { SleepPermissionStatus } from "./sleep-shared";
import type { SleepSyncResult } from "./sleep-data";

export { getSleepDashboardData, manualLogSleep };

export async function getSleepPermissionStatus(): Promise<SleepPermissionStatus> {
  return "unavailable";
}

export async function requestSleepPermission(): Promise<SleepPermissionStatus> {
  return "unavailable";
}

export async function syncLastNightSleep(): Promise<{ ok: boolean; data?: SleepSyncResult; error?: string; status?: SleepPermissionStatus }> {
  return { ok: false, status: "unavailable", error: "Sleep sync is available on iOS and Android devices. You can log sleep manually on web." };
}
