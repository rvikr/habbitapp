import { useState, useCallback, useEffect, useRef } from "react";
import { Alert, View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { getHabitsForToday, getInsights } from "@/lib/habits";
import { setCompletionValue, toggleHabit } from "@/lib/actions";
import InsightsStrip from "@/components/insights-strip";
import type { Insights } from "@/lib/habits";
import { useCelebrate } from "@/components/celebration";
import { useTheme } from "@/components/theme-provider";
import { recordCompletionAndMaybeReview } from "@/lib/store-review";
import HabitCard from "@/components/habit-card";
import type { Habit } from "@/types/db";
import { progressForHabit, type HabitProgress } from "@/lib/habit-intelligence";
import {
  getStepPermissionStatus,
  getTodayStepSnapshot,
  isStepTrackingAvailable,
  requestStepPermission,
  watchStepCount,
  type StepSubscription,
} from "@/lib/steps";
import Svg, { Circle } from "react-native-svg";

type DashboardData = {
  habits: Habit[];
  completedToday: Set<string>;
  todayProgress: Map<string, HabitProgress>;
  profile: { displayName: string; email: string | null };
  insights: Insights;
  leaderboardOptedIn: boolean;
};

const STEP_SYNC_INTERVAL_MS = 30_000;

type StepTrackingStatus =
  | "idle"
  | "checking"
  | "needsPermission"
  | "denied"
  | "unsupported"
  | "providerUpdateRequired"
  | "tracking"
  | "syncing"
  | "synced"
  | "error";
type StepTrackingState = {
  status: StepTrackingStatus;
  lastSyncedAt: number | null;
  error?: string;
};

function isStepHabit(habit: Habit): boolean {
  return habit.metric_type === "steps" || habit.habit_type === "walk" || habit.unit === "steps";
}

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
  const [stepTracking, setStepTracking] = useState<StepTrackingState>({ status: "idle", lastSyncedAt: null });
  const dataRef = useRef<DashboardData | null>(null);
  const stepSubscriptionRef = useRef<StepSubscription | null>(null);
  const stepTrackingHabitIdRef = useRef<string | null>(null);
  const stepBaseRef = useRef(0);
  const lastStepValueRef = useRef(0);
  const lastStepSaveAtRef = useRef(0);
  const stepSavingRef = useRef(false);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const load = useCallback(async () => {
    const [result, insights] = await Promise.all([getHabitsForToday(), getInsights()]);
    setData({ ...result, completedToday: result.completedToday, todayProgress: result.todayProgress, insights });
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const habits = data?.habits ?? [];
  const stepHabit = habits.find(isStepHabit) ?? null;

  const stopStepWatcher = useCallback(() => {
    stepSubscriptionRef.current?.remove();
    stepSubscriptionRef.current = null;
    stepTrackingHabitIdRef.current = null;
  }, []);

  useFocusEffect(useCallback(() => {
    return () => {
      const habit = dataRef.current?.habits.find((item) => item.id === stepTrackingHabitIdRef.current);
      const steps = lastStepValueRef.current;
      if (habit && steps > 0) {
        void setCompletionValue(habit.id, steps, "Synced from step counter");
      }
      stepSubscriptionRef.current?.remove();
      stepSubscriptionRef.current = null;
      stepTrackingHabitIdRef.current = null;
    };
  }, []));

  const updateLocalStepProgress = useCallback((habit: Habit, value: number) => {
    setData((current) => {
      if (!current || !current.habits.some((item) => item.id === habit.id)) return current;
      const progress = progressForHabit(habit, { value });
      const nextProgress = new Map(current.todayProgress);
      const nextCompleted = new Set(current.completedToday);
      nextProgress.set(habit.id, progress);
      if (progress.isDone) nextCompleted.add(habit.id);
      else nextCompleted.delete(habit.id);
      return { ...current, completedToday: nextCompleted, todayProgress: nextProgress };
    });
  }, []);

  const persistStepCount = useCallback(async (habit: Habit, value: number, force = false) => {
    const steps = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
    if (steps <= 0) return;

    const now = Date.now();
    if (!force && now - lastStepSaveAtRef.current < STEP_SYNC_INTERVAL_MS) return;
    if (stepSavingRef.current) return;

    stepSavingRef.current = true;
    const result = await setCompletionValue(habit.id, steps, "Synced from step counter");
    stepSavingRef.current = false;

    if (!result.ok) {
      setStepTracking({ status: "error", lastSyncedAt: lastStepSaveAtRef.current || null, error: result.error });
      return;
    }

    lastStepSaveAtRef.current = now;
    setStepTracking({ status: "tracking", lastSyncedAt: now });
  }, []);

  const syncStepHabit = useCallback(async (habit: Habit, shouldRequestPermission: boolean, forcePersist = true) => {
    setStepTracking((current) => ({ ...current, status: current.status === "tracking" ? "syncing" : "checking" }));

    const available = await isStepTrackingAvailable();
    if (!available) {
      stopStepWatcher();
      setStepTracking({ status: "unsupported", lastSyncedAt: null });
      return false;
    }

    let permission = await getStepPermissionStatus();
    if (permission !== "granted" && shouldRequestPermission) {
      permission = await requestStepPermission();
    }

    if (permission !== "granted") {
      stopStepWatcher();
      setStepTracking({
        status:
          permission === "providerUpdateRequired"
            ? "providerUpdateRequired"
            : permission === "unavailable"
              ? "unsupported"
              : permission === "denied"
                ? "denied"
                : "needsPermission",
        lastSyncedAt: null,
      });
      return false;
    }

    const savedValue = dataRef.current?.todayProgress.get(habit.id)?.current ?? 0;
    const snapshot = await getTodayStepSnapshot();
    if (snapshot.status === "providerUpdateRequired") {
      stopStepWatcher();
      setStepTracking({ status: "providerUpdateRequired", lastSyncedAt: null });
      return false;
    }
    if (snapshot.status === "unavailable" && snapshot.source !== "pedometer") {
      stopStepWatcher();
      setStepTracking({ status: "unsupported", lastSyncedAt: null });
      return false;
    }
    if (snapshot.status !== "granted") {
      stopStepWatcher();
      setStepTracking({ status: snapshot.status === "denied" ? "denied" : "needsPermission", lastSyncedAt: null });
      return false;
    }

    const baseline = Math.max(savedValue, snapshot.steps ?? 0);
    stepBaseRef.current = baseline;
    lastStepValueRef.current = baseline;
    stepTrackingHabitIdRef.current = habit.id;

    if (baseline > 0) {
      updateLocalStepProgress(habit, baseline);
      await persistStepCount(habit, baseline, forcePersist);
    }

    if (!snapshot.canWatch) {
      stopStepWatcher();
      setStepTracking({ status: "synced", lastSyncedAt: Date.now() });
      return true;
    }

    stepSubscriptionRef.current?.remove();
    const subscription = watchStepCount((sessionSteps) => {
      const totalSteps = Math.max(lastStepValueRef.current, stepBaseRef.current + sessionSteps);
      if (totalSteps <= lastStepValueRef.current) return;
      lastStepValueRef.current = totalSteps;
      updateLocalStepProgress(habit, totalSteps);
      void persistStepCount(habit, totalSteps);
    });

    if (!subscription) {
      setStepTracking({ status: "error", lastSyncedAt: lastStepSaveAtRef.current || null, error: "Could not start step tracking." });
      return false;
    }

    stepSubscriptionRef.current = subscription;
    setStepTracking((current) => ({ status: "tracking", lastSyncedAt: current.lastSyncedAt }));
    return true;
  }, [persistStepCount, stopStepWatcher, updateLocalStepProgress]);

  useEffect(() => {
    if (!stepHabit) {
      stopStepWatcher();
      setStepTracking({ status: "idle", lastSyncedAt: null });
      return;
    }

    if (stepTrackingHabitIdRef.current === stepHabit.id && stepSubscriptionRef.current) return;
    void syncStepHabit(stepHabit, false, true);
  }, [stepHabit?.id, stopStepWatcher, syncStepHabit]);

  useEffect(() => {
    return () => {
      stepSubscriptionRef.current?.remove();
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    if (stepHabit && (stepTracking.status === "tracking" || stepTracking.status === "synced")) {
      await syncStepHabit(stepHabit, false, true);
    }
    setRefreshing(false);
  }, [load, stepHabit, stepTracking.status, syncStepHabit]);

  async function handleToggle(habit: Habit) {
    if (!data) return;
    if (isStepHabit(habit)) {
      const ok = await syncStepHabit(habit, true, true);
      if (!ok) {
        Alert.alert("Step tracking unavailable", "Open the habit to log steps manually, or enable motion access in your device settings.");
      }
      return;
    }

    const habitId = habit.id;
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
    load();
  }

  const completedCount = data ? [...data.completedToday].filter(id => habits.some(h => h.id === id)).length : 0;
  const total = habits.length;
  const progress = total > 0 ? completedCount / total : 0;
  const progressItems = data ? [...data.todayProgress.values()] : [];
  const metricProgress = total > 0 ? progressItems.reduce((sum, item) => sum + item.ratio, 0) / total : 0;
  const activeProgress = total > 0 ? progressItems.filter((item) => item.current > 0 || item.isDone).length / total : 0;

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-d-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Welcome banner - shown once after new account creation */}
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

        {/* Habit status */}
        <View className="items-center py-lg">
          <HabitStatusRings
            completedProgress={progress}
            metricProgress={metricProgress}
            activeProgress={activeProgress}
            completedCount={completedCount}
            total={total}
            trackColor={primaryTrack}
          />
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

        {stepHabit && !["idle", "tracking", "synced"].includes(stepTracking.status) && (
          <StepTrackingCard
            state={stepTracking}
            primary={primary}
            onEnable={() => syncStepHabit(stepHabit, true, true)}
          />
        )}

        {/* Weekly insights */}
        {data?.insights && (
          <View className="mt-sm mb-lg">
            <InsightsStrip insights={data.insights} />
          </View>
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
                progress={data?.todayProgress.get(habit.id)}
                onToggle={() => handleToggle(habit)}
                onPress={() => router.push(`/habits/${habit.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type StepTrackingCardProps = {
  state: StepTrackingState;
  primary: string;
  onEnable: () => void;
};

function StepTrackingCard({ state, primary, onEnable }: StepTrackingCardProps) {
  const busy = state.status === "checking" || state.status === "syncing";
  const disabled = busy || state.status === "unsupported";
  const title =
    state.status === "unsupported"
      ? "Step tracking is unavailable"
      : state.status === "providerUpdateRequired"
        ? "Health Connect needs an update"
        : state.status === "denied"
          ? "Step tracking permission is off"
          : state.status === "error"
            ? "Step tracking needs attention"
            : "Enable step tracking";
  const body =
    state.status === "unsupported"
      ? "This device does not expose a pedometer here. Manual step logging still works."
      : state.status === "providerUpdateRequired"
        ? "Update or install Health Connect, then retry. Manual step logging still works."
        : state.status === "denied"
          ? "Enable Health Connect steps access or motion access, or log steps manually from the habit screen."
          : state.status === "error"
            ? state.error ?? "Could not sync steps. Try again."
            : "Use Health Connect to update your Walk habit from today's Android step total.";
  const action = busy ? "Checking..." : state.status === "denied" ? "Retry" : "Enable";

  return (
    <TouchableOpacity
      onPress={onEnable}
      disabled={disabled}
      className="mx-margin-mobile mb-sm bg-primary-fixed dark:bg-d-surface-container rounded-xl p-md flex-row items-center gap-md"
      style={{ opacity: disabled ? 0.72 : 1 }}
    >
      <MaterialCommunityIcons name="walk" size={24} color={primary} />
      <View className="flex-1">
        <Text className="text-body-sm text-on-background dark:text-d-on-background font-semibold">{title}</Text>
        <Text className="text-label-sm text-on-surface-variant dark:text-d-on-surface-variant">{body}</Text>
      </View>
      {!disabled && <Text className="text-primary text-label-lg font-semibold">{action}</Text>}
    </TouchableOpacity>
  );
}

type StatusArcProps = {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  trackColor: string;
};

function StatusArc({ progress, size, strokeWidth, color, trackColor }: StatusArcProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 1);

  return (
    <Svg width={size} height={size} style={{ position: "absolute" }}>
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" opacity={0.45} />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - clamped)}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}

type HabitStatusRingsProps = {
  completedProgress: number;
  metricProgress: number;
  activeProgress: number;
  completedCount: number;
  total: number;
  trackColor: string;
};

function HabitStatusRings({
  completedProgress,
  metricProgress,
  activeProgress,
  completedCount,
  total,
  trackColor,
}: HabitStatusRingsProps) {
  return (
    <View style={{ width: 184, height: 184, alignItems: "center", justifyContent: "center" }}>
      <StatusArc progress={completedProgress} size={176} strokeWidth={11} color="#5d3fd3" trackColor={trackColor} />
      <StatusArc progress={metricProgress} size={148} strokeWidth={10} color="#f8d100" trackColor={trackColor} />
      <StatusArc progress={activeProgress} size={120} strokeWidth={9} color="#66b7ff" trackColor={trackColor} />
      <View className="w-20 h-20 rounded-full bg-surface-lowest dark:bg-d-surface-lowest items-center justify-center">
        <Text className="text-headline-md">{completedCount === total && total > 0 ? "😊" : "🙂"}</Text>
        <Text className="text-label-sm text-on-surface-variant dark:text-d-on-surface-variant">
          {completedCount}/{total}
        </Text>
      </View>
    </View>
  );
}
