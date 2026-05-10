"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { revalidatePath } from "next/cache";
import { isValidDateKey } from "@/lib/date";

export async function toggleHabit(habitId: string, currentlyDone: boolean, completedOn: string) {
  if (!isValidDateKey(completedOn)) return;

  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return;

  if (currentlyDone) {
    await supabase
      .from("habit_completions")
      .delete()
      .eq("habit_id", habitId)
      .eq("user_id", user.id)
      .eq("completed_on", completedOn);
  } else {
    await supabase.from("habit_completions").upsert(
      { habit_id: habitId, user_id: user.id, completed_on: completedOn, value: 1 },
      { onConflict: "habit_id,completed_on" }
    );
  }

  revalidatePath("/dashboard");
}
