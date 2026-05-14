import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { localDateDaysAgo, localDateKey } from "../lib/date.ts";
import { XP_PER_COMPLETION, XP_PER_LEVEL, levelForXp, xpForCompletions, xpInLevel } from "../lib/xp.ts";
import { validatePassword } from "../lib/password.ts";
import { isMissingRefreshTokenError } from "../lib/supabase/auth-error.ts";
import { isValidReminderTime, parseOptionalPositiveNumber, validateFeedback } from "../lib/validation.ts";
import { streakFromDates } from "../lib/streak.ts";
import { buildCompletionValuePayload } from "../lib/completions.ts";
import {
  healthConnectTodayRange,
  normalizeHealthConnectStepAggregate,
  normalizeStepCount,
} from "../lib/steps-shared.ts";
import {
  buildSleepCompletionValue,
  computeSleepScore,
  normalizeHealthConnectSleepSessions,
  normalizeHealthKitSleepSamples,
  sleepDateForWakeTime,
  sleepWindowForDate,
} from "../lib/sleep-shared.ts";
import {
  inferHabitIntelligence,
  mergeHabitSettings,
  progressForHabit,
  scoreHabitSimilarity,
  smartReminderTimesForDay,
} from "../lib/habit-intelligence.ts";
import {
  buildCoachSignals,
  formatCoachMessage,
  chooseTopCoachSignal,
} from "../lib/coach.ts";
import { resolveCoachMessage } from "../lib/coach-ai.ts";
import {
  dateKeyInTimeZone,
  isValidDateKey,
  localDateKey as websiteLocalDateKey,
} from "../website/lib/date.ts";
import {
  XP_PER_COMPLETION as WEBSITE_XP_PER_COMPLETION,
  XP_PER_LEVEL as WEBSITE_XP_PER_LEVEL,
} from "../website/lib/xp.ts";
import { isMissingRefreshTokenError as websiteIsMissingRefreshTokenError } from "../website/lib/supabase/auth-error.ts";

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

test("website date helpers preserve browser-local calendar days", () => {
  const boundary = new Date("2026-01-01T23:30:00.000Z");
  assert.equal(dateKeyInTimeZone(boundary, "UTC"), "2026-01-01");
  assert.equal(dateKeyInTimeZone(boundary, "Asia/Kolkata"), "2026-01-02");
  assert.equal(websiteLocalDateKey(new Date(2026, 0, 2, 23, 30)), "2026-01-02");
});

test("date key validation accepts only real yyyy-mm-dd calendar dates", () => {
  assert.equal(isValidDateKey("2026-05-10"), true);
  assert.equal(isValidDateKey("2026-02-30"), false);
  assert.equal(isValidDateKey("05/10/2026"), false);
});

test("XP constants are canonical across app, website, and SQL", () => {
  assert.equal(XP_PER_COMPLETION, 10);
  assert.equal(XP_PER_LEVEL, 500);
  assert.equal(WEBSITE_XP_PER_COMPLETION, XP_PER_COMPLETION);
  assert.equal(WEBSITE_XP_PER_LEVEL, XP_PER_LEVEL);
  assert.equal(xpForCompletions(51), 510);
  assert.equal(levelForXp(0), 1);
  assert.equal(levelForXp(500), 2);
  assert.equal(xpInLevel(510), 10);

  const sql = readFileSync("supabase/migrations/0008_release_readiness.sql", "utf8");
  assert.match(sql, /count\(\*\)::bigint \* 10 as xp/);
  assert.match(sql, /\/ 500 \+ 1 as level/);
});

test("Supabase stale refresh token errors are recognized", () => {
  const error = new Error("Invalid Refresh Token: Refresh Token Not Found");
  assert.equal(isMissingRefreshTokenError(error), true);
  assert.equal(websiteIsMissingRefreshTokenError({ message: "refresh_token_not_found" }), true);
  assert.equal(isMissingRefreshTokenError(new Error("Network request failed")), false);
});

test("password validation rejects weak passwords", () => {
  assert.equal(validatePassword("Short1"), "Password must be at least 8 characters.");
  assert.equal(validatePassword("lowercaseonly1"), "Password must include an uppercase letter.");
  assert.equal(validatePassword("Valid123"), null);
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

test("streakFromDates returns 0 for empty input", () => {
  assert.equal(streakFromDates([]), 0);
});

test("streakFromDates counts consecutive days ending today", () => {
  const today = new Date(2026, 4, 10);
  const dates = [
    localDateKey(today),
    localDateDaysAgo(1, today),
    localDateDaysAgo(2, today),
  ];
  assert.equal(streakFromDates(dates, today), 3);
});

test("streakFromDates breaks on a missing day", () => {
  const today = new Date(2026, 4, 10);
  const dates = [
    localDateKey(today),
    localDateDaysAgo(2, today),
    localDateDaysAgo(3, today),
  ];
  assert.equal(streakFromDates(dates, today), 1);
});

test("streakFromDates is 0 when latest completion is older than today", () => {
  const today = new Date(2026, 4, 10);
  const dates = [localDateDaysAgo(1, today), localDateDaysAgo(2, today)];
  assert.equal(streakFromDates(dates, today), 0);
});

test("streakFromDates ignores duplicate days", () => {
  const today = new Date(2026, 4, 10);
  const key = localDateKey(today);
  assert.equal(streakFromDates([key, key, localDateDaysAgo(1, today)], today), 2);
});

test("habit intelligence assigns habit-specific metrics", () => {
  assert.deepEqual(
    inferHabitIntelligence({ name: "Drink Water", unit: "ml", target: 2000 }).metricType,
    "volume_ml",
  );
  const walk = inferHabitIntelligence({ name: "Walk", unit: "km", target: 3 });
  assert.equal(walk.metricType, "steps");
  assert.equal(walk.unit, "steps");
  assert.equal(walk.target, 8000);
  const timedReading = inferHabitIntelligence({ name: "Read for 30 minutes" });
  assert.equal(timedReading.metricType, "minutes");
  assert.equal(timedReading.target, 30);
});

test("habit intelligence normalizes water litre goals to ml", () => {
  const water = inferHabitIntelligence({ name: "Drink 1 litre water daily" });
  assert.equal(water.habitType, "water_intake");
  assert.equal(water.unit, "ml");
  assert.equal(water.target, 1000);
});

test("habit intelligence converts selected display units into base storage units", () => {
  const water = inferHabitIntelligence({ name: "Drink water", unit: "l", target: 2, habitType: "water_intake", metricType: "volume_ml" });
  assert.equal(water.unit, "ml");
  assert.equal(water.target, 2000);
  const run = inferHabitIntelligence({ name: "Run", unit: "m", target: 500, habitType: "run", metricType: "distance_km" });
  assert.equal(run.unit, "km");
  assert.equal(run.target, 0.5);
});

test("progressForHabit supports partial and completed target habits", () => {
  const habit = {
    id: "h1",
    user_id: "u1",
    name: "Drink Water",
    description: null,
    icon: "water_drop",
    color: "secondary",
    target: 2000,
    unit: "ml",
    reminder_time: null,
    reminder_times: [],
    reminder_days: [0, 1, 2, 3, 4, 5, 6],
    reminders_enabled: true,
    habit_type: "water_intake",
    metric_type: "volume_ml",
    visual_type: "water_bottle",
    reminder_strategy: "interval",
    reminder_interval_minutes: 120,
    default_log_value: 250,
    created_at: "2026-05-10T00:00:00Z",
    archived_at: null,
  };
  assert.equal(progressForHabit(habit, null).isDone, false);
  assert.equal(progressForHabit(habit, { value: 750 }).label, "750 / 2000 ml");
  assert.equal(progressForHabit(habit, { value: 2000 }).isDone, true);
});

test("completion value payload stores absolute values", () => {
  assert.deepEqual(
    buildCompletionValuePayload("habit-1", "user-1", "2026-05-14", 1234.9, " synced "),
    {
      habit_id: "habit-1",
      user_id: "user-1",
      completed_on: "2026-05-14",
      value: 1234,
      note: "synced",
    },
  );
});

test("health connect step range starts at local midnight", () => {
  const range = healthConnectTodayRange(new Date(2026, 4, 14, 15, 45, 12));
  const start = new Date(range.startTime);
  const end = new Date(range.endTime);
  assert.equal(range.operator, "between");
  assert.equal(start.getFullYear(), 2026);
  assert.equal(start.getMonth(), 4);
  assert.equal(start.getDate(), 14);
  assert.equal(start.getHours(), 0);
  assert.equal(start.getMinutes(), 0);
  assert.equal(end.getHours(), 15);
  assert.equal(end.getMinutes(), 45);
});

test("health connect step aggregate normalization returns integer totals", () => {
  assert.equal(normalizeStepCount(1234.9), 1234);
  assert.equal(normalizeStepCount(-20), 0);
  assert.equal(normalizeHealthConnectStepAggregate({ COUNT_TOTAL: 6789.8, dataOrigins: [] }), 6789);
  assert.equal(normalizeHealthConnectStepAggregate({ dataOrigins: [] }), 0);
  assert.equal(normalizeHealthConnectStepAggregate(null), null);
});

test("sleep date is assigned from wake time and windows span 18:00 to 18:00", () => {
  assert.equal(sleepDateForWakeTime(new Date(2026, 4, 14, 7, 30)), "2026-05-14");
  assert.equal(sleepDateForWakeTime(new Date(2026, 4, 14, 17, 59)), "2026-05-14");
  assert.equal(sleepDateForWakeTime(new Date(2026, 4, 14, 18, 0)), "2026-05-15");

  const window = sleepWindowForDate("2026-05-14");
  const start = new Date(window.startTime);
  const end = new Date(window.endTime);
  assert.equal(start.getFullYear(), 2026);
  assert.equal(start.getMonth(), 4);
  assert.equal(start.getDate(), 13);
  assert.equal(start.getHours(), 18);
  assert.equal(end.getDate(), 14);
  assert.equal(end.getHours(), 18);
});

test("health connect sleep sessions normalize duration and stages", () => {
  const normalized = normalizeHealthConnectSleepSessions([
    {
      startTime: "2026-05-13T22:30:00.000Z",
      endTime: "2026-05-14T06:30:00.000Z",
      stages: [
        { startTime: "2026-05-13T22:30:00.000Z", endTime: "2026-05-14T00:00:00.000Z", stage: 4 },
        { startTime: "2026-05-14T00:00:00.000Z", endTime: "2026-05-14T02:00:00.000Z", stage: 5 },
        { startTime: "2026-05-14T02:00:00.000Z", endTime: "2026-05-14T06:30:00.000Z", stage: 1 },
      ],
    },
  ]);

  assert.equal(normalized?.sleepDate, "2026-05-14");
  assert.equal(normalized?.durationMinutes, 480);
  assert.equal(normalized?.stageMinutes?.deep, 90);
  assert.equal(normalized?.stageMinutes?.rem, 120);
  assert.equal(normalized?.stageMinutes?.asleep, 270);
});

test("healthkit sleep samples count asleep categories and ignore in-bed/awake", () => {
  const normalized = normalizeHealthKitSleepSamples([
    { startDate: "2026-05-13T21:45:00.000Z", endDate: "2026-05-13T22:30:00.000Z", value: 0 },
    { startDate: "2026-05-13T22:30:00.000Z", endDate: "2026-05-14T01:30:00.000Z", value: 3 },
    { startDate: "2026-05-14T01:30:00.000Z", endDate: "2026-05-14T02:00:00.000Z", value: 2 },
    { startDate: "2026-05-14T02:00:00.000Z", endDate: "2026-05-14T06:00:00.000Z", value: 5 },
  ]);

  assert.equal(normalized?.sleepDate, "2026-05-14");
  assert.equal(normalized?.durationMinutes, 420);
  assert.equal(normalized?.stageMinutes?.core, 180);
  assert.equal(normalized?.stageMinutes?.rem, 240);
  assert.equal(normalized?.stageMinutes?.awake, 30);
});

test("sleep score is duration-first with neutral consistency and stage points", () => {
  assert.equal(computeSleepScore({ durationMinutes: 480, targetMinutes: 480, recentEntries: [] }), 100);
  assert.equal(computeSleepScore({ durationMinutes: 240, targetMinutes: 480, recentEntries: [] }), 58);
  assert.equal(
    computeSleepScore({
      durationMinutes: 480,
      targetMinutes: 480,
      startMinutes: 23 * 60,
      endMinutes: 7 * 60,
      recentEntries: [
        { startMinutes: 22 * 60 + 45, endMinutes: 6 * 60 + 45 },
        { startMinutes: 23 * 60, endMinutes: 7 * 60 },
        { startMinutes: 23 * 60 + 15, endMinutes: 7 * 60 + 10 },
      ],
      stageMinutes: { deep: 0, rem: 0, core: 0, asleep: 480, awake: 0 },
    }),
    95,
  );
});

test("sleep completion value stores hours from synced minutes", () => {
  assert.equal(buildSleepCompletionValue(465), 7.8);
  assert.equal(buildSleepCompletionValue(-20), 0);
});

test("duplicate scoring and merging combine compatible water habits", () => {
  const existing = {
    id: "h1",
    user_id: "u1",
    name: "Drink 1 litre water daily",
    description: null,
    icon: "water_drop",
    color: "secondary",
    target: 1000,
    unit: "ml",
    reminder_time: null,
    reminder_times: [],
    reminder_days: [0, 1, 2, 3, 4, 5, 6],
    reminders_enabled: true,
    habit_type: "water_intake",
    metric_type: "volume_ml",
    visual_type: "water_bottle",
    reminder_strategy: "interval",
    reminder_interval_minutes: 120,
    default_log_value: 250,
    created_at: "2026-05-10T00:00:00Z",
    archived_at: null,
  };
  const candidate = { name: "Drink more water", icon: "water_drop", unit: "ml", target: 2000 };
  assert.ok(scoreHabitSimilarity(candidate, existing) >= 0.8);
  const merged = mergeHabitSettings(candidate, existing);
  assert.equal(merged.target, 2000);
  assert.equal(merged.metric_type, "volume_ml");
});

test("smart reminder slots respect active hours and intervals", () => {
  const slots = smartReminderTimesForDay(new Date(2026, 4, 10, 7, 30), 120);
  assert.deepEqual(slots.map((slot) => slot.getHours()), [8, 10, 12, 14, 16, 18, 20, 22]);
  const midday = smartReminderTimesForDay(new Date(2026, 4, 10, 12, 30), 60);
  assert.equal(midday[0].getHours(), 13);
});

const coachHabit = {
  id: "coach-water",
  user_id: "u1",
  name: "Drink Water",
  description: null,
  icon: "water_drop",
  color: "secondary",
  target: 2000,
  unit: "ml",
  reminder_time: null,
  reminder_times: [],
  reminder_days: [0, 1, 2, 3, 4, 5, 6],
  reminders_enabled: true,
  habit_type: "water_intake",
  metric_type: "volume_ml",
  visual_type: "water_bottle",
  reminder_strategy: "interval",
  reminder_interval_minutes: 120,
  default_log_value: 250,
  created_at: "2026-05-01T00:00:00Z",
  archived_at: null,
};

test("coach detects target habits falling behind by time of day", () => {
  const signals = buildCoachSignals({
    habits: [coachHabit],
    completions: [{ habit_id: coachHabit.id, completed_on: "2026-05-14", created_at: "2026-05-14T09:00:00", value: 600 }],
    now: new Date(2026, 4, 14, 16, 0),
    tone: "friendly",
  });
  const signal = signals.find((item) => item.kind === "behind_progress");
  assert.equal(signal?.habitId, coachHabit.id);
  assert.equal(signal?.suggestedAction, "log_value");
  assert.equal(signal?.suggestedValue, 500);
  assert.match(signal?.message ?? "", /only completed 30%/i);
});

test("coach detects same-weekday late skip windows and suggests an easier version", () => {
  const workout = {
    ...coachHabit,
    id: "coach-workout",
    name: "Workout",
    target: 45,
    unit: "min",
    habit_type: "workout",
    metric_type: "minutes",
    default_log_value: 15,
  };
  const signals = buildCoachSignals({
    habits: [workout],
    completions: [
      { habit_id: workout.id, completed_on: "2026-05-12", created_at: "2026-05-12T18:30:00", value: 45 },
      { habit_id: workout.id, completed_on: "2026-05-11", created_at: "2026-05-11T18:30:00", value: 45 },
      { habit_id: workout.id, completed_on: "2026-05-06", created_at: "2026-05-06T18:30:00", value: 45 },
      { habit_id: workout.id, completed_on: "2026-04-29", created_at: "2026-04-29T18:30:00", value: 45 },
    ],
    now: new Date(2026, 4, 13, 20, 30),
    tone: "motivational",
  });
  const signal = signals.find((item) => item.kind === "usual_skip_window");
  assert.equal(signal?.suggestedValue, 15);
  assert.match(signal?.message ?? "", /15-minute version/i);
});

test("coach softens strict tones when burnout is detected", () => {
  const signals = buildCoachSignals({
    habits: [coachHabit],
    completions: [
      { habit_id: coachHabit.id, completed_on: "2026-05-05", created_at: "2026-05-05T09:00:00", value: 2000 },
      { habit_id: coachHabit.id, completed_on: "2026-05-06", created_at: "2026-05-06T09:00:00", value: 2000 },
      { habit_id: coachHabit.id, completed_on: "2026-05-07", created_at: "2026-05-07T09:00:00", value: 2000 },
      { habit_id: coachHabit.id, completed_on: "2026-05-08", created_at: "2026-05-08T09:00:00", value: 2000 },
    ],
    now: new Date(2026, 4, 14, 18, 0),
    tone: "military",
  });
  const signal = chooseTopCoachSignal(signals);
  assert.equal(signal?.kind, "burnout");
  assert.equal(signal?.tone, "calm");
  assert.match(signal?.message ?? "", /smaller/i);
});

test("coach tone formatter supports every configured tone", () => {
  const base = {
    kind: "encouragement",
    priority: 10,
    habitId: "habit-1",
    habitName: "Read",
    suggestedAction: "open_habit",
    message: "",
  };
  assert.match(formatCoachMessage({ ...base, tone: "friendly" }), /You/i);
  assert.match(formatCoachMessage({ ...base, tone: "motivational" }), /momentum/i);
  assert.match(formatCoachMessage({ ...base, tone: "calm" }), /small/i);
  assert.match(formatCoachMessage({ ...base, tone: "strict" }), /Commit/i);
  assert.match(formatCoachMessage({ ...base, tone: "military" }), /Mission/i);
});

test("AI coach message falls back when disabled or generation fails", async () => {
  const signal = {
    kind: "encouragement",
    priority: 10,
    habitId: "habit-1",
    habitName: "Read",
    tone: "friendly",
    suggestedAction: "open_habit",
    message: "Read one page now.",
  };
  let calls = 0;
  const disabled = await resolveCoachMessage(signal, { enabled: false, invoke: async () => { calls++; return "Generated"; } });
  assert.equal(disabled, signal.message);
  assert.equal(calls, 0);

  const failed = await resolveCoachMessage(signal, { enabled: true, invoke: async () => { calls++; throw new Error("offline"); } });
  assert.equal(failed, signal.message);
  assert.equal(calls, 1);
});

test("AI coach message uses cache before invoking generation", async () => {
  const signal = {
    kind: "behind_progress",
    priority: 70,
    habitId: "habit-1",
    habitName: "Water",
    tone: "friendly",
    suggestedAction: "log_value",
    suggestedValue: 500,
    message: "Drink 500 ml now.",
  };
  const cachedAt = new Date(2026, 4, 14, 12, 0).getTime();
  const cache = new Map([
    ["habbit:coach-message:behind_progress:habit-1:friendly:500", JSON.stringify({ message: "Cached coach line.", cachedAt })],
  ]);
  const storage = {
    getItem: async (key) => cache.get(key) ?? null,
    setItem: async (key, value) => { cache.set(key, value); },
  };
  let calls = 0;
  const message = await resolveCoachMessage(signal, {
    enabled: true,
    now: new Date(cachedAt + 60_000),
    storage,
    invoke: async () => { calls++; return "Generated coach line."; },
  });
  assert.equal(message, "Cached coach line.");
  assert.equal(calls, 0);
});
