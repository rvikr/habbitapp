import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getHabitsForToday } from "@/lib/habits";
import { toggleHabit } from "@/lib/actions";
import { useCelebrate } from "@/components/celebration";
import ProgressRing from "@/components/progress-ring";
import HabitCard from "@/components/habit-card";
import type { Habit } from "@/types/db";

type DashboardData = {
  habits: Habit[];
  completedToday: Set<string>;
  profile: { displayName: string; email: string | null };
};

export default function DashboardScreen() {
  const router = useRouter();
  const celebrate = useCelebrate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const result = await getHabitsForToday();
    setData({ ...result, completedToday: result.completedToday });
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  async function handleToggle(habitId: string) {
    if (!data) return;
    const wasDone = data.completedToday.has(habitId);
    const next = new Set(data.completedToday);
    if (wasDone) next.delete(habitId);
    else { next.add(habitId); celebrate(); }
    setData({ ...data, completedToday: next });
    await toggleHabit(habitId, wasDone);
  }

  const habits = data?.habits ?? [];
  const completedCount = data ? [...data.completedToday].filter(id => habits.some(h => h.id === id)).length : 0;
  const total = habits.length;
  const progress = total > 0 ? completedCount / total : 0;

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-d-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-margin-mobile pt-md pb-sm">
          <View>
            <Text className="text-label-sm text-on-surface-variant dark:text-d-on-surface-variant">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </Text>
            <Text className="text-headline-lg text-on-background dark:text-d-on-background">
              Hey, {data?.profile.displayName ?? "there"} 👋
            </Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-primary-fixed items-center justify-center"
            onPress={() => router.push("/habits/new")}
          >
            <MaterialCommunityIcons name="plus" size={22} color="#451ebb" />
          </TouchableOpacity>
        </View>

        {/* Progress ring */}
        <View className="items-center py-lg">
          <ProgressRing progress={progress} size={140} strokeWidth={10}>
            <Text className="text-headline-xl text-primary font-bold">{completedCount}</Text>
            <Text className="text-label-sm text-on-surface-variant dark:text-d-on-surface-variant">of {total}</Text>
          </ProgressRing>
          <Text className="text-body-md text-on-surface-variant dark:text-d-on-surface-variant mt-sm">
            {completedCount === total && total > 0 ? "All done! Great work 🎉" : `${total - completedCount} habit${total - completedCount === 1 ? "" : "s"} remaining`}
          </Text>
        </View>

        {/* Habits list */}
        <View className="px-margin-mobile gap-sm">
          <Text className="text-label-lg text-on-surface-variant dark:text-d-on-surface-variant mb-xs">TODAY'S HABITS</Text>
          {habits.length === 0 ? (
            <TouchableOpacity
              className="bg-surface-container dark:bg-d-surface-container rounded-xl p-lg items-center gap-sm"
              onPress={() => router.push("/habits/new")}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={40} color="#451ebb" />
              <Text className="text-body-md text-on-surface dark:text-d-on-surface font-semibold">Add your first habit</Text>
              <Text className="text-label-sm text-on-surface-variant dark:text-d-on-surface-variant text-center">
                Tap to browse the habit catalog or create a custom one.
              </Text>
            </TouchableOpacity>
          ) : (
            habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                done={data?.completedToday.has(habit.id) ?? false}
                onToggle={() => handleToggle(habit.id)}
                onPress={() => router.push(`/habits/${habit.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
