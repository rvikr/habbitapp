import { TopAppBar } from "@/components/top-app-bar";
import { Icon } from "@/components/icon";
import { BadgeGrid } from "@/components/badge-grid";
import { getStats, getMilestones } from "@/lib/habits";
import { BADGE_DEFS } from "@/lib/badges";
import type { BadgeStats, ComputedBadge } from "@/lib/badges";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const profile = await getStats();
  const milestones = getMilestones();

  const badgeStats: BadgeStats = {
    totalCompletions: profile.totalCompletions,
    totalHabits: profile.totalHabits,
    currentStreak: profile.currentStreak,
  };

  // Compute all badge data server-side — no functions cross the server/client boundary
  const computedBadges: ComputedBadge[] = BADGE_DEFS.map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    icon: b.icon,
    tone: b.tone,
    earned: b.check(badgeStats),
    progressPct: Math.round(b.progress(badgeStats) * 100),
    hintText: b.hint(badgeStats),
  }));

  const earnedCount = computedBadges.filter((b) => b.earned).length;
  const xpPct =
    profile.xpForNext === 0
      ? 0
      : Math.round((profile.xp / profile.xpForNext) * 100);

  return (
    <>
      <TopAppBar title="Achievements" />

      <main className="max-w-md mx-auto px-margin-mobile pt-lg pb-xxl space-y-lg">
        {/* XP Level card */}
        <section className="relative overflow-hidden rounded-[32px] p-lg bg-gradient-to-br from-primary-container to-primary text-white shadow-soft-purple-lg">
          <div className="relative z-10">
            <p className="text-label-lg text-white/80 uppercase tracking-widest mb-1">
              Level {profile.level}
            </p>
            <h1 className="text-headline-xl text-white mb-md">
              {profile.currentStreak >= 7
                ? "You're on Fire!"
                : profile.currentStreak > 0
                  ? "Keep the streak going."
                  : "Let's begin."}
            </h1>
            <div className="flex items-end gap-2 mb-lg">
              <span className="text-5xl font-extrabold tracking-tight">
                {profile.totalXp.toLocaleString()}
              </span>
              <span className="text-label-lg text-white/70 mb-1">XP POINTS</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-label-sm">
                <span>Progress to Level {profile.level + 1}</span>
                <span>{xpPct}%</span>
              </div>
              <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary-fixed rounded-full transition-all duration-700"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
            </div>
          </div>
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-tertiary/20 rounded-full blur-2xl" />
        </section>

        {/* Stats row */}
        <section className="grid grid-cols-3 gap-md">
          <div className="bg-surface-container-lowest p-md rounded-3xl shadow-soft-purple-md flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-2">
              <Icon name="local_fire_department" filled className="text-tertiary text-2xl" />
            </div>
            <span className="text-headline-md leading-tight">{profile.currentStreak}</span>
            <span className="text-[11px] text-outline">Day Streak</span>
          </div>
          <div className="bg-surface-container-lowest p-md rounded-3xl shadow-soft-purple-md flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-2">
              <Icon name="workspace_premium" filled className="text-primary text-2xl" />
            </div>
            <span className="text-headline-md leading-tight">{earnedCount}</span>
            <span className="text-[11px] text-outline">Badges</span>
          </div>
          <div className="bg-surface-container-lowest p-md rounded-3xl shadow-soft-purple-md flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center mb-2">
              <Icon name="check_circle" filled className="text-secondary text-2xl" />
            </div>
            <span className="text-headline-md leading-tight">{profile.totalCompletions}</span>
            <span className="text-[11px] text-outline">Done</span>
          </div>
        </section>

        {/* Badges — earned + locked, client component handles click */}
        <BadgeGrid badges={computedBadges} />

        {/* Milestones */}
        {milestones.length > 0 && (
          <section className="space-y-md">
            <h2 className="text-headline-md">Milestones</h2>
            <div className="space-y-md">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className="bg-surface-container-low p-lg rounded-[24px] flex items-center gap-md border border-dashed border-outline-variant"
                >
                  <div className="w-14 h-14 bg-surface-container-highest rounded-2xl flex items-center justify-center shrink-0">
                    <Icon name="lock" className="text-outline text-3xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-label-lg text-on-surface">{m.name}</h3>
                    <p className="text-label-sm text-outline">{m.description}</p>
                    <div className="mt-2 h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className="h-full bg-outline rounded-full"
                        style={{ width: `${Math.round(m.progress * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
