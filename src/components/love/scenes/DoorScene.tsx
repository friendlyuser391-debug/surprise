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

const MAX_CHANCES = love.gate.chances;
const LOCK_MS = love.gate.lockMs;
const REFILL_MS = love.gate.refillMs;
const GATE_KEY = "fmw.gate.v1";

interface GateState {
  chances: number; // tries available right now (0..MAX_CHANCES)
  lockUntil: number; // epoch ms — while in the future and chances = 0, door is sealed
  refillAt: number | null; // epoch ms — when the next extra chance releases
}

const FRESH_GATE: GateState = { chances: MAX_CHANCES, lockUntil: 0, refillAt: null };

/** Bring any stored/raw gate state up to date for `now`. Returns the SAME object if nothing changed. */
function normalizeGate(g: GateState, now: number): GateState {
  let chances = Math.min(MAX_CHANCES, Math.max(0, Math.floor(g.chances) || 0));
  let lockUntil = Math.max(0, Math.floor(g.lockUntil) || 0);
  let refillAt = g.refillAt != null && g.refillAt > 0 ? g.refillAt : null;

  if (chances >= MAX_CHANCES) {
    chances = MAX_CHANCES;
    lockUntil = 0;
    refillAt = null;
  } else {
    if (chances === 0 && !lockUntil && !refillAt) {
      // corrupt/legacy state — behave as if a seal just lifted
      refillAt = now;
    }
    // drip: one chance releases every REFILL_MS
    while (refillAt && refillAt <= now && chances < MAX_CHANCES) {
      chances += 1;
      refillAt += REFILL_MS;
    }
    if (chances >= MAX_CHANCES) {
      chances = MAX_CHANCES;
      lockUntil = 0;
      refillAt = null;
    } else {
      // safety net: seal already over but no release schedule
      if (chances === 0 && lockUntil && lockUntil <= now && !refillAt) {
        chances = 1;
        refillAt = lockUntil + REFILL_MS;
        lockUntil = 0;
      }
      if (chances > 0) lockUntil = 0;
    }
  }

  if (chances === g.chances && lockUntil === g.lockUntil && refillAt === g.refillAt) return g;
  return { chances, lockUntil, refillAt };
}

function loadGate(): GateState {
  if (typeof window === "undefined") return FRESH_GATE;
  try {
    const raw = window.localStorage.getItem(GATE_KEY);
    if (!raw) return FRESH_GATE;
    const p = JSON.parse(raw) as Partial<GateState>;
    return normalizeGate(
      { chances: Number(p.chances) || 0, lockUntil: Number(p.lockUntil) || 0, refillAt: Number(p.refillAt) || null },
      Date.now()
    );
  } catch {
    return FRESH_GATE;
  }
}

function saveGate(g: GateState) {
  try {
    window.localStorage.setItem(GATE_KEY, JSON.stringify(g));
  } catch {
    /* private mode — gate simply resets next visit */
  }
}

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

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
  const [code, setCode] = useState("");
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const [fails, setFails] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const [gate, setGate] = useState<GateState>(FRESH_GATE);
  const [now, setNow] = useState(0); // 0 until mounted — avoids SSR/hydration mismatch
  const inputRef = useRef<HTMLInputElement>(null);
  const reduced = useIsReducedMotion();

  // restore the persisted gate, then keep it ticking (catch-up on load → save straight away)
  useEffect(() => {
    const restored = loadGate();
    setGate(restored);
    saveGate(restored);
    setNow(Date.now());
    const id = setInterval(() => {
      setNow(Date.now());
      setGate((g) => {
        const next = normalizeGate(g, Date.now());
        if (next !== g) saveGate(next);
        return next;
      });
    }, 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setR(computeRemaining(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  useEffect(() => {
    if (drawerOpen) inputRef.current?.focus();
  }, [drawerOpen]);

  const expected = love.timeCodeEnabled ? timeCode(r.d, r.h, r.m) : love.fixedCode;

  const locked = gate.chances <= 0 && gate.lockUntil > now;
  const lockLeft = Math.max(0, gate.lockUntil - now);
  const refillLeft = gate.refillAt ? Math.max(0, gate.refillAt - now) : null;

  const updateGate = useCallback((next: GateState) => {
    saveGate(next);
    setGate(next);
  }, []);

  const openDrawer = () => {
    sound.click();
    setDrawerOpen(true);
  };

  const fail = () => {
    const msgs = love.wrongPasswordMessages;
    setMessage(msgs[Math.min(fails, msgs.length - 1)]);
    setFails((f) => f + 1);
    setShakeKey((k) => k + 1);
    sound.pop();
    const t = Date.now();
    const chances = gate.chances - 1;
    updateGate(
      chances > 0
        ? { chances, lockUntil: 0, refillAt: null }
        : { chances: 0, lockUntil: t + LOCK_MS, refillAt: t + LOCK_MS } // seal lifts → 1 chance, then +1 every 2 min
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locked || expected === null) return;
    if (code.trim() === expected) {
      sound.chime(880);
      updateGate(FRESH_GATE); // success — a fresh set of chances next visit too
      onUnlock();
    } else {
      fail();
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
            className="drawer texture-velvet relative p-5 pt-6 text-left"
            aria-label="Unlock the surprise"
          >
            <div className="drawer-face absolute left-0 right-0 top-0" />

            {/* the three chances — always visible, always honest */}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--brass)]">
                chances left
              </span>
              <span className="flex items-center gap-1.5" aria-label={`${gate.chances} of ${MAX_CHANCES} chances left`}>
                {Array.from({ length: MAX_CHANCES }).map((_, i) => (
                  <Heart
                    key={i}
                    size={14}
                    aria-hidden="true"
                    className={
                      i < gate.chances
                        ? "text-[#ff2e93] drop-shadow-[0_0_5px_rgba(255,46,147,.8)]"
                        : "text-[rgba(201,165,106,.28)]"
                    }
                    fill={i < gate.chances ? "currentColor" : "none"}
                    style={i < gate.chances ? { animation: "heart-breathe 2.6s ease-in-out infinite" } : undefined}
                  />
                ))}
              </span>
            </div>

            {expected === null ? (
              <div role="status" className="py-4 text-center">
                <p className="font-script text-2xl text-[color:var(--champagne)]">
                  The final minute…
                </p>
                <p className="mt-1 text-sm text-[color:var(--text-soft)]">
                  No code to type — just hold on, {love.recipientName}. The door unlocks
                  itself when the countdown completes.
                </p>
              </div>
            ) : (
              <>
                <label
                  htmlFor="secret-code"
                  className="mb-3 block text-sm font-medium text-[color:var(--champagne)]"
                >
                  The secret code, {love.recipientName}
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
                      inputMode="numeric"
                      disabled={locked}
                      className="h-12 w-full rounded-xl border border-[color:var(--input)] bg-[rgba(18,6,26,.8)] px-4 pr-12 text-lg tracking-[0.3em] text-[color:var(--champagne)] placeholder:text-[rgba(201,165,106,.4)] focus:border-[color:var(--rose)] focus:outline-none focus:ring-2 focus:ring-[color:var(--rose)]/50 disabled:opacity-50"
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
                    disabled={locked}
                  >
                    <span className="flex items-center gap-2">
                      <LockKeyhole size={18} aria-hidden="true" />
                      <span className="hidden sm:inline">Unlock</span>
                    </span>
                  </MagneticButton>
                </div>
              </>
            )}

            <p
              aria-live="polite"
              className={`comedy-bubble mt-4 ${message ? "opacity-100" : "opacity-0"}`}
              style={{ minHeight: "3.2rem", transition: "opacity .3s ease" }}
            >
              {message || "\u00A0"}
            </p>

            {/* the seal — all three chances spent */}
            {locked && (
              <div className="golden-ribbon mt-4 animate-[fadeUp_.6s_ease_both] text-center" role="alert">
                <p className="text-sm font-bold text-[#5a1226]">
                  All {MAX_CHANCES} chances gone — the door sealed itself 🔒
                </p>
                <p
                  className="my-2 font-display text-5xl font-bold tabular-nums text-[#a3125f]"
                  style={{ textShadow: "0 0 14px rgba(255,235,200,.55)" }}
                  role="timer"
                  aria-label={`Door sealed — ${mmss(lockLeft)} remaining`}
                >
                  {mmss(lockLeft)}
                </p>
                <p className="text-[11px] font-semibold leading-relaxed text-[#4a2140]">
                  One try releases when the timer ends — then one more every{" "}
                  {Math.round(REFILL_MS / 60_000)} minutes, {MAX_CHANCES} maximum. Even if you
                  come back later, the timer keeps its word.
                </p>
              </div>
            )}

            {/* drip feedback while chances regenerate */}
            {!locked && gate.chances > 0 && gate.chances < MAX_CHANCES && refillLeft != null && (
              <p className="mt-2 text-center text-xs text-[color:var(--brass)]" role="status">
                next extra chance in <span className="tabular-nums">{mmss(refillLeft)}</span>
              </p>
            )}
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
