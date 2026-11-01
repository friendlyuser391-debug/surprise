"use client";

/**
 * THE FIRST DOOR — the gateway to the surprise.
 *
 * Password rules:
 *   • Accepts the live countdown (Day + Hour + Minute, e.g. 021330)
 *   • Accepts current local time (Day + Hour + Minute)
 *   • Accepts rule (Day+1, Hour+1, Minute+60)
 *   • Accepts fixed birthday code (0423)
 *
 * Chance rules:
 *   • 3 chances
 *   • 2-minute lock cooldown if all 3 chances are spent
 *   • Refreshing the page ALWAYS resets back to 3 fresh chances
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, Heart, LockKeyhole, Sparkles, Volume2, VolumeX } from "lucide-react";
import { getBirthdayDate, isPasswordAutoVisible, love } from "@/lib/love-config";
import { sound } from "@/lib/sound";
import { usePasswordGate } from "@/lib/usePasswordGate";
import { useIsReducedMotion } from "../Ambient";
import { MagneticButton, TiltCard } from "../motion";

interface Remaining {
  d: number;
  h: number;
  m: number;
  s: number;
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

function cleanCode(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function validateDoorPassword(raw: string, r: Remaining): boolean {
  const clean = cleanCode(raw);
  if (!clean) return false;

  if (isPasswordAutoVisible()) return true;

  // Master creator / fallback code
  if (clean === "0423") return true;

  // The secret calculation rule: now day count + 1, hour + 1, minutes + 60
  // Checks with +/- 2 minutes tolerance so countdown clock changes while typing don't fail
  for (let mOffset = -2; mOffset <= 2; mOffset++) {
    const testM = r.m + mOffset;
    const testH = r.h;
    const testD = r.d;

    const calcD = testD + 1;
    const calcH = testH + 1;
    const calcM = testM + 60;

    // Both padded and unpadded variations of the secret rule
    if (clean === `${pad(calcD)}${pad(calcH)}${calcM}`) return true;
    if (clean === `${calcD}${calcH}${calcM}`) return true;
    if (clean === `${calcD}${pad(calcH)}${calcM}`) return true;
    if (testD === 0 && (clean === `${pad(calcH)}${calcM}` || clean === `${calcH}${calcM}`)) return true;
  }

  // Also support the secret rule if calculated from current calendar clock:
  const now = new Date();
  const calDay = now.getDate();
  const calH24 = now.getHours();
  const calM = now.getMinutes();

  for (let mOffset = -2; mOffset <= 2; mOffset++) {
    const testM = calM + mOffset;
    const calcD = calDay + 1;
    const calcH = calH24 + 1;
    const calcM = testM + 60;

    if (clean === `${pad(calcD)}${pad(calcH)}${calcM}`) return true;
    if (clean === `${calcD}${calcH}${calcM}`) return true;
    if (clean === `${calcD}${pad(calcH)}${calcM}`) return true;
  }

  // Direct countdown (e.g. 021312) or direct day/hour/minute is rejected (it's a prank!)
  return false;
}

export default function DoorScene({ onUnlock }: { onUnlock: () => void }) {
  const target = useMemo(() => getBirthdayDate(), []);
  const [r, setR] = useState<Remaining>(() => computeRemaining(target));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [code, setCode] = useState("");
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const [fails, setFails] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const reduced = useIsReducedMotion();

  // 3 chances with 2-minute cooldown (resets to 3 on page refresh)
  const gate = usePasswordGate("fmw.gate.v1");

  useEffect(() => {
    const id = setInterval(() => setR(computeRemaining(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  useEffect(() => {
    if (drawerOpen) inputRef.current?.focus();
  }, [drawerOpen]);

  const openDrawer = () => {
    sound.click();
    setDrawerOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gate.isLocked) return;

    if (validateDoorPassword(code, r)) {
      sound.chime(880);
      gate.recordSuccess();
      onUnlock();
    } else {
      sound.pop();
      gate.recordFail();
      setShakeKey((k) => k + 1);
      const msgs = love.wrongPasswordMessages;
      setMessage(msgs[fails % msgs.length]);
      setFails((f) => f + 1);
      setCode("");
    }
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
          key={shakeKey}
          className={`heart-lock ${shakeKey ? "shake" : ""}`}
          onClick={openDrawer}
          aria-label={
            drawerOpen ? "Password form is open below" : "Tap the glowing heart to reveal the code form"
          }
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
          <form
            onSubmit={submit}
            className="drawer texture-velvet relative p-5 pt-6 text-center"
            aria-label="Unlock the secret door"
          >
            <div className="drawer-face absolute left-0 right-0 top-0" />

            {/* chances left indicator */}
            <div className="flex items-center justify-between w-full px-1 text-xs mb-3">
              <span className="text-[10px] uppercase tracking-wider text-[color:var(--brass)] font-semibold">
                Chances Left:
              </span>
              <span className="flex items-center gap-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart
                    key={i}
                    size={14}
                    className={
                      i < gate.chances
                        ? "text-[color:var(--neon)] drop-shadow-[0_0_6px_rgba(255,46,147,0.8)]"
                        : "text-white/20"
                    }
                    fill={i < gate.chances ? "currentColor" : "none"}
                  />
                ))}
              </span>
            </div>

            {/* 2 minutes lock banner */}
            {gate.isLocked && (
              <div className="w-full rounded-xl border border-red-500/40 bg-red-950/50 p-2.5 text-center text-xs text-red-200 mb-3 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                <p className="font-bold flex items-center justify-center gap-1">
                  <LockKeyhole size={13} />
                  <span>Door sealed for 2 minutes!</span>
                </p>
                <p className="text-[11px] text-[color:var(--champagne)] mt-1">
                  Next chance in: <span className="font-mono font-bold text-base text-[color:var(--neon)]">{gate.lockLeftText}</span>
                </p>
                <p className="text-[10px] text-white/60 mt-0.5">1 chance will unlock when the timer finishes.</p>
              </div>
            )}

            {!gate.isLocked && gate.chances < 3 && gate.refillLeftText && (
              <p className="text-[10px] text-[color:var(--brass)] text-center mb-2">
                Next extra chance refills in: <span className="font-mono font-semibold">{gate.refillLeftText}</span>
              </p>
            )}

            <label
              htmlFor="secret-code"
              className="mb-2 block text-sm font-medium text-[color:var(--champagne)]"
            >
              The Secret Code, {love.recipientName}
            </label>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  id="secret-code"
                  type={show ? "text" : "password"}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="••••••"
                  autoComplete="off"
                  disabled={gate.isLocked}
                  className="h-12 w-full rounded-xl border border-[color:var(--input)] bg-[rgba(18,6,26,.8)] px-4 pr-12 text-center text-lg tracking-[0.25em] text-[color:var(--champagne)] placeholder:text-[rgba(201,165,106,.3)] focus:border-[color:var(--rose)] focus:outline-none focus:ring-2 focus:ring-[color:var(--rose)]/50 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide code" : "Show code"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[color:var(--brass)] hover:text-[color:var(--champagne)]"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <MagneticButton
                type="submit"
                className="btn-museum !px-5"
                ariaLabel="Unlock"
                disabled={gate.isLocked}
              >
                <span className="flex items-center gap-2">
                  <LockKeyhole size={18} aria-hidden="true" />
                  <span className="hidden sm:inline">Unlock</span>
                </span>
              </MagneticButton>
            </div>

            {/* Playful prank clue drawer — does NOT mention the secret rule */}
            <details className="mt-3 text-center group">
              <summary className="cursor-pointer text-xs text-[color:var(--champagne)]/80 hover:text-[color:var(--champagne)] inline-flex items-center gap-1.5 transition-colors">
                <Heart size={13} className="text-[color:var(--rose)] animate-pulse" fill="currentColor" />
                <span>Need a clue for the secret code? 🗝️</span>
                <span className="text-[10px] uppercase tracking-wider text-[color:var(--brass)] group-open:hidden">Tap to reveal</span>
              </summary>
              <div className="mt-2 rounded-xl border border-[color:var(--rose)]/30 bg-[rgba(18,6,26,0.85)] p-3 text-xs text-[color:var(--champagne)]/90 backdrop-blur-md">
                <p className="font-script text-base text-[color:var(--rose)]">
                  &ldquo;Look at the countdown clock above…&rdquo;
                </p>
                <p className="mt-1 text-[11px] text-[color:var(--brass)]">
                  Just prank !!! Ippo Kandupudi Pakalam 😉🔐
                </p>
              </div>
            </details>

            <p
              aria-live="polite"
              className={`comedy-bubble mt-3 ${message ? "opacity-100" : "opacity-0"}`}
              style={{ minHeight: "2.8rem", transition: "opacity .3s ease" }}
            >
              {message || "\u00A0"}
            </p>
          </form>
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
