import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { TopAppBar } from "@/components/top-app-bar";
import { HabitForm, type HabitFormValues } from "@/components/habit-form";
import { HabitCatalogPicker } from "@/components/habit-catalog-picker";
import { HABIT_CATALOG } from "@/lib/habit-catalog";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function handleCreate(values: HabitFormValues) {
  "use server";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("habits").insert({
    user_id: user.id,
    name: values.name,
    description: values.description || null,
    icon: values.icon,
    color: values.color,
    unit: values.unit || null,
    target: values.target ?? null,
    reminders_enabled: values.remindersEnabled,
    reminder_times: values.reminderTimes,
    reminder_days: values.reminderDays,
  });

  revalidatePath("/", "layout");
  redirect("/");
}

export default async function NewHabitPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template } = await searchParams;

  if (!template) {
    return (
      <>
        <TopAppBar title="New Habit" back="/" />
        <main className="max-w-screen-sm mx-auto px-margin-mobile pt-lg pb-xxl">
          <HabitCatalogPicker />
        </main>
      </>
    );
  }

  const preset =
    template !== "custom"
      ? HABIT_CATALOG.find((e) => e.template === template)
      : undefined;

  const initial: Partial<HabitFormValues> = preset
    ? {
        name: preset.name,
        description: preset.description,
        icon: preset.icon,
        color: preset.color,
        unit: preset.unit,
        target: preset.target,
        remindersEnabled: preset.defaultTimes.length > 0,
        reminderTimes:
          preset.defaultTimes.length > 0 ? preset.defaultTimes : ["08:00"],
        reminderDays: [0, 1, 2, 3, 4, 5, 6],
      }
    : {};

  return (
    <>
      <TopAppBar
        title={preset ? preset.name : "New Habit"}
        back="/habits/new"
      />
      <main className="max-w-screen-sm mx-auto px-margin-mobile pt-lg pb-xxl">
        <HabitForm
          submitLabel="Create habit"
          onSubmit={handleCreate}
          initial={initial}
        />
      </main>
    </>
  );
}
