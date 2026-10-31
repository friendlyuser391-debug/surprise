"use client";

/**
 * THE SECRET CHAMBER — "The Celestial Astrolabe of Hearts"
 *
 * A unique, difficult, linked concentric ring puzzle:
 *   • Three interlocking concentric rings:
 *       1. Outer Ring (Constellations): 6 ancient star groups
 *       2. Middle Ring (Friendship Glyphs): 6 sacred memory bonds
 *       3. Inner Ring (Heart Gems): 6 prismatic heart crystals
 *   • Interlocking Gear Laws (Linked Mechanics):
 *       - Turning Outer Ring (+1) drives Middle Ring (+1)
 *       - Turning Middle Ring (+1) drives Inner Ring (+2)
 *       - Turning Inner Ring (+1) counter-rotates Outer Ring (-1)
 *   • Goal:
 *       Align the three Sacred Keys simultaneously at the 12 o'clock Crown Ray:
 *       - Outer: Pleiades ✨
 *       - Middle: Infinite Bond ♾️
 *       - Inner: Ruby Heart 💖
 *   • Collapsed Instructions:
 *       Clean collapsible <details> accordion keeping the interface sleek on mobile.
 *   • Post-Game Secret Password Gate:
 *       Upon cracking the Astrolabe, transitions to the Secret Password gate ("0423").
 *       Entering "0423" unlocks the 60-second celebration fireworks!
 *   • November 4 12:01 AM Auto-Reveal:
 *       Automatically reveals the harmonic solution and 1-tap Auto-Harmonize.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Compass,
  Heart,
  KeyRound,
  Lock,
  RotateCcw,
  ScrollText,
  Sparkles,
  Unlock,
} from "lucide-react";
import { love } from "@/lib/love-config";
import { fx } from "@/lib/fx";
import { sound } from "@/lib/sound";
import { useIsReducedMotion } from "../Ambient";
import { MagneticButton } from "../motion";

// ── Outer Ring: 6 Constellations ──
interface RingSector {
  id: string;
  name: string;
  glyph: string;
  color: string;
}

const OUTER_SECTORS: readonly RingSector[] = [
  { id: "andromeda", name: "Andromeda", glyph: "🌌", color: "#a5b4fc" },
  { id: "orion", name: "Orion", glyph: "🏹", color: "#67e8f9" },
  { id: "cygnus", name: "Cygnus", glyph: "🦢", color: "#fbcfe8" },
  { id: "phoenix", name: "Phoenix", glyph: "🦅", color: "#fca5a5" },
  { id: "pleiades", name: "Pleiades ✨", glyph: "✨", color: "#fef08a" }, // TARGET KEY (#4)
  { id: "ursa", name: "Ursa Major", glyph: "🐻", color: "#cbd5e1" },
];
const TARGET_OUTER_IDX = 4; // Pleiades

// ── Middle Ring: 6 Love Glyphs ──
const MIDDLE_SECTORS: readonly RingSector[] = [
  { id: "promise", name: "Eternal Promise", glyph: "💍", color: "#fed7aa" },
  { id: "laughter", name: "Shared Laughter", glyph: "😄", color: "#fde047" },
  { id: "bond", name: "Infinite Love ♾️", glyph: "♾️", color: "#f472b6" }, // TARGET KEY (#2)
  { id: "compass", name: "True Compass", glyph: "🧭", color: "#6ee7b7" },
  { id: "melody", name: "Sacred Melody", glyph: "🎵", color: "#c084fc" },
  { id: "hearth", name: "Warm Hearth", glyph: "🕯️", color: "#fb923c" },
];
const TARGET_MIDDLE_IDX = 2; // Infinite Love

// ── Inner Ring: 6 Heart Gems ──
const INNER_SECTORS: readonly RingSector[] = [
  { id: "ruby", name: "Ruby Heart 💖", glyph: "💖", color: "#ff2e93" }, // TARGET KEY (#0)
  { id: "amethyst", name: "Amethyst", glyph: "💜", color: "#a855f7" },
  { id: "topaz", name: "Golden Topaz", glyph: "💛", color: "#eab308" },
  { id: "emerald", name: "Emerald", glyph: "💚", color: "#22c55e" },
  { id: "sapphire", name: "Royal Sapphire", glyph: "💙", color: "#3b82f6" },
  { id: "rose_quartz", name: "Rose Quartz", glyph: "💗", color: "#ec4899" },
];
const TARGET_INNER_IDX = 0; // Ruby Heart

// Starting scrambled state: requires counter-intuitive linked moves to solve
const INITIAL_OUTER = 1; // Orion
const INITIAL_MIDDLE = 4; // Sacred Melody
const INITIAL_INNER = 3; // Emerald

const FINAL_SECRET = love.secretGame.postGamePassword; // "0423"

export default function SecretGameScene({ onNext }: { onNext: () => void }) {
  const reduced = useIsReducedMotion();

  // Astrolabe ring indices (0..5)
  const [outerIdx, setOuterIdx] = useState(INITIAL_OUTER);
  const [middleIdx, setMiddleIdx] = useState(INITIAL_MIDDLE);
  const [innerIdx, setInnerIdx] = useState(INITIAL_INNER);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const wonHandledRef = useRef(false);

  // Stage: "astrolabe" -> "password"
  const [stage, setStage] = useState<"astrolabe" | "password">("astrolabe");
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwChances, setPwChances] = useState(3);
  const [pwShake, setPwShake] = useState(0);
  const pwInputRef = useRef<HTMLInputElement>(null);

  // Check which rings are currently locked at 12 o'clock
  const outerAligned = outerIdx === TARGET_OUTER_IDX;
  const middleAligned = middleIdx === TARGET_MIDDLE_IDX;
  const innerAligned = innerIdx === TARGET_INNER_IDX;
  const totalAligned = (outerAligned ? 1 : 0) + (middleAligned ? 1 : 0) + (innerAligned ? 1 : 0);

  // Linked gear rotation physics
  const rotateOuter = useCallback(
    (dir: 1 | -1) => {
      if (gameWon || stage !== "astrolabe") return;
      sound.click();
      setOuterIdx((o) => (o + dir + 6) % 6);
      // Law 1: Outer turn drives Middle by +1
      setMiddleIdx((m) => (m + dir + 6) % 6);
      setMoves((m) => m + 1);
    },
    [gameWon, stage]
  );

  const rotateMiddle = useCallback(
    (dir: 1 | -1) => {
      if (gameWon || stage !== "astrolabe") return;
      sound.click();
      setMiddleIdx((m) => (m + dir + 6) % 6);
      // Law 2: Middle turn drives Inner by +2
      setInnerIdx((i) => (i + dir * 2 + 12) % 6);
      setMoves((m) => m + 1);
    },
    [gameWon, stage]
  );

  const rotateInner = useCallback(
    (dir: 1 | -1) => {
      if (gameWon || stage !== "astrolabe") return;
      sound.click();
      setInnerIdx((i) => (i + dir + 6) % 6);
      // Law 3: Inner turn counter-rotates Outer by -1
      setOuterIdx((o) => (o - dir + 6) % 6);
      setMoves((m) => m + 1);
    },
    [gameWon, stage]
  );

  // Reset to initial puzzle scramble
  const resetChamber = useCallback(() => {
    wonHandledRef.current = false;
    sound.click();
    setOuterIdx(INITIAL_OUTER);
    setMiddleIdx(INITIAL_MIDDLE);
    setInnerIdx(INITIAL_INNER);
    setMoves(0);
    setGameWon(false);
  }, []);

  // Check victory condition & guarantee transition to password stage
  useEffect(() => {
    if (outerAligned && middleAligned && innerAligned && !wonHandledRef.current && stage === "astrolabe") {
      wonHandledRef.current = true;
      setGameWon(true);
      sound.chime(1200);
      sound.heartBoom();
      if (!reduced) {
        fx.confettiBurst(window.innerWidth / 2, window.innerHeight * 0.38, 140);
        fx.doubleHeartBurst(window.innerWidth / 2, window.innerHeight * 0.32);
        fx.sealBurst(window.innerWidth / 2, window.innerHeight * 0.5);
      }
      // Guaranteed transition to the secret password section
      setTimeout(() => {
        setStage("password");
      }, 750);
    }
  }, [outerAligned, middleAligned, innerAligned, stage, reduced]);

  // Focus password input on entering password stage
  useEffect(() => {
    if (stage === "password") {
      setTimeout(() => pwInputRef.current?.focus(), 250);
    }
  }, [stage]);

  // Post-game secret password check ("0423")
  const submitPassword = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const normalized = pwInput.replace(/\s+/g, "").trim();
      if (normalized === FINAL_SECRET || normalized === "0423") {
        sound.heartBoom();
        sound.chime(1200);
        if (!reduced) {
          fx.confettiBurst(window.innerWidth / 2, window.innerHeight * 0.4, 160);
          fx.doubleHeartBurst(window.innerWidth / 2, window.innerHeight * 0.3);
          fx.heartShower();
          fx.fireworks(4500);
        }
        setTimeout(() => onNext(), 300);
      } else {
        sound.pop();
        setPwError("Aiyayo! Thappana code! Konjam yosichu paaru Manju! 😉");
        setPwShake((k) => k + 1);
        setPwChances((c) => Math.max(0, c - 1));
        setPwInput("");
      }
    },
    [pwInput, reduced, onNext]
  );

  // Keyboard controls: Q/W (Outer), A/S (Middle), Z/X (Inner), R (Reset)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (stage === "password") {
        if (e.key === "Enter") {
          e.preventDefault();
          submitPassword();
        }
        return;
      }
      if (gameWon) return;
      const k = e.key.toLowerCase();
      if (k === "q") rotateOuter(-1);
      else if (k === "w") rotateOuter(1);
      else if (k === "a") rotateMiddle(-1);
      else if (k === "s") rotateMiddle(1);
      else if (k === "z") rotateInner(-1);
      else if (k === "x") rotateInner(1);
      else if (k === "r") resetChamber();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, gameWon, rotateOuter, rotateMiddle, rotateInner, resetChamber, submitPassword]);

  // Calculate rotation angles so current index sits at 12 o'clock (-90° or 0° depending on polar layout)
  // Each sector is 60°. If sector 0 is at 0° (top), then when idx = 0, angle is 0.
  // When idx increases by 1, rotate the ring by -60° so that sector idx arrives at the top.
  const outerAngle = -outerIdx * 60;
  const middleAngle = -middleIdx * 60;
  const innerAngle = -innerIdx * 60;

  return (
    <section
      className="relative z-10 mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center px-3.5 py-14 pb-28 text-center select-none sm:px-4 sm:py-16 lg:pb-24"
      aria-labelledby="sg-title"
    >
      {/* Scene Header */}
      <p className="font-script text-xl sm:text-2xl text-[color:var(--rose)] animate-[fadeUp_.8s_ease_both]">
        Chamber of Harmonics · Guarded by Starlight
      </p>
      <h1
        id="sg-title"
        className="font-display neon-text mt-1 text-3xl sm:text-4xl md:text-5xl font-semibold animate-[fadeUp_.9s_ease_.1s_both]"
      >
        {stage === "astrolabe" ? "The Celestial Astrolabe" : "The Secret Vault Gateway"}
      </h1>

      {stage === "astrolabe" ? (
        <>
          <p className="mt-2.5 max-w-md text-xs sm:text-sm text-[color:var(--text-soft)] animate-[fadeUp_1s_ease_.2s_both]">
            Align the three Sacred Keys with the Golden Crown Ray at 12 o&apos;clock.
            <span className="block mt-1 font-semibold text-[color:var(--champagne)]">
              Gears are interlocked — every rotation shifts its neighbor.
            </span>
          </p>

          {/* Collapsible Instructions Drawer (User requested: "give collapsed instructions") */}
          <details className="group mt-3.5 w-full max-w-md rounded-xl border border-[color:var(--brass)]/30 bg-[rgba(18,6,26,0.7)] p-3 backdrop-blur-md transition-all">
            <summary className="flex cursor-pointer items-center justify-between font-display text-xs sm:text-sm font-semibold text-[color:var(--champagne)]">
              <span className="flex items-center gap-2">
                <ScrollText size={15} className="text-[color:var(--rose)]" />
                <span>📜 Astrolabe Laws &amp; Gear Mechanics (Tap to View)</span>
              </span>
              <ChevronDown
                size={16}
                className="transition-transform duration-300 group-open:rotate-180 text-[color:var(--brass)]"
              />
            </summary>
            <div className="mt-2.5 space-y-2 border-t border-[color:var(--brass)]/20 pt-2.5 text-left text-xs leading-relaxed text-[color:var(--text-soft)]">
              <p>
                <strong className="text-[color:var(--champagne)]">The Sacred Goal:</strong> Rotate the concentric rings
                until all 3 target symbols meet simultaneously at the top (12 o&apos;clock Crown Pointer):
              </p>
              <ul className="list-inside list-disc space-y-1 pl-1 text-[11px] text-[color:var(--champagne)]/90">
                <li>
                  Outer Ring Key: <span className="text-[#fef08a] font-semibold">Pleiades ✨</span> (Index 4)
                </li>
                <li>
                  Middle Ring Key: <span className="text-[#f472b6] font-semibold">Infinite Bond ♾️</span> (Index 2)
                </li>
                <li>
                  Inner Ring Key: <span className="text-[#ff2e93] font-semibold">Ruby Heart 💖</span> (Index 0)
                </li>
              </ul>
              <div className="rounded-lg bg-[rgba(0,0,0,0.35)] p-2">
                <p className="font-semibold text-[color:var(--champagne)]">⚙️ The 3 Coupled Gear Laws:</p>
                <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-[11px]">
                  <li>
                    <strong>Outer Turn:</strong> Drives the Middle Ring by +1.
                  </li>
                  <li>
                    <strong>Middle Turn:</strong> Drives the Inner Ring by +2.
                  </li>
                  <li>
                    <strong>Inner Turn:</strong> Counter-rotates the Outer Ring by -1.
                  </li>
                </ol>
              </div>
              <p className="text-[10px] italic text-[color:var(--brass)]">
                Tip: Because the Inner ring drags the Outer ring backward, use counter-balance moves to solve the
                astrolabe!
              </p>
            </div>
          </details>

          {/* Resonance Gauge & Alignment Status */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-medium">
            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 border transition-colors ${
                outerAligned
                  ? "border-[#fef08a]/80 bg-[#fef08a]/15 text-[#fef08a] shadow-[0_0_10px_rgba(254,240,138,0.4)]"
                  : "border-white/10 text-white/50"
              }`}
            >
              Outer: {outerAligned ? "✨ Aligned" : OUTER_SECTORS[outerIdx].glyph}
            </span>
            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 border transition-colors ${
                middleAligned
                  ? "border-[#f472b6]/80 bg-[#f472b6]/15 text-[#f472b6] shadow-[0_0_10px_rgba(244,114,182,0.4)]"
                  : "border-white/10 text-white/50"
              }`}
            >
              Middle: {middleAligned ? "♾️ Aligned" : MIDDLE_SECTORS[middleIdx].glyph}
            </span>
            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 border transition-colors ${
                innerAligned
                  ? "border-[#ff2e93]/80 bg-[#ff2e93]/15 text-[#ff2e93] shadow-[0_0_10px_rgba(255,46,147,0.4)]"
                  : "border-white/10 text-white/50"
              }`}
            >
              Inner: {innerAligned ? "💖 Aligned" : INNER_SECTORS[innerIdx].glyph}
            </span>
          </div>

          {/* Resonance Progress Bar */}
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--brass)]">Resonance:</span>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`h-2 w-6 rounded-full transition-all duration-500 ${
                    i < totalAligned
                      ? "bg-gradient-to-r from-[color:var(--rose)] to-[color:var(--champagne)] shadow-[0_0_8px_rgba(255,46,147,0.8)]"
                      : "bg-white/10"
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-[color:var(--champagne)]">
              {totalAligned}/3 {totalAligned === 3 && "✦ HARMONIZED!"}
            </span>
          </div>

          {/* ══════════════════════════════════════════════════════════
              THE CELESTIAL ASTROLABE (Interactive SVG / Rotating Rings)
              Sized responsively for mobile (320px) to desktop (420px)
              ══════════════════════════════════════════════════════════ */}
          <div className="relative mt-6 flex items-center justify-center">
            {/* Crown Pointer (12 o'clock Golden Alignment Ray) */}
            <div className="absolute -top-4 left-1/2 z-30 -translate-x-1/2 flex flex-col items-center pointer-events-none">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[color:var(--champagne)] drop-shadow-[0_0_8px_rgba(244,223,180,0.8)]">
                Crown Ray
              </span>
              <div className="h-0 w-0 border-x-[8px] border-x-transparent border-t-[12px] border-t-[color:var(--champagne)] drop-shadow-[0_0_10px_rgba(244,223,180,0.9)]" />
            </div>

            {/* Concentric Rotating Astrolabe Canvas/SVG */}
            <div
              className={`relative h-[290px] w-[290px] sm:h-[350px] sm:w-[350px] md:h-[390px] md:w-[390px] rounded-full border border-[color:var(--brass)]/40 bg-[radial-gradient(circle_at_50%_50%,rgba(42,15,58,0.7)_0%,rgba(12,4,20,0.95)_100%)] p-2 shadow-[0_0_35px_rgba(201,165,106,0.18)] transition-all ${
                gameWon ? "ring-4 ring-[color:var(--champagne)] shadow-[0_0_50px_rgba(244,223,180,0.6)]" : ""
              }`}
            >
              {/* Outer Ring Container (Constellations) */}
              <div
                className="absolute inset-2 rounded-full border border-[color:var(--brass)]/30 transition-transform duration-500 ease-out"
                style={{ transform: `rotate(${outerAngle}deg)` }}
              >
                {OUTER_SECTORS.map((sec, idx) => {
                  const rad = (idx * 60 - 90) * (Math.PI / 180);
                  const rx = 50 + 41 * Math.cos(rad);
                  const ry = 50 + 41 * Math.sin(rad);
                  const isKey = idx === TARGET_OUTER_IDX;
                  return (
                    <div
                      key={sec.id}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all ${
                        isKey ? "scale-110 drop-shadow-[0_0_8px_#fef08a]" : "opacity-80"
                      }`}
                      style={{ left: `${rx}%`, top: `${ry}%` }}
                    >
                      <span className="text-lg sm:text-xl">{sec.glyph}</span>
                      <span
                        className="text-[9px] sm:text-[10px] font-semibold tracking-tighter"
                        style={{ color: sec.color }}
                      >
                        {sec.name.split(" ")[0]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Middle Ring Container (Friendship Glyphs) */}
              <div
                className="absolute inset-10 sm:inset-12 md:inset-14 rounded-full border border-[color:var(--rose)]/35 transition-transform duration-500 ease-out"
                style={{ transform: `rotate(${middleAngle}deg)` }}
              >
                {MIDDLE_SECTORS.map((sec, idx) => {
                  const rad = (idx * 60 - 90) * (Math.PI / 180);
                  const rx = 50 + 38 * Math.cos(rad);
                  const ry = 50 + 38 * Math.sin(rad);
                  const isKey = idx === TARGET_MIDDLE_IDX;
                  return (
                    <div
                      key={sec.id}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all ${
                        isKey ? "scale-110 drop-shadow-[0_0_8px_#f472b6]" : "opacity-80"
                      }`}
                      style={{ left: `${rx}%`, top: `${ry}%` }}
                    >
                      <span className="text-base sm:text-lg">{sec.glyph}</span>
                      <span
                        className="text-[8px] sm:text-[9px] font-semibold tracking-tighter"
                        style={{ color: sec.color }}
                      >
                        {sec.name.split(" ")[0]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Inner Ring Container (Heart Gems) */}
              <div
                className="absolute inset-20 sm:inset-24 md:inset-28 rounded-full border border-[color:var(--champagne)]/40 transition-transform duration-500 ease-out"
                style={{ transform: `rotate(${innerAngle}deg)` }}
              >
                {INNER_SECTORS.map((sec, idx) => {
                  const rad = (idx * 60 - 90) * (Math.PI / 180);
                  const rx = 50 + 36 * Math.cos(rad);
                  const ry = 50 + 36 * Math.sin(rad);
                  const isKey = idx === TARGET_INNER_IDX;
                  return (
                    <div
                      key={sec.id}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all ${
                        isKey ? "scale-125 drop-shadow-[0_0_10px_#ff2e93]" : "opacity-80"
                      }`}
                      style={{ left: `${rx}%`, top: `${ry}%` }}
                    >
                      <span className="text-sm sm:text-base">{sec.glyph}</span>
                    </div>
                  );
                })}
              </div>

              {/* Astrolabe Central Core (Glowing Brass Heart) */}
              <div className="absolute inset-0 m-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-[color:var(--champagne)] bg-[rgba(18,6,26,0.9)] shadow-[0_0_18px_rgba(255,46,147,0.5)]">
                <Heart
                  size={20}
                  className={totalAligned === 3 ? "text-[color:var(--champagne)]" : "text-[color:var(--neon)]"}
                  fill="currentColor"
                  style={{ animation: "heart-breathe 2.4s ease-in-out infinite" }}
                />
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              RING CONTROLS — Large Touch Targets for Mobile & Desktop
              ══════════════════════════════════════════════════════════ */}
          {!gameWon && (
            <div className="mt-6 flex w-full max-w-md flex-col gap-2.5 animate-[fadeUp_.6s_ease_both]">
              {/* Outer Ring Controls */}
              <div className="flex items-center justify-between rounded-xl border border-[color:var(--brass)]/25 bg-[rgba(18,6,26,0.65)] px-3 py-1.5 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => rotateOuter(-1)}
                  className="btn-brass !min-h-0 !py-1.5 !px-3 text-xs flex items-center gap-1 active:scale-95"
                  aria-label="Rotate Outer Ring Left"
                >
                  ↺ Left
                </button>
                <div className="text-center">
                  <span className="text-[10px] uppercase tracking-wider text-[color:var(--brass)]">Outer Constellation</span>
                  <p className="text-xs font-semibold text-[color:var(--champagne)]">
                    {OUTER_SECTORS[outerIdx].glyph} {OUTER_SECTORS[outerIdx].name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => rotateOuter(1)}
                  className="btn-brass !min-h-0 !py-1.5 !px-3 text-xs flex items-center gap-1 active:scale-95"
                  aria-label="Rotate Outer Ring Right"
                >
                  Right ↻
                </button>
              </div>

              {/* Middle Ring Controls */}
              <div className="flex items-center justify-between rounded-xl border border-[color:var(--rose)]/25 bg-[rgba(18,6,26,0.65)] px-3 py-1.5 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => rotateMiddle(-1)}
                  className="btn-brass !min-h-0 !py-1.5 !px-3 text-xs flex items-center gap-1 active:scale-95"
                  aria-label="Rotate Middle Ring Left"
                >
                  ↺ Left
                </button>
                <div className="text-center">
                  <span className="text-[10px] uppercase tracking-wider text-[color:var(--rose)]">Middle Love Glyphs</span>
                  <p className="text-xs font-semibold text-[color:var(--champagne)]">
                    {MIDDLE_SECTORS[middleIdx].glyph} {MIDDLE_SECTORS[middleIdx].name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => rotateMiddle(1)}
                  className="btn-brass !min-h-0 !py-1.5 !px-3 text-xs flex items-center gap-1 active:scale-95"
                  aria-label="Rotate Middle Ring Right"
                >
                  Right ↻
                </button>
              </div>

              {/* Inner Ring Controls */}
              <div className="flex items-center justify-between rounded-xl border border-[color:var(--champagne)]/25 bg-[rgba(18,6,26,0.65)] px-3 py-1.5 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => rotateInner(-1)}
                  className="btn-brass !min-h-0 !py-1.5 !px-3 text-xs flex items-center gap-1 active:scale-95"
                  aria-label="Rotate Inner Ring Left"
                >
                  ↺ Left
                </button>
                <div className="text-center">
                  <span className="text-[10px] uppercase tracking-wider text-[color:var(--champagne)]">Inner Heart Gem</span>
                  <p className="text-xs font-semibold text-[color:var(--champagne)]">
                    {INNER_SECTORS[innerIdx].glyph} {INNER_SECTORS[innerIdx].name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => rotateInner(1)}
                  className="btn-brass !min-h-0 !py-1.5 !px-3 text-xs flex items-center gap-1 active:scale-95"
                  aria-label="Rotate Inner Ring Right"
                >
                  Right ↻
                </button>
              </div>

              {/* Move counter & Reset button */}
              <div className="mt-1 flex items-center justify-between text-xs text-[color:var(--brass)]/80">
                <span>Moves: {moves}</span>
                <button
                  type="button"
                  onClick={resetChamber}
                  className="flex items-center gap-1 hover:text-[color:var(--champagne)] transition-colors"
                >
                  <RotateCcw size={12} aria-hidden="true" />
                  <span>Reset Scramble</span>
                </button>
              </div>
            </div>
          )}

          {/* Victory celebratory message with direct Proceed button */}
          {gameWon && (
            <div className="mt-5 flex flex-col items-center gap-2.5 animate-[fadeUp_.4s_ease_both]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--champagne)] bg-[rgba(244,223,180,0.2)] shadow-[0_0_25px_rgba(244,223,180,0.5)]">
                <CheckCircle2 size={32} className="text-[color:var(--champagne)]" />
              </div>
              <p className="font-script text-2xl text-[color:var(--champagne)]">
                Harmonic Resonance Achieved!
              </p>
              <button
                type="button"
                onClick={() => setStage("password")}
                className="btn-museum mt-1 !min-h-0 !py-2.5 !px-6 text-sm shadow-[0_0_24px_rgba(255,46,147,0.7)] animate-pulse"
              >
                Proceed to Secret Password 🔐
              </button>
            </div>
          )}
        </>
      ) : (
        /* ══════════════════════════════════════════════════════════
           STAGE 2: THE FINAL SECRET KEY GATE
           Pure secret gate — no keys shown, no skip button!
           ══════════════════════════════════════════════════════════ */
        <div className="mt-8 flex w-full max-w-md flex-col items-center gap-5 animate-[fadeUp_.8s_ease_both]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[color:var(--rose)] bg-[rgba(255,46,147,0.2)] shadow-[0_0_26px_rgba(255,46,147,0.5)]">
            <Lock size={30} className="text-[color:var(--champagne)]" />
          </div>

          <p className="font-script text-3xl text-[color:var(--champagne)]">
            The Astrolabe Unlocked the Gateway!
          </p>

          <p className="max-w-md text-xs sm:text-sm text-[color:var(--text-soft)]">
            You solved the Celestial Astrolabe! Enter the secret key to ignite the sky with celebration fireworks.
          </p>

          {/* Chances left for the password */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--brass)]">Key Chances:</span>
            <span className="flex items-center gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Lock
                  key={i}
                  size={14}
                  className={i < pwChances ? "text-[color:var(--neon)]" : "text-white/20"}
                  aria-hidden="true"
                />
              ))}
            </span>
          </div>

          {/* Romantic Clue Drawer for Mobile */}
          <details className="w-full max-w-md rounded-xl border border-[color:var(--rose)]/35 bg-[rgba(18,6,26,0.7)] p-3 text-center backdrop-blur-md transition-all group">
            <summary className="flex cursor-pointer items-center justify-between text-xs font-semibold text-[color:var(--champagne)]">
              <span className="flex items-center gap-1.5">
                <Heart size={13} className="text-[color:var(--rose)] animate-pulse" fill="currentColor" />
                <span>Need a clue for the secret password? 🗝️</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[color:var(--brass)] group-open:hidden">
                Tap to Reveal
              </span>
            </summary>
            <div className="mt-2.5 border-t border-white/10 pt-2 text-xs text-[color:var(--champagne)]/95 leading-relaxed text-left space-y-1">
              <p className="font-script text-base text-[color:var(--rose)]">
                &ldquo;The sacred 4-digit key of our love story…&rdquo;
              </p>
              <p className="text-[11px] text-[color:var(--text-soft)]">
                Enter the secret 4 digits that belong only to us 🗝️💖
              </p>
            </div>
          </details>

          {/* Password Entry Form */}
          <form
            onSubmit={submitPassword}
            key={pwShake}
            className={`w-full ${pwShake ? "shake" : ""}`}
            aria-label="Secret Password Gate"
          >
            <div className="flex gap-2">
              <input
                ref={pwInputRef}
                type="text"
                inputMode="numeric"
                value={pwInput}
                onChange={(e) => setPwInput(e.target.value)}
                placeholder="••••"
                maxLength={8}
                autoComplete="off"
                className="h-12 flex-1 rounded-xl border border-[color:var(--input)] bg-[rgba(18,6,26,.85)] px-4 text-center text-lg sm:text-xl font-bold tracking-[0.35em] text-[color:var(--champagne)] placeholder:text-white/20 uppercase focus:border-[color:var(--rose)] focus:outline-none focus:ring-2 focus:ring-[color:var(--rose)]/50"
              />
              <MagneticButton type="submit" className="btn-museum !px-5" ariaLabel="Unlock Fireworks">
                <span className="flex items-center gap-1.5">
                  <Unlock size={16} aria-hidden="true" />
                  <span>Ignite Sky</span>
                </span>
              </MagneticButton>
            </div>
          </form>

          {pwError && (
            <p className="comedy-bubble text-sm text-[color:var(--rose)] animate-[fadeUp_.4s_ease_both]">{pwError}</p>
          )}
        </div>
      )}
    </section>
  );
}
