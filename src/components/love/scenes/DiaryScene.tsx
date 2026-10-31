"use client";

import { useMemo, useRef, useState } from "react";
import { Bold, Heart, Italic, Plus, Printer, Search, Trash2, Underline, X, Download } from "lucide-react";
import { love } from "@/lib/love-config";
import { sound } from "@/lib/sound";
import { exportAllData, uid, useDiary } from "@/lib/store";
import { useIsReducedMotion } from "../Ambient";
import { MagneticButton } from "../motion";

export default function DiaryScene() {
  const entries = useDiary((s) => s.entries);
  const addEntry = useDiary((s) => s.add);
  const updateEntry = useDiary((s) => s.update);
  const removeEntry = useDiary((s) => s.remove);
  const draft = useDiary((s) => s.draft);
  const setDraft = useDiary((s) => s.setDraft);
  const reduced = useIsReducedMotion();

  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [turning, setTurning] = useState<"next" | "prev" | null>(null);
  const [page, setPage] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visible = useMemo(() => {
    let list = [...entries].sort((a, b) => b.datetime.localeCompare(a.datetime));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q)) ||
          e.html.toLowerCase().includes(q)
      );
    }
    if (dateFilter) list = list.filter((e) => e.datetime.startsWith(dateFilter));
    if (favOnly) list = list.filter((e) => e.fav);
    return list;
  }, [entries, query, dateFilter, favOnly]);

  const PER_PAGE = 3;
  const pages = Math.max(1, Math.ceil(visible.length / PER_PAGE));
  // clamp during render so a shrinking filter never leaves an out-of-range page
  // (avoids the set-state-in-effect cascade)
  const safePage = page > pages - 1 ? 0 : page;
  const pageItems = visible.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);

  // draft autosave (debounced)
  const queueDraftSave = (html: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setDraft({ title, html });
    }, 700);
  };

  const openEditor = (id?: string) => {
    if (id) {
      const e = entries.find((x) => x.id === id);
      if (!e) return;
      setEditId(id);
      setTitle(e.title);
      setTags(e.tags.join(", "));
      setEditorOpen(true);
      requestAnimationFrame(() => {
        if (editorRef.current) editorRef.current.innerHTML = e.html;
      });
    } else {
      setEditId(null);
      setTitle(draft?.title ?? "");
      setTags("");
      setEditorOpen(true);
      requestAnimationFrame(() => {
        if (editorRef.current) editorRef.current.innerHTML = draft?.html ?? "";
      });
    }
    sound.click();
  };

  const exec = (cmd: string) => {
    document.execCommand(cmd);
    editorRef.current?.focus();
  };

  const saveEntry = () => {
    const html = editorRef.current?.innerHTML ?? "";
    if (!title.trim() && !html.replace(/<[^>]*>/g, "").trim()) return;
    const datetime = new Date().toISOString();
    if (editId) {
      updateEntry(editId, { title: title.trim() || "Untitled page", html, tags: tags.split(",").map((t) => t.trim()).filter(Boolean), updatedAt: Date.now() });
    } else {
      addEntry({
        id: uid(),
        datetime,
        title: title.trim() || "Untitled page",
        html,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        fav: false,
        updatedAt: Date.now(),
      });
      setDraft(null);
    }
    sound.chime(860);
    setEditorOpen(false);
    setEditId(null);
    setTitle("");
    setTags("");
  };

  const turn = (dir: "next" | "prev") => {
    const cur = safePage;
    if (reduced) {
      setPage(Math.min(pages - 1, Math.max(0, cur + (dir === "next" ? 1 : -1))));
      return;
    }
    setTurning(dir);
    sound.click();
    setTimeout(() => {
      setPage(Math.min(pages - 1, Math.max(0, cur + (dir === "next" ? 1 : -1))));
      setTurning(null);
    }, 450);
  };

  return (
    <section
      className="relative z-10 mx-auto min-h-dvh w-full max-w-3xl px-4 py-16 pb-32 lg:pb-24"
      aria-labelledby="dia-title"
    >
      <h1 id="dia-title" className="font-display neon-text mt-4 text-center text-4xl font-semibold sm:text-5xl">
        The Private Diary
      </h1>
      <p className="mt-2 text-center text-sm text-[color:var(--text-soft)]">
        Leather-bound, ribbon-marked, and for your eyes only.
      </p>
      <p className="mt-1 text-center font-script text-xl text-[color:var(--champagne)]">
        “{love.diaryPrompt}”
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--brass)]" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages…"
            aria-label="Search diary"
            className="h-10 w-44 rounded-full border border-[color:var(--input)] bg-[rgba(18,6,26,.8)] pl-9 pr-3 text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--brass)]/50 focus:border-[color:var(--rose)] focus:outline-none"
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
        <button onClick={() => window.print()} className="btn-brass !min-h-0 !py-2 text-xs">
          <Printer size={13} aria-hidden="true" /> Print
        </button>
        <button onClick={exportAllData} className="btn-brass !min-h-0 !py-2 text-xs">
          <Download size={13} aria-hidden="true" /> Export
        </button>
        <MagneticButton onClick={() => openEditor()} className="btn-museum !min-h-0 !py-2 text-sm">
          <span className="flex items-center gap-1.5">
            <Plus size={15} aria-hidden="true" /> New page
          </span>
        </MagneticButton>
      </div>

      {draft && !editorOpen && (
        <p className="mt-3 text-center text-xs text-[color:var(--brass)]" role="status">
          Draft autosaved — “{draft.title || "Untitled"}” is waiting for you.
        </p>
      )}

      {/* the leather book */}
      <div className={`book mt-10 ${turning ? `turn-${turning}` : ""}`}>
        <div className="book-spine" aria-hidden="true" />
        <div className="ribbon" aria-hidden="true" />
        <div className="book-pages">
          {pageItems.length === 0 ? (
            <div className="grid h-full place-items-center p-8 text-center">
              <div>
                <p className="font-script text-3xl text-[#7a1740]">Empty pages, waiting…</p>
                <p className="mt-1 text-sm text-[#6b4a5a]">
                  Nothing is pre-written here — your words make the diary.
                </p>
              </div>
            </div>
          ) : (
            pageItems.map((e) => (
              <article key={e.id} className="diary-entry lined-paper texture-paper relative mb-5 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-display text-xl text-[#3c2436]">{e.title}</h2>
                    <time className="text-[10px] uppercase tracking-[0.2em] text-[#9e1b32]">
                      {new Date(e.datetime).toLocaleString()}
                    </time>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => updateEntry(e.id, { fav: !e.fav })}
                      aria-label={e.fav ? "Unfavourite" : "Favourite"}
                      aria-pressed={e.fav}
                      className={`grid h-8 w-8 place-items-center rounded-full ${e.fav ? "text-[#9e1b32]" : "text-[#6b4a5a]/60"}`}
                    >
                      <Heart size={14} fill={e.fav ? "currentColor" : "none"} aria-hidden="true" />
                    </button>
                    <button onClick={() => openEditor(e.id)} aria-label={`Edit ${e.title}`} className="grid h-8 w-8 place-items-center rounded-full text-[#6b4a5a]/70">
                      ✎
                    </button>
                    <button
                      onClick={() => { removeEntry(e.id); sound.pop(); }}
                      aria-label={`Delete ${e.title}`}
                      className="grid h-8 w-8 place-items-center rounded-full text-[#6b4a5a]/70"
                    >
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="diary-html mt-2 text-[15px] leading-relaxed text-[#3c2436]" dangerouslySetInnerHTML={{ __html: e.html }} />
                {e.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {e.tags.map((t) => <span key={t} className="chip !border-[#9e1b32]/30 !text-[#9e1b32]">#{t}</span>)}
                  </div>
                )}
              </article>
            ))
          )}
        </div>
        <div className="book-nav">
          <button onClick={() => turn("prev")} disabled={safePage === 0} aria-label="Previous page" className="ctrl-btn">
            ←
          </button>
          <span className="text-xs text-[#6b4a5a]">
            {safePage + 1} / {pages}
          </span>
          <button onClick={() => turn("next")} disabled={safePage >= pages - 1} aria-label="Next page" className="ctrl-btn">
            →
          </button>
        </div>
      </div>

      {/* editor */}
      {editorOpen && (
        <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Diary editor">
          <div className="w-full max-w-xl">
            <div className="lined-paper texture-paper relative p-6">
              <button onClick={() => setEditorOpen(false)} aria-label="Close editor" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-[#6b4a5a]">
                <X size={16} aria-hidden="true" />
              </button>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Page title…"
                aria-label="Page title"
                className="font-display w-full bg-transparent text-2xl text-[#3c2436] placeholder:text-[#6b4a5a]/50 focus:outline-none"
              />
              <div className="mt-2 flex gap-1" role="toolbar" aria-label="Formatting">
                <button type="button" onClick={() => exec("bold")} aria-label="Bold" className="fmt-btn"><Bold size={13} aria-hidden="true" /></button>
                <button type="button" onClick={() => exec("italic")} aria-label="Italic" className="fmt-btn"><Italic size={13} aria-hidden="true" /></button>
                <button type="button" onClick={() => exec("underline")} aria-label="Underline" className="fmt-btn"><Underline size={13} aria-hidden="true" /></button>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="tags, comma, separated"
                  aria-label="Tags"
                  className="ml-auto h-8 w-44 rounded-full border border-[#9e1b32]/30 bg-white/60 px-3 text-xs text-[#3c2436] focus:outline-none"
                />
              </div>
              <div
                ref={editorRef}
                contentEditable
                role="textbox"
                aria-multiline="true"
                aria-label="Diary page body"
                suppressContentEditableWarning
                onInput={(e) => queueDraftSave(e.currentTarget.innerHTML)}
                className="diary-html mt-3 min-h-56 text-[15px] leading-[28px] text-[#3c2436] focus:outline-none"
              />
              <div className="mt-4 flex gap-2">
                <MagneticButton onClick={saveEntry} className="btn-museum !min-h-0 !py-2 text-sm">
                  {editId ? "Save page" : "Add to the diary"}
                </MagneticButton>
                <button onClick={() => setEditorOpen(false)} className="btn-brass !min-h-0 !py-2 text-xs">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
