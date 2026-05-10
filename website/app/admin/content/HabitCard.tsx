"use client";

import { useState, useTransition } from "react";
import { toggleSuggestedHabit, deleteSuggestedHabit, updateSuggestedHabit, createSuggestedHabit } from "./actions";

interface SuggestedHabit {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  enabled: boolean;
  sort_order: number;
}

export function HabitCard({ habit }: { habit: SuggestedHabit }) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [enabled, setEnabled] = useState(habit.enabled);
  const [deleted, setDeleted] = useState(false);
  const [deletePhase, setDeletePhase] = useState<"idle" | "confirm">("idle");
  const [err, setErr] = useState("");

  if (deleted) return null;

  function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    startTransition(async () => {
      const res = await toggleSuggestedHabit(habit.id, next);
      if (!res.ok) { setEnabled(!next); setErr(res.error ?? "Failed"); }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteSuggestedHabit(habit.id);
      if (res.ok) setDeleted(true);
      else { setErr(res.error ?? "Failed"); setDeletePhase("idle"); }
    });
  }

  if (editing) {
    return <HabitEditForm habit={habit} onDone={() => setEditing(false)} />;
  }

  return (
    <div className="flex min-w-[680px] items-center gap-4 px-5 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
      {/* Sort */}
      <span className="text-xs font-bold text-slate-300 w-6 text-center flex-shrink-0">{habit.sort_order}</span>

      {/* Icon */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${enabled ? "bg-primary/10" : "bg-slate-100"}`}>
        <span
          className={`material-symbols-outlined text-[18px] ${enabled ? "text-primary" : "text-slate-400"}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {habit.icon}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${enabled ? "text-slate-800" : "text-slate-400"}`}>{habit.name}</p>
        {habit.description && (
          <p className="text-xs text-slate-400 truncate mt-0.5">{habit.description}</p>
        )}
      </div>

      {/* Status */}
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${enabled ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"}`}>
        {enabled ? "Active" : "Hidden"}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={handleToggle}
          disabled={isPending}
          title={enabled ? "Hide from catalog" : "Show in catalog"}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">
            {enabled ? "visibility_off" : "visibility"}
          </span>
        </button>
        <button
          onClick={() => setEditing(true)}
          title="Edit"
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">edit</span>
        </button>

        {deletePhase === "idle" ? (
          <button
            onClick={() => setDeletePhase("confirm")}
            title="Delete"
            className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-[11px] font-bold px-2 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              {isPending ? "…" : "Delete"}
            </button>
            <button
              onClick={() => setDeletePhase("idle")}
              className="text-[11px] font-bold px-2 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {err && <p className="text-xs text-red-500 mt-1 w-full">{err}</p>}
    </div>
  );
}

function HabitEditForm({ habit, onDone }: { habit: SuggestedHabit; onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateSuggestedHabit(habit.id, fd);
      if (res.ok) onDone();
      else setErr(res.error ?? "Failed");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="px-5 py-4 bg-primary/5 border-b border-slate-100">
      <div className="grid grid-cols-2 gap-3">
        <input
          name="name"
          defaultValue={habit.name}
          placeholder="Name"
          required
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-primary transition-all"
        />
        <input
          name="icon"
          defaultValue={habit.icon}
          placeholder="Material icon name (e.g. water_drop)"
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-primary transition-all"
        />
        <input
          name="description"
          defaultValue={habit.description ?? ""}
          placeholder="Short description"
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-primary transition-all col-span-2"
        />
        <input
          name="sort_order"
          type="number"
          defaultValue={habit.sort_order}
          placeholder="Sort order"
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-primary transition-all"
        />
        <div className="flex gap-2 items-center">
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="px-4 py-2 border border-slate-200 text-slate-500 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
      {err && <p className="text-xs text-red-500 mt-2">{err}</p>}
    </form>
  );
}

export function AddHabitForm() {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createSuggestedHabit(fd);
      if (res.ok) { setOpen(false); e.currentTarget?.reset(); setErr(""); }
      else setErr(res.error ?? "Failed");
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        Add Template
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-primary/5 rounded-2xl p-5 border border-primary/15 space-y-3">
      <h3 className="font-bold text-slate-800 text-sm">New Suggested Habit</h3>
      <div className="grid grid-cols-2 gap-3">
        <input name="name" placeholder="Name *" required className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-primary transition-all" />
        <input name="icon" placeholder="Material icon (e.g. water_drop)" className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-primary transition-all" />
        <input name="description" placeholder="Short description" className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-primary transition-all col-span-2" />
        <input name="sort_order" type="number" placeholder="Sort order (e.g. 11)" defaultValue="" className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-primary transition-all" />
        <div className="flex gap-2 items-center">
          <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
            {isPending ? "Adding…" : "Add"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-500 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
      {err && <p className="text-xs text-red-500">{err}</p>}
    </form>
  );
}
