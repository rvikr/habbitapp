import { Tabs } from "expo-router";
import { useColorScheme, Platform } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const TAB_ACTIVE = "#451ebb";
const TAB_ACTIVE_DARK = "#cabeff";
const TAB_INACTIVE = "#797586";
const TAB_INACTIVE_DARK = "#9b95ad";

export default function TabsLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const active = isDark ? TAB_ACTIVE_DARK : TAB_ACTIVE;
  const inactive = isDark ? TAB_INACTIVE_DARK : TAB_INACTIVE;
  const tabBarBg = isDark ? "#14141b" : "#ffffff";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: active,
        tabBarInactiveTintColor: inactive,
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopColor: isDark ? "#4a4658" : "#c9c4d7",
          borderTopWidth: 1,
          paddingBottom: Platform.OS === "ios" ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === "ios" ? 80 : 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: "Badges",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="trophy" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Ranks",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="podium" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cog" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
