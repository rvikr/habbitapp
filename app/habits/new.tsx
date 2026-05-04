import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import HabitForm from "@/components/habit-form";
import { createHabit } from "@/lib/actions";

export default function NewHabitScreen() {
  const router = useRouter();

  async function handleCreate(data: Parameters<typeof createHabit>[0]) {
    const result = await createHabit(data);
    if (result.ok) router.replace("/");
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-d-background" edges={["top"]}>
      <View className="flex-row items-center px-margin-mobile py-sm">
        <TouchableOpacity onPress={() => router.back()} className="mr-md">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#451ebb" />
        </TouchableOpacity>
        <Text className="text-headline-md text-on-background dark:text-d-on-background">New Habit</Text>
      </View>
      <HabitForm onSubmit={handleCreate} submitLabel="Create habit" />
    </SafeAreaView>
  );
}
