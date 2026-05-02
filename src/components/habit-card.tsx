"use client";

import Link from "next/link";
import { useTransition } from "react";
import type { Habit } from "@/types/db";
import { toggleHabit } from "@/app/actions";
import { Icon } from "./icon";
import { useCelebrate } from "./celebration";

const colorPalette: Record<
  Habit["color"],
  { bg: string; fg: string }
> = {
  primary: { bg: "bg-primary-fixed/30", fg: "text-primary" },
  secondary: { bg: "bg-secondary-container/40", fg: "text-secondary" },
  tertiary: { bg: "bg-tertiary-fixed/40", fg: "text-tertiary" },
  neutral: { bg: "bg-surface-container", fg: "text-on-surface-variant" },
};

export function HabitCard({
  habit,
  done,
}: {
  habit: Habit;
  done: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const { celebrate } = useCelebrate();
  const palette = colorPalette[habit.color];

  return (
    <div className="bg-white p-md rounded-xl shadow-card flex items-center gap-lg border border-slate-50 group hover:shadow-soft-purple transition-shadow">
      <Link
        href={`/habits/${habit.id}`}
        className={`w-14 h-14 ${palette.bg} rounded-2xl flex items-center justify-center ${palette.fg} flex-shrink-0`}
        aria-label={`Open ${habit.name}`}
      >
        <Icon name={habit.icon} filled className="text-3xl" />
      </Link>
      <Link href={`/habits/${habit.id}`} className="flex-1 min-w-0">
        <h4 className="text-label-lg text-on-background truncate">
          {habit.name}
        </h4>
        {habit.description ? (
          <p className="text-label-sm text-on-surface-variant truncate">
            {habit.description}
          </p>
        ) : null}
      </Link>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          const wasDone = done;
          startTransition(async () => {
            await toggleHabit(habit.id, wasDone);
          });
          if (!wasDone) celebrate();
        }}
        aria-pressed={done}
        aria-label={done ? "Mark incomplete" : "Mark complete"}
        className={
          done
            ? "w-9 h-9 rounded-full bg-secondary text-white flex items-center justify-center shadow-md active:scale-90 transition-all"
            : "w-9 h-9 rounded-full border-2 border-slate-200 hover:border-primary text-primary flex items-center justify-center active:scale-90 transition-all"
        }
      >
        {done ? <Icon name="check" className="text-lg" /> : null}
      </button>
    </div>
  );
}
