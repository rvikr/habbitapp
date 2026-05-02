import Link from "next/link";
import { TopAppBar } from "@/components/top-app-bar";
import { Icon } from "@/components/icon";
import { PersistentToggle } from "@/components/persistent-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { NotificationPermissionCard } from "@/components/notification-permission-card";
import { createClient } from "@/lib/supabase/server";
import { avatarFromUser } from "@/lib/avatar";
import type { Habit } from "@/types/db";

export const dynamic = "force-dynamic";

const accountRows = [
  {
    icon: "person",
    title: "Personal Information",
    description: "Avatar, name, email",
    href: "/settings/profile",
  },
  {
    icon: "shield",
    title: "Security",
    description: "Password and authentication",
    href: "/settings/security",
  },
];


export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? "";
  const avatarSrc = user ? avatarFromUser(user) : undefined;

  const { data: habitRows } = await supabase
    .from("habits")
    .select(
      "id, name, icon, color, reminder_times, reminder_days, reminders_enabled",
    )
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  const habits = (habitRows ?? []) as Pick<
    Habit,
    | "id"
    | "name"
    | "icon"
    | "color"
    | "reminder_times"
    | "reminder_days"
    | "reminders_enabled"
  >[];

  return (
    <>
      <TopAppBar
        title="Settings"
        trailing={
          <Link
            href="/habits/new"
            className="text-primary hover:opacity-80 active:scale-95 transition"
            aria-label="Add habit"
          >
            <Icon name="add_circle" />
          </Link>
        }
      />

      <main className="max-w-2xl mx-auto px-margin-mobile py-lg space-y-xxl">
        <section className="space-y-md">
          <h2 className="text-headline-md text-on-surface-variant flex items-center gap-sm px-sm">
            <Icon name="account_circle" className="text-primary" />
            Account
          </h2>
          <div className="bg-white rounded-xl p-md shadow-soft-purple-md space-y-lg">
            <div className="flex items-center gap-md pb-md border-b border-outline-variant/30">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 flex-shrink-0">
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover bg-primary-fixed" />
                ) : (
                  <div className="w-full h-full bg-primary-fixed flex items-center justify-center text-primary font-bold">
                    {email[0]?.toUpperCase() ?? "U"}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-label-lg truncate">{email}</p>
                <p className="text-label-sm text-outline">Signed in</p>
              </div>
            </div>
            {accountRows.map((row, i) => (
              <div key={row.title}>
                <Link
                  href={row.href}
                  className="flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-md">
                    <div className="p-sm bg-primary/10 rounded-lg text-primary">
                      <Icon name={row.icon} />
                    </div>
                    <div>
                      <p className="text-label-lg">{row.title}</p>
                      <p className="text-label-sm text-outline">
                        {row.description}
                      </p>
                    </div>
                  </div>
                  <Icon
                    name="chevron_right"
                    className="text-outline group-hover:translate-x-1 transition-transform"
                  />
                </Link>
                {i < accountRows.length - 1 ? (
                  <div className="h-px bg-outline-variant/30 mt-lg" />
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-md">
          <h2 className="text-headline-md text-on-surface-variant flex items-center gap-sm px-sm">
            <Icon name="notifications_active" className="text-primary" />
            Reminders
          </h2>
          <NotificationPermissionCard />
          <Link
            href="/settings/reminders"
            className="bg-white rounded-xl p-md shadow-soft-purple-md flex items-center justify-between gap-md group"
          >
            <div className="flex items-center gap-md">
              <div className="p-sm bg-primary/10 rounded-lg text-primary">
                <Icon name="schedule" />
              </div>
              <div>
                <p className="text-label-lg">Manage Reminders</p>
                <p className="text-label-sm text-outline">
                  {habits.length === 0
                    ? "No habits yet"
                    : (() => {
                        const active = habits.filter(
                          (h) =>
                            h.reminders_enabled &&
                            h.reminder_times &&
                            h.reminder_times.length > 0,
                        ).length;
                        return active === 0
                          ? `${habits.length} habit${habits.length !== 1 ? "s" : ""} · none active`
                          : `${active} of ${habits.length} habit${habits.length !== 1 ? "s" : ""} active`;
                      })()}
                </p>
              </div>
            </div>
            <Icon
              name="chevron_right"
              className="text-outline group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </section>

        <section className="space-y-md">
          <h2 className="text-headline-md text-on-surface-variant flex items-center gap-sm px-sm">
            <Icon name="tune" className="text-primary" />
            App Preferences
          </h2>
          <div className="bg-white rounded-xl p-md shadow-soft-purple-md space-y-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-md">
                <Icon name="dark_mode" className="text-outline" />
                <p className="text-label-lg">Dark Mode</p>
              </div>
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-md">
                <Icon name="vibration" className="text-outline" />
                <p className="text-label-lg">Haptic Feedback</p>
              </div>
              <PersistentToggle
                storageKey="haptic"
                defaultChecked
                ariaLabel="Haptic feedback"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-md">
                <Icon name="auto_awesome" className="text-outline" />
                <p className="text-label-lg">Daily quote on dashboard</p>
              </div>
              <PersistentToggle
                storageKey="quotes"
                defaultChecked
                ariaLabel="Show daily quote"
              />
            </div>
          </div>
        </section>

        <section className="pt-xl">
          <LogoutButton />
          <p className="text-center text-outline text-label-sm mt-md">
            Version 0.1.0 (Build 1)
          </p>
        </section>
      </main>
    </>
  );
}
