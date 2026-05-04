import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import Icon from "./icon";
import HabitCatalogPicker from "./habit-catalog-picker";
import type { Habit } from "@/types/db";
import type { CatalogEntry } from "@/lib/habit-catalog";

const ICONS = ["water_drop", "directions_run", "directions_walk", "menu_book", "self_improvement", "edit_note", "fitness_center", "bedtime", "medication", "restaurant", "shower", "code", "directions_bike", "favorite", "eco", "spa"];
const COLORS: Array<{ id: "primary" | "secondary" | "tertiary" | "neutral"; label: string; hex: string }> = [
  { id: "primary", label: "Purple", hex: "#5d3fd3" },
  { id: "secondary", label: "Teal", hex: "#006a67" },
  { id: "tertiary", label: "Orange", hex: "#7b2900" },
  { id: "neutral", label: "Neutral", hex: "#484554" },
];

type FormData = {
  name: string;
  description: string | null;
  icon: string;
  color: "primary" | "secondary" | "tertiary" | "neutral";
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
  const [color, setColor] = useState<"primary" | "secondary" | "tertiary" | "neutral">(initial?.color ?? "primary");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [target, setTarget] = useState(initial?.target?.toString() ?? "");
  const [loading, setLoading] = useState(false);

  function applyTemplate(entry: CatalogEntry) {
    setName(entry.name);
    setDescription(entry.description);
    setIcon(entry.icon);
    setColor(entry.color as "primary" | "secondary" | "tertiary" | "neutral");
    setUnit(entry.unit);
    setTarget(entry.target?.toString() ?? "");
    setShowCatalog(false);
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    setLoading(true);
    await onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      icon,
      color,
      unit: unit.trim(),
      target: target ? parseFloat(target) : null,
      remindersEnabled: false,
      reminderTimes: [],
      reminderDays: [0, 1, 2, 3, 4, 5, 6],
    });
    setLoading(false);
  }

  if (showCatalog && !initial) {
    return (
      <HabitCatalogPicker
        onSelect={applyTemplate}
        onSkip={() => setShowCatalog(false)}
      />
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
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
