import { useState, useCallback } from "react";
import { Alert, View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase/client";
import { signOut } from "@/lib/actions";
import { avatarFromUser } from "@/lib/avatar";
import { useTheme } from "@/components/theme-provider";

type UserInfo = { displayName: string; email: string | null; avatarUrl: string };

function SettingsRow({ icon, label, onPress, danger }: { icon: string; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity
      className="flex-row items-center px-md py-sm bg-surface-container dark:bg-d-surface-container rounded-xl mb-xs"
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon as any} size={20} color={danger ? "#ba1a1a" : "#451ebb"} />
      <Text className={`flex-1 ml-md text-body-md ${danger ? "text-error" : "text-on-surface dark:text-d-on-surface"}`}>{label}</Text>
      {!danger && <MaterialCommunityIcons name="chevron-right" size={20} color="#797586" />}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colorScheme, toggle } = useTheme();
  const [user, setUser] = useState<UserInfo | null>(null);

  const load = useCallback(async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (u) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", u.id)
        .maybeSingle();
      setUser({
        displayName:
          (profile?.display_name as string | null | undefined) ??
          (u.user_metadata?.full_name as string | undefined) ??
          u.email?.split("@")[0] ??
          "there",
        email: u.email ?? null,
        avatarUrl: avatarFromUser(u),
      });
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleSignOut() {
    Alert.alert("Sign out?", "You can sign back in any time.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-d-background" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-margin-mobile pt-md pb-sm">
          <Text className="text-headline-lg text-on-background dark:text-d-on-background">Settings</Text>
        </View>

        {/* Profile card */}
        <TouchableOpacity
          className="mx-margin-mobile mb-lg flex-row items-center bg-surface-container dark:bg-d-surface-container rounded-xl p-md"
          onPress={() => router.push("/settings/profile")}
        >
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} className="w-14 h-14 rounded-full" />
          ) : (
            <View className="w-14 h-14 rounded-full bg-primary-fixed items-center justify-center">
              <MaterialCommunityIcons name="account" size={28} color="#451ebb" />
            </View>
          )}
          <View className="flex-1 ml-md">
            <Text className="text-body-lg text-on-surface dark:text-d-on-surface font-semibold">{user?.displayName}</Text>
            <Text className="text-label-sm text-on-surface-variant dark:text-d-on-surface-variant">{user?.email}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#797586" />
        </TouchableOpacity>

        {/* Appearance */}
        <View className="px-margin-mobile mb-lg">
          <Text className="text-label-lg text-on-surface-variant dark:text-d-on-surface-variant mb-sm">APPEARANCE</Text>
          <TouchableOpacity
            className="flex-row items-center px-md py-sm bg-surface-container dark:bg-d-surface-container rounded-xl"
            onPress={toggle}
          >
            <MaterialCommunityIcons
              name={colorScheme === "dark" ? "weather-night" : "weather-sunny"}
              size={20}
              color="#451ebb"
            />
            <Text className="flex-1 ml-md text-body-md text-on-surface dark:text-d-on-surface">
              {colorScheme === "dark" ? "Dark mode" : "Light mode"}
            </Text>
            <Text className="text-label-sm text-on-surface-variant dark:text-d-on-surface-variant">Toggle</Text>
          </TouchableOpacity>
        </View>

        {/* Account */}
        <View className="px-margin-mobile mb-lg">
          <Text className="text-label-lg text-on-surface-variant dark:text-d-on-surface-variant mb-sm">ACCOUNT</Text>
          <SettingsRow icon="bell" label="Reminders" onPress={() => router.push("/settings/reminders")} />
          <SettingsRow icon="shield-lock" label="Security" onPress={() => router.push("/settings/security")} />
          <SettingsRow icon="database-lock" label="Privacy & Data" onPress={() => router.push("/settings/privacy" as never)} />
        </View>

        {/* Danger */}
        <View className="px-margin-mobile">
          <SettingsRow icon="logout" label="Sign out" onPress={handleSignOut} danger />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
