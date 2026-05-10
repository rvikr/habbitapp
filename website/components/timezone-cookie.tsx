"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TimezoneCookie() {
  const router = useRouter();

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timeZone) return;
    const encoded = encodeURIComponent(timeZone);
    const current = document.cookie
      .split("; ")
      .find((row) => row.startsWith("lagan_tz="))
      ?.split("=")[1];
    if (current === encoded) return;

    document.cookie = `lagan_tz=${encoded}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  }, [router]);

  return null;
}
