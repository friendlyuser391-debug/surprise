"use client";

import { useMemo, useRef, useState } from "react";
import { Download, Heart, Pencil, Plus, Printer, Search, Trash2, Upload, X } from "lucide-react";
import { love } from "@/lib/love-config";
import { sound } from "@/lib/sound";
import { compressImage, exportAllData, uid, useJournal, type JournalEntry } from "@/lib/store";
import { MagneticButton, TiltCard } from "../motion";

const emptyDraft = {
  date: new Date().toISOString().slice(0, 10),
  time: "",
  title: "",
  summary: "",
  notes: "",
  tags: "",
};

export default function JournalScene() {
  const entries = useJournal((s) => s.entries);
  const addEntry = useJournal((s) => s.add);
  const updateEntry = useJournal((s) => s.update);
  const removeEntry = useJournal((s) => s.remove);

  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [draftPhoto, setDraftPhoto] = useState<string | undefined>(undefined);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(() => {
    let list = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          e.notes.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (dateFilter) list = list.filter((e) => e.date.startsWith(dateFilter));
    if (favOnly) list = list.filter((e) => e.fav);
    return list;
  }, [entries, query, dateFilter, favOnly]);

  const save = () => {
    if (!draft.title.trim()) return;
    const payload = {
      date: draft.date,
      time: draft.time || undefined,
      title: draft.title,
      summary: draft.summary,
      notes: draft.notes,
      photo: draftPhoto,
      tags: draft.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    if (editing) {
      updateEntry(editing.id, payload);
    } else {
      addEntry({ id: uid(), fav: false, createdAt: Date.now(), ...payload });
    }
    sound.chime(840);
    setAdding(false);
    setEditing(null);
    setDraft(emptyDraft);
    setDraftPhoto(undefined);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "conversation-journal.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      className="relative z-10 mx-auto min-h-dvh w-full max-w-4xl px-4 py-16 pb-32 lg:pb-24"
      aria-labelledby="jou-title"
    >
      <h1 id="jou-title" className="font-display neon-text mt-4 text-center text-4xl font-semibold sm:text-5xl">
        Conversation Memory Journal
      </h1>
      <p className="mt-2 text-center text-sm text-[color:var(--text-soft)]">
        Folded notes, ticket stubs and little cassettes of the words that mattered.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--brass)]" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations…"
            aria-label="Search journal"
            className="h-10 w-48 rounded-full border border-[color:var(--input)] bg-[rgba(18,6,26,.8)] pl-9 pr-3 text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--brass)]/50 focus:border-[color:var(--rose)] focus:outline-none"
          />
        </div>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          aria-label="Filter by date"
          className="h-10 rounded-full border border-[color:var(--input)] bg-[rgba(18,6,26,.8)] px-3 text-sm text-[color:var(--text-primary)] focus:border-[color:var(--rose)] focus:outline-none"
        />
        <button onClick={() => setFavOnly((f) => !f)} aria-pressed={favOnly} className={`btn-brass !min-h-0 !py-2 text-xs ${favOnly ? "!border-[color:var(--neon)] !text-[color:var(--rose)]" : ""}`}>
          <Heart size={13} aria-hidden="true" /> Favourites
        </button>
        <button onClick={exportJson} className="btn-brass !min-h-0 !py-2 text-xs">
          <Download size={13} aria-hidden="true" /> Export JSON
        </button>
        <button onClick={() => window.print()} className="btn-brass !min-h-0 !py-2 text-xs">
          <Printer size={13} aria-hidden="true" /> Print
        </button>
        <MagneticButton
          onClick={() => {
            setEditing(null);
            setDraft({ ...emptyDraft, title: love.journalExamples[Math.floor(Math.random() * love.journalExamples.length)] });
            setDraftPhoto(undefined);
            setAdding(true);
          }}
          className="btn-museum !min-h-0 !py-2 text-sm"
        >
          <span className="flex items-center gap-1.5">
            <Plus size={15} aria-hidden="true" /> New entry
          </span>
        </MagneticButton>
      </div>

      {/* folded note cards */}
      {visible.length === 0 ? (
        <div className="mt-16 text-center" role="status">
          <p className="font-script text-3xl text-[color:var(--champagne)]">No notes folded yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[color:var(--text-soft)]">
            Write down the conversations you never want to forget — in your own words.
            Nothing is imported from any chat app; only what you type is saved.
          </p>
        </div>
      ) : (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2">
          {visible.map((e, i) => (
            <li key={e.id}>
              <TiltCard
                max={8}
                className={`note-card relative p-5 ${i % 3 === 1 ? "ticket" : i % 3 === 2 ? "cassette" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <time className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--brass)]">
                    {e.date}{e.time ? ` · ${e.time}` : ""}
                  </time>
                  <div className="flex gap-1">
                    <button
                      onClick={() => updateEntry(e.id, { fav: !e.fav })}
                      aria-label={e.fav ? "Unfavourite" : "Favourite"}
                      aria-pressed={e.fav}
                      className={`grid h-8 w-8 place-items-center rounded-full ${e.fav ? "text-[color:var(--neon)]" : "text-white/50"}`}
                    >
                      <Heart size={14} fill={e.fav ? "currentColor" : "none"} aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => {
                        setEditing(e);
                        setDraft({ date: e.date, time: e.time ?? "", title: e.title, summary: e.summary, notes: e.notes, tags: e.tags.join(", ") });
                        setDraftPhoto(e.photo);
                        setAdding(true);
                      }}
                      aria-label={`Edit ${e.title}`}
                      className="grid h-8 w-8 place-items-center rounded-full text-white/50"
                    >
                      <Pencil size={13} aria-hidden="true" />
                    </button>
                    <button onClick={() => setConfirmId(e.id)} aria-label={`Delete ${e.title}`} className="grid h-8 w-8 place-items-center rounded-full text-white/50">
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <h2 className="font-display mt-1 text-xl text-[color:var(--champagne)]">{e.title}</h2>
                {e.photo && (
                   
                  <img src={e.photo} alt="" className="mt-2 h-28 w-full rounded-lg border border-[color:var(--brass)]/30 object-cover" />
                )}
                {e.summary && <p className="mt-2 text-sm text-[color:var(--text-primary)]">{e.summary}</p>}
                {e.notes && <p className="mt-1 text-sm italic text-[color:var(--text-soft)]">{e.notes}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {e.tags.map((t) => <span key={t} className="chip">#{t}</span>)}
                </div>
              </TiltCard>
            </li>
          ))}
        </ul>
      )}

      {/* editor */}
      {adding && (
        <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={editing ? "Edit entry" : "New entry"}>
          <div className="ornate-card relative w-full max-w-lg p-6">
            <button onClick={() => setAdding(false)} aria-label="Close" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-[color:var(--rose)]">
              <X size={16} aria-hidden="true" />
            </button>
            <h2 className="text-sm font-semibold text-[color:var(--champagne)]">
              {editing ? "Edit the note" : "Fold a new note"}
            </h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <label className="text-xs text-[color:var(--brass)]">
                Date
                <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="field" />
              </label>
              <label className="text-xs text-[color:var(--brass)]">
                Time (optional)
                <input type="time" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} className="field" />
              </label>
              <label className="text-xs text-[color:var(--brass)] sm:col-span-2">
                Title
                <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="field" />
              </label>
              <label className="text-xs text-[color:var(--brass)] sm:col-span-2">
                Conversation summary
                <textarea value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} rows={3} className="field" />
              </label>
              <label className="text-xs text-[color:var(--brass)] sm:col-span-2">
                Personal notes
                <textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} rows={2} className="field" />
              </label>
              <label className="text-xs text-[color:var(--brass)] sm:col-span-2">
                Tags (comma separated)
                <input value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} className="field" />
              </label>
              <div className="text-xs text-[color:var(--brass)] sm:col-span-2">
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
                {editing ? "Save changes" : "Fold & save"}
              </MagneticButton>
              <button onClick={() => setAdding(false)} className="btn-brass !min-h-0 !py-2 text-xs">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {confirmId && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-label="Confirm delete">
          <div className="ornate-card w-full max-w-sm p-5 text-center">
            <p className="text-sm">Unfold this memory and let it go? This cannot be undone.</p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => { removeEntry(confirmId); setConfirmId(null); sound.pop(); }}
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
