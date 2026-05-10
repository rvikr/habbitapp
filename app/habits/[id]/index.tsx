import { useState, useCallback } from "react";
import { Alert, View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { getHabit, weekProgressFor, streakFor } from "@/lib/habits";
import { toggleHabit, deleteHabit, logCompletion } from "@/lib/actions";
import { useCelebrate } from "@/components/celebration";
import Icon from "@/components/icon";
import LogEntryFab from "@/components/log-entry-fab";
import LogPrompt from "@/components/log-prompt";
import type { Habit, HabitCompletion } from "@/types/db";
import { localDateKey } from "@/lib/date";

const COLOR_BG: Record<string, string> = { primary: "#e6deff", secondary: "#76f6f2", tertiary: "#ffdbce", neutral: "#e1e3e4" };
const COLOR_FG: Record<string, string> = { primary: "#451ebb", secondary: "#006a67", tertiary: "#7b2900", neutral: "#484554" };

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const celebrate = useCelebrate();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogPrompt, setShowLogPrompt] = useState(false);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const { habit: h, completions: c } = await getHabit(id);
    setHabit(h);
    setCompletions(c);
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const today = localDateKey();
  const doneToday = completions.some((c) => c.completed_on === today);
  const streak = streakFor(completions);
  const weekDays = habit ? weekProgressFor(habit.id, completions) : [];

  async function handleToggle() {
    if (!habit || toggling) return;
    setToggling(true);
    try {
      if (!doneToday) celebrate();
      const result = await toggleHabit(habit.id, doneToday);
      if (!result.ok) Alert.alert("Could not update habit", result.error ?? "Try again.");
      load();
    } finally {
      setToggling(false);
    }
  }

  async function handleLog(value: number, note: string) {
    if (!habit) return { ok: false, error: "Habit not loaded." };
    const result = await logCompletion(habit.id, value, note);
    if (!result.ok) return result;
    setShowLogPrompt(false);
    celebrate();
    load();
    return result;
  }

  async function handleDelete() {
    if (!habit) return;
    Alert.alert("Delete habit?", "This archives the habit and cancels its reminders.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const result = await deleteHabit(habit.id);
          if (!result.ok) {
            Alert.alert("Could not delete habit", result.error ?? "Try again.");
            return;
          }
          router.replace("/");
        },
      },
    ]);
  }

  if (!habit) return null;

  const bg = COLOR_BG[habit.color] ?? "#e6deff";
  const fg = COLOR_FG[habit.color] ?? "#451ebb";

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-d-background" edges={["top"]}>
      <View className="flex-row items-center justify-between px-margin-mobile py-sm">
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#451ebb" />
        </TouchableOpacity>
        <View className="flex-row gap-sm">
          <TouchableOpacity onPress={() => router.push(`/habits/${habit.id}/edit`)}>
            <MaterialCommunityIcons name="pencil" size={22} color="#451ebb" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <MaterialCommunityIcons name="delete" size={22} color="#ba1a1a" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header card */}
        <View className="mx-margin-mobile mb-lg rounded-2xl p-lg" style={{ backgroundColor: bg }}>
          <View className="w-14 h-14 rounded-full items-center justify-center mb-md" style={{ backgroundColor: fg + "20" }}>
            <Icon name={habit.icon} size={28} color={fg} />
          </View>
          <Text className="text-headline-lg font-bold mb-xs" style={{ color: fg }}>{habit.name}</Text>
          {habit.description && (
            <Text className="text-body-md" style={{ color: fg + "cc" }}>{habit.description}</Text>
          )}
        </View>

        {/* Stats */}
        <View className="flex-row mx-margin-mobile mb-lg gap-sm">
          <View className="flex-1 bg-surface-container dark:bg-d-surface-container rounded-xl p-md items-center">
            <Text className="text-headline-md font-bold text-primary">{streak}</Text>
            <Text className="text-label-sm text-on-surface-variant dark:text-d-on-surface-variant">day streak</Text>
          </View>
          <View className="flex-1 bg-surface-container dark:bg-d-surface-container rounded-xl p-md items-center">
            <Text className="text-headline-md font-bold text-secondary">{completions.length}</Text>
            <Text className="text-label-sm text-on-surface-variant dark:text-d-on-surface-variant">total logs</Text>
          </View>
          <View className="flex-1 bg-surface-container dark:bg-d-surface-container rounded-xl p-md items-center">
            <MaterialCommunityIcons name={doneToday ? "check-circle" : "circle-outline"} size={28} color={doneToday ? "#006a67" : "#797586"} />
            <Text className="text-label-sm text-on-surface-variant dark:text-d-on-surface-variant">today</Text>
          </View>
        </View>

        {/* Weekly bars */}
        <View className="mx-margin-mobile mb-lg bg-surface-container dark:bg-d-surface-container rounded-xl p-md">
          <Text className="text-label-lg text-on-surface-variant dark:text-d-on-surface-variant mb-md">THIS WEEK</Text>
          <View className="flex-row justify-between">
            {weekDays.map((day) => (
              <View key={day.key} className="items-center gap-xs">
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: day.done ? fg : day.future ? "#e1e3e4" : "#c9c4d7" }}
                >
                  {day.done && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
                </View>
                <Text className="text-label-sm text-on-surface-variant dark:text-d-on-surface-variant">{day.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Today toggle */}
        <View className="px-margin-mobile">
          <TouchableOpacity
            className={`rounded-full py-sm items-center ${doneToday ? "bg-secondary" : "bg-primary"}`}
            onPress={handleToggle}
            disabled={toggling}
          >
            <Text className="text-on-primary text-label-lg font-semibold">
              {doneToday ? "Mark as undone" : "Mark as done today"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {habit.target != null && (
        <LogEntryFab onPress={() => setShowLogPrompt(true)} />
      )}

      <LogPrompt
        visible={showLogPrompt}
        habit={habit}
        onSubmit={handleLog}
        onDismiss={() => setShowLogPrompt(false)}
      />
    </SafeAreaView>
  );
}
