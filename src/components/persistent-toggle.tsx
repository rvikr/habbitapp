"use client";

import { useEffect, useState } from "react";

const PREFIX = "habbit:pref:";

export function PersistentToggle({
  storageKey,
  defaultChecked = false,
  ariaLabel,
}: {
  storageKey: string;
  defaultChecked?: boolean;
  ariaLabel: string;
}) {
  const [checked, setChecked] = useState(defaultChecked);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(PREFIX + storageKey);
    if (stored !== null) setChecked(stored === "1");
    setHydrated(true);
  }, [storageKey]);

  function onClick() {
    setChecked((prev) => {
      const next = !prev;
      window.localStorage.setItem(PREFIX + storageKey, next ? "1" : "0");
      if (storageKey === "haptic" && next && "vibrate" in navigator) {
        navigator.vibrate(20);
      }
      return next;
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onClick}
      className="squishy-toggle"
      data-checked={checked}
      data-hydrated={hydrated}
    >
      <span className="dot" />
    </button>
  );
}
