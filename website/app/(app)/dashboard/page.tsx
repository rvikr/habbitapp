import type { Metadata } from "next";
import { getHabitsForToday, getWeeklyCompletions } from "@/lib/habits";
import HabitList from "@/components/HabitList";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const { habits, completedToday, displayName } = await getHabitsForToday();
  const weeklyCompletions = await getWeeklyCompletions();

  const total = habits.length;
  const done = completedToday.size;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const circumference = 2 * Math.PI * 46;
  const dashOffset = circumference - (pct / 100) * circumference;

  // Build a map of date → completion count for the last 7 days
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 6 + i);
    return d.toISOString().split("T")[0];
  });
  const completionsByDate = weeklyCompletions.reduce<Record<string, number>>(
    (acc, c) => { acc[c.completed_on] = (acc[c.completed_on] ?? 0) + 1; return acc; },
    {}
  );

  return (
    <div className="flex min-h-screen">
      {/* ── Main ─────────────────────────────────────────── */}
      <div className="flex-1 p-8 space-y-8 max-w-3xl">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-extrabold text-on-background" style={{ fontSize: "28px", letterSpacing: "-0.01em" }}>
              {greeting()}, {displayName}! 👋
            </h1>
            <p className="text-on-surface-variant text-base mt-1">
              {total === 0
                ? "Add habits in the mobile app to get started."
                : done === total
                ? "All habits complete — amazing work! 🎉"
                : `${done} of ${total} habits complete. Keep going!`}
            </p>
          </div>
        </div>

        {/* Progress + streak bento */}
        <div className="grid grid-cols-3 gap-5">
          {/* Progress ring */}
          <div className="col-span-2 bg-white rounded-3xl p-6 shadow-card border border-outline-variant/20 flex items-center gap-6">
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="46" fill="none"
                  stroke="#5D3FD3" strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-extrabold text-2xl text-primary" style={{ letterSpacing: "-0.02em" }}>{pct}%</span>
                <span className="text-xs text-on-surface-variant font-medium">done</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-extrabold text-secondary uppercase tracking-widest">Daily Goal</p>
              <h2 className="font-bold text-on-background text-xl">Today&apos;s Habits</h2>
              <p className="text-sm text-on-surface-variant">{done} of {total} completed</p>
              {done === total && total > 0 && (
                <span className="inline-flex items-center gap-1 bg-secondary-container/40 text-on-secondary-container text-xs font-bold px-3 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
                  Perfect day!
                </span>
              )}
            </div>
          </div>

          {/* Weekly mastery */}
          <div className="bg-gradient-to-br from-primary to-primary-container rounded-3xl p-5 text-white relative overflow-hidden shadow-[0_4px_24px_rgba(93,63,211,0.28)]">
            <div className="absolute -right-4 -bottom-4 opacity-20 pointer-events-none">
              <span className="material-symbols-outlined text-[90px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            </div>
            <div className="relative z-10 space-y-1">
              <p className="text-white/70 text-xs font-bold uppercase tracking-wider">This Week</p>
              <p className="font-extrabold text-3xl" style={{ letterSpacing: "-0.02em" }}>
                {weekDays.filter((d) => (completionsByDate[d] ?? 0) > 0).length}/7
              </p>
              <p className="text-white/80 text-sm font-medium">Days active</p>
            </div>
          </div>
        </div>

        {/* Habit List */}
        <section className="space-y-4">
          <h2 className="font-bold text-on-background text-xl">Today&apos;s Habits</h2>
          <HabitList habits={habits} completedToday={completedToday} />
        </section>

        {/* Weekly chart */}
        <section className="bg-white rounded-3xl p-6 shadow-card border border-outline-variant/15 space-y-4">
          <h2 className="font-bold text-on-background text-xl">Weekly Overview</h2>
          <div className="flex items-end gap-3 h-24">
            {weekDays.map((date, i) => {
              const count = completionsByDate[date] ?? 0;
              const isToday = date === today.toISOString().split("T")[0];
              const heightPct = total > 0 ? Math.min((count / total) * 100, 100) : 0;
              const dayLabel = DAYS[(new Date(date).getDay() + 6) % 7];
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-lg relative" style={{ height: "100%" }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-lg transition-all duration-500 ${
                        isToday
                          ? "bg-primary/20 border-2 border-primary border-dashed"
                          : count > 0 ? "bg-secondary" : "bg-surface-container"
                      }`}
                      style={{ height: isToday ? "60%" : `${Math.max(heightPct, 8)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${isToday ? "text-primary font-bold" : "text-on-surface-variant"}`}>
                    {dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ── Right Aside ──────────────────────────────────── */}
      <aside className="w-72 flex-shrink-0 p-6 space-y-6">
        {/* Quick tip */}
        <div className="bg-white rounded-3xl p-5 shadow-card border border-outline-variant/15 space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
            <h3 className="font-bold text-on-background">Quick Tip</h3>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Consistency beats intensity. Even completing one habit today keeps your streak alive.
          </p>
        </div>

        {/* Today&apos;s date */}
        <div className="bg-gradient-to-br from-secondary/10 to-secondary-container/20 rounded-3xl p-5 border border-secondary-container/30 space-y-1">
          <p className="text-xs font-bold text-secondary uppercase tracking-widest">Today</p>
          <p className="font-extrabold text-on-background text-2xl" style={{ letterSpacing: "-0.01em" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long" })}
          </p>
          <p className="text-on-surface-variant text-sm">
            {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>

        {/* Progress summary */}
        <div className="bg-white rounded-3xl p-5 shadow-card border border-outline-variant/15 space-y-3">
          <h3 className="font-bold text-on-background">Progress</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-on-surface-variant">Today</span>
                <span className="text-primary">{pct}%</span>
              </div>
              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
