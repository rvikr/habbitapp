export async function requestPermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export async function getPermissionStatus(): Promise<"granted" | "denied" | "undetermined"> {
  if (typeof Notification === "undefined") return "undetermined";
  return Notification.permission as "granted" | "denied" | "undetermined";
}

export async function scheduleHabitReminder(
  habitId: string,
  habitName: string,
  time: string,
  days: number[],
  body?: string,
): Promise<string[]> {
  return [];
}

export async function scheduleHabitReminderAt(
  habitId: string,
  habitName: string,
  fireAt: Date,
  body?: string,
): Promise<string> {
  return "";
}

export async function cancelScheduledReminder(id: string): Promise<void> {
}

export async function cancelAllReminders(): Promise<void> {
}
