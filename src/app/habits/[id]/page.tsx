import Link from "next/link";
import { notFound } from "next/navigation";
import { TopAppBar } from "@/components/top-app-bar";
import { Icon } from "@/components/icon";
import { LogEntryFab } from "@/components/log-entry-fab";
import { LogPrompt } from "@/components/log-prompt";
import { getHabit, streakFor, weekProgressFor } from "@/lib/habits";

export const dynamic = "force-dynamic";

const colorMap = {
  primary: { stat: "bg-primary text-on-primary", bar: "bg-primary", soft: "bg-primary-fixed/30 text-primary" },
  secondary: { stat: "bg-secondary text-on-secondary", bar: "bg-secondary", soft: "bg-secondary-container/40 text-secondary" },
  tertiary: { stat: "bg-tertiary text-on-tertiary", bar: "bg-tertiary", soft: "bg-tertiary-fixed/40 text-tertiary" },
  neutral: { stat: "bg-on-surface-variant text-white", bar: "bg-outline", soft: "bg-surface-container text-on-surface-variant" },
} as const;

export default async function HabitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { habit, completions } = await getHabit(id);
  if (!habit) notFound();

  const tone = colorMap[habit.color];
  const week = weekProgressFor(habit.id, completions);
  const streak = streakFor(completions);
  const consistencyPct =
    completions.length === 0
      ? 0
      : Math.round((week.filter((d) => d.done).length / 7) * 100);

  const recentEntries = [...completions]
    .sort((a, b) => (a.completed_on < b.completed_on ? 1 : -1))
    .slice(0, 4);

  return (
    <>
      <TopAppBar
        title={habit.name}
        back="/"
        trailing={
          <Link
            href={`/habits/${habit.id}/edit`}
            className="text-primary hover:opacity-80 active:scale-95 transition"
            aria-label="Edit habit"
          >
            <Icon name="tune" />
          </Link>
        }
      />

      <main className="max-w-4xl mx-auto px-margin-mobile py-lg space-y-lg pb-32">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <div className="md:col-span-2 glass-card rounded-xl p-lg flex flex-col justify-between relative overflow-hidden shadow-soft-purple-md border border-white">
            <div className="z-10">
              <span className="text-secondary text-label-lg uppercase tracking-widest mb-xs block">
                Current Progress
              </span>
              <h2 className="text-headline-xl">
                {week.filter((d) => d.done).length}
                <span className="text-body-lg text-outline"> / 7 days</span>
              </h2>
              <div className="mt-md w-full bg-surface-container-highest h-3 rounded-full overflow-hidden">
                <div
                  className={`${tone.bar} h-full rounded-full transition-all duration-700`}
                  style={{ width: `${consistencyPct}%` }}
                />
              </div>
              <p className="mt-sm text-label-sm text-on-surface-variant italic">
                &ldquo;Success is the sum of small efforts, repeated day-in and
                day-out.&rdquo;
              </p>
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-10">
              <Icon name={habit.icon} filled className="text-[160px]" />
            </div>
          </div>

          <div className="bg-primary-container text-on-primary-container rounded-xl p-lg flex flex-col items-center justify-center text-center shadow-soft-purple-lg">
            <Icon
              name="local_fire_department"
              filled
              className="text-4xl mb-sm"
            />
            <span className="text-headline-xl leading-none">{streak}</span>
            <span className="text-label-lg uppercase tracking-tighter mt-xs">
              Day Streak
            </span>
            <p className="text-[11px] mt-md opacity-80">Keep showing up.</p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-md">
          <div className="md:col-span-3 bg-white rounded-xl p-lg shadow-card border border-slate-50">
            <div className="flex justify-between items-center mb-lg">
              <h3 className="text-headline-md">Weekly Overview</h3>
              <span className="px-3 py-1 rounded-full bg-surface-container text-label-sm text-on-surface-variant">
                This week
              </span>
            </div>
            <div className="flex items-end justify-between h-48 pt-md gap-sm">
              {week.map((d) => {
                const height = d.future ? 20 : d.done ? 100 : 35;
                return (
                  <div
                    key={d.key}
                    className={`flex-1 flex flex-col items-center gap-sm ${d.future ? "opacity-30" : ""}`}
                  >
                    <div
                      className={`w-full ${d.future ? "bg-slate-200" : `${tone.bar}/20`} rounded-t-lg relative`}
                      style={{ height: `${height}%` }}
                    >
                      {d.done ? (
                        <div
                          className={`absolute inset-x-0 bottom-0 ${tone.bar} rounded-t-lg`}
                          style={{ height: "100%" }}
                        />
                      ) : null}
                    </div>
                    <span
                      className={`text-label-sm ${d.done ? "text-on-surface font-bold" : "text-outline"}`}
                    >
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-1 space-y-md">
            <div className="bg-tertiary-fixed text-on-tertiary-fixed rounded-xl p-md flex flex-col shadow-sm">
              <Icon name="verified" className="text-tertiary-container mb-xs" />
              <span className="text-label-sm font-bold uppercase">
                Consistency
              </span>
              <span className="text-headline-md">{consistencyPct}%</span>
            </div>
            <div className="bg-secondary-container text-on-secondary-container rounded-xl p-md flex flex-col shadow-sm">
              <Icon name="schedule" className="text-secondary mb-xs" />
              <span className="text-label-sm font-bold uppercase">
                Reminder
              </span>
              <span className="text-headline-md">
                {habit.reminder_time ?? "—"}
              </span>
            </div>
          </div>
        </section>

        <section className="space-y-md">
          <div className="flex justify-between items-center">
            <h3 className="text-headline-md">Recent Entries</h3>
            <span className="text-outline text-label-sm">
              Last {Math.min(recentEntries.length, 4)}
            </span>
          </div>
          <div className="space-y-sm">
            {recentEntries.length === 0 ? (
              <div className="bg-white/60 border border-slate-100 rounded-xl p-md text-on-surface-variant text-label-sm">
                No entries yet — log this habit today to get started.
              </div>
            ) : (
              recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white/60 border border-slate-100 rounded-xl p-md flex items-center justify-between hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-md">
                    <div
                      className={`w-10 h-10 rounded-full ${tone.soft} flex items-center justify-center`}
                    >
                      <Icon name={habit.icon} filled />
                    </div>
                    <div>
                      <p className="text-label-lg">Logged</p>
                      <p className="text-label-sm text-outline">
                        {new Date(entry.completed_on).toLocaleDateString(
                          undefined,
                          { weekday: "short", month: "short", day: "numeric" },
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-secondary">
                    {entry.value && habit.unit
                      ? `+${entry.value} ${habit.unit}`
                      : "✓"}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="pt-md">
          <div className="rounded-2xl overflow-hidden relative h-40">
            <div className="absolute inset-0 bg-gradient-to-r from-[#5D3FD3] to-[#7e60dd]" />
            <div className="absolute inset-0 flex items-center p-lg">
              <div className="max-w-xs text-white">
                <p className="text-body-md italic font-medium leading-relaxed">
                  &ldquo;Consistency is the engine of mastery. Show up again
                  tomorrow.&rdquo;
                </p>
                <p className="text-[10px] uppercase tracking-widest mt-sm opacity-80">
                  — Daily Reminder
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LogPrompt
        habitId={habit.id}
        habitName={habit.name}
        done={completions.some(
          (c) => c.completed_on === new Date().toISOString().slice(0, 10),
        )}
        unit={habit.unit ?? ""}
        target={habit.target ?? null}
      />
      <LogEntryFab
        habitId={habit.id}
        unit={habit.unit ?? ""}
        target={habit.target ?? null}
        remindersEnabled={habit.reminders_enabled ?? false}
        reminderTimes={habit.reminder_times ?? []}
      />
    </>
  );
}
