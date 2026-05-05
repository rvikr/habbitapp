import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Switch } from "react-native";
import Icon from "./icon";
import HabitCatalogPicker from "./habit-catalog-picker";
import type { Habit } from "@/types/db";
import type { CatalogEntry } from "@/lib/habit-catalog";
import { isValidReminderTime, parseOptionalPositiveNumber } from "@/lib/validation";

const ICONS = ["water_drop", "directions_run", "directions_walk", "menu_book", "self_improvement", "edit_note", "fitness_center", "bedtime", "medication", "restaurant", "shower", "code", "directions_bike", "favorite", "eco", "spa"];
const COLORS: Array<{ id: "primary" | "secondary" | "tertiary" | "neutral"; label: string; hex: string }> = [
  { id: "primary", label: "Purple", hex: "#5d3fd3" },
  { id: "secondary", label: "Teal", hex: "#006a67" },
  { id: "tertiary", label: "Orange", hex: "#7b2900" },
  { id: "neutral", label: "Neutral", hex: "#484554" },
];
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const TIME_PRESETS = ["07:00", "08:00", "12:00", "16:00", "20:00", "22:00"];

type ColorId = "primary" | "secondary" | "tertiary" | "neutral";
type FormData = {
  name: string;
  description: string | null;
  icon: string;
  color: ColorId;
  unit: string;
  target: number | null;
  remindersEnabled: boolean;
  reminderTimes: string[];
  reminderDays: number[];
};

type Props = {
  initial?: Habit;
  onSubmit: (data: FormData) => Promise<void>;
  submitLabel?: string;
};

export default function HabitForm({ initial, onSubmit, submitLabel = "Save" }: Props) {
  const [showCatalog, setShowCatalog] = useState(!initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "spa");
  const [color, setColor] = useState<ColorId>(initial?.color ?? "primary");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [target, setTarget] = useState(initial?.target?.toString() ?? "");
  const [remindersEnabled, setRemindersEnabled] = useState(initial?.reminders_enabled ?? false);
  const [reminderTimes, setReminderTimes] = useState<string[]>(initial?.reminder_times ?? []);
  const [reminderDays, setReminderDays] = useState<number[]>(initial?.reminder_days ?? [0, 1, 2, 3, 4, 5, 6]);
  const [customTime, setCustomTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function applyTemplate(entry: CatalogEntry) {
    setName(entry.name);
    setDescription(entry.description);
    setIcon(entry.icon);
    setColor(entry.color as ColorId);
    setUnit(entry.unit);
    setTarget(entry.target?.toString() ?? "");
    if (entry.defaultTimes.length > 0) {
      setRemindersEnabled(true);
      setReminderTimes(entry.defaultTimes);
    }
    setShowCatalog(false);
  }

  function toggleTime(time: string) {
    setReminderTimes((prev) => prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time].sort());
  }

  function addCustomTime() {
    const t = customTime.trim();
    if (!isValidReminderTime(t)) {
      setFormError("Use a valid 24-hour time, for example 08:30.");
      return;
    }
    if (!reminderTimes.includes(t)) setReminderTimes((prev) => [...prev, t].sort());
    setCustomTime("");
    setFormError(null);
  }

  function toggleDay(day: number) {
    setReminderDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort());
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    const parsedTarget = parseOptionalPositiveNumber(target);
    if (!parsedTarget.ok) {
      setFormError(parsedTarget.error);
      return;
    }
    if (remindersEnabled && reminderTimes.length === 0) {
      setFormError("Add at least one reminder time or turn reminders off.");
      return;
    }
    if (remindersEnabled && reminderTimes.some((time) => !isValidReminderTime(time))) {
      setFormError("Use valid 24-hour reminder times.");
      return;
    }
    if (reminderDays.some((day) => day < 0 || day > 6)) {
      setFormError("Choose valid reminder days.");
      return;
    }
    setFormError(null);
    setLoading(true);
    await onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      icon,
      color,
      unit: unit.trim(),
      target: parsedTarget.value,
      remindersEnabled,
      reminderTimes: remindersEnabled ? reminderTimes : [],
      reminderDays: remindersEnabled ? (reminderDays.length > 0 ? reminderDays : [0, 1, 2, 3, 4, 5, 6]) : [0, 1, 2, 3, 4, 5, 6],
    });
    setLoading(false);
  }

  if (showCatalog && !initial) {
    return <HabitCatalogPicker onSelect={applyTemplate} onSkip={() => setShowCatalog(false)} />;
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <View className="px-margin-mobile gap-md">
        {/* Name */}
        <View>
          <Text className="text-label-lg text-on-surface-variant dark:text-d-on-surface-variant mb-xs">NAME</Text>
          <TextInput
            className="bg-surface-container dark:bg-d-surface-container text-on-surface dark:text-d-on-surface rounded-xl px-md py-sm text-body-md"
            placeholder="Habit name"
            placeholderTextColor="#797586"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Description */}
        <View>
          <Text className="text-label-lg text-on-surface-variant dark:text-d-on-surface-variant mb-xs">DESCRIPTION (optional)</Text>
          <TextInput
            className="bg-surface-container dark:bg-d-surface-container text-on-surface dark:text-d-on-surface rounded-xl px-md py-sm text-body-md"
            placeholder="What's this habit about?"
            placeholderTextColor="#797586"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Icon picker */}
        <View>
          <Text className="text-label-lg text-on-surface-variant dark:text-d-on-surface-variant mb-xs">ICON</Text>
          <View className="flex-row flex-wrap gap-sm">
            {ICONS.map((ic) => (
              <TouchableOpacity
                key={ic}
                className="w-12 h-12 rounded-xl items-center justify-center"
                style={{ backgroundColor: icon === ic ? "#5d3fd3" : "#edeeef" }}
                onPress={() => setIcon(ic)}
              >
                <Icon name={ic} size={24} color={icon === ic ? "#fff" : "#484554"} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color picker */}
        <View>
          <Text className="text-label-lg text-on-surface-variant dark:text-d-on-surface-variant mb-xs">COLOR</Text>
          <View className="flex-row gap-sm">
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c.id}
                className="flex-1 py-sm rounded-xl items-center"
                style={{ backgroundColor: c.hex + "22", borderWidth: 2, borderColor: color === c.id ? c.hex : "transparent" }}
                onPress={() => setColor(c.id)}
              >
                <View className="w-5 h-5 rounded-full mb-xs" style={{ backgroundColor: c.hex }} />
                <Text className="text-label-sm" style={{ color: c.hex }}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Unit + Target */}
        <View className="flex-row gap-sm">
          <View className="flex-1">
            <Text className="text-label-lg text-on-surface-variant dark:text-d-on-surface-variant mb-xs">UNIT</Text>
            <TextInput
              className="bg-surface-container dark:bg-d-surface-container text-on-surface dark:text-d-on-surface rounded-xl px-md py-sm text-body-md"
              placeholder="ml, km, min…"
              placeholderTextColor="#797586"
              value={unit}
              onChangeText={setUnit}
            />
          </View>
          <View className="flex-1">
            <Text className="text-label-lg text-on-surface-variant dark:text-d-on-surface-variant mb-xs">TARGET</Text>
            <TextInput
              className="bg-surface-container dark:bg-d-surface-container text-on-surface dark:text-d-on-surface rounded-xl px-md py-sm text-body-md"
              placeholder="e.g. 2000"
              placeholderTextColor="#797586"
              value={target}
              onChangeText={setTarget}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Reminders */}
        <View className="bg-surface-container dark:bg-d-surface-container rounded-xl p-md gap-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-body-md text-on-surface dark:text-d-on-surface font-semibold">Reminders</Text>
              <Text className="text-label-sm text-on-surface-variant dark:text-d-on-surface-variant">Send notifications at specific times.</Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={setRemindersEnabled}
              trackColor={{ false: "#c9c4d7", true: "#5d3fd3" }}
              thumbColor="#fff"
            />
          </View>

          {remindersEnabled && (
            <>
              <Text className="text-label-lg text-on-surface-variant dark:text-d-on-surface-variant mt-sm">TIMES</Text>
              <View className="flex-row flex-wrap gap-xs">
                {TIME_PRESETS.map((t) => {
                  const active = reminderTimes.includes(t);
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => toggleTime(t)}
                      className={`px-md py-xs rounded-full ${active ? "bg-primary" : "bg-surface-high dark:bg-d-surface-high"}`}
                    >
                      <Text className={`text-label-lg ${active ? "text-on-primary" : "text-on-surface dark:text-d-on-surface"}`}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {reminderTimes.filter((t) => !TIME_PRESETS.includes(t)).length > 0 && (
                <View className="flex-row flex-wrap gap-xs">
                  {reminderTimes.filter((t) => !TIME_PRESETS.includes(t)).map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => toggleTime(t)}
                      className="px-md py-xs rounded-full bg-primary flex-row items-center gap-xs"
                    >
                      <Text className="text-on-primary text-label-lg">{t}</Text>
                      <Text className="text-on-primary text-label-sm">×</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View className="flex-row gap-xs items-center">
                <TextInput
                  className="flex-1 bg-surface-high dark:bg-d-surface-high text-on-surface dark:text-d-on-surface rounded-xl px-md py-xs text-body-md"
                  placeholder="HH:MM (24h)"
                  placeholderTextColor="#797586"
                  value={customTime}
                  onChangeText={setCustomTime}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
                <TouchableOpacity
                  className="bg-primary px-md py-xs rounded-full"
                  onPress={addCustomTime}
                  disabled={!isValidReminderTime(customTime)}
                  style={{ opacity: isValidReminderTime(customTime) ? 1 : 0.4 }}
                >
                  <Text className="text-on-primary text-label-lg">Add</Text>
                </TouchableOpacity>
              </View>

              <Text className="text-label-lg text-on-surface-variant dark:text-d-on-surface-variant mt-sm">REPEAT ON</Text>
              <View className="flex-row gap-xs">
                {DAY_LABELS.map((label, i) => {
                  const active = reminderDays.includes(i);
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => toggleDay(i)}
                      className={`flex-1 py-xs rounded-full items-center ${active ? "bg-primary" : "bg-surface-high dark:bg-d-surface-high"}`}
                    >
                      <Text className={`text-label-lg ${active ? "text-on-primary" : "text-on-surface dark:text-d-on-surface"}`}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {formError && <Text className="text-error text-label-sm text-center">{formError}</Text>}

        {/* Submit */}
        <TouchableOpacity
          className="bg-primary rounded-full py-sm items-center mt-sm"
          onPress={handleSubmit}
          disabled={loading || !name.trim()}
          style={{ opacity: !name.trim() ? 0.5 : 1 }}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-on-primary text-label-lg font-semibold">{submitLabel}</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
