import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Icon from "./icon";
import type { Habit } from "@/types/db";
import HabitProgressVisual from "./habit-progress-visual";
import ProgressRing from "./progress-ring";
import type { HabitProgress } from "@/lib/habit-intelligence";

const COLOR_BG: Record<string, string> = { primary: "#e6deff", secondary: "#76f6f2", tertiary: "#ffdbce", neutral: "#e1e3e4" };
const COLOR_FG: Record<string, string> = { primary: "#451ebb", secondary: "#006a67", tertiary: "#7b2900", neutral: "#484554" };

type Props = {
  habit: Habit;
  done: boolean;
  progress?: HabitProgress;
  onToggle: () => void | Promise<void>;
  onPress: () => void;
};

export default function HabitCard({ habit, done, progress, onToggle, onPress }: Props) {
  const [toggling, setToggling] = useState(false);
  const bg = COLOR_BG[habit.color] ?? "#e6deff";
  const fg = COLOR_FG[habit.color] ?? "#451ebb";

  async function handleToggleTap(e: { stopPropagation: () => void }) {
    e.stopPropagation();
    if (toggling) return;
    setToggling(true);
    try {
      await onToggle();
    } finally {
      setToggling(false);
    }
  }

  return (
    <TouchableOpacity
      className="flex-row items-center bg-surface-lowest dark:bg-d-surface-lowest rounded-xl p-md gap-md"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="w-16 h-16 rounded-xl items-center justify-center" style={{ backgroundColor: bg }}>
        {progress && habit.visual_type && habit.visual_type !== "progress_ring" ? (
          <HabitProgressVisual visualType={habit.visual_type} progress={progress.ratio} color={fg} trackColor={bg} />
        ) : (
          <Icon name={habit.icon} size={24} color={fg} />
        )}
      </View>
      <View className="flex-1">
        <Text className="text-body-md text-on-surface dark:text-d-on-surface font-semibold">{habit.name}</Text>
        {habit.description && (
          <Text className="text-label-sm text-on-surface-variant dark:text-d-on-surface-variant" numberOfLines={1}>{habit.description}</Text>
        )}
        {progress ? (
          <Text className="text-label-sm text-on-surface-variant dark:text-d-on-surface-variant">
            {progress.label}
          </Text>
        ) : habit.target != null && (
          <Text className="text-label-sm text-on-surface-variant dark:text-d-on-surface-variant">
            Goal: {habit.target} {habit.unit}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={handleToggleTap} disabled={toggling} activeOpacity={0.8}>
        <ProgressRing
          progress={done ? 1 : progress?.ratio ?? 0}
          size={48}
          strokeWidth={5}
          color={fg}
          trackColor="#e1e3e4"
        >
          <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: done ? fg : bg }}>
            {done ? (
              <MaterialCommunityIcons name="check" size={17} color="#fff" />
            ) : (
              <Text className="text-label-sm font-bold" style={{ color: fg }}>
                {Math.round((progress?.ratio ?? 0) * 100)}%
              </Text>
            )}
          </View>
        </ProgressRing>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
