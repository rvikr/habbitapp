import { View, Text, FlatList } from "react-native";
import Icon from "./icon";
import type { ComputedBadge } from "@/lib/badges";

const TONE_BG: Record<string, string> = {
  yellow: "#fef9c3",
  purple: "#ede9fe",
  teal: "#ccfbf1",
  red: "#fee2e2",
  indigo: "#e0e7ff",
  orange: "#ffedd5",
};
const TONE_FG: Record<string, string> = {
  yellow: "#854d0e",
  purple: "#6d28d9",
  teal: "#134e4a",
  red: "#991b1b",
  indigo: "#3730a3",
  orange: "#9a3412",
};

type Props = { badges: ComputedBadge[] };

export default function BadgeGrid({ badges }: Props) {
  return (
    <FlatList
      data={badges}
      numColumns={2}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      columnWrapperStyle={{ gap: 8 }}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      renderItem={({ item }) => {
        const bg = item.earned ? (TONE_BG[item.tone] ?? "#e6deff") : "#e7e8e9";
        const fg = item.earned ? (TONE_FG[item.tone] ?? "#451ebb") : "#797586";
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
