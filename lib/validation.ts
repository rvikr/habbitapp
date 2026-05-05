export const REMINDER_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidReminderTime(value: string): boolean {
  return REMINDER_TIME_PATTERN.test(value.trim());
}

export function parseOptionalPositiveNumber(value: string): { ok: true; value: number | null } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: null };

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { ok: false, error: "Target must be a positive number." };
  }
  return { ok: true, value: parsed };
}
