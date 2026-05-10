import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getStats } from "@/lib/habits";
import SettingsForm from "./SettingsForm";

export const metadata: Metadata = { title: "Settings — Lagan" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, stats] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle(),
    getStats(),
  ]);

  const displayName =
    (profile?.display_name as string | null | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "";

  const totalXP = (stats?.totalCompletions ?? 0) * 100;
  const level = Math.floor(totalXP / 3000) + 1;

  return (
    <div className="p-8 space-y-8 max-w-2xl">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="font-extrabold text-on-background"
            style={{ fontSize: "28px", letterSpacing: "-0.01em" }}
          >
            Settings
          </h1>
          <p className="text-on-surface-variant text-base mt-1">
            Manage your account and preferences.
          </p>
        </div>

        {/* Plan badge */}
        <div className="bg-gradient-to-br from-primary/10 to-primary-fixed/40 rounded-2xl px-4 py-3 text-center border border-primary/15 flex-shrink-0">
          <span
            className="material-symbols-outlined text-primary text-xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            workspace_premium
          </span>
          <p className="font-extrabold text-primary text-sm mt-0.5">
            Level {level}
          </p>
          <p className="text-xs text-on-surface-variant">{totalXP.toLocaleString()} XP</p>
        </div>
      </div>

      {/* ── Form ────────────────────────────────────────────── */}
      <SettingsForm
        userId={user.id}
        displayName={displayName}
        email={user.email ?? ""}
      />
    </div>
  );
}
