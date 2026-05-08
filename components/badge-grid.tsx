import { View, Text, FlatList } from "react-native";
import { useTheme } from "@/components/theme-provider";
import Icon from "./icon";
import type { ComputedBadge } from "@/lib/badges";

const TONE_BG: Record<string, string> = {
  yellow: "#fef9c3", purple: "#ede9fe", teal: "#ccfbf1",
  red: "#fee2e2", indigo: "#e0e7ff", orange: "#ffedd5",
};
const TONE_BG_DARK: Record<string, string> = {
  yellow: "#3d2e00", purple: "#2d1f6e", teal: "#003d3b",
  red: "#4a0000", indigo: "#1a1f5e", orange: "#3d1500",
};
const TONE_FG: Record<string, string> = {
  yellow: "#854d0e", purple: "#6d28d9", teal: "#134e4a",
  red: "#991b1b", indigo: "#3730a3", orange: "#9a3412",
};
const TONE_FG_DARK: Record<string, string> = {
  yellow: "#fde68a", purple: "#c4b5fd", teal: "#99f6e4",
  red: "#fca5a5", indigo: "#a5b4fc", orange: "#fdba74",
};

type Props = { badges: ComputedBadge[] };

export default function BadgeGrid({ badges }: Props) {
  const { colorScheme } = useTheme();
  const dark = colorScheme === "dark";

  return (
    <FlatList
      data={badges}
      numColumns={2}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      columnWrapperStyle={{ gap: 8 }}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      renderItem={({ item }) => {
        const bgMap = dark ? TONE_BG_DARK : TONE_BG;
        const fgMap = dark ? TONE_FG_DARK : TONE_FG;
        const unearnedBg = dark ? "#2a2435" : "#e7e8e9";
        const unearnedFg = dark ? "#a09ab8" : "#797586";
        const bg = item.earned ? (bgMap[item.tone] ?? (dark ? "#2d1f6e" : "#e6deff")) : unearnedBg;
        const fg = item.earned ? (fgMap[item.tone] ?? (dark ? "#c4b5fd" : "#451ebb")) : unearnedFg;
        return (
          <View
            className="flex-1 rounded-xl p-md"
            style={{ backgroundColor: bg, opacity: item.earned ? 1 : 0.55 }}
          >
            <View className="w-10 h-10 rounded-full items-center justify-center mb-sm" style={{ backgroundColor: fg + "20" }}>
              <Icon name={item.icon} size={20} color={fg} />
            </View>
            <Text className="text-label-lg font-semibold mb-xs" style={{ color: fg }}>{item.name}</Text>
            <Text className="text-label-sm" style={{ color: fg + "aa" }}>{item.earned ? item.description : item.hintText}</Text>
            {!item.earned && item.progressPct > 0 && (
              <View className="h-1 bg-outline-variant rounded-full mt-sm overflow-hidden">
                <View className="h-full rounded-full" style={{ width: `${item.progressPct * 100}%`, backgroundColor: fg }} />
              </View>
            )}
          </View>
        );
      }}
    />
  );
}
