"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { logCompletion } from "@/app/actions";
import { Icon } from "./icon";
import { useCelebrate } from "./celebration";

type Props = {
  habitId: string;
  unit: string;
  target: number | null;
  remindersEnabled: boolean;
  reminderTimes: string[];
};

function nowHHMM(): string {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}

function earliestTime(times: string[]): string | null {
  if (times.length === 0) return null;
  return [...times].sort()[0];
}

export function LogEntryFab({
  habitId,
  unit,
  target,
  remindersEnabled,
  reminderTimes,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const { celebrate } = useCelebrate();
  const [showQuantity, setShowQuantity] = useState(false);
  const [amount, setAmount] = useState<string>(target ? String(target) : "");
  const [now, setNow] = useState(nowHHMM());
  const inputRef = useRef<HTMLInputElement>(null);

  // Recheck time every minute so the button auto-unlocks
  useEffect(() => {
    const id = setInterval(() => setNow(nowHHMM()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (showQuantity) inputRef.current?.focus();
  }, [showQuantity]);

  // Time-gate: disabled before earliest reminder time today
  const earliest = remindersEnabled ? earliestTime(reminderTimes) : null;
  const locked = !!(earliest && now < earliest);

  function handleFabClick() {
    if (locked || isPending) return;
    if (unit) {
      setAmount(target ? String(target) : "");
      setShowQuantity(true);
    } else {
      celebrate("Logged!");
      startTransition(async () => {
        await logCompletion(habitId);
      });
    }
  }

  function handleLog() {
    const value = parseFloat(amount);
    if (!amount || isNaN(value) || value <= 0) return;
    setShowQuantity(false);
    celebrate("Logged!");
    startTransition(async () => {
      await logCompletion(habitId, value);
    });
  }

  return (
    <>
      {/* Quantity mini-modal */}
      {showQuantity && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-end pb-36 pr-6"
          onClick={() => setShowQuantity(false)}
        >
          <div
            className="bg-white rounded-2xl p-md shadow-soft-purple-lg w-56 space-y-md"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-label-lg font-semibold">How much?</p>
            <div className="flex items-center gap-sm">
              <input
                ref={inputRef}
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLog()}
                className="flex-1 bg-surface-container-low text-on-background rounded-lg px-sm py-2 text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40 w-0"
              />
              <span className="text-label-sm text-outline whitespace-nowrap">
                {unit}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLog}
              disabled={!amount || isPending}
              className="w-full py-2 rounded-full bg-primary text-on-primary text-label-sm font-bold active:scale-95 transition disabled:opacity-50"
            >
              {isPending ? "Logging…" : `Log ${amount || "—"} ${unit}`}
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <div className="fixed bottom-32 right-6 z-30 flex flex-col items-end gap-2">
        {locked && earliest && (
          <span className="bg-surface-container text-on-surface-variant text-[11px] font-medium px-2 py-1 rounded-full shadow-sm whitespace-nowrap">
            Unlocks at {earliest}
          </span>
        )}
        <button
          type="button"
          disabled={isPending || locked}
          onClick={handleFabClick}
          aria-label={locked ? `Available at ${earliest}` : "Log entry for today"}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-soft-purple-lg transition-all ${
            locked
              ? "bg-surface-container text-on-surface-variant cursor-not-allowed"
              : "bg-primary-container text-on-primary-container hover:scale-110 active:scale-95"
          } disabled:opacity-70`}
        >
          <Icon
            name={locked ? "lock_clock" : isPending ? "hourglass_top" : "add"}
            className="text-3xl"
          />
        </button>
      </div>
    </>
  );
}
