import { useState, useCallback } from "react";
import { Alert, View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { getHabitsForToday, getInsights } from "@/lib/habits";
import { toggleHabit } from "@/lib/actions";
import InsightsStrip from "@/components/insights-strip";
import type { Insights } from "@/lib/habits";
import { useCelebrate } from "@/components/celebration";
import { useTheme } from "@/components/theme-provider";
import { recordCompletionAndMaybeReview } from "@/lib/store-review";
import ProgressRing from "@/components/progress-ring";
import HabitCard from "@/components/habit-card";
import type { Habit } from "@/types/db";

type DashboardData = {
  habits: Habit[];
  completedToday: Set<string>;
  profile: { displayName: string; email: string | null };
  insights: Insights;
  leaderboardOptedIn: boolean;
};

export default function DashboardScreen() {
  const router = useRouter();
  const celebrate = useCelebrate();
  const { colorScheme } = useTheme();
  const primary = colorScheme === "dark" ? "#c5b8ff" : "#451ebb";
  const primaryTrack = colorScheme === "dark" ? "#3d3450" : "#c9c4d7";
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { newUser } = useLocalSearchParams<{ newUser?: string }>();
  const [showWelcome, setShowWelcome] = useState(newUser === "1");

  const load = useCallback(async () => {
    const [result, insights] = await Promise.all([getHabitsForToday(), getInsights()]);
    setData({ ...result, completedToday: result.completedToday, insights });
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
    const previous = data.completedToday;
    const next = new Set(previous);
    if (wasDone) next.delete(habitId);
    else next.add(habitId);
    setData({ ...data, completedToday: next });
    const result = await toggleHabit(habitId, wasDone);
    if (!result.ok) {
      setData((current) => current ? { ...current, completedToday: previous } : current);
      Alert.alert("Could not update habit", result.error ?? "Try again.");
      return;
    }
    if (!wasDone) {
      celebrate();
      recordCompletionAndMaybeReview();
    }
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
        {/* Welcome banner — shown once after new account creation */}
        {showWelcome && (
          <TouchableOpacity
            onPress={() => setShowWelcome(false)}
            className="mx-margin-mobile mt-md mb-xs bg-primary-fixed dark:bg-d-surface-container rounded-xl p-md flex-row items-center gap-md"
          >
            <MaterialCommunityIcons name="party-popper" size={22} color={primary} />
            <View className="flex-1">
              <Text className="text-body-sm text-on-background dark:text-d-on-background font-semibold">Welcome to Lagan!</Text>
              <Text className="text-label-sm text-on-surface-variant dark:text-d-on-surface-variant">You're all set. Add your first habit to get started.</Text>
            </View>
            <MaterialCommunityIcons name="close" size={18} color={primary} />
          </TouchableOpacity>
        )}

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
            <MaterialCommunityIcons name="plus" size={22} color={primary} />
          </TouchableOpacity>
        </View>

        {/* Progress ring */}
        <View className="items-center py-lg">
          <ProgressRing progress={progress} size={140} strokeWidth={10} color={primary} trackColor={primaryTrack}>
            <Text className="text-headline-xl text-primary font-bold">{completedCount}</Text>
            <Text className="text-label-sm text-on-surface-variant dark:text-d-on-surface-variant">of {total}</Text>
          </ProgressRing>
          <Text className="text-body-md text-on-surface-variant dark:text-d-on-surface-variant mt-sm">
            {completedCount === total && total > 0 ? "All done! Great work 🎉" : `${total - completedCount} habit${total - completedCount === 1 ? "" : "s"} remaining`}
          </Text>
        </View>

        {/* Leaderboard opt-in banner */}
        {data && !data.leaderboardOptedIn && (
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/leaderboard")}
            className="mx-margin-mobile mb-sm bg-primary-fixed dark:bg-d-surface-container rounded-xl p-md flex-row items-center gap-md"
          >
            <MaterialCommunityIcons name="trophy-outline" size={22} color={primary} />
            <View className="flex-1">
              <Text className="text-body-sm text-on-background dark:text-d-on-background font-semibold">Join the global leaderboard</Text>
              <Text className="text-label-sm text-on-surface-variant dark:text-d-on-surface-variant">Set a display name to rank with others</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={primary} />
          </TouchableOpacity>
        )}

        {/* Habits list */}
        <View className="px-margin-mobile gap-sm">
          <Text className="text-label-lg text-on-surface-variant dark:text-d-on-surface-variant mb-xs">TODAY'S HABITS</Text>
          {habits.length === 0 ? (
            <TouchableOpacity
              className="bg-surface-container dark:bg-d-surface-container rounded-xl p-lg items-center gap-sm"
              onPress={() => router.push("/habits/new")}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={40} color={primary} />
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

        {/* Weekly insights */}
        {data?.insights && (
          <View className="mt-lg">
            <InsightsStrip insights={data.insights} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
