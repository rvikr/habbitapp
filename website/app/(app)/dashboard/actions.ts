"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

export async function toggleHabit(habitId: string, currentlyDone: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const today = todayKey();
  if (currentlyDone) {
    await supabase
      .from("habit_completions")
      .delete()
      .eq("habit_id", habitId)
      .eq("completed_on", today);
  } else {
    await supabase.from("habit_completions").upsert(
      { habit_id: habitId, user_id: user.id, completed_on: today },
      { onConflict: "habit_id,completed_on" }
    );
  }

  revalidatePath("/dashboard");
}
