import Link from "next/link";
import { TopAppBar } from "@/components/top-app-bar";
import { Icon } from "@/components/icon";
import { NotificationPermissionCard } from "@/components/notification-permission-card";
import { createClient } from "@/lib/supabase/server";
import type { Habit } from "@/types/db";

export const dynamic = "force-dynamic";

const dayShort = ["S", "M", "T", "W", "T", "F", "S"];

function formatTimes(times: string[] | null) {
  if (!times || times.length === 0) return null;
  if (times.length <= 2) return times.join(" · ");
  return `${times[0]} · ${times[1]} +${times.length - 2} more`;
}

function formatDays(days: number[] | null) {
  if (!days || days.length === 7) return "Every day";
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d)))
    return "Weekdays";
  if (days.length === 2 && [0, 6].every((d) => days.includes(d)))
    return "Weekends";
  return days.map((d) => dayShort[d]).join(" ");
}

type HabitRow = Pick<
  Habit,
  "id" | "name" | "icon" | "color" | "reminder_times" | "reminder_days" | "reminders_enabled"
>;

function HabitReminderRow({ h }: { h: HabitRow }) {
  const active =
    h.reminders_enabled && h.reminder_times && h.reminder_times.length > 0;
  const timeSummary = formatTimes(h.reminder_times);
  const daySummary = active ? formatDays(h.reminder_days) : null;

  return (
    <Link
      href={`/habits/${h.id}/edit`}
      className="flex items-center justify-between gap-md px-md py-sm group hover:bg-surface-container/40 transition-colors"
    >
      <div className="flex items-center gap-md min-w-0">
        <div className="w-9 h-9 bg-primary-fixed/30 text-primary flex items-center justify-center rounded-lg flex-shrink-0">
          <Icon name={h.icon} filled className="text-[18px]" />
        </div>
        <div className="min-w-0">
          <p className="text-label-lg truncate">{h.name}</p>
          {active && timeSummary ? (
            <p className="text-label-sm text-outline truncate">
              {timeSummary}
              {daySummary ? ` · ${daySummary}` : ""}
            </p>
          ) : (
            <p className="text-label-sm text-outline/60 truncate italic">
              No reminder
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-sm flex-shrink-0">
        {active ? (
          <span className="text-label-sm uppercase font-bold text-secondary">
            On
          </span>
        ) : null}
        <Icon
          name="chevron_right"
          className="text-outline group-hover:translate-x-1 transition-transform"
        />
      </div>
    </Link>
  );
}

export default async function RemindersPage() {
  const supabase = await createClient();
  const { data: habitRows } = await supabase
    .from("habits")
    .select("id, name, icon, color, reminder_times, reminder_days, reminders_enabled")
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  const habits = (habitRows ?? []) as HabitRow[];

  const active = habits.filter(
    (h) => h.reminders_enabled && h.reminder_times && h.reminder_times.length > 0,
  );
  const inactive = habits.filter(
    (h) => !(h.reminders_enabled && h.reminder_times && h.reminder_times.length > 0),
  );

  return (
    <>
      <TopAppBar title="Reminders" back="/settings" />
      <main className="max-w-screen-sm mx-auto px-margin-mobile pt-lg pb-xxl space-y-lg">
        <NotificationPermissionCard />

        {habits.length === 0 ? (
          <div className="bg-white rounded-xl p-lg text-center text-on-surface-variant text-label-sm">
            You haven&apos;t added any habits yet —{" "}
            <Link href="/habits/new" className="text-primary font-semibold">
              create one
            </Link>{" "}
            to schedule reminders.
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section className="space-y-xs">
                <h2 className="text-label-sm font-bold uppercase tracking-widest text-outline px-sm">
                  Active · {active.length}
                </h2>
                <div className="bg-white rounded-xl shadow-soft-purple-md divide-y divide-outline-variant/20 overflow-hidden">
                  {active.map((h) => (
                    <HabitReminderRow key={h.id} h={h} />
                  ))}
                </div>
              </section>
            )}

            {inactive.length > 0 && (
              <section className="space-y-xs">
                <h2 className="text-label-sm font-bold uppercase tracking-widest text-outline px-sm">
                  Not configured · {inactive.length}
                </h2>
                <div className="bg-white rounded-xl shadow-soft-purple-md divide-y divide-outline-variant/20 overflow-hidden">
                  {inactive.map((h) => (
                    <HabitReminderRow key={h.id} h={h} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
