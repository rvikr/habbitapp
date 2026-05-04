import { useState } from "react";
import { View, Text, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Habit } from "@/types/db";

type Props = {
  visible: boolean;
  habit: Habit | null;
  onSubmit: (value: number, note: string) => void;
  onDismiss: () => void;
};

export default function LogPrompt({ visible, habit, onSubmit, onDismiss }: Props) {
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");

  function handleSubmit() {
    const num = parseFloat(value) || 1;
    onSubmit(num, note);
    setValue("");
    setNote("");
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 justify-end">
        <TouchableOpacity className="flex-1" onPress={onDismiss} />
        <View className="bg-surface-lowest dark:bg-d-surface-lowest rounded-t-3xl p-lg">
          <View className="flex-row items-center justify-between mb-md">
            <Text className="text-headline-md text-on-surface dark:text-d-on-surface font-bold">Log progress</Text>
            <TouchableOpacity onPress={onDismiss}>
              <MaterialCommunityIcons name="close" size={24} color="#797586" />
            </TouchableOpacity>
          </View>
          {habit?.unit && (
            <View className="flex-row items-center gap-sm mb-sm">
              <TextInput
                className="flex-1 bg-surface-container dark:bg-d-surface-container text-on-surface dark:text-d-on-surface rounded-xl px-md py-sm text-body-md"
                placeholder={`Value (${habit.unit})`}
                placeholderTextColor="#797586"
                value={value}
                onChangeText={setValue}
                keyboardType="decimal-pad"
              />
              <Text className="text-body-md text-on-surface-variant dark:text-d-on-surface-variant">{habit.unit}</Text>
            </View>
          )}
          <TextInput
            className="bg-surface-container dark:bg-d-surface-container text-on-surface dark:text-d-on-surface rounded-xl px-md py-sm text-body-md mb-md"
            placeholder="Note (optional)"
            placeholderTextColor="#797586"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={2}
          />
          <TouchableOpacity className="bg-primary rounded-full py-sm items-center" onPress={handleSubmit}>
            <Text className="text-on-primary text-label-lg font-semibold">Log</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
