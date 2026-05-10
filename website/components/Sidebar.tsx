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
    <aside className="w-60 min-h-screen bg-white/90 backdrop-blur-xl border-r border-outline-variant/30 flex flex-col fixed top-0 left-0 shadow-sidebar">
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
  );
}
