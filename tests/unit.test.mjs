import assert from "node:assert/strict";

import { localDateDaysAgo, localDateKey } from "../lib/date.ts";
import { validatePassword } from "../lib/password.ts";
import { isValidReminderTime, parseOptionalPositiveNumber, validateFeedback } from "../lib/validation.ts";

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("localDateKey uses local calendar fields", () => {
  assert.equal(localDateKey(new Date(2026, 0, 2, 23, 30)), "2026-01-02");
});

test("localDateDaysAgo crosses month boundaries", () => {
  assert.equal(localDateDaysAgo(1, new Date(2026, 0, 1, 8, 0)), "2025-12-31");
});

test("password validation rejects weak passwords", () => {
  assert.equal(validatePassword("short"), "Password must be at least 12 characters.");
  assert.equal(validatePassword("lowercaseonly1"), "Password must include an uppercase letter.");
  assert.equal(validatePassword("ValidPassword1"), null);
});

test("reminder time validation accepts only HH:MM in 24-hour time", () => {
  assert.equal(isValidReminderTime("08:30"), true);
  assert.equal(isValidReminderTime("23:59"), true);
  assert.equal(isValidReminderTime("24:00"), false);
  assert.equal(isValidReminderTime("7:30"), false);
});

test("positive number parsing rejects invalid habit targets", () => {
  assert.deepEqual(parseOptionalPositiveNumber(""), { ok: true, value: null });
  assert.deepEqual(parseOptionalPositiveNumber("2.5"), { ok: true, value: 2.5 });
  assert.equal(parseOptionalPositiveNumber("0").ok, false);
  assert.equal(parseOptionalPositiveNumber("-1").ok, false);
});

test("feedback validation requires useful message and valid rating", () => {
  assert.equal(validateFeedback({ rating: 5, message: "Great, but reminders need snooze." }), null);
  assert.equal(validateFeedback({ rating: 5, message: "too short" })?.includes("10 characters"), true);
  assert.equal(validateFeedback({ rating: 6, message: "This message is long enough." })?.includes("rating"), true);
});
