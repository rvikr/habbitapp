"use client";

import Link from "next/link";
import { Icon } from "./icon";
import { HABIT_CATALOG } from "@/lib/habit-catalog";

const COLOR_BG: Record<string, string> = {
  primary: "bg-primary-fixed/30 text-primary",
  secondary: "bg-secondary-container/40 text-secondary",
  tertiary: "bg-tertiary-fixed/40 text-tertiary",
  neutral: "bg-surface-container text-on-surface-variant",
};

export function HabitCatalogPicker() {
  return (
    <div className="space-y-lg">
      <div className="space-y-xs">
        <h2 className="text-headline-md">Choose a habit</h2>
        <p className="text-label-sm text-outline">
          Pick a preset to get started quickly, or create a custom one.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-md">
        {HABIT_CATALOG.map((entry) => (
          <Link
            key={entry.template}
            href={`/habits/new?template=${entry.template}`}
            className="bg-white rounded-2xl p-md shadow-soft-purple-md flex flex-col gap-sm active:scale-[0.97] transition-transform hover:shadow-soft-purple-lg"
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center ${COLOR_BG[entry.color]}`}
            >
              <Icon name={entry.icon} filled className="text-xl" />
            </div>
            <div className="min-w-0">
              <p className="text-label-lg font-semibold leading-tight truncate">
                {entry.name}
              </p>
              {entry.unit ? (
                <p className="text-label-sm text-outline mt-0.5">
                  Track in {entry.unit}
                  {entry.target ? ` · ${entry.target}${entry.unit}/day` : ""}
                </p>
              ) : (
                <p className="text-label-sm text-outline mt-0.5">Yes / No</p>
              )}
            </div>
          </Link>
        ))}

        {/* Custom habit card */}
        <Link
          href="/habits/new?template=custom"
          className="bg-primary/5 border-2 border-dashed border-primary/30 rounded-2xl p-md flex flex-col gap-sm items-center justify-center text-center active:scale-[0.97] transition-transform hover:bg-primary/10 min-h-[100px]"
        >
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Icon name="add" className="text-xl" />
          </div>
          <p className="text-label-lg font-semibold text-primary">Custom</p>
          <p className="text-label-sm text-outline">Build your own</p>
        </Link>
      </div>
    </div>
  );
}
