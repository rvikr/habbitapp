import type { Metadata } from "next";
import { getStats } from "@/lib/habits";
import { computeBadges } from "@/lib/badges";
import type { Badge } from "@/types/db";

export const metadata: Metadata = { title: "Achievements" };
export const dynamic = "force-dynamic";

const TONE_MAP: Record<Badge["tone"], { bg: string; ic: string; tag: string }> = {
  yellow: { bg: "bg-tertiary-fixed/50",       ic: "text-on-tertiary-fixed-variant", tag: "bg-tertiary-fixed/40 text-on-tertiary-fixed-variant" },
  orange: { bg: "bg-tertiary-fixed/50",       ic: "text-on-tertiary-fixed-variant", tag: "bg-tertiary-fixed/40 text-on-tertiary-fixed-variant" },
  purple: { bg: "bg-primary-fixed/50",        ic: "text-primary",                   tag: "bg-primary-fixed/40 text-primary" },
  teal:   { bg: "bg-secondary-container/40",  ic: "text-secondary",                 tag: "bg-secondary-container/35 text-on-secondary-container" },
  indigo: { bg: "bg-primary-fixed/40",        ic: "text-primary",                   tag: "bg-primary-fixed/35 text-primary" },
  red:    { bg: "bg-error-container/40",      ic: "text-error",                     tag: "bg-error-container/35 text-on-error-container" },
};

function BadgeCard({ badge }: { badge: Badge }) {
  const tone = TONE_MAP[badge.tone];
  return (
    <div
      className={`bg-white rounded-3xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.05)] border border-outline-variant/15 flex flex-col items-center gap-3 text-center transition-all duration-200 ${
        badge.earned ? "hover:-translate-y-1 hover:shadow-card-hover" : "opacity-45 grayscale-[0.5]"
      }`}
    >
      <div className={`w-16 h-16 rounded-2xl ${tone.bg} flex items-center justify-center relative`}>
        <span
          className={`material-symbols-outlined ${tone.ic} text-3xl`}
          style={badge.earned ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {badge.icon}
        </span>
        {!badge.earned && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-outline-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
          </div>
        )}
      </div>
      <div>
        <p className="font-bold text-on-background text-sm">{badge.name}</p>
        <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">{badge.description}</p>
      </div>
      {badge.earned && (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tone.tag}`}>
          Earned
        </span>
      )}
    </div>
  );
}

export default async function AchievementsPage() {
  const stats = await getStats();
  const badges = stats ? computeBadges(stats) : [];

  const earned = badges.filter((b) => b.earned);
  const locked = badges.filter((b) => !b.earned);

  // XP & level (simple: 100 XP per habit completion)
  const xpPerCompletion = 100;
  const totalXP = (stats?.totalCompletions ?? 0) * xpPerCompletion;
  const xpPerLevel = 3000;
  const level = Math.floor(totalXP / xpPerLevel) + 1;
  const levelXP = totalXP % xpPerLevel;
  const levelPct = Math.round((levelXP / xpPerLevel) * 100);

  // Build last-30-days activity
  const today = new Date();
  const thirtyDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 29 + i);
    return d.toISOString().split("T")[0];
  });
  const activeDatesSet = new Set(stats?.activeDates ?? []);
  const todayStr = today.toISOString().split("T")[0];

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="font-extrabold text-on-background" style={{ fontSize: "28px", letterSpacing: "-0.01em" }}>
          Your Achievements
        </h1>
        <p className="text-on-surface-variant text-base mt-1">
          Keep building habits to unlock more badges and level up.
        </p>
      </div>

      {/* Level hero */}
      <div className="bg-gradient-to-br from-primary to-primary-container rounded-3xl p-8 text-white relative overflow-hidden shadow-[0_8px_40px_rgba(93,63,211,0.3)]">
        <div className="absolute -right-8 -top-8 opacity-15 pointer-events-none">
          <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
        </div>
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              </div>
              <div>
                <p className="text-white/70 text-sm font-bold uppercase tracking-wider">Current Level</p>
                <h2 className="font-extrabold text-white text-3xl" style={{ letterSpacing: "-0.02em" }}>
                  Level {level}
                </h2>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70 font-medium">XP Progress</span>
                <span className="text-white font-bold">{levelXP.toLocaleString()} / {xpPerLevel.toLocaleString()} XP</span>
              </div>
              <div className="w-72 h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700"
                  style={{ width: `${levelPct}%` }}
                />
              </div>
              <p className="text-white/60 text-xs">{(xpPerLevel - levelXP).toLocaleString()} XP to Level {level + 1}</p>
            </div>
          </div>

          <div className="flex gap-5">
            {[
              { icon: "local_fire_department", val: stats?.streak ?? 0,              lbl: "Day Streak",    color: "text-tertiary-fixed"      },
              { icon: "military_tech",          val: earned.length,                   lbl: "Badges Earned", color: "text-secondary-container"  },
              { icon: "check_circle",           val: stats?.totalCompletions ?? 0,    lbl: "Habits Done",   color: "text-secondary-fixed"      },
            ].map(({ icon, val, lbl, color }) => (
              <div key={lbl} className="bg-white/15 backdrop-blur-sm rounded-2xl px-6 py-5 text-center border border-white/15">
                <span className={`material-symbols-outlined ${color} text-3xl`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                <p className="font-extrabold text-white text-3xl mt-2" style={{ letterSpacing: "-0.02em" }}>{val}</p>
                <p className="text-white/65 text-sm mt-0.5">{lbl}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Earned badges */}
      {earned.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-on-background text-xl">Unlocked Badges</h2>
            <span className="bg-secondary-container/40 text-on-secondary-container text-xs font-bold px-2.5 py-1 rounded-full">
              {earned.length} earned
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {earned.map((b) => <BadgeCard key={b.id} badge={b} />)}
          </div>
        </div>
      )}

      {/* Locked badges */}
      {locked.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-on-background text-xl">Locked Badges</h2>
            <span className="bg-surface-container text-on-surface-variant text-xs font-bold px-2.5 py-1 rounded-full">
              {locked.length} remaining
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {locked.map((b) => <BadgeCard key={b.id} badge={b} />)}
          </div>
        </div>
      )}

      {/* Streak history */}
      <div className="bg-white rounded-3xl p-6 shadow-card border border-outline-variant/15 space-y-4">
        <h2 className="font-bold text-on-background text-xl">Last 30 Days</h2>
        <div className="flex gap-1.5 flex-wrap">
          {thirtyDays.map((date) => {
            const isToday = date === todayStr;
            const active = activeDatesSet.has(date);
            return (
              <div
                key={date}
                title={date}
                className={`w-8 h-8 rounded-lg ${
                  isToday
                    ? "bg-primary/20 border-2 border-primary border-dashed"
                    : active
                    ? "bg-secondary"
                    : "bg-surface-container"
                }`}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-6 pt-1">
          {[
            { color: "bg-secondary",    label: "Completed" },
            { color: "bg-surface-container", label: "No activity" },
            { color: "bg-primary/20 border-2 border-primary border-dashed", label: "Today" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${color}`} />
              <span className="text-xs text-on-surface-variant font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
