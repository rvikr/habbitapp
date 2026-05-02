import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { TopAppBar } from "@/components/top-app-bar";
import { HabitForm, type HabitFormValues } from "@/components/habit-form";
import { createClient } from "@/lib/supabase/server";
import type { Habit } from "@/types/db";

export const dynamic = "force-dynamic";

async function fetchHabit(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("habits")
    .select("*")
    .eq("id", id)
    .single();
  return data as Habit | null;
}

export default async function EditHabitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const habit = await fetchHabit(id);
  if (!habit) notFound();

  async function handleUpdate(values: HabitFormValues) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    await supabase
      .from("habits")
      .update({
        name: values.name,
        description: values.description || null,
        icon: values.icon,
        color: values.color,
        unit: values.unit || null,
        target: values.target ?? null,
        reminders_enabled: values.remindersEnabled,
        reminder_times: values.reminderTimes,
        reminder_days: values.reminderDays,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    revalidatePath("/", "layout");
    redirect(`/habits/${id}`);
  }

  async function handleDelete() {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    await supabase
      .from("habits")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);
    revalidatePath("/", "layout");
    redirect("/");
  }

  return (
    <>
      <TopAppBar title="Edit Habit" back={`/habits/${id}`} />
      <main className="max-w-screen-sm mx-auto px-margin-mobile pt-lg pb-xxl">
        <HabitForm
          submitLabel="Save changes"
          onSubmit={handleUpdate}
          onDelete={handleDelete}
          initial={{
            name: habit.name,
            description: habit.description ?? "",
            icon: habit.icon,
            color: habit.color,
            unit: habit.unit ?? "",
            target: habit.target ?? null,
            remindersEnabled: habit.reminders_enabled ?? false,
            reminderTimes: habit.reminder_times ?? [],
            reminderDays: habit.reminder_days ?? [0, 1, 2, 3, 4, 5, 6],
          }}
        />
      </main>
    </>
  );
}
