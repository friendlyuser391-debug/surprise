"use client";

import { useMemo, useRef, useState } from "react";
import { CalendarHeart, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { sound } from "@/lib/sound";
import { compressImage, uid, useSpecialDays, type SpecialDay } from "@/lib/store";
import { MagneticButton, TiltCard } from "../motion";

const emptyDraft = {
  name: "",
  date: new Date().toISOString().slice(0, 10),
  description: "",
  reminderDays: 1,
  annual: true,
};

/** Days until (positive) or since (negative) the next occurrence. */
function daysUntil(dateStr: string, annual: boolean): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [, m, d] = dateStr.split("-").map(Number);
  let next = new Date(today.getFullYear(), (m ?? 1) - 1, d ?? 1);
  if (annual && next < today) next = new Date(today.getFullYear() + 1, (m ?? 1) - 1, d ?? 1);
  if (!annual) {
    const full = new Date(dateStr);
    next = full;
  }
  return Math.round((next.getTime() - today.getTime()) / 86400000);
}

export default function SpecialDaysScene() {
  const days = useSpecialDays((s) => s.days);
  const addDay = useSpecialDays((s) => s.add);
  const updateDay = useSpecialDays((s) => s.update);
  const removeDay = useSpecialDays((s) => s.remove);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<SpecialDay | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [draftPhoto, setDraftPhoto] = useState<string | undefined>(undefined);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const enriched = useMemo(
    () =>
      [...days]
        .map((d) => ({ ...d, until: daysUntil(d.date, d.annual) }))
        .sort((a, b) => a.until - b.until),
    [days]
  );
  const upcoming = enriched.filter((d) => d.until >= 0);
  const past = enriched.filter((d) => d.until < 0).reverse();

  const save = () => {
    if (!draft.name.trim()) return;
    const payload = {
      name: draft.name,
      date: draft.date,
      description: draft.description,
      photo: draftPhoto,
      reminderDays: Number(draft.reminderDays) || 0,
      annual: draft.annual,
    };
    if (editing) updateDay(editing.id, payload);
    else addDay({ id: uid(), ...payload });
    sound.chime(840);
    setAdding(false);
    setEditing(null);
    setDraft(emptyDraft);
    setDraftPhoto(undefined);
  };

  const Card = ({ d }: { d: (typeof enriched)[number] }) => {
    const abs = Math.abs(d.until);
    const label =
      d.until === 0 ? "Today!" : d.until > 0 ? `in ${abs} day${abs > 1 ? "s" : ""}` : `${abs} day${abs > 1 ? "s" : ""} ago`;
    return (
      <TiltCard max={7} className="ornate-card calendar-card relative p-5">
        <div className="tear-edge" aria-hidden="true" />
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="wax-stamp" aria-hidden="true">
              {d.date.slice(5).replace("-", "/")}
            </span>
            <div>
              <h2 className="font-display text-xl text-[color:var(--champagne)]">{d.name}</h2>
              <time className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--brass)]">
                {d.date} · {d.annual ? "every year" : "one-time"}
              </time>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => {
                setEditing(d);
                setDraft({ name: d.name, date: d.date, description: d.description, reminderDays: d.reminderDays, annual: d.annual });
                setDraftPhoto(d.photo);
                setAdding(true);
              }}
              aria-label={`Edit ${d.name}`}
              className="grid h-8 w-8 place-items-center rounded-full text-white/50"
            >
              <Pencil size={13} aria-hidden="true" />
            </button>
            <button onClick={() => setConfirmId(d.id)} aria-label={`Delete ${d.name}`} className="grid h-8 w-8 place-items-center rounded-full text-white/50">
              <Trash2 size={13} aria-hidden="true" />
            </button>
          </div>
        </div>
        {d.photo && (
           
          <img src={d.photo} alt="" className="mt-3 h-28 w-full rounded-lg border border-[color:var(--brass)]/30 object-cover" />
        )}
        {d.description && <p className="mt-2 text-sm text-[color:var(--text-soft)]">{d.description}</p>}
        <p
          className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
            d.until === 0
              ? "bg-[rgba(255,46,147,.25)] text-[color:var(--champagne)]"
              : d.until > 0 && d.until <= d.reminderDays
                ? "bg-[rgba(244,223,180,.18)] text-[color:var(--champagne)]"
                : "bg-white/5 text-[color:var(--text-soft)]"
          }`}
          role="status"
        >
          {d.until > 0 && d.until <= d.reminderDays ? "🔔 " : ""}{label}
        </p>
      </TiltCard>
    );
  };

  return (
    <section
      className="relative z-10 mx-auto min-h-dvh w-full max-w-4xl px-4 py-16 pb-32 lg:pb-24"
      aria-labelledby="spd-title"
    >
      <h1 id="spd-title" className="font-display neon-text mt-4 flex flex-wrap items-center justify-center gap-3 text-center text-4xl font-semibold sm:text-5xl">
        <CalendarHeart size={30} aria-hidden="true" className="text-[color:var(--rose)]" />
        Special Days
      </h1>
      <p className="mt-2 text-center text-sm text-[color:var(--text-soft)]">
        A wall calendar of moments — stamped in wax, never forgotten.
      </p>

      <div className="mt-6 text-center">
        <MagneticButton
          onClick={() => {
            setEditing(null);
            setDraft(emptyDraft);
            setDraftPhoto(undefined);
            setAdding(true);
          }}
          className="btn-museum !min-h-0 !py-2 text-sm"
        >
          <span className="flex items-center gap-1.5">
            <Plus size={15} aria-hidden="true" /> Add a date
          </span>
        </MagneticButton>
      </div>

      {enriched.length === 0 ? (
        <div className="mt-16 text-center" role="status">
          <p className="font-script text-3xl text-[color:var(--champagne)]">The wall is bare</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[color:var(--text-soft)]">
            Add the dates that matter — firsts, favourites, and every reason to celebrate.
          </p>
        </div>
      ) : (
        <>
          <h2 className="mt-10 text-xs uppercase tracking-[0.3em] text-[color:var(--brass)]">Upcoming</h2>
          <ul className="mt-4 grid gap-6 sm:grid-cols-2">
            {upcoming.map((d) => (
              <li key={d.id}><Card d={d} /></li>
            ))}
          </ul>
          {past.length > 0 && (
            <>
              <h2 className="mt-10 text-xs uppercase tracking-[0.3em] text-[color:var(--brass)]">Past</h2>
              <ul className="mt-4 grid gap-6 sm:grid-cols-2">
                {past.map((d) => (
                  <li key={d.id}><Card d={d} /></li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {adding && (
        <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={editing ? "Edit date" : "Add date"}>
          <div className="ornate-card relative w-full max-w-md p-6">
            <button onClick={() => setAdding(false)} aria-label="Close" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-[color:var(--rose)]">
              <X size={16} aria-hidden="true" />
            </button>
            <h2 className="text-sm font-semibold text-[color:var(--champagne)]">
              {editing ? "Edit the date" : "Stamp a new date"}
            </h2>
            <div className="mt-4 grid gap-2">
              <label className="text-xs text-[color:var(--brass)]">
                Event name
                <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. The day we met" className="field" />
              </label>
              <label className="text-xs text-[color:var(--brass)]">
                Date
                <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="field" />
              </label>
              <label className="text-xs text-[color:var(--brass)]">
                Description
                <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} className="field" />
              </label>
              <label className="flex items-center gap-2 text-xs text-[color:var(--brass)]">
                <input type="checkbox" checked={draft.annual} onChange={(e) => setDraft({ ...draft, annual: e.target.checked })} className="accent-[color:var(--neon)]" />
                Repeats every year
              </label>
              <label className="text-xs text-[color:var(--brass)]">
                Remind me N days before
                <input type="number" min={0} max={60} value={draft.reminderDays} onChange={(e) => setDraft({ ...draft, reminderDays: Number(e.target.value) })} className="field" />
              </label>
              <div className="text-xs text-[color:var(--brass)]">
                Photo (optional)
                <div className="mt-1 flex items-center gap-2">
                  <input ref={photoRef} type="file" accept="image/*" className="hidden" aria-label="Upload photo"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) setDraftPhoto(await compressImage(f));
                    }} />
                  <button type="button" onClick={() => photoRef.current?.click()} className="btn-brass !min-h-0 !py-2 text-xs">
                    <Upload size={12} aria-hidden="true" /> {draftPhoto ? "Replace" : "Upload"}
                  </button>
                  {draftPhoto && (
                     
                    <img src={draftPhoto} alt="Preview" className="h-14 w-14 rounded-lg border border-[color:var(--brass)]/40 object-cover" />
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <MagneticButton onClick={save} className="btn-museum !min-h-0 !py-2 text-sm">
                {editing ? "Save changes" : "Stamp it"}
              </MagneticButton>
              <button onClick={() => setAdding(false)} className="btn-brass !min-h-0 !py-2 text-xs">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {confirmId && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-label="Confirm delete">
          <div className="ornate-card w-full max-w-sm p-5 text-center">
            <p className="text-sm">Tear this page off the calendar? This cannot be undone.</p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => { removeDay(confirmId); setConfirmId(null); sound.pop(); }}
                className="btn-museum !min-h-0 !py-2 text-sm !bg-gradient-to-br !from-[#ff5c8a] !to-[#a3125f]"
              >
                Yes, remove
              </button>
              <button onClick={() => setConfirmId(null)} className="btn-brass !min-h-0 !py-2 text-xs">Keep it</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
