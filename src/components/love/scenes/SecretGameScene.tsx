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
import { isPasswordAutoVisible, love } from "@/lib/love-config";
import { fx } from "@/lib/fx";
import { sound } from "@/lib/sound";
import { usePasswordGate } from "@/lib/usePasswordGate";
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

// Starting scrambled state: requires 8 linked moves to solve (Depth 8 hard mode)
// Secret Solution: 3x Outer Right, 3x Middle Right, 2x Inner Right!
const INITIAL_OUTER = 4; // Polaris
const INITIAL_MIDDLE = 1; // Golden Key
const INITIAL_INNER = 4; // Royal Sapphire

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

  // Stages: "astrolabe" -> "password" (0423) -> "rest" -> "celebration" (Pmraanejeu)
  const [stage, setStage] = useState<"astrolabe" | "password" | "rest" | "celebration">("astrolabe");

  // 0423 password state (3 chances, 2 minutes cooldown)
  const vaultGate = usePasswordGate("fmw.gate.vault");
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwShake, setPwShake] = useState(0);
  const pwInputRef = useRef<HTMLInputElement>(null);

  // Pmraanejeu celebration password state (3 chances, 2 minutes cooldown)
  const celebGate = usePasswordGate("fmw.gate.celebration");
  const [celebInput, setCelebInput] = useState("");
  const [celebError, setCelebError] = useState("");
  const [celebShake, setCelebShake] = useState(0);
  const celebInputRef = useRef<HTMLInputElement>(null);

  // Secret Creator Shortcut (triple tap on Crown Ray)
  const [crownTaps, setCrownTaps] = useState(0);

  // Check which rings are currently locked at 12 o'clock
  const outerAligned = outerIdx === TARGET_OUTER_IDX;
  const middleAligned = middleIdx === TARGET_MIDDLE_IDX;
  const innerAligned = innerIdx === TARGET_INNER_IDX;
  const totalAligned = (outerAligned ? 1 : 0) + (middleAligned ? 1 : 0) + (innerAligned ? 1 : 0);

  // Automatic solve after November 4, 12:01 AM (or ?reveal=1)
  useEffect(() => {
    if (stage === "astrolabe" && !gameWon && isPasswordAutoVisible()) {
      const timer = setTimeout(() => {
        sound.chime(1200);
        sound.heartBoom();
        setOuterIdx(TARGET_OUTER_IDX);
        setMiddleIdx(TARGET_MIDDLE_IDX);
        setInnerIdx(TARGET_INNER_IDX);
        setGameWon(true);
        if (!reduced) {
          fx.confettiBurst(window.innerWidth / 2, window.innerHeight * 0.38, 140);
          fx.doubleHeartBurst(window.innerWidth / 2, window.innerHeight * 0.32);
        }
        setTimeout(() => setStage("password"), 900);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [stage, gameWon, reduced]);

  // Linked gear rotation physics (Hard Mode)
  const rotateOuter = useCallback(
    (dir: 1 | -1) => {
      if (gameWon || stage !== "astrolabe") return;
      sound.click();
      setOuterIdx((o) => (o + dir + 6) % 6);
      // Outer drives Middle by +2, Inner by -1
      setMiddleIdx((m) => (m + dir * 2 + 12) % 6);
      setInnerIdx((i) => (i - dir + 6) % 6);
      setMoves((m) => m + 1);
    },
    [gameWon, stage]
  );

  const rotateMiddle = useCallback(
    (dir: 1 | -1) => {
      if (gameWon || stage !== "astrolabe") return;
      sound.click();
      setMiddleIdx((m) => (m + dir + 6) % 6);
      // Middle drives Inner by +3, Outer by +1
      setInnerIdx((i) => (i + dir * 3 + 18) % 6);
      setOuterIdx((o) => (o + dir + 6) % 6);
      setMoves((m) => m + 1);
    },
    [gameWon, stage]
  );

  const rotateInner = useCallback(
    (dir: 1 | -1) => {
      if (gameWon || stage !== "astrolabe") return;
      sound.click();
      setInnerIdx((i) => (i + dir + 6) % 6);
      // Inner drives Outer by -2, Middle by -1
      setOuterIdx((o) => (o - dir * 2 + 12) % 6);
      setMiddleIdx((m) => (m - dir + 6) % 6);
      setMoves((m) => m + 1);
    },
    [gameWon, stage]
  );

  // Secret creator tap on the crown ray: 3 taps instant solve!
  const tapCrown = useCallback(() => {
    sound.click();
    const next = crownTaps + 1;
    setCrownTaps(next);
    if (next >= 3) {
      sound.chime(1200);
      sound.heartBoom();
      setOuterIdx(TARGET_OUTER_IDX);
      setMiddleIdx(TARGET_MIDDLE_IDX);
      setInnerIdx(TARGET_INNER_IDX);
      setGameWon(true);
      if (!reduced) {
        fx.confettiBurst(window.innerWidth / 2, window.innerHeight * 0.38, 140);
        fx.doubleHeartBurst(window.innerWidth / 2, window.innerHeight * 0.32);
      }
      setTimeout(() => setStage("password"), 800);
      setCrownTaps(0);
    }
  }, [crownTaps, reduced]);

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
      // Transition to the secret password section
      setTimeout(() => {
        setStage("password");
      }, 750);
    }
  }, [outerAligned, middleAligned, innerAligned, stage, reduced]);

  // Focus password inputs on entering respective stages
  useEffect(() => {
    if (stage === "password") {
      setTimeout(() => pwInputRef.current?.focus(), 250);
    } else if (stage === "celebration") {
      setTimeout(() => celebInputRef.current?.focus(), 250);
    }
  }, [stage]);

  // Post-game secret password check ("0423") -> transitions to rest stage
  const submitPassword = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (vaultGate.isLocked) return;
      const normalized = pwInput.replace(/\s+/g, "").trim();
      if (normalized === FINAL_SECRET || normalized === "0423") {
        vaultGate.recordSuccess();
        sound.heartBoom();
        sound.chime(1100);
        if (!reduced) {
          fx.confettiBurst(window.innerWidth / 2, window.innerHeight * 0.4, 120);
          fx.doubleHeartBurst(window.innerWidth / 2, window.innerHeight * 0.3);
          fx.heartShower();
        }
        // Move to rest scene with gentle animations
        setStage("rest");
      } else {
        sound.pop();
        vaultGate.recordFail();
        if (vaultGate.chances <= 1) {
          setPwError("All 3 chances used! Vault sealed for 2 minutes! 🔒");
        } else {
          setPwError(`Aiyayo! Thappana code! Konjam yosichu paaru Manju! (${vaultGate.chances - 1} chances left) 😉`);
        }
        setPwShake((k) => k + 1);
        setPwInput("");
      }
    },
    [pwInput, vaultGate, reduced]
  );

  // Final celebration password check ("Pmraanejeu") -> triggers fireworks
  const submitCelebration = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (celebGate.isLocked) return;
      const clean = celebInput.replace(/\s+/g, "").trim().toLowerCase();
      if (clean === "pmraanejeu") {
        celebGate.recordSuccess();
        sound.heartBoom();
        sound.chime(1200);
        if (!reduced) {
          fx.confettiBurst(window.innerWidth / 2, window.innerHeight * 0.4, 160);
          fx.doubleHeartBurst(window.innerWidth / 2, window.innerHeight * 0.3);
          fx.heartShower();
          fx.fireworks(5000);
        }
        setTimeout(() => onNext(), 400);
      } else {
        sound.pop();
        celebGate.recordFail();
        if (celebGate.chances <= 1) {
          setCelebError("All 3 chances used! Celebration gate sealed for 2 minutes! 🔒");
        } else {
          setCelebError(`Aiyayo! Thappana celebration password! Try again Manju! (${celebGate.chances - 1} chances left) 😉`);
        }
        setCelebShake((k) => k + 1);
        setCelebInput("");
      }
    },
    [celebInput, celebGate, reduced, onNext]
  );

  // Keyboard controls: Q/W (Outer), A/S (Middle), Z/X (Inner), R (Reset), Enter for forms
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (stage === "password") {
        if (e.key === "Enter") {
          e.preventDefault();
          submitPassword();
        }
        return;
      }
      if (stage === "celebration") {
        if (e.key === "Enter") {
          e.preventDefault();
          submitCelebration();
        }
        return;
      }
      if (stage === "rest") {
        if (e.key === "Enter") {
          e.preventDefault();
          sound.chime(950);
          setStage("celebration");
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
  }, [stage, gameWon, rotateOuter, rotateMiddle, rotateInner, resetChamber, submitPassword, submitCelebration]);

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
        {stage === "astrolabe"
          ? "The Celestial Astrolabe"
          : stage === "password"
            ? "The Secret Vault Gateway"
            : stage === "rest"
              ? "Chamber of Peaceful Rest"
              : "The Grand Celebration Gate"}
      </h1>

      {stage === "astrolabe" && (
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
                    <strong>Outer Turn:</strong> Drives the Middle Ring by +2, Inner Ring by -1.
                  </li>
                  <li>
                    <strong>Middle Turn:</strong> Drives the Inner Ring by +3, Outer Ring by +1.
                  </li>
                  <li>
                    <strong>Inner Turn:</strong> Counter-rotates the Outer Ring by -2, Middle Ring by -1.
                  </li>
                </ol>
              </div>
              <p className="text-[10px] italic text-[color:var(--brass)]">
                Tip: Because the gears are tightly coupled, calculate counter-balance moves to achieve resonance!
              </p>
            </div>
          </details>

          {/* Resonance Gauge & Alignment Status */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-medium">
            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 border transition-colors ${outerAligned
                ? "border-[#fef08a]/80 bg-[#fef08a]/15 text-[#fef08a] shadow-[0_0_10px_rgba(254,240,138,0.4)]"
                : "border-white/10 text-white/50"
                }`}
            >
              Outer: {outerAligned ? "✨ Aligned" : OUTER_SECTORS[outerIdx].glyph}
            </span>
            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 border transition-colors ${middleAligned
                ? "border-[#f472b6]/80 bg-[#f472b6]/15 text-[#f472b6] shadow-[0_0_10px_rgba(244,114,182,0.4)]"
                : "border-white/10 text-white/50"
                }`}
            >
              Middle: {middleAligned ? "♾️ Aligned" : MIDDLE_SECTORS[middleIdx].glyph}
            </span>
            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 border transition-colors ${innerAligned
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
                  className={`h-2 w-6 rounded-full transition-all duration-500 ${i < totalAligned
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
            {/* Crown Pointer (12 o'clock Golden Alignment Ray) - Click 3 times for creator shortcut */}
            <button
              type="button"
              onClick={tapCrown}
              title="Crown Ray"
              className="absolute -top-4 left-1/2 z-30 -translate-x-1/2 flex flex-col items-center cursor-pointer active:scale-95 transition-transform bg-transparent border-none p-1 focus:outline-none"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[color:var(--champagne)] drop-shadow-[0_0_8px_rgba(244,223,180,0.8)]">
                Crown Ray
              </span>
              <div className="h-0 w-0 border-x-[8px] border-x-transparent border-t-[12px] border-t-[color:var(--champagne)] drop-shadow-[0_0_10px_rgba(244,223,180,0.9)]" />
            </button>

            {/* Concentric Rotating Astrolabe Canvas/SVG */}
            <div
              className={`relative h-[290px] w-[290px] sm:h-[350px] sm:w-[350px] md:h-[390px] md:w-[390px] rounded-full border border-[color:var(--brass)]/40 bg-[radial-gradient(circle_at_50%_50%,rgba(42,15,58,0.7)_0%,rgba(12,4,20,0.95)_100%)] p-2 shadow-[0_0_35px_rgba(201,165,106,0.18)] transition-all ${gameWon ? "ring-4 ring-[color:var(--champagne)] shadow-[0_0_50px_rgba(244,223,180,0.6)]" : ""
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
                      className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all ${isKey ? "scale-110 drop-shadow-[0_0_8px_#fef08a]" : "opacity-80"
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
                      className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all ${isKey ? "scale-110 drop-shadow-[0_0_8px_#f472b6]" : "opacity-80"
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
                      className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all ${isKey ? "scale-125 drop-shadow-[0_0_10px_#ff2e93]" : "opacity-80"
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
      )}

      {/* ══════════════════════════════════════════════════════════
          STAGE 2: THE 0423 SECRET PASSWORD GATE
          ══════════════════════════════════════════════════════════ */}
      {stage === "password" && (
        <div className="mt-8 flex w-full max-w-md flex-col items-center gap-5 animate-[fadeUp_.8s_ease_both]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[color:var(--rose)] bg-[rgba(255,46,147,0.2)] shadow-[0_0_26px_rgba(255,46,147,0.5)]">
            <Lock size={30} className="text-[color:var(--champagne)]" />
          </div>

          <p className="font-script text-3xl text-[color:var(--champagne)]">
            The Astrolabe Unlocked the Gateway!
          </p>

          <p className="max-w-md text-xs sm:text-sm text-[color:var(--text-soft)]">
            You cracked the Celestial Astrolabe! Enter the secret key to proceed.
          </p>

          {/* Chances left for the password */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--brass)] font-semibold">Vault Chances:</span>
            <span className="flex items-center gap-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Lock
                  key={i}
                  size={14}
                  className={
                    i < vaultGate.chances
                      ? "text-[color:var(--neon)] drop-shadow-[0_0_6px_rgba(255,46,147,0.8)]"
                      : "text-white/20"
                  }
                  aria-hidden="true"
                />
              ))}
            </span>
          </div>

          {/* 2 minutes lock banner */}
          {vaultGate.isLocked && (
            <div className="w-full rounded-xl border border-red-500/40 bg-red-950/50 p-3 text-center text-xs text-red-200 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              <p className="font-bold flex items-center justify-center gap-1.5">
                <Lock size={14} />
                <span>Vault sealed for 2 minutes!</span>
              </p>
              <p className="text-xs text-[color:var(--champagne)] mt-1">
                Next chance unlocks in: <span className="font-mono font-bold text-base text-[color:var(--neon)]">{vaultGate.lockLeftText}</span>
              </p>
              <p className="text-[10px] text-white/60 mt-0.5">1 chance will be granted when the timer finishes.</p>
            </div>
          )}

          {!vaultGate.isLocked && vaultGate.chances < 3 && vaultGate.refillLeftText && (
            <p className="text-[10px] text-[color:var(--brass)] text-center -mt-2">
              Next extra chance in: <span className="font-mono font-semibold">{vaultGate.refillLeftText}</span>
            </p>
          )}

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
                disabled={vaultGate.isLocked}
                autoComplete="off"
                className="h-12 flex-1 rounded-xl border border-[color:var(--input)] bg-[rgba(18,6,26,.85)] px-4 text-center text-lg sm:text-xl font-bold tracking-[0.35em] text-[color:var(--champagne)] placeholder:text-white/20 uppercase focus:border-[color:var(--rose)] focus:outline-none focus:ring-2 focus:ring-[color:var(--rose)]/50 disabled:opacity-50"
              />
              <MagneticButton
                type="submit"
                className="btn-museum !px-5 disabled:opacity-40"
                ariaLabel="Unlock Vault"
                disabled={vaultGate.isLocked}
              >
                <span className="flex items-center gap-1.5">
                  <Unlock size={16} aria-hidden="true" />
                  <span>Unlock</span>
                </span>
              </MagneticButton>
            </div>
          </form>

          {pwError && (
            <p className="comedy-bubble text-sm text-[color:var(--rose)] animate-[fadeUp_.4s_ease_both]">{pwError}</p>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          STAGE 3: THE PEACEFUL REST CHAMBER
          Gentle animations & resting atmosphere for Manju
          ══════════════════════════════════════════════════════════ */}
      {stage === "rest" && (
        <div className="mt-6 flex w-full max-w-lg flex-col items-center gap-5 animate-[fadeUp_.8s_ease_both]">
          {/* Header badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--champagne)]/40 bg-[rgba(244,223,180,0.1)] px-3.5 py-1 text-xs font-medium text-[color:var(--champagne)]">
            <Sparkles size={14} className="text-[color:var(--champagne)] animate-spin" style={{ animationDuration: "6s" }} />
            <span>Chamber of Rest · Peaceful Starlight</span>
          </div>

          <h2 className="font-script text-3xl sm:text-4xl text-[color:var(--champagne)] drop-shadow-[0_0_15px_rgba(244,223,180,0.6)]">
            Take a Gentle Rest, Manju 🌙✨
          </h2>

          {/* Cozy animated resting scene illustration */}
          <div className="ornate-card relative w-full overflow-hidden p-6 sm:p-8 text-center flex flex-col items-center justify-center">
            {/* Ambient dreamy background aura */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(163,18,95,0.25)_0%,rgba(7,3,10,0.9)_75%)] pointer-events-none" />

            {/* Resting SVG Artwork */}
            <div className="relative z-10 my-2 flex items-center justify-center">
              <svg
                width="220"
                height="160"
                viewBox="0 0 220 160"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-[0_0_25px_rgba(255,126,182,0.4)]"
              >
                {/* Crescent Moon resting on a cloud */}
                <defs>
                  <linearGradient id="moonGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fff8d8" />
                    <stop offset="50%" stopColor="#ffd475" />
                    <stop offset="100%" stopColor="#f4a261" />
                  </linearGradient>
                  <linearGradient id="cloudGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                    <stop offset="100%" stopColor="rgba(163,18,95,0.25)" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Stars twinkling */}
                <g className="animate-pulse" style={{ animationDuration: "2.5s" }}>
                  <circle cx="28" cy="30" r="2" fill="#fef08a" />
                  <polygon points="45,15 47,21 53,23 47,25 45,31 43,25 37,23 43,21" fill="#fef08a" />
                  <circle cx="185" cy="25" r="2.5" fill="#f4dfb4" />
                  <polygon points="175,45 176.5,49 181,50 176.5,51 175,55 173.5,51 169,50 173.5,49" fill="#f4dfb4" />
                  <circle cx="105" cy="18" r="1.5" fill="#ffffff" />
                </g>

                {/* Crescent Moon with closed serene sleeping eye */}
                <g className="animate-[bounce_6s_ease-in-out_infinite]">
                  <path
                    d="M 110,25 A 42,42 0 1 0 148,82 A 35,35 0 0 1 110,25 Z"
                    fill="url(#moonGrad)"
                    filter="url(#glow)"
                  />
                  {/* Sleeping closed eye arc */}
                  <path
                    d="M 102,52 Q 107,56 112,52"
                    stroke="#5a0f2e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Rose cheek blush */}
                  <circle cx="107" cy="58" r="4" fill="#ff7eb6" opacity="0.6" />
                  {/* Nightcap / star tassel */}
                  <circle cx="147" cy="80" r="3" fill="#fef08a" className="animate-ping" style={{ animationDuration: "3s" }} />
                </g>

                {/* Cozy Cloud bed beneath the moon */}
                <g className="animate-[pulse_4s_ease-in-out_infinite]">
                  <path
                    d="M 40,115 C 30,115 20,125 25,138 C 30,148 45,150 55,148 C 65,152 85,154 100,148 C 115,153 145,153 160,146 C 175,150 195,145 198,134 C 200,122 185,115 175,115 C 168,102 145,98 132,106 C 122,98 98,96 85,106 C 72,100 50,102 40,115 Z"
                    fill="url(#cloudGrad)"
                    stroke="rgba(244,223,180,0.4)"
                    strokeWidth="1.5"
                  />
                </g>

                {/* Floating Hearts drifting up from sleep */}
                <g>
                  <path
                    d="M 65,85 C 65,82 62,80 59,80 C 56,80 54,82 54,85 C 54,90 65,97 65,97 C 65,97 76,90 76,85 C 76,82 74,80 71,80 C 68,80 65,82 65,85 Z"
                    fill="#ff2e93"
                    opacity="0.8"
                    transform="scale(0.8) translate(15, -10)"
                    className="animate-pulse"
                  />
                  <path
                    d="M 155,75 C 155,72 152,70 149,70 C 146,70 144,72 144,75 C 144,80 155,87 155,87 C 155,87 166,80 166,75 C 166,72 164,70 161,70 C 158,70 155,72 155,75 Z"
                    fill="#ff7eb6"
                    opacity="0.9"
                    transform="scale(0.7) translate(65, -5)"
                    className="animate-pulse"
                    style={{ animationDelay: "1s" }}
                  />
                </g>
              </svg>
            </div>

            {/* Resting note */}
            <div className="relative z-10 mt-3 max-w-sm space-y-2 text-center">
              <p className="font-script text-xl sm:text-2xl text-[color:var(--rose)] leading-snug">
                &ldquo;Romba kashtapattu astrolabe and 0423 secrets decode pannita... Ippo konjam relaxation yedu Manju!&rdquo;
              </p>
              <p className="text-xs sm:text-sm text-[color:var(--text-soft)] leading-relaxed">
                Take a peaceful breath, relax your mind, and feel all my warmth around you. When you are ready to witness the grand midnight fireworks, proceed to the final celebration gate.
              </p>
            </div>
          </div>

          {/* Action button to proceed to final celebration password */}
          <MagneticButton
            onClick={() => {
              sound.chime(950);
              setStage("celebration");
            }}
            className="btn-museum mt-2 !px-7 !py-3 text-sm sm:text-base shadow-[0_0_25px_rgba(255,46,147,0.7)] animate-pulse"
            ariaLabel="Proceed to Final Celebration Gate"
          >
            <span className="flex items-center gap-2">
              <KeyRound size={18} aria-hidden="true" />
              <span>Proceed to Celebration Gate 🔐✨</span>
            </span>
          </MagneticButton>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          STAGE 4: THE GRAND CELEBRATION PASSWORD GATE ("Pmraanejeu")
          ══════════════════════════════════════════════════════════ */}
      {stage === "celebration" && (
        <div className="mt-8 flex w-full max-w-md flex-col items-center gap-5 animate-[fadeUp_.8s_ease_both]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[color:var(--champagne)] bg-[rgba(244,223,180,0.2)] shadow-[0_0_30px_rgba(244,223,180,0.6)] animate-pulse">
            <Sparkles size={32} className="text-[color:var(--champagne)]" />
          </div>

          <p className="font-script text-3xl sm:text-4xl text-[color:var(--champagne)] drop-shadow-[0_0_12px_rgba(244,223,180,0.6)]">
            The Grand Celebration Gate
          </p>

          <p className="max-w-md text-xs sm:text-sm text-[color:var(--text-soft)]">
            Enter the sacred final password uniting our names to ignite the midnight sky with our fireworks celebration!
          </p>

          {/* Chances left for the celebration password */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--champagne)] font-semibold">
              Celebration Chances:
            </span>
            <span className="flex items-center gap-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart
                  key={i}
                  size={14}
                  className={
                    i < celebGate.chances
                      ? "text-[color:var(--neon)] drop-shadow-[0_0_6px_rgba(255,46,147,0.8)]"
                      : "text-white/20"
                  }
                  fill={i < celebGate.chances ? "currentColor" : "none"}
                />
              ))}
            </span>
          </div>

          {/* 2 minutes lock banner */}
          {celebGate.isLocked && (
            <div className="w-full rounded-xl border border-red-500/40 bg-red-950/50 p-3 text-center text-xs text-red-200 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              <p className="font-bold flex items-center justify-center gap-1.5">
                <Lock size={14} />
                <span>Celebration Gate sealed for 2 minutes!</span>
              </p>
              <p className="text-xs text-[color:var(--champagne)] mt-1">
                Next chance unlocks in: <span className="font-mono font-bold text-base text-[color:var(--neon)]">{celebGate.lockLeftText}</span>
              </p>
              <p className="text-[10px] text-white/60 mt-0.5">1 chance will be granted when the timer finishes.</p>
            </div>
          )}

          {!celebGate.isLocked && celebGate.chances < 3 && celebGate.refillLeftText && (
            <p className="text-[10px] text-[color:var(--champagne)] text-center -mt-2">
              Next extra chance in: <span className="font-mono font-semibold">{celebGate.refillLeftText}</span>
            </p>
          )}

          {/* Romantic Clue Drawer for Celebration Password */}
          <details className="w-full max-w-md rounded-xl border border-[color:var(--champagne)]/35 bg-[rgba(18,6,26,0.7)] p-3 text-center backdrop-blur-md transition-all group">
            <summary className="flex cursor-pointer items-center justify-between text-xs font-semibold text-[color:var(--champagne)]">
              <span className="flex items-center gap-1.5">
                <Heart size={13} className="text-[color:var(--rose)] animate-pulse" fill="currentColor" />
                <span>Need a clue for the celebration password? 🗝️</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[color:var(--brass)] group-open:hidden">
                Tap to Reveal
              </span>
            </summary>
            <div className="mt-2.5 border-t border-white/10 pt-2 text-xs text-[color:var(--champagne)]/95 leading-relaxed text-left space-y-1">
              <p className="font-script text-base text-[color:var(--rose)]">
                &ldquo;The sacred password uniting Prajeeth and Manju into celebration…&rdquo;
              </p>
              <p className="text-[11px] text-[color:var(--text-soft)]">
                A secret code konjam fast ha potana ulla enna irukunu pakalam🗝️💖
              </p>
            </div>
          </details>

          {/* Celebration Password Entry Form */}
          <form
            onSubmit={submitCelebration}
            key={celebShake}
            className={`w-full ${celebShake ? "shake" : ""}`}
            aria-label="Grand Celebration Password Gate"
          >
            <div className="flex gap-2">
              <input
                ref={celebInputRef}
                type="text"
                value={celebInput}
                onChange={(e) => setCelebInput(e.target.value)}
                placeholder="••••••••••"
                maxLength={20}
                disabled={celebGate.isLocked}
                autoComplete="off"
                className="h-12 flex-1 rounded-xl border border-[color:var(--input)] bg-[rgba(18,6,26,.85)] px-4 text-center text-lg sm:text-xl font-bold tracking-[0.2em] text-[color:var(--champagne)] placeholder:text-white/20 focus:border-[color:var(--rose)] focus:outline-none focus:ring-2 focus:ring-[color:var(--rose)]/50 disabled:opacity-50"
              />
              <MagneticButton
                type="submit"
                className="btn-museum !px-5 disabled:opacity-40"
                ariaLabel="Ignite Fireworks Celebration"
                disabled={celebGate.isLocked}
              >
                <span className="flex items-center gap-1.5">
                  <Unlock size={16} aria-hidden="true" />
                  <span>Celebrate!</span>
                </span>
              </MagneticButton>
            </div>
          </form>

          {celebError && (
            <p className="comedy-bubble text-sm text-[color:var(--rose)] animate-[fadeUp_.4s_ease_both]">
              {celebError}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
