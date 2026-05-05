import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function AccountDeletionPage() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-d-background justify-center px-margin-mobile">
      <View className="gap-md">
        <Text className="text-headline-lg text-on-background dark:text-d-on-background font-bold">
          Account deletion
        </Text>
        <Text className="text-body-md text-on-surface-variant dark:text-d-on-surface-variant">
          Sign in, then open Settings, Privacy & Data, and Request account deletion. The request records the account and data to be deleted by the production operator.
        </Text>
        <TouchableOpacity className="bg-primary rounded-full py-sm items-center" onPress={() => router.replace("/login")}>
          <Text className="text-on-primary text-label-lg font-semibold">Sign in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
