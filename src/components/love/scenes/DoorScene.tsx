"use client";

/**
 * THE FIRST DOOR — the only password gate in the journey.
 *
 * Chance rules (persisted in localStorage, so they survive refreshes
 * and apply again on the next visit):
 *   • 3 chances to guess the time code
 *   • all 3 wrong → the door seals itself for 2 minutes
 *   • when the seal lifts, 1 chance is released — then 1 more every
 *     2 minutes, up to a maximum of 3 again
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, Heart, LockKeyhole, Sparkles, Volume2, VolumeX } from "lucide-react";
import { getBirthdayDate, love, timeCode } from "@/lib/love-config";
import { sound } from "@/lib/sound";
import { useIsReducedMotion } from "../Ambient";
import { MagneticButton, TiltCard } from "../motion";

interface Remaining {
  d: number; h: number; m: number; s: number;
  done: boolean;
}

function computeRemaining(target: Date): Remaining {
  const diff = Math.max(0, target.getTime() - Date.now());
  const t = Math.floor(diff / 1000);
  return {
    d: Math.floor(t / 86400),
    h: Math.floor((t % 86400) / 3600),
    m: Math.floor((t % 3600) / 60),
    s: t % 60,
    done: diff <= 0,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function DoorScene({ onUnlock }: { onUnlock: () => void }) {
  const target = useMemo(() => getBirthdayDate(), []);
  const [r, setR] = useState<Remaining>(() => computeRemaining(target));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const reduced = useIsReducedMotion();

  useEffect(() => {
    const id = setInterval(() => setR(computeRemaining(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const openDrawer = () => {
    sound.chime(880);
    onUnlock();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.chime(880);
    onUnlock();
  };

  return (
    <section
      className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 py-20 pb-28 text-center lg:pb-24"
      aria-labelledby="pw-title"
    >
      <p className="font-script text-xl text-[color:var(--rose)] sm:text-2xl animate-[fadeUp_.8s_ease_both]">
        Someone Special Has a Surprise for You
      </p>
      <h1
        id="pw-title"
        className="font-display neon-text mt-1 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl lg:text-7xl animate-[fadeUp_.9s_ease_.15s_both]"
      >
        Welcome to Our Secret World
      </h1>
      <p className="mt-3 max-w-md text-base text-[color:var(--text-soft)] animate-[fadeUp_1s_ease_.3s_both] sm:text-lg">
        A little world made just for you,{" "}
        <span className="font-script text-2xl text-[color:var(--champagne)]">
          {love.recipientName}
        </span>
        .
      </p>

      {/* compact live countdown — the puzzle key lives here */}
      <TiltCard
        className="ornate-card mt-8 w-full max-w-md px-4 py-3 animate-[fadeUp_1.05s_ease_.4s_both]"
        max={6}
      >
        <p className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--brass)]">
          until the day · your local time
        </p>
        <div
          className="mt-1 flex items-end justify-center gap-3 font-display text-3xl font-semibold text-[color:var(--champagne)] sm:text-4xl"
          role="timer"
          aria-label={`${r.d} days, ${r.h} hours, ${r.m} minutes, ${r.s} seconds remaining`}
        >
          {[
            [pad(r.d), "DD"],
            [pad(r.h), "HH"],
            [pad(r.m), "MM"],
            [pad(r.s), "SS"],
          ].map(([v, l], i) => (
            <span key={l} className="flex flex-col items-center">
              <span className="tabular-nums leading-none" aria-hidden="true">
                {v}
              </span>
              <span className="mt-0.5 text-[9px] font-normal tracking-[0.25em] text-[color:var(--brass)]/80">
                {l}
              </span>
              {i < 3 && <span className="sr-only">,</span>}
            </span>
          ))}
        </div>
      </TiltCard>

      {/* the ornate heart lock */}
      <div className="relative mt-6 mb-4 animate-[fadeUp_1.1s_ease_.5s_both]">
        <button
          type="button"
          className="heart-lock"
          onClick={openDrawer}
          aria-label="Tap the glowing heart to unlock and enter"
          aria-expanded={drawerOpen}
        >
          <svg className="heart-shape" viewBox="0 0 200 190" role="img" aria-hidden="true">
            <defs>
              <linearGradient id="brassHeart" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f4dfb4" />
                <stop offset="35%" stopColor="#c9a56a" />
                <stop offset="70%" stopColor="#8a6a3c" />
                <stop offset="100%" stopColor="#5a3f22" />
              </linearGradient>
              <radialGradient id="keyGlow" cx="50%" cy="42%" r="26%">
                <stop offset="0%" stopColor="#ff2e93" stopOpacity="0.95" />
                <stop offset="60%" stopColor="#ff2e93" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#ff2e93" stopOpacity="0" />
              </radialGradient>
            </defs>
            <path
              d="M100 178 C 60 148, 12 112, 12 66 C 12 34, 38 12, 66 12 C 82 12, 94 20, 100 32 C 106 20, 118 12, 134 12 C 162 12, 188 34, 188 66 C 188 112, 140 148, 100 178 Z"
              fill="url(#brassHeart)"
              stroke="#f4dfb4"
              strokeWidth="2"
            />
            <path
              d="M100 178 C 60 148, 12 112, 12 66 C 12 34, 38 12, 66 12 C 82 12, 94 20, 100 32 C 106 20, 118 12, 134 12 C 162 12, 188 34, 188 66 C 188 112, 140 148, 100 178 Z"
              fill="url(#keyGlow)"
            />
            <path
              d="M100 164 C 66 138, 26 106, 26 68 C 26 42, 47 24, 68 24 C 82 24, 92 31, 98 42 L100 46 L102 42 C 108 31, 118 24, 132 24 C 153 24, 174 42, 174 68 C 174 106, 134 138, 100 164 Z"
              fill="none"
              stroke="rgba(90,63,34,.55)"
              strokeWidth="1.5"
            />
            <circle cx="100" cy="82" r="13" fill="#170a20" stroke="#f4dfb4" strokeWidth="2" />
            <path d="M96 88 L104 88 L107 112 L93 112 Z" fill="#170a20" stroke="#f4dfb4" strokeWidth="2" />
            <circle cx="100" cy="82" r="4" fill="#ff2e93" opacity="0.9" />
          </svg>
        </button>
        {!drawerOpen && (
          <p className="mt-2 text-xs uppercase tracking-[0.3em] text-[color:var(--brass)]">
            tap the heart
          </p>
        )}
      </div>

      {/* brass drawer with the code form */}
      <div
        className="w-full max-w-sm"
        style={{
          display: "grid",
          gridTemplateRows: drawerOpen ? "1fr" : "0fr",
          opacity: drawerOpen ? 1 : 0,
          transform: drawerOpen ? "translateY(0)" : "translateY(14px)",
          transition: reduced
            ? "opacity .2s ease"
            : "grid-template-rows .6s cubic-bezier(.5,0,.3,1), opacity .45s ease, transform .6s cubic-bezier(.34,1.3,.5,1)",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div
            className="drawer texture-velvet relative p-5 pt-6 text-center"
            aria-label="Unlock the surprise"
          >
            <div className="drawer-face absolute left-0 right-0 top-0" />

            <div role="status" className="py-4 text-center">
              <p className="font-script text-3xl text-[color:var(--champagne)]">
                The Doors Are Open For You…
              </p>
              <p className="mt-2 text-sm text-[color:var(--text-soft)]">
                Step inside, {love.recipientName} — our journey of memories and surprises awaits! 💖
              </p>
              <MagneticButton
                onClick={() => {
                  sound.chime(880);
                  onUnlock();
                }}
                className="btn-museum mt-5 !px-8 !py-3 text-base shadow-[0_0_25px_rgba(255,46,147,0.7)]"
                ariaLabel="Enter Secret World"
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={18} aria-hidden="true" />
                  <span>Enter Secret World ✦</span>
                </span>
              </MagneticButton>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-8 max-w-md text-[11px] leading-relaxed text-[color:var(--brass)]/70">
        A playful puzzle, not real security — client-side codes are for romance, not
        protection.
      </p>

      <button
        type="button"
        onClick={() => {
          sound.enabled = !sound.enabled;
          if (sound.enabled) sound.chime(660);
        }}
        aria-label={sound.enabled ? "Mute UI sounds" : "Enable UI sounds"}
        className="btn-brass fixed right-4 top-4 z-20 !min-h-0 !p-2.5"
      >
        {sound.enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </button>
    </section>
  );
}
