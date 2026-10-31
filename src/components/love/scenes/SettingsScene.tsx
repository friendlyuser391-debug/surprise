"use client";

import { useState } from "react";
import {
  Database, Download, KeyRound, LogOut, MailOpen, RotateCcw,
  Sparkles, Volume2,
} from "lucide-react";
import { getBirthdayDate, love } from "@/lib/love-config";
import { sound } from "@/lib/sound";
import {
  exportAllData, useDiary, useHistory, useJournal, usePhotos,
  useSettings, useSpecialDays, useTracks, useVault, type AnimLevel,
} from "@/lib/store";
import { useIsReducedMotion } from "../Ambient";
import { MagneticButton } from "../motion";

function bytesOf(obj: unknown) {
  return new Blob([JSON.stringify(obj)]).size;
}
function fmtBytes(b: number) {
  return b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`;
}

export default function SettingsScene() {
  const settings = useSettings();
  const setSettings = useSettings((s) => s.set);
  const reduced = useIsReducedMotion();
  const [saved, setSaved] = useState("");

  const photos = usePhotos((s) => s.photos);
  const history = useHistory((s) => s.entries);
  const diary = useDiary((s) => s.entries);
  const journal = useJournal((s) => s.entries);
  const specialDays = useSpecialDays((s) => s.days);
  const vaultNotes = useVault((s) => s.notes);
  const tracks = useTracks((s) => s.tracks);

  const [letterText, setLetterText] = useState(
    (settings.letterOverride ?? love.letter).paragraphs.join("\n\n")
  );
  const [msgs, setMsgs] = useState(
    (settings.birthdayMessagesOverride ?? love.birthdayMessages).join("\n")
  );

  const flash = (m: string) => {
    setSaved(m);
    sound.chime(880);
    setTimeout(() => setSaved(""), 2400);
  };

  const target = getBirthdayDate();

  const totals = [
    { label: "Photos", n: photos.length },
    { label: "History", n: history.length },
    { label: "Diary", n: diary.length },
    { label: "Journal", n: journal.length },
    { label: "Days", n: specialDays.length },
    { label: "Vault", n: vaultNotes.length },
    { label: "Tracks", n: tracks.length },
  ];
  const storage = bytesOf({ photos, history, diary, journal, specialDays, vaultNotes, tracks, settings });

  return (
    <section
      className="relative z-10 mx-auto min-h-dvh w-full max-w-3xl px-4 py-16 pb-32 lg:pb-24"
      aria-labelledby="set-title"
    >
      <h1 id="set-title" className="font-display text-center text-4xl font-semibold text-[color:var(--champagne)] sm:text-5xl">
        Settings &amp; Backstage
      </h1>
      <p className="mt-2 text-center text-sm text-[color:var(--text-soft)]">
        The quiet control room — everything saved locally in this browser only.
      </p>
      <p aria-live="polite" className="mt-2 min-h-5 text-center text-sm text-[color:var(--champagne)]">{saved}</p>

      {/* storage stats */}
      <ul className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {totals.map((t) => (
          <li key={t.label} className="ornate-card p-2.5 text-center">
            <p className="font-display text-xl text-[color:var(--champagne)]">{t.n}</p>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[color:var(--brass)]">{t.label}</p>
          </li>
        ))}
        <li className="ornate-card p-2.5 text-center">
          <p className="font-display text-xl text-[color:var(--champagne)]">{fmtBytes(storage)}</p>
          <p className="text-[9px] uppercase tracking-[0.2em] text-[color:var(--brass)]">Local</p>
        </li>
      </ul>

      <div className="mt-8 grid gap-6">
        {/* preferences */}
        <div className="ornate-card space-y-5 p-6 text-left">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[color:var(--champagne)]">
            <Volume2 size={15} aria-hidden="true" /> Preferences
          </h2>
          <label className="block text-xs text-[color:var(--brass)]">
            Display name
            <input
              value={settings.displayName}
              onChange={(e) => setSettings({ displayName: e.target.value })}
              onBlur={() => flash("Display name saved.")}
              className="field"
            />
          </label>

          <label className="block text-xs text-[color:var(--brass)]">
            Birthday date &amp; time (local) — currently {target.toLocaleString()}
            <input
              type="date"
              value={settings.birthdayISO}
              onChange={(e) => {
                setSettings({ birthdayISO: e.target.value });
                flash("Birthday saved. (The live puzzle reads the config date; update src/lib/love-config.ts to change it.)");
              }}
              className="field"
            />
          </label>

          <fieldset>
            <legend className="text-xs text-[color:var(--brass)]">Animation level</legend>
            <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Animation level">
              {(["full", "balanced", "minimal"] as AnimLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  role="radio"
                  aria-checked={settings.animLevel === lvl}
                  onClick={() => {
                    setSettings({ animLevel: lvl });
                    flash(`Animations: ${lvl}.`);
                  }}
                  className={`btn-brass !min-h-0 flex-1 !py-2 text-xs capitalize ${settings.animLevel === lvl ? "!border-[color:var(--neon)] !text-[color:var(--rose)]" : ""}`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-[color:var(--text-soft)]">
              {reduced
                ? "Your system prefers reduced motion — the museum is already in Minimal mode."
                : "Minimal turns off particles, parallax and flips; content appears instantly."}
            </p>
          </fieldset>

          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-[color:var(--brass)]">
              <Volume2 size={14} aria-hidden="true" /> UI sounds
              <input
                type="checkbox"
                checked={settings.soundOn}
                onChange={(e) => {
                  setSettings({ soundOn: e.target.checked });
                  sound.enabled = e.target.checked;
                  flash(`UI sounds ${e.target.checked ? "on" : "off"}.`);
                }}
                className="accent-[color:var(--neon)]"
              />
            </label>
            <label className="flex flex-1 items-center gap-2 text-xs text-[color:var(--brass)]">
              Volume
              <input
                type="range" min={0} max={1} step={0.05} value={settings.volume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setSettings({ volume: v });
                  sound.setVolume(v);
                }}
                aria-label="Master volume"
                className="slider flex-1"
              />
            </label>
          </div>
        </div>

        {/* content editors */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="ornate-card p-5 text-left">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[color:var(--champagne)]">
              <MailOpen size={15} aria-hidden="true" /> Edit the letter
            </h2>
            <p className="mt-1 text-[11px] text-[color:var(--brass)]">Blank lines separate paragraphs — saved in this browser.</p>
            <textarea
              value={letterText}
              onChange={(e) => setLetterText(e.target.value)}
              rows={8}
              aria-label="Letter paragraphs"
              className="field mt-2"
            />
            <MagneticButton
              onClick={() => {
                const paragraphs = letterText.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
                setSettings({ letterOverride: { ...love.letter, paragraphs } });
                flash("Letter saved — the typewriter will use it next time.");
              }}
              className="btn-museum mt-3 !min-h-0 !py-2 text-sm"
            >
              Save letter
            </MagneticButton>
          </div>

          <div className="ornate-card p-5 text-left">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[color:var(--champagne)]">
              <Sparkles size={15} aria-hidden="true" /> Celebration message lines
            </h2>
            <p className="mt-1 text-[11px] text-[color:var(--brass)]">One line per row — revealed one by one.</p>
            <textarea
              value={msgs}
              onChange={(e) => setMsgs(e.target.value)}
              rows={6}
              aria-label="Birthday message lines"
              className="field mt-2"
            />
            <MagneticButton
              onClick={() => {
                const lines = msgs.split("\n").map((s) => s.trim()).filter(Boolean);
                setSettings({ birthdayMessagesOverride: lines });
                flash("Celebration lines saved.");
              }}
              className="btn-museum mt-3 !min-h-0 !py-2 text-sm"
            >
              Save lines
            </MagneticButton>
          </div>
        </div>

        {/* secrets */}
        <div className="ornate-card p-5 text-left">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[color:var(--champagne)]">
            <KeyRound size={15} aria-hidden="true" /> Vault PIN
          </h2>
          <div className="mt-3">
            <label className="block text-xs text-[color:var(--brass)]">
              Vault PIN (for the locked vault room)
              <input
                type="password"
                value={settings.vaultPin ?? ""}
                onChange={(e) => setSettings({ vaultPin: e.target.value || null })}
                placeholder="Not set yet"
                autoComplete="off"
                className="field"
              />
            </label>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--text-soft)]">
            Lives only in this browser — never inside the website&apos;s source code.
          </p>
        </div>

        {/* data & privacy */}
        <div className="ornate-card p-5 text-left">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[color:var(--champagne)]">
            <Database size={15} aria-hidden="true" /> Data &amp; privacy
          </h2>
          <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--text-soft)]">
            Everything on this site is stored locally in this browser (localStorage) —
            photos are auto-compressed, audio tracks capped at 8 MB. For a public
            deployment with real accounts, connect a backend such as Supabase before
            trusting it with private memories.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={exportAllData} className="btn-brass !min-h-0 !py-2 text-xs">
              <Download size={12} aria-hidden="true" /> Export backup
            </button>
            <button
              onClick={() => {
                sound.enabled = false;
                setSettings({ vaultPin: null });
                flash("Signed out — secrets cleared from this browser.");
              }}
              className="btn-brass !min-h-0 !py-2 text-xs"
              title="Clears the owner secrets from this browser"
            >
              <LogOut size={12} aria-hidden="true" /> Log out (clear secrets)
            </button>
            <button
              onClick={() => {
                if (window.confirm("Erase ALL local website data? This cannot be undone.")) {
                  ["fm-settings", "fm-photos", "fm-history", "fm-diary", "fm-journal", "fm-special-days", "fm-vault", "fm-tracks"].forEach((k) => localStorage.removeItem(k));
                  window.location.reload();
                }
              }}
              className="btn-brass !min-h-0 !py-2 text-xs !border-[rgba(255,92,138,.5)]"
            >
              <RotateCcw size={12} aria-hidden="true" /> Reset all data
            </button>
          </div>
        </div>
      </div>

      <p className="mt-8 text-center font-script text-xl text-[color:var(--rose)]">
        {love.projectName} — {love.tagline}
      </p>
    </section>
  );
}
