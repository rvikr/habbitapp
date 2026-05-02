"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Icon } from "./icon";

const CONFETTI_COLORS = [
  "#5D3FD3",
  "#48CFCB",
  "#FF8A5B",
  "#FACC15",
  "#cabeff",
];

type CelebrationContextValue = {
  celebrate: (message?: string) => void;
};

const CelebrationContext = createContext<CelebrationContextValue | null>(null);

const MESSAGES = [
  "Great job!",
  "Streak strengthened!",
  "Tiny win, big impact.",
  "Beautiful consistency.",
  "Showing up is everything.",
  "Future-you says thanks.",
];

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<{ id: number; message: string } | null>(
    null,
  );

  const celebrate = useCallback((message?: string) => {
    const text = message ?? MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    setActive({ id: Date.now(), message: text });
    if ("vibrate" in navigator) navigator.vibrate([10, 30, 20]);
  }, []);

  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => setActive(null), 1700);
    return () => window.clearTimeout(t);
  }, [active]);

  return (
    <CelebrationContext.Provider value={{ celebrate }}>
      {children}
      {active ? <Burst key={active.id} message={active.message} /> : null}
    </CelebrationContext.Provider>
  );
}

export function useCelebrate() {
  const ctx = useContext(CelebrationContext);
  if (!ctx) {
    return { celebrate: () => {} };
  }
  return ctx;
}

function Burst({ message }: { message: string }) {
  const pieces = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * Math.PI * 2;
    const dist = 140 + Math.random() * 120;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const delay = Math.random() * 80;
    return { tx, ty, color, delay, id: i };
  });

  return (
    <div className="celebrate-overlay" aria-live="polite">
      <div className="relative">
        {pieces.map((p) => (
          <span
            key={p.id}
            className="celebrate-burst"
            style={{
              background: p.color,
              ["--tx" as string]: `${p.tx}px`,
              ["--ty" as string]: `${p.ty}px`,
              animationDelay: `${p.delay}ms`,
              left: "50%",
              top: "50%",
            }}
          />
        ))}
        <div className="celebrate-card">
          <div className="w-14 h-14 mx-auto rounded-full bg-secondary text-white flex items-center justify-center shadow-soft-purple-lg">
            <Icon name="check" filled className="text-3xl" />
          </div>
          <p className="text-headline-md text-on-background mt-md">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
