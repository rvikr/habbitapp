"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./icon";

const ICONS = [
  "water_drop",
  "menu_book",
  "directions_run",
  "self_improvement",
  "edit_note",
  "fitness_center",
  "bedtime",
  "spa",
  "restaurant",
  "code",
  "directions_walk",
  "directions_bike",
  "medication",
  "shower",
  "sports_gymnastics",
  "outdoor_grill",
];

const COLORS = [
  { id: "primary", hex: "#5D3FD3", label: "Purple" },
  { id: "secondary", hex: "#48CFCB", label: "Teal" },
  { id: "tertiary", hex: "#FF8A5B", label: "Orange" },
  { id: "neutral", hex: "#797586", label: "Slate" },
] as const;

const DAYS = [
  { i: 1, label: "M" },
  { i: 2, label: "T" },
  { i: 3, label: "W" },
  { i: 4, label: "T" },
  { i: 5, label: "F" },
  { i: 6, label: "S" },
  { i: 0, label: "S" },
];

const UNIT_PRESETS = ["ml", "L", "km", "miles", "min", "hr", "pages", "reps", "kcal"];

type ColorId = (typeof COLORS)[number]["id"];

export type HabitFormValues = {
  name: string;
  description: string;
  icon: string;
  color: ColorId;
  unit: string;
  target: number | null;
  remindersEnabled: boolean;
  reminderTimes: string[];
  reminderDays: number[];
};

type Props = {
  initial?: Partial<HabitFormValues>;
  submitLabel?: string;
  onSubmit: (values: HabitFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export function HabitForm({
  initial,
  submitLabel = "Create habit",
  onSubmit,
  onDelete,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "water_drop");
  const [color, setColor] = useState<ColorId>(initial?.color ?? "primary");

  // Measurement
  const initialUnitIsCustom =
    !!(initial?.unit) && !UNIT_PRESETS.includes(initial.unit);
  const [unit, setUnit] = useState(
    initialUnitIsCustom ? "custom" : (initial?.unit ?? ""),
  );
  const [customUnit, setCustomUnit] = useState(
    initialUnitIsCustom ? (initial?.unit ?? "") : "",
  );
  const [target, setTarget] = useState<number | null>(initial?.target ?? null);
  const trackAmount = !!unit;

  function selectUnit(u: string) {
    setUnit(u);
  }

  function toggleTrackAmount() {
    if (trackAmount) {
      setUnit("");
      setTarget(null);
      setCustomUnit("");
    } else {
      setUnit("ml");
    }
  }

  const resolvedUnit = unit === "custom" ? customUnit.trim() : unit;

  // Reminders
  const [remindersEnabled, setRemindersEnabled] = useState(
    initial?.remindersEnabled ?? false,
  );
  const [reminderTimes, setReminderTimes] = useState<string[]>(
    initial?.reminderTimes && initial.reminderTimes.length > 0
      ? initial.reminderTimes
      : ["08:00"],
  );
  const [reminderDays, setReminderDays] = useState<number[]>(
    initial?.reminderDays ?? [0, 1, 2, 3, 4, 5, 6],
  );
  const [pending, startTransition] = useTransition();

  function toggleDay(d: number) {
    setReminderDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    );
  }

  function setTimeAt(index: number, value: string) {
    setReminderTimes((prev) => prev.map((t, i) => (i === index ? value : t)));
  }

  function addTime() {
    setReminderTimes((prev) => [...prev, "12:00"]);
  }

  function removeTime(index: number) {
    setReminderTimes((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index),
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        icon,
        color,
        unit: resolvedUnit,
        target: resolvedUnit ? target : null,
        remindersEnabled,
        reminderTimes: remindersEnabled ? reminderTimes.filter(Boolean) : [],
        reminderDays: remindersEnabled ? reminderDays : [0, 1, 2, 3, 4, 5, 6],
      });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-lg">
      {/* Name + Description */}
      <div className="bg-white rounded-xl p-lg shadow-soft-purple-md space-y-md">
        <label className="block">
          <span className="text-label-lg text-on-surface-variant">
            Habit name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Drink Water"
            className="mt-2 w-full bg-surface-container-low text-on-background rounded-lg px-md py-3 text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>
        <label className="block">
          <span className="text-label-lg text-on-surface-variant">
            Description
          </span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Why this matters, target, etc."
            className="mt-2 w-full bg-surface-container-low text-on-background rounded-lg px-md py-3 text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>
      </div>

      {/* Icon */}
      <div className="bg-white rounded-xl p-lg shadow-soft-purple-md space-y-md">
        <span className="text-label-lg text-on-surface-variant block">
          Icon
        </span>
        <div className="grid grid-cols-5 gap-sm">
          {ICONS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIcon(i)}
              className={`aspect-square rounded-2xl border flex items-center justify-center transition-colors ${
                icon === i
                  ? "border-primary bg-primary-fixed/40"
                  : "border-outline-variant/40"
              }`}
              aria-pressed={icon === i}
            >
              <Icon name={i} filled className="text-2xl text-primary" />
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div className="bg-white rounded-xl p-lg shadow-soft-purple-md space-y-md">
        <span className="text-label-lg text-on-surface-variant block">
          Color
        </span>
        <div className="flex gap-md">
          {COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setColor(c.id)}
              aria-pressed={color === c.id}
              className={`flex-1 rounded-2xl border p-md flex flex-col items-center gap-2 transition-colors ${
                color === c.id
                  ? "border-primary bg-primary-fixed/30"
                  : "border-outline-variant/40"
              }`}
            >
              <span
                className="w-8 h-8 rounded-full"
                style={{ background: c.hex }}
              />
              <span className="text-label-sm">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Measurement */}
      <div className="bg-white rounded-xl p-lg shadow-soft-purple-md space-y-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-label-lg">Track amount</p>
            <p className="text-label-sm text-outline">
              Log a quantity (ml, km, min…) instead of just yes/no.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={trackAmount}
            aria-label="Track amount"
            onClick={toggleTrackAmount}
            className="squishy-toggle"
            data-checked={trackAmount}
          >
            <span className="dot" />
          </button>
        </div>

        {trackAmount && (
          <div className="space-y-md pt-md border-t border-outline-variant/30">
            <div className="space-y-sm">
              <span className="text-label-lg text-on-surface-variant">
                Unit
              </span>
              <div className="flex flex-wrap gap-sm">
                {UNIT_PRESETS.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => selectUnit(u)}
                    className={`px-md py-1.5 rounded-full text-label-sm font-medium border transition-colors ${
                      unit === u
                        ? "bg-primary text-on-primary border-primary"
                        : "border-outline-variant/40 text-on-surface-variant"
                    }`}
                  >
                    {u}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => selectUnit("custom")}
                  className={`px-md py-1.5 rounded-full text-label-sm font-medium border transition-colors ${
                    unit === "custom"
                      ? "bg-primary text-on-primary border-primary"
                      : "border-outline-variant/40 text-on-surface-variant"
                  }`}
                >
                  Other
                </button>
              </div>
              {unit === "custom" && (
                <input
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  placeholder="e.g. glasses, steps"
                  className="w-full bg-surface-container-low text-on-background rounded-lg px-md py-3 text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              )}
            </div>

            <div className="space-y-sm">
              <span className="text-label-lg text-on-surface-variant">
                Daily target{" "}
                <span className="text-outline font-normal">
                  ({resolvedUnit || "unit"})
                </span>
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={target ?? ""}
                onChange={(e) =>
                  setTarget(e.target.value ? Number(e.target.value) : null)
                }
                placeholder="e.g. 2000"
                className="w-full bg-surface-container-low text-on-background rounded-lg px-md py-3 text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        )}
      </div>

      {/* Reminders */}
      <div className="bg-white rounded-xl p-lg shadow-soft-purple-md space-y-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-label-lg">Reminders</p>
            <p className="text-label-sm text-outline">
              Get a notification at each scheduled time.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={remindersEnabled}
            aria-label="Enable reminders"
            onClick={() => setRemindersEnabled((v) => !v)}
            className="squishy-toggle"
            data-checked={remindersEnabled}
          >
            <span className="dot" />
          </button>
        </div>

        {remindersEnabled ? (
          <div className="space-y-md pt-md border-t border-outline-variant/30">
            <div className="space-y-2">
              <span className="text-label-lg text-on-surface-variant">
                Times
              </span>
              <div className="space-y-2">
                {reminderTimes.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-sm">
                    <input
                      type="time"
                      value={t}
                      onChange={(e) => setTimeAt(idx, e.target.value)}
                      className="flex-1 bg-surface-container-low text-on-background rounded-lg px-md py-3 text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <button
                      type="button"
                      onClick={() => removeTime(idx)}
                      disabled={reminderTimes.length === 1}
                      className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center disabled:opacity-30"
                      aria-label="Remove time"
                    >
                      <Icon name="remove" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addTime}
                className="text-primary text-label-lg flex items-center gap-1 mt-2"
              >
                <Icon name="add" />
                Add another time
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-label-lg text-on-surface-variant">
                Days
              </span>
              <div className="flex gap-1.5">
                {DAYS.map((d) => {
                  const active = reminderDays.includes(d.i);
                  return (
                    <button
                      key={`${d.i}-${d.label}`}
                      type="button"
                      onClick={() => toggleDay(d.i)}
                      aria-pressed={active}
                      className={`flex-1 aspect-square rounded-full text-label-lg transition-colors ${
                        active
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Actions */}
      <div className="space-y-sm">
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="w-full py-md rounded-full bg-gradient-to-r from-primary to-primary-container text-white text-label-lg shadow-soft-purple-lg active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        {onDelete ? (
          <button
            type="button"
            onClick={() => {
              if (!confirm("Delete this habit? Past entries are kept.")) return;
              startTransition(async () => {
                await onDelete();
                router.push("/");
              });
            }}
            disabled={pending}
            className="w-full py-md rounded-xl bg-white border border-error/20 text-error text-label-lg active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            Delete habit
          </button>
        ) : null}
      </div>
    </form>
  );
}
