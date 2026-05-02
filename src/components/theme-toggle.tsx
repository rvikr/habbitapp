"use client";

import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const checked = theme === "dark";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Toggle dark mode"
      onClick={toggle}
      className="squishy-toggle"
      data-checked={checked}
    >
      <span className="dot" />
    </button>
  );
}
