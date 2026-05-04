import { View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Icon from "./icon";
import type { Habit } from "@/types/db";

const COLOR_BG: Record<string, string> = { primary: "#e6deff", secondary: "#76f6f2", tertiary: "#ffdbce", neutral: "#e1e3e4" };
const COLOR_FG: Record<string, string> = { primary: "#451ebb", secondary: "#006a67", tertiary: "#7b2900", neutral: "#484554" };

type Props = {
  habit: Habit;
  done: boolean;
  onToggle: () => void;
  onPress: () => void;
};

export default function HabitCard({ habit, done, onToggle, onPress }: Props) {
  const bg = COLOR_BG[habit.color] ?? "#e6deff";
  const fg = COLOR_FG[habit.color] ?? "#451ebb";

  return (
    <TouchableOpacity
      className="flex-row items-center bg-surface-lowest dark:bg-d-surface-lowest rounded-xl p-md gap-md"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: bg }}>
        <Icon name={habit.icon} size={22} color={fg} />
      </View>
      <View className="flex-1">
        <Text className="text-body-md text-on-surface dark:text-d-on-surface font-semibold">{habit.name}</Text>
        {habit.description && (
          <Text className="text-label-sm text-on-surface-variant dark:text-d-on-surface-variant" numberOfLines={1}>{habit.description}</Text>
        )}
        {habit.target != null && (
          <Text className="text-label-sm text-on-surface-variant dark:text-d-on-surface-variant">
            Goal: {habit.target} {habit.unit}
          </Text>
        )}
      </View>
      <TouchableOpacity
        onPress={(e) => { e.stopPropagation(); onToggle(); }}
        className="w-8 h-8 rounded-full items-center justify-center"
        style={{ backgroundColor: done ? fg : "transparent", borderWidth: 2, borderColor: done ? fg : "#c9c4d7" }}
      >
        {done && <MaterialCommunityIcons name="check" size={18} color="#fff" />}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
