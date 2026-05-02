"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icon";

const items = [
  { href: "/", label: "Today", icon: "calendar_today" },
  { href: "/achievements", label: "Badges", icon: "military_tech" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/habits");
  return pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname() ?? "/";
  if (pathname === "/login" || pathname.startsWith("/auth")) return null;
  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "nav-item-active" : "nav-item"}
            aria-current={active ? "page" : undefined}
          >
            <Icon name={item.icon} filled={active} className="mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
