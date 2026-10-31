"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download, Heart, Images, Pencil, Plus, Search, Shuffle, Star, Trash2, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import { love } from "@/lib/love-config";
import { sound } from "@/lib/sound";
import { compressImage, uid, usePhotos, type Photo } from "@/lib/store";
import { useIsReducedMotion } from "../Ambient";
import { MagneticButton, TiltCard } from "../motion";

function StringLights() {
  const bulbs = useMemo(
    () => Array.from({ length: 18 }, (_, i) => ({ left: `${(i / 17) * 100}%`, delay: `${(i % 6) * 0.55}s` })),
    []
  );
  return (
    <div className="string-lights" aria-hidden="true">
      {bulbs.map((b, i) => (
        <span key={i} className="bulb" style={{ left: b.left, animationDelay: b.delay }} />
      ))}
    </div>
  );
}

/**
 * 3D rotating photo cube — the gallery's signature exhibit.
 * Shows up to 6 photos on the cube's faces; empty faces show a soft
 * "add a memory" placeholder. Auto-rotates, pauses on hover, and the
 * rotation speed can be overridden. Falls back to a static front face
 * under reduced motion (handled in CSS).
 */
function PhotoCube({ photos, reduced }: { photos: Photo[]; reduced: boolean }) {
  const faces = ["front", "back", "right", "left", "top", "bottom"] as const;
  const picks = useMemo(() => {
    if (photos.length === 0) return [];
    // cycle through photos to fill up to 6 faces
    return Array.from({ length: 6 }, (_, i) => photos[i % photos.length]);
  }, [photos]);

  if (reduced) {
    // static front face only
    return (
      <div className="cube-scene" style={{ animation: "none" }} aria-label="Photo cube (motion reduced)">
        <div className="cube" style={{ animation: "none", transform: "rotateX(-18deg) rotateY(0deg)" }}>
          <div className="cube-face front">
            {picks[0] ? (
              <img src={picks[0].src} alt={picks[0].caption || "Memory"} />
            ) : (
              <div className="cube-empty">Add a memory</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cube-scene" aria-label="Rotating 3D photo cube — hover to pause">
      <div className="cube">
        {faces.map((face, i) => {
          const p = picks[i];
          return (
            <div key={face} className={`cube-face ${face}`}>
              {p ? (
                <img src={p.src} alt={p.caption || "Gallery memory"} loading="lazy" />
              ) : (
                <div className="cube-empty">pin a memory here</div>
              )}
            </div>
          );
        })}
      </div>
      <div className="cube-pedestal" />
    </div>
  );
}

const emptyDraft = {
  album: love.albums[0] as string,
  caption: "",
  date: new Date().toISOString().slice(0, 10),
  description: "",
  location: "",
};

export default function GalleryScene() {
  const photos = usePhotos((s) => s.photos);
  const addPhoto = usePhotos((s) => s.add);
  const updatePhoto = usePhotos((s) => s.update);
  const removePhoto = usePhotos((s) => s.remove);

  const [pending, setPending] = useState<{ src: string; name: string }[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [query, setQuery] = useState("");
  const [albumFilter, setAlbumFilter] = useState("all");
  const [favOnly, setFavOnly] = useState(false);
  const [sortDesc, setSortDesc] = useState(true);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [slideshow, setSlideshow] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const reduced = useIsReducedMotion();

  const albums = useMemo(() => {
    const custom = [...new Set(photos.map((p) => p.album))];
    return [...new Set([...love.albums, ...custom])];
  }, [photos]);

  const visible = useMemo(() => {
    let list = [...photos];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.caption.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.date.includes(q)
      );
    }
    if (albumFilter !== "all") list = list.filter((p) => p.album === albumFilter);
    if (favOnly) list = list.filter((p) => p.fav);
    list.sort((a, b) => (sortDesc ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)));
    return list;
  }, [photos, query, albumFilter, favOnly, sortDesc]);

  // slideshow
  useEffect(() => {
    if (lightbox === null || !slideshow || reduced) return;
    const t = setInterval(() => {
      setLightbox((i) => (i === null ? null : (i + 1) % visible.length));
    }, 3200);
    return () => clearInterval(t);
  }, [lightbox, slideshow, visible.length, reduced]);

  // lightbox keyboard navigation
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightbox(null);
        setSlideshow(false);
      }
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? null : (i + 1) % visible.length));
      if (e.key === "ArrowLeft")
        setLightbox((i) => (i === null ? null : (i - 1 + visible.length) % visible.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, visible.length]);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const results: { src: string; name: string }[] = [];
    for (const f of Array.from(files).slice(0, 8)) {
      if (!f.type.startsWith("image/")) continue;
      try {
        results.push({ src: await compressImage(f), name: f.name });
      } catch {
        setNotice("One file could not be read — skipped.");
      }
    }
    if (results.length) setPending(results);
  };

  const savePending = () => {
    pending.forEach((p) =>
      addPhoto({
        id: uid(),
        album: draft.album,
        caption: draft.caption || p.name.replace(/\.[^.]+$/, ""),
        date: draft.date,
        description: draft.description,
        location: draft.location,
        fav: false,
        src: p.src,
        createdAt: Date.now(),
      })
    );
    sound.chime(880);
    setPending([]);
    setDraft(emptyDraft);
    setNotice(`${pending.length} photo${pending.length > 1 ? "s" : ""} saved to the wall.`);
  };

  const download = (p: Photo) => {
    const a = document.createElement("a");
    a.href = p.src;
    a.download = `${p.caption || "memory"}.jpg`;
    a.click();
  };

  return (
    <section
      className="relative z-10 mx-auto min-h-dvh w-full max-w-5xl px-4 py-16 pb-32 lg:pb-24"
      aria-labelledby="gal-title"
    >
      <StringLights />
      <h1 id="gal-title" className="font-display neon-text mt-6 text-center text-4xl font-semibold sm:text-5xl">
        The Memory Wall
      </h1>
      <p className="mt-2 text-center text-sm text-[color:var(--text-soft)]">
        Pin your favourite moments — they are stored safely in this browser.
      </p>

      {/* 3D rotating photo cube — the gallery's signature exhibit */}
      <div className="mt-8 mb-2">
        <PhotoCube photos={visible.slice(0, 6)} reduced={reduced} />
        <p className="mt-3 text-center text-[10px] uppercase tracking-[0.3em] text-[color:var(--brass)]">
          Exhibit · Memories in the Round
        </p>
      </div>

      {/* controls */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <label className="sr-only" htmlFor="gal-search">Search photos</label>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--brass)]" aria-hidden="true" />
          <input
            id="gal-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search captions, places, dates…"
            className="h-10 w-56 rounded-full border border-[color:var(--input)] bg-[rgba(18,6,26,.8)] pl-9 pr-3 text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--brass)]/50 focus:border-[color:var(--rose)] focus:outline-none"
          />
        </div>
        <label className="sr-only" htmlFor="gal-album">Filter by album</label>
        <select
          id="gal-album"
          value={albumFilter}
          onChange={(e) => setAlbumFilter(e.target.value)}
          className="h-10 rounded-full border border-[color:var(--input)] bg-[rgba(18,6,26,.8)] px-3 text-sm text-[color:var(--text-primary)] focus:border-[color:var(--rose)] focus:outline-none"
        >
          <option value="all">All albums</option>
          {albums.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <button
          onClick={() => setFavOnly((f) => !f)}
          aria-pressed={favOnly}
          className={`btn-brass !min-h-0 !py-2 text-xs ${favOnly ? "!border-[color:var(--neon)] !text-[color:var(--rose)]" : ""}`}
        >
          <Star size={13} aria-hidden="true" /> Favourites
        </button>
        <button
          onClick={() => setSortDesc((d) => !d)}
          className="btn-brass !min-h-0 !py-2 text-xs"
          aria-label={sortDesc ? "Sorted newest first — switch to oldest" : "Sorted oldest first — switch to newest"}
        >
          {sortDesc ? "Newest first" : "Oldest first"}
        </button>
        <MagneticButton onClick={() => fileRef.current?.click()} className="btn-museum !min-h-0 !py-2 text-sm">
          <span className="flex items-center gap-1.5">
            <Plus size={15} aria-hidden="true" /> Add photos
          </span>
        </MagneticButton>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void onFiles(e.target.files)}
          aria-label="Choose photos to upload"
        />
      </div>

      <p aria-live="polite" className="mt-2 min-h-5 text-center text-xs text-[color:var(--brass)]">
        {notice}
      </p>

      {/* preview before saving */}
      {pending.length > 0 && (
        <div className="ornate-card mt-6 p-4">
          <h2 className="text-sm font-semibold text-[color:var(--champagne)]">
            Preview before saving ({pending.length})
          </h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {pending.map((p, i) => (
               
              <img key={i} src={p.src} alt={`Preview ${i + 1}`} className="h-24 w-24 rounded-lg border border-[color:var(--brass)]/40 object-cover" />
            ))}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-[color:var(--brass)]">
              Album
              <input
                list="album-list"
                value={draft.album}
                onChange={(e) => setDraft({ ...draft, album: e.target.value })}
                className="mt-1 h-10 w-full rounded-lg border border-[color:var(--input)] bg-[rgba(18,6,26,.8)] px-3 text-sm text-[color:var(--text-primary)] focus:outline-none focus:border-[color:var(--rose)]"
              />
              <datalist id="album-list">
                {albums.map((a) => <option key={a} value={a} />)}
              </datalist>
            </label>
            <label className="text-xs text-[color:var(--brass)]">
              Caption
              <input
                value={draft.caption}
                onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
                placeholder="e.g. Golden hour"
                className="mt-1 h-10 w-full rounded-lg border border-[color:var(--input)] bg-[rgba(18,6,26,.8)] px-3 text-sm text-[color:var(--text-primary)] focus:outline-none focus:border-[color:var(--rose)]"
              />
            </label>
            <label className="text-xs text-[color:var(--brass)]">
              Date
              <input
                type="date"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                className="mt-1 h-10 w-full rounded-lg border border-[color:var(--input)] bg-[rgba(18,6,26,.8)] px-3 text-sm text-[color:var(--text-primary)] focus:outline-none focus:border-[color:var(--rose)]"
              />
            </label>
            <label className="text-xs text-[color:var(--brass)]">
              Location (optional)
              <input
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                placeholder="e.g. Marina Beach"
                className="mt-1 h-10 w-full rounded-lg border border-[color:var(--input)] bg-[rgba(18,6,26,.8)] px-3 text-sm text-[color:var(--text-primary)] focus:outline-none focus:border-[color:var(--rose)]"
              />
            </label>
            <label className="text-xs text-[color:var(--brass)] sm:col-span-2">
              Description
              <textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg border border-[color:var(--input)] bg-[rgba(18,6,26,.8)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:border-[color:var(--rose)]"
              />
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <MagneticButton onClick={savePending} className="btn-museum !min-h-0 !py-2 text-sm">
              Save to wall
            </MagneticButton>
            <button onClick={() => setPending([])} className="btn-brass !min-h-0 !py-2 text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* the polaroid wall */}
      {visible.length === 0 ? (
        <div className="mt-16 text-center" role="status">
          <Images size={44} className="mx-auto text-[color:var(--brass)]/60" aria-hidden="true" />
          <p className="mt-3 font-script text-3xl text-[color:var(--champagne)]">
            {photos.length === 0 ? "Add your first memory" : "Nothing matches that filter"}
          </p>
          <p className="mt-1 text-sm text-[color:var(--text-soft)]">
            {photos.length === 0
              ? "Upload a photo and pin it to the string lights."
              : "Try a different search or album."}
          </p>
        </div>
      ) : (
        <ul className="mt-8 flex flex-wrap justify-center gap-6">
          {visible.map((p, i) => (
            <li key={p.id} className="w-44">
              <TiltCard
                className="polaroid group relative cursor-pointer"
                max={12}
                style={reduced ? undefined : { rotate: `${((i * 37) % 9) - 4}deg` }}
              >
                <button
                  onClick={() => setLightbox(i)}
                  className="block w-full text-left"
                  aria-label={`Open photo: ${p.caption || "memory"}`}
                >
                  { }
                  <img src={p.src} alt={p.caption || "Gallery memory"} loading="lazy" className="h-36 w-full object-cover" />
                  <p className="mt-2 line-clamp-2 px-1 pb-1 font-script text-lg leading-tight text-[#3c2436]">
                    {p.caption || "Untitled memory"}
                  </p>
                </button>
                <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    onClick={() => updatePhoto(p.id, { fav: !p.fav })}
                    aria-label={p.fav ? "Remove from favourites" : "Add to favourites"}
                    className={`grid h-7 w-7 place-items-center rounded-full bg-[rgba(12,4,20,.75)] ${p.fav ? "text-[color:var(--neon)]" : "text-white/80"}`}
                  >
                    <Heart size={13} fill={p.fav ? "currentColor" : "none"} aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => {
                      setEditId(p.id);
                      setDraft({ album: p.album, caption: p.caption, date: p.date, description: p.description, location: p.location });
                    }}
                    aria-label="Edit photo details"
                    className="grid h-7 w-7 place-items-center rounded-full bg-[rgba(12,4,20,.75)] text-white/80"
                  >
                    <Pencil size={12} aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setConfirmId(p.id)}
                    aria-label="Delete photo"
                    className="grid h-7 w-7 place-items-center rounded-full bg-[rgba(12,4,20,.75)] text-white/80"
                  >
                    <Trash2 size={12} aria-hidden="true" />
                  </button>
                </div>
                <span className="absolute left-2 top-2 text-[10px] text-[color:var(--brass)]/90" aria-hidden="true">
                  {p.fav ? "★" : ""}
                </span>
              </TiltCard>
            </li>
          ))}
        </ul>
      )}

      {/* edit modal */}
      {editId && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Edit photo details">
          <div className="ornate-card w-full max-w-md p-5">
            <h2 className="text-sm font-semibold text-[color:var(--champagne)]">Edit details</h2>
            <div className="mt-3 grid gap-2">
              <input
                value={draft.caption}
                onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
                placeholder="Caption"
                aria-label="Caption"
                className="h-10 w-full rounded-lg border border-[color:var(--input)] bg-[rgba(18,6,26,.8)] px-3 text-sm text-[color:var(--text-primary)] focus:outline-none focus:border-[color:var(--rose)]"
              />
              <input
                list="album-list"
                value={draft.album}
                onChange={(e) => setDraft({ ...draft, album: e.target.value })}
                placeholder="Album"
                aria-label="Album"
                className="h-10 w-full rounded-lg border border-[color:var(--input)] bg-[rgba(18,6,26,.8)] px-3 text-sm text-[color:var(--text-primary)] focus:outline-none focus:border-[color:var(--rose)]"
              />
              <input
                type="date"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                aria-label="Date"
                className="h-10 w-full rounded-lg border border-[color:var(--input)] bg-[rgba(18,6,26,.8)] px-3 text-sm text-[color:var(--text-primary)] focus:outline-none focus:border-[color:var(--rose)]"
              />
              <input
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                placeholder="Location"
                aria-label="Location"
                className="h-10 w-full rounded-lg border border-[color:var(--input)] bg-[rgba(18,6,26,.8)] px-3 text-sm text-[color:var(--text-primary)] focus:outline-none focus:border-[color:var(--rose)]"
              />
              <textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Description"
                aria-label="Description"
                rows={2}
                className="w-full rounded-lg border border-[color:var(--input)] bg-[rgba(18,6,26,.8)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:border-[color:var(--rose)]"
              />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  updatePhoto(editId, draft);
                  setEditId(null);
                  sound.click();
                }}
                className="btn-museum !min-h-0 !py-2 text-sm"
              >
                Save changes
              </button>
              <button onClick={() => setEditId(null)} className="btn-brass !min-h-0 !py-2 text-xs">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* delete confirmation */}
      {confirmId && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-label="Confirm delete">
          <div className="ornate-card w-full max-w-sm p-5 text-center">
            <p className="text-sm text-[color:var(--text-primary)]">
              Remove this photo from the wall? This cannot be undone.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => {
                  removePhoto(confirmId);
                  setConfirmId(null);
                  sound.pop();
                }}
                className="btn-museum !min-h-0 !py-2 text-sm !bg-gradient-to-br !from-[#ff5c8a] !to-[#a3125f]"
              >
                Yes, remove
              </button>
              <button onClick={() => setConfirmId(null)} className="btn-brass !min-h-0 !py-2 text-xs">
                Keep it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* lightbox */}
      {lightbox !== null && visible[lightbox] && (
        <div
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Photo lightbox"
          onClick={() => {
            setLightbox(null);
            setSlideshow(false);
          }}
        >
          <div className="relative max-h-[70vh]" onClick={(e) => e.stopPropagation()}>
            { }
            <img
              src={visible[lightbox].src}
              alt={visible[lightbox].caption || "Gallery memory"}
              className="max-h-[70vh] rounded-xl border border-[color:var(--brass)]/50 object-contain shadow-2xl"
            />
            <button
              onClick={() => setLightbox((lightbox - 1 + visible.length) % visible.length)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              onClick={() => setLightbox((lightbox + 1) % visible.length)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="mt-3 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="font-script text-2xl text-[color:var(--champagne)]">
              {visible[lightbox].caption || "Untitled memory"}
            </p>
            <p className="text-xs text-[color:var(--text-soft)]">
              {visible[lightbox].date}
              {visible[lightbox].location ? ` · ${visible[lightbox].location}` : ""}
              {visible[lightbox].description ? ` — ${visible[lightbox].description}` : ""}
            </p>
            <div className="mt-3 flex justify-center gap-2">
              <button onClick={() => setSlideshow((s) => !s)} aria-pressed={slideshow} className="btn-brass !min-h-0 !py-2 text-xs">
                <Shuffle size={12} aria-hidden="true" /> {slideshow ? "Stop slideshow" : "Slideshow"}
              </button>
              <button onClick={() => download(visible[lightbox])} className="btn-brass !min-h-0 !py-2 text-xs">
                <Download size={12} aria-hidden="true" /> Download
              </button>
              <button
                onClick={() => {
                  setLightbox(null);
                  setSlideshow(false);
                }}
                className="btn-brass !min-h-0 !py-2 text-xs"
              >
                <X size={12} aria-hidden="true" /> Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
