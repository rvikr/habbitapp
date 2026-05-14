import { useState, useCallback } from "react";
import { Alert, View, Text, ScrollView, TouchableOpacity, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { getHabitsForToday } from "@/lib/habits";
import { updateHabitReminders } from "@/lib/actions";
import { requestPermission, getPermissionStatus } from "@/lib/notifications";
import { syncScheduledReminders } from "@/lib/reminder-sync";
import { getReminderSchedule } from "@/lib/reminders";
import { buildSmartBody } from "@/lib/reminder-sync";
import type { Habit } from "@/types/db";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function RemindersScreen() {
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [permission, setPermission] = useState<"granted" | "denied" | "undetermined">("undetermined");
  const [previewMessages, setPreviewMessages] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const { habits: h } = await getHabitsForToday();
    setHabits(h);
    const status = await getPermissionStatus();
    setPermission(status);

    // Load enriched schedule to show contextual preview messages.
    const schedule = await getReminderSchedule();
    const previews: Record<string, string> = {};
    for (const entry of schedule) {
      if (!(entry.habitId in previews)) {
        previews[entry.habitId] = entry.coachMessage ?? buildSmartBody(entry.habitName, entry.context);
      }
    }
    setPreviewMessages(previews);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleRequestPermission() {
    const granted = await requestPermission();
    setPermission(granted ? "granted" : "denied");
    if (granted) await syncScheduledReminders();
  }

  async function handleToggle(habit: Habit) {
    const enabled = !habit.reminders_enabled;
    if (enabled && permission !== "granted") {
      const granted = await requestPermission();
      setPermission(granted ? "granted" : "denied");
      if (!granted) {
        Alert.alert("Notifications are disabled", "Enable notifications before turning on reminders.");
        return;
      }
    }

    const usesSmartReminders = habit.reminder_strategy === "interval" || habit.reminder_strategy === "conditional_interval";
    if (enabled && !usesSmartReminders && (habit.reminder_times ?? []).length === 0) {
      Alert.alert("Add a reminder time", "Edit the habit and add at least one reminder time first.");
      return;
    }

    const result = await updateHabitReminders(habit.id, {
      enabled,
      times: habit.reminder_times ?? [],
      days: habit.reminder_days ?? [0, 1, 2, 3, 4, 5, 6],
    });
    if (!result.ok) {
      Alert.alert("Could not update reminders", result.error ?? "Try again.");
      return;
    }
    setHabits((prev) => prev.map((h) => h.id === habit.id ? { ...h, reminders_enabled: enabled } : h));
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-d-background" edges={["top"]}>
      <View className="flex-row items-center px-margin-mobile py-sm">
        <TouchableOpacity onPress={() => router.back()} className="mr-md">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#451ebb" />
        </TouchableOpacity>
        <Text className="text-headline-md text-on-background dark:text-d-on-background">Reminders</Text>
      </View>

      {permission !== "granted" && (
        <View className="mx-margin-mobile mb-md bg-primary-fixed rounded-xl p-md flex-row items-center gap-md">
          <MaterialCommunityIcons name="bell-alert" size={24} color="#451ebb" />
          <View className="flex-1">
            <Text className="text-body-md text-on-background font-semibold">Enable notifications</Text>
            <Text className="text-label-sm text-on-surface-variant">Allow notifications to receive habit reminders.</Text>
          </View>
          <TouchableOpacity className="bg-primary px-md py-xs rounded-full" onPress={handleRequestPermission}>
            <Text className="text-on-primary text-label-sm font-semibold">Allow</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-margin-mobile gap-sm">
          {habits.map((habit) => (
            <View key={habit.id} className="bg-surface-container dark:bg-d-surface-container rounded-xl p-md">
              <View className="flex-row items-center justify-between mb-sm">
                <Text className="text-body-md text-on-surface dark:text-d-on-surface font-semibold">{habit.name}</Text>
                <Switch
                  value={habit.reminders_enabled ?? false}
                  onValueChange={() => handleToggle(habit)}
                  trackColor={{ false: "#c9c4d7", true: "#5d3fd3" }}
                  thumbColor="#fff"
                />
              </View>
              {(habit.reminder_strategy === "interval" || habit.reminder_strategy === "conditional_interval") && (
                <Text className="text-label-sm text-on-surface-variant dark:text-d-on-surface-variant">
                  Smart reminders every {habit.reminder_interval_minutes ?? 60} minutes, 08:00-22:00
                </Text>
              )}
              {habit.reminder_times && habit.reminder_times.length > 0 && (
                <Text className="text-label-sm text-on-surface-variant dark:text-d-on-surface-variant">
                  {habit.reminder_times.join(", ")}
                </Text>
              )}
              {habit.reminder_days && (
                <View className="flex-row gap-xs mt-xs">
                  {habit.reminder_days.map((d) => (
                    <Text key={d} className="text-label-sm bg-primary-fixed text-primary px-xs py-xs rounded">{DAY_LABELS[d]}</Text>
                  ))}
                </View>
              )}
              {habit.reminders_enabled && previewMessages[habit.id] && (
                <View className="mt-sm flex-row items-center gap-xs bg-primary-fixed/40 rounded-lg px-sm py-xs">
                  <MaterialCommunityIcons name="message-text-outline" size={14} color="#451ebb" />
                  <Text className="text-label-sm text-primary flex-1" numberOfLines={2}>
                    {previewMessages[habit.id]}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
