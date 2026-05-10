"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/dashboard",     icon: "calendar_today", label: "Today"         },
  { href: "/achievements",  icon: "military_tech",  label: "Achievements"  },
  { href: "/leaderboard",   icon: "leaderboard",    label: "Leaderboard"   },
  { href: "/settings",      icon: "settings",       label: "Settings"      },
];

export default function Sidebar({
  displayName,
  email,
  isAdmin = false,
}: {
  displayName: string;
  email: string | null;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initial = displayName?.[0]?.toUpperCase() ?? "?";

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-outline-variant/30 bg-white/95 px-4 backdrop-blur-xl lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="material-symbols-outlined text-[18px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
          </div>
          <span className="font-extrabold text-on-background">
            Lagan <span className="text-primary">लगन</span>
          </span>
        </Link>
        <button
          onClick={signOut}
          className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant"
          aria-label="Sign out"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
        </button>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-outline-variant/30 bg-white/95 px-2 py-1.5 backdrop-blur-xl lg:hidden">
        {NAV.map(({ href, icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-bold ${
                active ? "bg-primary/10 text-primary" : "text-on-surface-variant"
              }`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {icon}
              </span>
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      <aside className="fixed left-0 top-0 hidden min-h-screen w-60 flex-col border-r border-outline-variant/30 bg-white/90 shadow-sidebar backdrop-blur-xl lg:flex">
      {/* Logo */}
      <div className="px-6 pt-6 pb-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_4px_12px_rgba(69,30,187,0.3)]">
            <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
          </div>
          <span className="font-extrabold text-lg text-on-background">
            Lagan <span className="text-primary">लगन</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1 pt-2">
        {NAV.map(({ href, icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                active
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-on-surface-variant hover:text-primary hover:bg-primary/6"
              }`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {icon}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Admin link */}
      {isAdmin && (
        <div className="px-3 pt-2 pb-1">
          <div className="h-px bg-outline-variant/20 mb-2" />
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-on-surface-variant hover:text-primary hover:bg-primary/6 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              admin_panel_settings
            </span>
            Admin Panel
          </Link>
        </div>
      )}

      {/* Profile + sign out */}
      <div className="p-4 border-t border-outline-variant/30 space-y-1">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
          <div className="w-9 h-9 rounded-full bg-primary-fixed/80 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-on-background truncate">{displayName}</p>
            {email && <p className="text-xs text-on-surface-variant truncate">{email}</p>}
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-on-surface-variant hover:text-error hover:bg-error-container/30 font-semibold text-sm transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Sign out
        </button>
      </div>
      </aside>
    </>
  );
}
