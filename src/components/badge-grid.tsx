"use client";

import { useState } from "react";
import { Icon } from "./icon";
import type { ComputedBadge } from "@/lib/badges";

const TONE_STYLES: Record<string, { bg: string; icon: string; border: string }> = {
  yellow: { bg: "from-yellow-100 to-yellow-50", icon: "text-yellow-600", border: "border-yellow-200/60" },
  purple: { bg: "from-purple-100 to-purple-50", icon: "text-primary", border: "border-purple-200/60" },
  teal: { bg: "from-teal-100 to-teal-50", icon: "text-secondary", border: "border-teal-200/60" },
  red: { bg: "from-red-100 to-red-50", icon: "text-red-500", border: "border-red-200/60" },
  indigo: { bg: "from-indigo-100 to-indigo-50", icon: "text-indigo-600", border: "border-indigo-200/60" },
  orange: { bg: "from-orange-100 to-orange-50", icon: "text-orange-500", border: "border-orange-200/60" },
};

export function BadgeGrid({ badges }: { badges: ComputedBadge[] }) {
  const [selected, setSelected] = useState<ComputedBadge | null>(null);

  const earned = badges.filter((b) => b.earned);
  const locked = badges.filter((b) => !b.earned);

  return (
    <>
      {/* Earned */}
      {earned.length > 0 ? (
        <section className="space-y-md">
          <div className="flex justify-between items-center">
            <h2 className="text-headline-md">Earned Badges</h2>
            <span className="text-outline text-label-sm">{earned.length} earned</span>
          </div>
          <div className="grid grid-cols-3 gap-md">
            {earned.map((badge) => {
              const s = TONE_STYLES[badge.tone];
              return (
                <button
                  key={badge.id}
                  type="button"
                  onClick={() => setSelected(badge)}
                  className="flex flex-col items-center space-y-2 active:scale-95 transition-transform"
                >
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-tr ${s.bg} ${s.border} border flex items-center justify-center shadow-sm`}>
                    <Icon name={badge.icon} filled className={`text-4xl ${s.icon}`} />
                  </div>
                  <span className="text-label-sm text-center px-1 leading-tight">{badge.name}</span>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="bg-surface-container-low rounded-2xl p-lg text-center text-on-surface-variant text-label-sm">
          No badges earned yet — start completing habits to unlock them!
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <section className="space-y-md">
          <h2 className="text-headline-md">Earn These</h2>
          <div className="space-y-sm">
            {locked.map((badge) => {
              const s = TONE_STYLES[badge.tone];
              return (
                <button
                  key={badge.id}
                  type="button"
                  onClick={() => setSelected(badge)}
                  className="w-full bg-surface-container-low border border-dashed border-outline-variant rounded-2xl p-md flex items-center gap-md active:scale-[0.98] transition-transform opacity-80"
                >
                  <div className="w-14 h-14 rounded-full bg-surface-container-highest border border-outline-variant/40 flex items-center justify-center flex-shrink-0">
                    <Icon name={badge.icon} filled className={`text-2xl ${s.icon} opacity-40`} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-label-lg text-on-surface">{badge.name}</p>
                    <p className="text-label-sm text-outline truncate">{badge.description}</p>
                    <div className="mt-2 flex items-center gap-sm">
                      <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/40 rounded-full transition-all duration-500"
                          style={{ width: `${badge.progressPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-outline shrink-0">{badge.hintText}</span>
                    </div>
                  </div>
                  <Icon name="chevron_right" className="text-outline flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Detail bottom sheet */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-md p-lg space-y-md"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const s = TONE_STYLES[selected.tone];
              return (
                <div className="flex items-center gap-md">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-tr ${s.bg} ${s.border} border flex items-center justify-center`}>
                    <Icon name={selected.icon} filled className={`text-3xl ${s.icon} ${selected.earned ? "" : "opacity-40"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-headline-md">{selected.name}</p>
                    {selected.earned ? (
                      <span className="inline-flex items-center gap-1 text-secondary text-label-sm font-bold">
                        <Icon name="check_circle" className="text-[16px]" /> Earned
                      </span>
                    ) : (
                      <span className="text-outline text-label-sm">Locked</span>
                    )}
                  </div>
                  <button type="button" onClick={() => setSelected(null)} className="text-outline p-1" aria-label="Close">
                    <Icon name="close" />
                  </button>
                </div>
              );
            })()}

            <p className="text-body-md text-on-surface-variant">{selected.description}</p>

            {!selected.earned && (
              <div className="space-y-xs">
                <div className="flex justify-between text-label-sm">
                  <span className="text-outline">Progress</span>
                  <span className="font-medium">{selected.hintText}</span>
                </div>
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${selected.progressPct}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="w-full py-3 rounded-full bg-surface-container text-on-surface text-label-lg active:scale-95 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
