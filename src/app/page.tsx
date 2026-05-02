import Link from "next/link";
import { TopAppBar } from "@/components/top-app-bar";
import { ProgressRing } from "@/components/progress-ring";
import { HabitCard } from "@/components/habit-card";
import { StreakChip } from "@/components/streak-chip";
import { Icon } from "@/components/icon";
import { getHabitsForToday } from "@/lib/habits";

export const dynamic = "force-dynamic";

function partOfDay() {
  const h = new Date().getHours();
  if (h < 5) return "evening";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export default async function DashboardPage() {
  const { habits, completedToday, profile } = await getHabitsForToday();
  const total = habits.length;
  const done = habits.filter((h) => completedToday.has(h.id)).length;
  const ratio = total === 0 ? 0 : done / total;
  const percent = Math.round(ratio * 100);

  return (
    <>
      <TopAppBar
        title="My Habits"
        trailing={
          <Link
            href="/habits/new"
            className="text-[#5D3FD3] hover:opacity-80 active:scale-95 transition-all"
            aria-label="Add habit"
          >
            <Icon name="add_circle" className="text-[28px]" />
          </Link>
        }
      />
      <main className="max-w-screen-sm mx-auto px-margin-mobile pb-xxl pt-lg space-y-xxl">
        <section className="space-y-sm">
          <h2 className="text-headline-lg">
            Good {partOfDay()}, {profile.displayName}!
          </h2>
          <p className="text-body-md text-on-surface-variant">
            {total === 0
              ? "Let's set up your first habit."
              : done === 0
                ? `Let's start your ${total} habit${total === 1 ? "" : "s"} for today.`
                : done === total
                  ? "All done — beautifully consistent."
                  : `You've completed ${done} of ${total} habits for today. Keep going!`}
          </p>
        </section>

        {total > 0 ? (
          <section className="bg-white rounded-3xl p-lg shadow-soft-purple-md relative overflow-hidden border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <div className="space-y-xs">
                <span className="text-label-sm text-secondary uppercase tracking-widest">
                  Daily Goal
                </span>
                <p className="text-headline-xl text-primary">{percent}%</p>
                <p className="text-body-md text-on-surface-variant">
                  {percent === 100
                    ? "Mastered today!"
                    : percent >= 50
                      ? "Almost there!"
                      : "Take it one habit at a time."}
                </p>
              </div>
              <ProgressRing progress={ratio} />
            </div>
            <div className="mt-lg pt-md border-t border-outline-variant/30 flex gap-md overflow-x-auto no-scrollbar">
              <StreakChip
                icon="local_fire_department"
                label={`${done}/${total} today`}
                tone="secondary"
              />
              {percent === 100 ? (
                <StreakChip
                  icon="military_tech"
                  label="Goal hit"
                  tone="tertiary"
                />
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="space-y-lg">
          {total > 0 ? (
            <div className="flex justify-between items-center px-xs">
              <h3 className="text-headline-md">Today&apos;s Habits</h3>
              <Link
                href="/habits/new"
                className="text-label-lg text-primary hover:opacity-70"
              >
                Add
              </Link>
            </div>
          ) : null}

          <div className="space-y-md">
            {total === 0 ? (
              <div className="bg-white rounded-3xl p-lg border border-outline-variant/30 shadow-soft-purple-md text-center space-y-md">
                <div className="w-16 h-16 rounded-2xl bg-primary-fixed/40 mx-auto flex items-center justify-center text-primary">
                  <Icon name="spa" filled className="text-4xl" />
                </div>
                <div>
                  <h4 className="text-headline-md">No habits yet</h4>
                  <p className="text-body-md text-on-surface-variant mt-1">
                    Pick something small you&apos;d like to do every day.
                  </p>
                </div>
                <Link
                  href="/habits/new"
                  className="inline-flex items-center gap-2 px-lg py-3 rounded-full bg-primary text-on-primary text-label-lg active:scale-95 transition-transform"
                >
                  <Icon name="add" />
                  Create your first habit
                </Link>
              </div>
            ) : (
              habits.map((h) => (
                <HabitCard
                  key={h.id}
                  habit={h}
                  done={completedToday.has(h.id)}
                />
              ))
            )}
          </div>
        </section>

        {total > 0 ? (
          <section className="grid grid-cols-2 gap-md">
            <div className="col-span-2 bg-gradient-to-br from-[#5D3FD3] to-[#451ebb] rounded-3xl p-lg text-white relative overflow-hidden">
              <div className="relative z-10 space-y-xs">
                <h4 className="text-headline-md">Weekly Mastery</h4>
                <p className="text-body-md opacity-90">
                  Keep showing up — every check-in builds the streak.
                </p>
              </div>
              <div className="absolute -right-6 -bottom-6 opacity-20 rotate-12">
                <Icon
                  name="workspace_premium"
                  filled
                  className="text-[120px]"
                />
              </div>
            </div>
            <Link
              href="/achievements"
              className="bg-white p-md rounded-3xl shadow-sm border border-outline-variant/30 flex flex-col justify-between h-32 active:scale-[0.98] transition-transform"
            >
              <Icon name="military_tech" className="text-secondary" />
              <div>
                <p className="text-headline-md">Badges</p>
                <p className="text-label-sm text-on-surface-variant uppercase tracking-tighter">
                  See progress
                </p>
              </div>
            </Link>
            <Link
              href="/settings"
              className="bg-white p-md rounded-3xl shadow-sm border border-outline-variant/30 flex flex-col justify-between h-32 active:scale-[0.98] transition-transform"
            >
              <Icon name="tune" className="text-tertiary" />
              <div>
                <p className="text-headline-md">Settings</p>
                <p className="text-label-sm text-on-surface-variant uppercase tracking-tighter">
                  Reminders
                </p>
              </div>
            </Link>
          </section>
        ) : null}
      </main>

      {total > 0 ? (
        <Link
          href="/habits/new"
          className="fixed right-6 bottom-28 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center z-30 active:scale-90 transition-transform"
          aria-label="Add habit"
        >
          <Icon name="add" className="text-3xl" />
        </Link>
      ) : null}
    </>
  );
}
