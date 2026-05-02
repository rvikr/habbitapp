"use client";

import { useTransition } from "react";
import { signOut } from "@/app/actions";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("habbit:theme");
        }
        startTransition(() => {
          void signOut();
        });
      }}
      className="w-full p-md bg-white dark:bg-surface-container border border-error/20 text-error rounded-xl text-label-lg hover:bg-error/5 transition-colors active:scale-[0.98] duration-200 disabled:opacity-50"
    >
      {isPending ? "Signing out…" : "Log Out"}
    </button>
  );
}
