"use client";

import { useMemo, useRef, useState } from "react";
import { Heart, Lock, Plus, Sparkles, Trash2, Unlock, Upload, X } from "lucide-react";
import { sound } from "@/lib/sound";
import { compressImage, exportAllData, uid, useSettings, useVault } from "@/lib/store";
import { useIsReducedMotion } from "../Ambient";
import { MagneticButton, TiltCard } from "../motion";

const emptyDraft = { title: "", body: "" };

export default function VaultScene() {
  const pin = useSettings((s) => s.vaultPin);
  const setSettings = useSettings((s) => s.set);
  const notes = useVault((s) => s.notes);
  const addNote = useVault((s) => s.add);
  const removeNote = useVault((s) => s.remove);

  const [pinInput, setPinInput] = useState("");
  const [newPin, setNewPin] = useState("");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [dialAngle, setDialAngle] = useState(0);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [draftPhoto, setDraftPhoto] = useState<string | undefined>(undefined);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const reduced = useIsReducedMotion();
  const photoRef = useRef<HTMLInputElement>(null);

  const locked = useMemo(() => !open, [open]);

  const tryUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    if (pinInput === pin) {
      setOpen(true);
      setMessage("");
      sound.chime(1000);
    } else {
      setMessage("Wrong combination — the dial clicks back. 🔒");
      sound.pop();
      setPinInput("");
      setDialAngle((a) => a - 60);
    }
  };

  const saveNote = () => {
    if (!draft.title.trim() && !draft.body.trim()) return;
    addNote({
      id: uid(),
      title: draft.title.trim() || "Untitled keepsake",
      body: draft.body,
      photo: draftPhoto,
      fav: false,
      createdAt: Date.now(),
    });
    sound.chime(860);
    setDraft(emptyDraft);
    setDraftPhoto(undefined);
    setAdding(false);
  };

  return (
    <section
      className="relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center px-4 py-16 pb-32 text-center lg:pb-24"
      aria-labelledby="vlt-title"
    >
      <h1 id="vlt-title" className="font-display neon-text mt-4 text-4xl font-semibold sm:text-5xl">
        The Private Vault
      </h1>
      <p className="mt-2 max-w-md text-sm text-[color:var(--text-soft)]">
        A brass safe for the memories you keep closest. (Demo privacy — everything stays
        in this browser only.)
      </p>

      {!pin ? (
        /* first-time PIN setup */
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newPin.trim().length >= 4) {
              setSettings({ vaultPin: newPin.trim() });
              setNewPin("");
              sound.chime(940);
            } else setMessage("Choose at least 4 characters.");
          }}
          className="ornate-card mt-10 w-full max-w-md p-6 text-left"
          aria-label="Create vault PIN"
        >
          <p className="text-sm font-semibold text-[color:var(--champagne)]">Owner setup — choose a vault PIN</p>
          <p className="mt-2 text-xs leading-relaxed text-[color:var(--text-soft)]">
            You will type this to open the safe. It lives only in this browser
            (Dashboard → change it anytime).
          </p>
          <div className="mt-4 flex gap-2">
            <input
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="4+ characters"
              aria-label="New vault PIN"
              autoComplete="off"
              className="h-12 flex-1 rounded-xl border border-[color:var(--input)] bg-[rgba(18,6,26,.8)] px-4 tracking-[0.3em] text-[color:var(--champagne)] focus:border-[color:var(--rose)] focus:outline-none"
            />
            <MagneticButton type="submit" className="btn-museum !px-5" ariaLabel="Save PIN">
              <Lock size={18} aria-hidden="true" />
            </MagneticButton>
          </div>
          <p aria-live="polite" className="mt-2 min-h-4 text-xs text-[color:var(--rose)]">{message}</p>
        </form>
      ) : (
        <>
          {/* the brass safe */}
          <div className="safe-stage mt-10" data-open={!locked}>
            <div className={`safe-door texture-velvet ${open ? "open" : ""}`}>
              {/* dial */}
              <div
                className={`dial ${reduced ? "" : "dial-glow"}`}
                role="slider"
                aria-label="Safe dial (decorative — type the PIN below)"
                aria-valuenow={Math.round(dialAngle / 30)}
                aria-valuemin={0}
                aria-valuemax={11}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") { setDialAngle((a) => a + 30); sound.click(); }
                  if (e.key === "ArrowLeft") { setDialAngle((a) => a - 30); sound.click(); }
                }}
              >
                <div className="dial-ring" style={{ transform: `rotate(${dialAngle}deg)` }}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <span key={i} className="tick" style={{ transform: `rotate(${i * 30}deg)` }} />
                  ))}
                  <span className="dial-mark" />
                </div>
              </div>
              <div className="safe-handle" aria-hidden="true">
                <span /><span /><span />
              </div>
            </div>
            <div className="safe-interior" aria-hidden="true">
              <span className="interior-glow" />
            </div>
          </div>

          {!open ? (
            <form onSubmit={tryUnlock} className="mt-8 w-full max-w-sm" aria-label="Unlock the vault">
              <label htmlFor="vault-pin" className="mb-2 block text-sm font-medium text-[color:var(--champagne)]">
                Turn the dial, then enter your PIN
              </label>
              <div className="flex gap-2">
                <input
                  id="vault-pin"
                  type="password"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setDialAngle(e.target.value.length * 45);
                  }}
                  placeholder="••••"
                  autoComplete="off"
                  className="h-12 flex-1 rounded-xl border border-[color:var(--input)] bg-[rgba(18,6,26,.8)] px-4 tracking-[0.35em] text-[color:var(--champagne)] focus:border-[color:var(--rose)] focus:outline-none"
                />
                <MagneticButton type="submit" className="btn-museum !px-5" ariaLabel="Open the vault">
                  <span className="flex items-center gap-2">
                    <Unlock size={17} aria-hidden="true" /> Open
                  </span>
                </MagneticButton>
              </div>
              <p aria-live="polite" className="mt-2 min-h-5 text-sm text-[color:var(--rose)]">{message}</p>
            </form>
          ) : (
            <div className="mt-8 w-full">
              <div className="flex justify-center gap-2">
                <MagneticButton onClick={() => setAdding(true)} className="btn-museum !min-h-0 !py-2 text-sm">
                  <span className="flex items-center gap-1.5"><Plus size={15} aria-hidden="true" /> Add a keepsake</span>
                </MagneticButton>
                <button
                  onClick={() => { setOpen(false); setPinInput(""); sound.click(); }}
                  className="btn-brass !min-h-0 !py-2 text-xs"
                >
                  Lock the safe
                </button>
              </div>

              {notes.length === 0 ? (
                <p className="mt-10 font-script text-3xl text-[color:var(--champagne)]" role="status">
                  The shelves are waiting…
                </p>
              ) : (
                <ul className="mt-8 grid gap-5 text-left sm:grid-cols-2">
                  {notes.map((n) => (
                    <li key={n.id}>
                      <TiltCard max={6} className="ornate-card p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h2 className="font-display text-lg text-[color:var(--champagne)]">{n.title}</h2>
                          <div className="flex gap-1">
                            <span className={n.fav ? "text-[color:var(--neon)]" : "text-white/40"} aria-hidden="true">
                              <Heart size={13} fill={n.fav ? "currentColor" : "none"} />
                            </span>
                            <button onClick={() => setConfirmId(n.id)} aria-label={`Delete ${n.title}`} className="grid h-7 w-7 place-items-center rounded-full text-white/50">
                              <Trash2 size={12} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                        {n.photo && (
                           
                          <img src={n.photo} alt="" className="mt-2 h-28 w-full rounded-lg border border-[color:var(--brass)]/30 object-cover" />
                        )}
                        <p className="mt-2 whitespace-pre-wrap text-sm text-[color:var(--text-soft)]">{n.body}</p>
                      </TiltCard>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      {/* note editor */}
      {adding && (
        <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Add keepsake">
          <div className="ornate-card relative w-full max-w-md p-6 text-left">
            <button onClick={() => setAdding(false)} aria-label="Close" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-[color:var(--rose)]">
              <X size={16} aria-hidden="true" />
            </button>
            <h2 className="text-sm font-semibold text-[color:var(--champagne)]">A new keepsake</h2>
            <div className="mt-4 grid gap-2">
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Title" aria-label="Title" className="field" />
              <textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} placeholder="What makes this one precious?" aria-label="Body" rows={4} className="field" />
              <div className="flex items-center gap-2">
                <input ref={photoRef} type="file" accept="image/*" className="hidden" aria-label="Upload photo"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) setDraftPhoto(await compressImage(f));
                  }} />
                <button type="button" onClick={() => photoRef.current?.click()} className="btn-brass !min-h-0 !py-2 text-xs">
                  <Upload size={12} aria-hidden="true" /> {draftPhoto ? "Replace photo" : "Add photo"}
                </button>
                {draftPhoto && (
                   
                  <img src={draftPhoto} alt="Preview" className="h-14 w-14 rounded-lg border border-[color:var(--brass)]/40 object-cover" />
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <MagneticButton onClick={saveNote} className="btn-museum !min-h-0 !py-2 text-sm">Store it</MagneticButton>
              <button onClick={() => setAdding(false)} className="btn-brass !min-h-0 !py-2 text-xs">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {confirmId && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-label="Confirm delete">
          <div className="ornate-card w-full max-w-sm p-5 text-center">
            <p className="text-sm">Take this keepsake out and let it go? This cannot be undone.</p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => { removeNote(confirmId); setConfirmId(null); sound.pop(); }}
                className="btn-museum !min-h-0 !py-2 text-sm !bg-gradient-to-br !from-[#ff5c8a] !to-[#a3125f]"
              >
                Yes, remove
              </button>
              <button onClick={() => setConfirmId(null)} className="btn-brass !min-h-0 !py-2 text-xs">Keep it</button>
            </div>
          </div>
        </div>
      )}

      <button onClick={exportAllData} className="btn-brass mt-10 !min-h-0 !py-2 text-xs">
        Export all website data (JSON)
      </button>
    </section>
  );
}
