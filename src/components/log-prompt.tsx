"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { logCompletion } from "@/app/actions";
import { Icon } from "./icon";
import { useCelebrate } from "./celebration";

type Props = {
  habitId: string;
  habitName: string;
  done: boolean;
  unit: string;
  target: number | null;
};

export function LogPrompt({ habitId, habitName, done, unit, target }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const { celebrate } = useCelebrate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"confirm" | "quantity">("confirm");
  const [amount, setAmount] = useState<string>(target ? String(target) : "");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (params.get("prompt") === "log" && !done) setOpen(true);
  }, [params, done]);

  useEffect(() => {
    if (step === "quantity") inputRef.current?.focus();
  }, [step]);

  function close() {
    setOpen(false);
    setStep("confirm");
    const url = new URL(window.location.href);
    url.searchParams.delete("prompt");
    router.replace(url.pathname + (url.search ? url.search : ""));
  }

  function handleYes() {
    if (unit) {
      setAmount(target ? String(target) : "");
      setStep("quantity");
    } else {
      doLog(undefined);
    }
  }

  function handleLog() {
    const value = parseFloat(amount);
    if (!amount || isNaN(value) || value <= 0) return;
    doLog(value);
  }

  function doLog(value?: number) {
    celebrate("Logged!");
    startTransition(async () => {
      await logCompletion(habitId, value);
      close();
    });
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-margin-mobile bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={close}
    >
      <div
        className="bg-white rounded-3xl p-lg max-w-sm w-full shadow-soft-purple-lg space-y-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-md">
          <div className="w-12 h-12 rounded-2xl bg-primary-fixed/40 text-primary flex items-center justify-center">
            <Icon name="notifications" filled />
          </div>
          <div>
            <p className="text-headline-md leading-tight">{habitName}</p>
            <p className="text-label-sm text-outline">
              {step === "quantity" ? `How much did you log?` : "Did you do it just now?"}
            </p>
          </div>
        </div>

        {step === "confirm" ? (
          <div className="flex gap-sm">
            <button
              type="button"
              onClick={close}
              className="flex-1 py-3 rounded-full bg-surface-container text-on-surface text-label-lg active:scale-95 transition"
            >
              Not yet
            </button>
            <button
              type="button"
              onClick={handleYes}
              disabled={pending}
              className="flex-1 py-3 rounded-full bg-secondary text-on-secondary text-label-lg active:scale-95 transition disabled:opacity-50"
            >
              {unit ? "Yes →" : pending ? "Logging…" : "Yes, log it"}
            </button>
          </div>
        ) : (
          <div className="space-y-sm">
            <div className="flex items-center gap-sm">
              <input
                ref={inputRef}
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLog()}
                className="flex-1 bg-surface-container-low text-on-background rounded-lg px-md py-3 text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <span className="text-label-lg text-outline font-medium w-12 text-right">
                {unit}
              </span>
            </div>
            {target && (
              <p className="text-label-sm text-outline">
                Daily target: {target} {unit}
              </p>
            )}
            <div className="flex gap-sm pt-xs">
              <button
                type="button"
                onClick={() => setStep("confirm")}
                className="flex-1 py-3 rounded-full bg-surface-container text-on-surface text-label-lg active:scale-95 transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleLog}
                disabled={pending || !amount}
                className="flex-1 py-3 rounded-full bg-secondary text-on-secondary text-label-lg active:scale-95 transition disabled:opacity-50"
              >
                {pending ? "Logging…" : `Log ${amount || "—"} ${unit}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
