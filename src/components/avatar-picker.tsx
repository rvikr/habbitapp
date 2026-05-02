"use client";

import { useState, useTransition } from "react";
import {
  AVATAR_SEED_PRESETS,
  AVATAR_STYLES,
  avatarUrl,
  type AvatarStyle,
} from "@/lib/avatar";
import { updateAvatar } from "@/app/actions";
import { Icon } from "./icon";

export function AvatarPicker({
  initialStyle,
  initialSeed,
}: {
  initialStyle: AvatarStyle;
  initialSeed: string;
}) {
  const [style, setStyle] = useState<AvatarStyle>(initialStyle);
  const [seed, setSeed] = useState<string>(initialSeed);
  const [customSeed, setCustomSeed] = useState<string>(initialSeed);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");

  function commit(nextStyle: AvatarStyle, nextSeed: string) {
    setSaved("saving");
    startTransition(async () => {
      await updateAvatar(nextStyle, nextSeed);
      setSaved("saved");
      window.setTimeout(() => setSaved("idle"), 1500);
    });
  }

  return (
    <div className="space-y-md">
      <div className="flex items-center gap-md">
        <img
          src={avatarUrl(style, seed)}
          alt="Selected avatar preview"
          className="w-20 h-20 rounded-full border-2 border-primary/30 bg-primary-fixed"
        />
        <div className="flex-1 min-w-0">
          <p className="text-headline-md truncate">{seed}</p>
          <p className="text-label-sm text-outline">Style: {style}</p>
        </div>
        <span
          className={`text-label-sm ${
            saved === "saved"
              ? "text-secondary"
              : saved === "saving"
                ? "text-outline"
                : "opacity-0"
          }`}
          aria-live="polite"
        >
          {saved === "saved" ? "Saved" : "Saving…"}
        </span>
      </div>

      <div className="space-y-xs">
        <label className="text-label-lg text-on-surface-variant">
          Style
        </label>
        <div className="flex gap-sm overflow-x-auto no-scrollbar pb-1">
          {AVATAR_STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={pending}
              onClick={() => {
                setStyle(s.id);
                commit(s.id, seed);
              }}
              className={`flex-shrink-0 flex flex-col items-center gap-2 p-2 rounded-2xl border transition-colors ${
                style === s.id
                  ? "border-primary bg-primary-fixed/30"
                  : "border-outline-variant/40"
              }`}
            >
              <img
                src={avatarUrl(s.id, seed)}
                alt={s.label}
                className="w-12 h-12 rounded-full"
              />
              <span className="text-label-sm">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-xs">
        <label className="text-label-lg text-on-surface-variant">
          Pick a seed
        </label>
        <div className="grid grid-cols-4 gap-sm">
          {AVATAR_SEED_PRESETS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              onClick={() => {
                setSeed(s);
                setCustomSeed(s);
                commit(style, s);
              }}
              className={`flex flex-col items-center gap-1 p-2 rounded-2xl border transition-colors ${
                seed === s
                  ? "border-primary bg-primary-fixed/30"
                  : "border-outline-variant/40"
              }`}
            >
              <img
                src={avatarUrl(style, s)}
                alt={s}
                className="w-12 h-12 rounded-full"
              />
              <span className="text-label-sm">{s}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-xs">
        <label className="text-label-lg text-on-surface-variant">
          Custom seed
        </label>
        <div className="flex gap-sm">
          <input
            type="text"
            value={customSeed}
            onChange={(e) => setCustomSeed(e.target.value)}
            placeholder="Anything — name, word, emoji"
            className="flex-1 bg-surface-container-low rounded-lg px-md py-3 text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="button"
            disabled={pending || !customSeed.trim()}
            onClick={() => {
              const next = customSeed.trim();
              setSeed(next);
              commit(style, next);
            }}
            className="px-md rounded-full bg-primary text-on-primary text-label-lg active:scale-95 transition-transform disabled:opacity-50"
          >
            <Icon name="check" />
          </button>
        </div>
      </div>
    </div>
  );
}
