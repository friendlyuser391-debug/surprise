"use client";

/**
 * OUR ROAD OF MEMORIES — The Highway of Our Love Story
 *
 * An interactive road trip where you drive a romantic car through all the special dates:
 *  1. August 8 — First time I made lunch with my hands for you 🍱
 *  2. August 8 · 5:05 PM — Our very first photo taken 📸
 *  3. August 30 — First outing with dinner together 🍽️✨
 *  4. October 23 — Our first bike ride together 🏍️💨
 *  5. November 4 — Celebrating you: Happy Birthday My Future Wife! 🎂💖
 *
 * At each milestone checkpoint, open a beautifully wrapped 3D Gift Box
 * that pops open with sparkles, confetti, and reveals the cherished memory!
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Flame,
  Gauge,
  Gift,
  Heart,
  Navigation,
  Sparkles,
  Utensils,
  Volume2,
  Zap,
} from "lucide-react";
import { love } from "@/lib/love-config";
import { fx } from "@/lib/fx";
import { sound } from "@/lib/sound";
import { useIsReducedMotion } from "../Ambient";
import { MagneticButton } from "../motion";

interface Milestone {
  id: string;
  date: string;
  displayDate: string;
  time?: string;
  title: string;
  subtitle: string;
  description: string;
  emoji: string;
  iconName: "lunch" | "photo" | "dinner" | "bike" | "birthday";
  tags: string[];
  location?: string;
  boxColor: {
    base: string;
    lid: string;
    ribbon: string;
    glow: string;
  };
}

const MILESTONES: Milestone[] = [
  {
    id: "lunch",
    date: "August 8",
    displayDate: "AUG 08",
    time: "Afternoon",
    title: "First Time I Made Lunch with My Hands for You",
    subtitle: "Prepared with My Whole Heart & Soul",
    description:
      "August 8. The very first time I cooked lunch for you with my own hands. I carefully seasoned every single dish, hoping it would bring a genuine smile to your face. Watching you take that first taste and that priceless smile lighting up your face made every second in the kitchen unforgettable. That simple meal became one of the sweetest moments of my life.",
    emoji: "🍱",
    iconName: "lunch",
    tags: ["homemadelunch", "cookedwithlove", "precioussmile", "august8"],
    location: "Home Sweet Home",
    boxColor: {
      base: "from-rose-600 via-pink-700 to-rose-900",
      lid: "from-pink-500 to-rose-600",
      ribbon: "#fcd34d",
      glow: "rgba(255,46,147,0.55)",
    },
  },
  {
    id: "first-photo",
    date: "August 8 · 5:05 PM",
    displayDate: "AUG 08 · 5:05 PM",
    time: "5:05 PM",
    title: "Our Very First Photo Taken",
    subtitle: "A Single Second That Stole My Heart Forever",
    description:
      "August 8 at 5:05 PM. The camera flashed, capturing our smiling faces side by side for the very first time. To the rest of the world, it was just a photograph — but in that exact second, my heart knew it had found its home. The very first frame of a million memories yet to come.",
    emoji: "📸",
    iconName: "photo",
    tags: ["firstphoto", "505pm", "capturedforever", "august8"],
    location: "Our Special Spot",
    boxColor: {
      base: "from-amber-600 via-yellow-700 to-amber-900",
      lid: "from-yellow-500 to-amber-600",
      ribbon: "#ff7eb6",
      glow: "rgba(244,223,180,0.55)",
    },
  },
  {
    id: "dinner-outing",
    date: "August 30",
    displayDate: "AUG 30",
    time: "Evening",
    title: "First Outing with Dinner Together",
    subtitle: "Warm Lights, Endless Laughter & Pure Magic",
    description:
      "August 30. Our very first official dinner date and outing together. Across the table, time seemed to stand completely still. We lost track of hours talking about everything and laughing until our cheeks hurt. Looking into your eyes, I realized you were the one I wanted to share every meal, every story, and every day with.",
    emoji: "🍽️",
    iconName: "dinner",
    tags: ["firstouting", "dinnerdate", "unforgettable", "august30"],
    location: "Dinner Date",
    boxColor: {
      base: "from-purple-700 via-indigo-800 to-slate-900",
      lid: "from-purple-600 to-indigo-700",
      ribbon: "#fb7185",
      glow: "rgba(176,124,255,0.55)",
    },
  },
  {
    id: "bike-ride",
    date: "October 23",
    displayDate: "OCT 23",
    time: "Evening",
    title: "Our First Bike Ride Together",
    subtitle: "Cool Wind, Open Highway & You Holding Me Close",
    description:
      "October 23. The rush of the night air, streetlights reflecting on the asphalt, and your gentle hands holding me tight from behind. With every curve in the road, my heartbeat felt perfectly synchronized with yours. The most exhilarating, romantic journey of my life — just you, me, and the endless road.",
    emoji: "🏍️",
    iconName: "bike",
    tags: ["firstbikeride", "windandfreedom", "holdingtight", "october23"],
    location: "The Open Road",
    boxColor: {
      base: "from-teal-600 via-cyan-800 to-slate-900",
      lid: "from-cyan-500 to-teal-600",
      ribbon: "#fde047",
      glow: "rgba(63,214,198,0.55)",
    },
  },
  {
    id: "birthday",
    date: "November 4",
    displayDate: "NOV 04",
    time: "12:00 AM",
    title: "Celebrating You — Happy Birthday!",
    subtitle: "The Most Beautiful Destination of My Whole Life",
    description:
      "November 4. The day that gave the world the brightest, kindest heart. Every mile we've traveled together has led us to this day of celebration. You are my favorite memory, my present happiness, and my entire future. Happy Birthday Manju ! 💍💖",
    emoji: "🎂",
    iconName: "birthday",
    tags: ["happybirthday", "foreverlove", "november4"],
    location: "Manju's Birthday Celebration",
    boxColor: {
      base: "from-pink-600 via-rose-700 to-red-900",
      lid: "from-pink-500 to-rose-600",
      ribbon: "#ffd700",
      glow: "rgba(255,46,147,0.75)",
    },
  },
];

export default function HistoryScene({ onNext }: { onNext?: () => void }) {
  const reduced = useIsReducedMotion();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [openedGifts, setOpenedGifts] = useState<Set<number>>(new Set());
  const [isDriving, setIsDriving] = useState(false);
  const [isNitro, setIsNitro] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [gear, setGear] = useState<"P" | "D1" | "D2" | "D3" | "SPORT" | "R">("D1");
  const [rpm, setRpm] = useState(900);
  const [honking, setHonking] = useState(false);
  const giftRef = useRef<HTMLDivElement>(null);

  const activeMilestone = MILESTONES[currentIdx];
  const isGiftOpened = openedGifts.has(currentIdx);
  const allOpened = openedGifts.size >= MILESTONES.length;

  // Open the current gift box
  const openGift = useCallback(() => {
    if (isGiftOpened) return;
    sound.popper();
    sound.chime(1040);
    if (!reduced && giftRef.current) {
      const rect = giftRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      fx.confettiBurst(cx, cy, 70);
      fx.sealBurst(cx, cy);
      fx.heartBurst(cx, cy - 30);
    }
    setOpenedGifts((prev) => new Set(prev).add(currentIdx));
  }, [currentIdx, isGiftOpened, reduced]);

  // Real fast interactive car driving engine
  const driveTo = useCallback(
    (targetIdx: number, nitro = false) => {
      if (targetIdx === currentIdx || isDriving) return;
      setIsDriving(true);
      setIsNitro(nitro);

      const isForward = targetIdx > currentIdx;
      setGear(isForward ? (nitro ? "SPORT" : "D3") : "R");
      setRpm(nitro ? 7200 : 5800);

      if (nitro) {
        sound.rocketLaunch();
        sound.carRev();
        setSpeed(175);
      } else {
        sound.carRev();
        sound.whoosh();
        setSpeed(128);
      }

      if (!reduced) {
        fx.trailSpark(window.innerWidth * 0.45, window.innerHeight * 0.42, nitro ? "#38bdf8" : "#ff2e93");
        if (nitro) {
          fx.doubleHeartBurst(window.innerWidth * 0.5, window.innerHeight * 0.45);
        }
      }

      // Fast, snappy driving time: 420ms (nitro) / 520ms (normal)
      const driveTime = nitro ? 420 : 520;
      setTimeout(() => {
        setCurrentIdx(targetIdx);
        setIsDriving(false);
        setIsNitro(false);
        setSpeed(0);
        setGear("D1");
        setRpm(900);
        sound.chime(880);
      }, driveTime);
    },
    [currentIdx, isDriving, reduced]
  );

  const driveNext = useCallback(() => {
    if (currentIdx < MILESTONES.length - 1) {
      driveTo(currentIdx + 1, false);
    }
  }, [currentIdx, driveTo]);

  const drivePrev = useCallback(() => {
    if (currentIdx > 0) {
      driveTo(currentIdx - 1, false);
    }
  }, [currentIdx, driveTo]);

  // Fast Nitro boost trigger
  const triggerNitro = useCallback(() => {
    if (currentIdx < MILESTONES.length - 1 && !isDriving) {
      driveTo(currentIdx + 1, true);
    } else if (!isDriving) {
      // Rev nitro in place at final milestone
      setIsNitro(true);
      setSpeed(165);
      setRpm(7600);
      sound.rocketLaunch();
      sound.carRev();
      if (!reduced) {
        fx.doubleHeartBurst(window.innerWidth * 0.5, window.innerHeight * 0.4);
      }
      setTimeout(() => {
        setIsNitro(false);
        setSpeed(0);
        setRpm(900);
      }, 480);
    }
  }, [currentIdx, isDriving, driveTo, reduced]);

  // Honk horn
  const honkHorn = useCallback(() => {
    sound.carHorn();
    setHonking(true);
    if (!reduced) {
      fx.sealBurst(window.innerWidth * 0.5, window.innerHeight * 0.35);
    }
    setTimeout(() => setHonking(false), 800);
  }, [reduced]);

  // Keyboard controls for realistic driving:
  // Right / D / W = Accelerate, Left / A / S = Reverse, N / Shift = Nitro, H = Horn, Space = Gift
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.key === "ArrowRight" || k === "d" || k === "w") {
        e.preventDefault();
        driveNext();
      } else if (e.key === "ArrowLeft" || k === "a" || k === "s") {
        e.preventDefault();
        drivePrev();
      } else if (k === "n" || e.key === "Shift") {
        e.preventDefault();
        triggerNitro();
      } else if (k === "h") {
        e.preventDefault();
        honkHorn();
      } else if (e.key === " " || e.key === "Enter") {
        if (!isGiftOpened) {
          e.preventDefault();
          openGift();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [driveNext, drivePrev, triggerNitro, honkHorn, isGiftOpened, openGift]);

  return (
    <section
      className="relative z-10 mx-auto min-h-dvh w-full max-w-4xl px-3 sm:px-4 py-12 pb-32 lg:pb-24 text-center select-none"
      aria-labelledby="road-title"
    >
      {/* ── HEADER & NAVIGATION ── */}
      <div className="flex flex-col items-center animate-[fadeUp_.8s_ease_both]">
        <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--rose)]/40 bg-[rgba(255,46,147,0.15)] px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--champagne)] backdrop-blur-md shadow-[0_0_15px_rgba(255,46,147,0.3)]">
          <Navigation size={13} className="text-[color:var(--rose)] animate-spin" />
          <span>The Road of Our Memories 🚗💨</span>
        </div>

        <h1
          id="road-title"
          className="font-display neon-text mt-2 text-3xl sm:text-5xl font-bold tracking-tight"
        >
          Our Journey With You
        </h1>
        <p className="mt-1.5 max-w-md text-xs sm:text-sm text-[color:var(--text-soft)]">
          Press Gas to drive our sports car fast through each special memory milestone! 🏎️💨
        </p>

        {/* ── REALISTIC SPORTS CAR COCKPIT & DASHBOARD HUD ── */}
        <div className="mt-4 flex w-full max-w-2xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--brass)]/35 bg-[radial-gradient(ellipse_at_top,rgba(26,10,36,0.95)_0%,rgba(10,3,16,0.98)_100%)] p-3 sm:p-4 backdrop-blur-md shadow-[0_0_25px_rgba(0,0,0,0.8)]">
          {/* Digital Speedometer Gauge */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border-2 border-[color:var(--rose)]/40 bg-[rgba(255,46,147,0.1)] shadow-[0_0_15px_rgba(255,46,147,0.35)]">
              <div className="text-center">
                <span className="font-mono text-base sm:text-lg font-extrabold text-[color:var(--champagne)] leading-none block">
                  {speed}
                </span>
                <span className="text-[8px] font-bold text-[color:var(--rose)] uppercase tracking-tight">KM/H</span>
              </div>
              {/* Circular gauge pulse when driving */}
              {isDriving && (
                <div className="absolute inset-0 rounded-full border-2 border-t-[color:var(--neon)] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              )}
            </div>

            <div className="text-left space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-[rgba(255,46,147,0.25)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[color:var(--neon)]">
                  GEAR: {gear}
                </span>
                <span className="text-[10px] font-mono text-[color:var(--brass)]">
                  {isNitro ? "⚡ NITRO BOOST" : isDriving ? "🏎️ ACCELERATING" : "✦ IDLE / READY"}
                </span>
              </div>
              {/* RPM LED bar */}
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 8 }).map((_, i) => {
                  const active = (rpm / 7500) * 8 > i;
                  return (
                    <span
                      key={i}
                      className={`h-1.5 w-2 rounded-xs transition-colors ${
                        active
                          ? i > 5
                            ? "bg-red-500 shadow-[0_0_4px_red]"
                            : "bg-[color:var(--neon)] shadow-[0_0_4px_#ff2e93]"
                          : "bg-white/10"
                      }`}
                    />
                  );
                })}
                <span className="ml-1 text-[9px] font-mono text-white/50">{rpm} RPM</span>
              </div>
              <p className="text-[10px] text-[color:var(--text-soft)]">
                Trip: <strong className="font-mono text-[color:var(--champagne)]">{currentIdx * 25 + 10} km</strong> · Milestone {currentIdx + 1}/{MILESTONES.length}
              </p>
            </div>
          </div>

          {/* Quick Driving Controls in Cockpit */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Horn Button */}
            <button
              type="button"
              onClick={honkHorn}
              className="flex items-center gap-1 rounded-xl border border-[color:var(--rose)]/40 bg-[rgba(255,46,147,0.18)] px-2.5 py-1.5 text-xs font-bold text-[color:var(--champagne)] shadow-[0_0_10px_rgba(255,46,147,0.25)] active:scale-95 transition-all hover:border-[color:var(--rose)]"
              title="Honk Car Horn (H key)"
            >
              <Volume2 size={14} className="text-[color:var(--rose)]" />
              <span className="hidden sm:inline">Horn</span>
            </button>

            {/* Nitro Boost Button */}
            <button
              type="button"
              onClick={triggerNitro}
              disabled={isDriving}
              className="flex items-center gap-1 rounded-xl border border-cyan-400/50 bg-[radial-gradient(ellipse,rgba(56,189,248,0.25)_0%,rgba(14,165,233,0.1)_100%)] px-3 py-1.5 text-xs font-bold text-cyan-200 shadow-[0_0_14px_rgba(56,189,248,0.4)] active:scale-95 transition-all hover:border-cyan-300 disabled:opacity-50"
              title="Nitro Turbo Boost (N key)"
            >
              <Flame size={14} className="text-cyan-300 animate-pulse" />
              <span>NITRO ⚡</span>
            </button>

            {/* Gas Pedal / Drive Button */}
            <button
              type="button"
              onClick={driveNext}
              disabled={currentIdx === MILESTONES.length - 1 || isDriving}
              className="btn-museum !min-h-0 !py-1.5 !px-3.5 text-xs shadow-[0_0_16px_rgba(255,46,147,0.6)] disabled:opacity-40"
              title="Accelerate / Next Stop (Right Arrow / D)"
            >
              <span className="flex items-center gap-1">
                <span>Gas 🏎️</span>
                <ChevronRight size={14} />
              </span>
            </button>
          </div>
        </div>

        {/* Milestone Stepper Pills */}
        <div className="mt-4 flex w-full max-w-xl items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto py-1 scrollbar-none">
          {MILESTONES.map((m, idx) => {
            const isActive = idx === currentIdx;
            const isOpened = openedGifts.has(idx);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => driveTo(idx, false)}
                className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? "border-2 border-[color:var(--rose)] bg-[rgba(255,46,147,0.3)] text-[color:var(--champagne)] shadow-[0_0_16px_rgba(255,46,147,0.6)] scale-105"
                    : "border border-white/10 bg-[rgba(18,6,26,0.6)] text-white/60 hover:text-white hover:border-white/20"
                }`}
              >
                <span>{m.emoji}</span>
                <span className="text-[11px] font-mono">{m.displayDate}</span>
                {isOpened && <span className="text-[10px] text-[color:var(--neon)]">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── THE REALISTIC HIGHWAY & CAR STAGE ── */}
      <div className="relative mt-6 w-full rounded-2xl border border-[color:var(--brass)]/30 bg-[radial-gradient(ellipse_at_center,rgba(26,10,36,0.92)_0%,rgba(10,3,16,0.98)_100%)] p-4 sm:p-6 shadow-[0_0_40px_rgba(0,0,0,0.85)] backdrop-blur-md overflow-hidden">
        {/* Night Sky Horizon, Mountain Silhouettes & Crescent Moon */}
        <div className="absolute inset-0 pointer-events-none opacity-50">
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[rgba(255,46,147,0.2)] via-[rgba(147,51,234,0.1)] to-transparent" />
          {/* Distant stars */}
          <div className="absolute top-2 left-10 h-1 w-1 rounded-full bg-white animate-ping" />
          <div className="absolute top-4 left-1/3 h-1 w-1 rounded-full bg-yellow-200" />
          <div className="absolute top-3 right-16 text-xs text-yellow-200/80">🌙</div>
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[color:var(--brass)]/40 to-transparent" />
        </div>

        {/* Milestone Road Signpost */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="text-left">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--brass)] font-semibold">
              Checkpoint Destination
            </span>
            <h2 className="font-display text-lg sm:text-xl font-bold text-[color:var(--champagne)]">
              {activeMilestone.displayDate} · {activeMilestone.title.split(" ").slice(0, 4).join(" ")}…
            </h2>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--brass)] font-semibold">
              Highway Mile
            </span>
            <p className="text-xs font-mono font-bold text-[color:var(--rose)]">
              Mile {currentIdx * 25 + 10} KM · {activeMilestone.time || "Memories"}
            </p>
          </div>
        </div>

        {/* THE REAL DRIVING ROADWAY */}
        <div className="relative mt-4 h-40 sm:h-48 w-full rounded-xl bg-gradient-to-b from-[#181220] via-[#0f0a15] to-[#07040a] border border-white/15 overflow-hidden shadow-[inset_0_2px_12px_rgba(0,0,0,0.9)] flex items-center justify-between px-3 sm:px-10">
          {/* Animated Speed Lines (active during drive & nitro) */}
          {isDriving && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
              <div className="absolute top-4 left-0 right-0 h-[1px] bg-white/40 animate-[speedStreak_0.15s_linear_infinite]" />
              <div className="absolute top-10 left-0 right-0 h-[1.5px] bg-cyan-300/50 animate-[speedStreak_0.12s_linear_infinite]" />
              <div className="absolute bottom-8 left-0 right-0 h-[1px] bg-[color:var(--rose)]/60 animate-[speedStreak_0.18s_linear_infinite]" />
            </div>
          )}

          {/* Roadside Lampposts (streaming backward when driving) */}
          <div className="absolute top-2 left-6 sm:left-14 flex flex-col items-center pointer-events-none opacity-60">
            <div className="h-2 w-2 rounded-full bg-yellow-300 shadow-[0_0_12px_#fde047]" />
            <div className="h-10 w-[2px] bg-white/20" />
          </div>

          {/* Animated Road Lane Dashes */}
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[4px] flex items-center justify-around pointer-events-none overflow-hidden">
            <div
              className={`w-full flex justify-between gap-4 transition-transform duration-300 ${
                isDriving
                  ? isNitro
                    ? "animate-[fastRoadDash_0.08s_linear_infinite]"
                    : "animate-[fastRoadDash_0.13s_linear_infinite]"
                  : ""
              }`}
            >
              {Array.from({ length: 18 }).map((_, i) => (
                <span
                  key={i}
                  className="h-[3.5px] w-9 sm:w-14 bg-gradient-to-r from-[color:var(--brass)] via-yellow-200 to-[color:var(--champagne)] rounded-full shadow-[0_0_8px_rgba(244,223,180,0.85)] shrink-0"
                />
              ))}
            </div>
          </div>

          {/* Road Curb Reflectors */}
          <div className="absolute bottom-1.5 left-0 right-0 flex justify-around opacity-50">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className="h-1.5 w-1.5 rounded-full bg-red-400 shadow-[0_0_5px_red]" />
            ))}
          </div>

          {/* ══════════════════════════════════════════════════════════
              THE SPORTS CAR (Realistic Convertible with Prajeeth & Manju)
              ══════════════════════════════════════════════════════════ */}
          <div
            className={`relative z-20 flex flex-col items-center transition-all duration-500 ${
              isDriving
                ? isNitro
                  ? "translate-x-12 scale-105 animate-[carDriveTilt_0.4s_ease-in-out_infinite]"
                  : "translate-x-8 scale-100 animate-[carDriveTilt_0.5s_ease-in-out_infinite]"
                : "translate-x-0 scale-100 animate-[carSuspension_2.4s_ease-in-out_infinite]"
            }`}
          >
            {/* Horn bubble */}
            {honking && (
              <div className="absolute -top-11 flex items-center gap-1.5 rounded-full border border-[color:var(--rose)] bg-[rgba(255,46,147,0.95)] px-3 py-1 font-script text-xs font-bold text-white shadow-[0_0_20px_rgba(255,46,147,0.9)] animate-bounce z-30">
                <span>Beep Beep! Manju 💖</span>
                <Heart size={13} fill="white" />
              </div>
            )}

            {/* Car Vector Wrapper */}
            <div className="relative w-40 sm:w-52 select-none">
              {/* Headlights Light Beam Cutting the Road Ahead */}
              <div
                className="absolute top-5 -right-20 sm:-right-32 w-32 sm:w-44 h-14 pointer-events-none z-10"
                style={{
                  background: isNitro
                    ? "radial-gradient(ellipse at left, rgba(56,189,248,0.9) 0%, rgba(14,165,233,0.5) 45%, transparent 80%)"
                    : "radial-gradient(ellipse at left, rgba(255,255,230,0.85) 0%, rgba(255,240,180,0.45) 45%, transparent 80%)",
                  filter: "blur(5px)",
                  transform: "perspective(200px) rotateY(-16deg)",
                }}
              />

              {/* Realistic SVG Sports Convertible */}
              <svg
                viewBox="0 0 220 95"
                className="w-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Underglow Neon */}
                <ellipse
                  cx="110"
                  cy="86"
                  rx="85"
                  ry="7"
                  fill={isNitro ? "#38bdf8" : "#ff2e93"}
                  opacity={isDriving ? "0.9" : "0.6"}
                  filter="blur(5px)"
                />

                {/* Car Main Body (Metallic Racing Rose-Magenta) */}
                <path
                  d="M16 68 C16 56 32 51 54 49 L82 31 C94 22 138 22 154 31 L186 49 C204 53 214 60 214 71 C214 76 208 79 196 79 L34 79 C22 79 16 76 16 68 Z"
                  fill="url(#sportsCarGrad)"
                  stroke="#ff7eb6"
                  strokeWidth="1.8"
                />

                {/* Windshield & Cabin */}
                <path
                  d="M86 33 L138 33 C146 33 152 38 156 46 L170 50 L78 50 L86 33 Z"
                  fill="url(#glassGrad)"
                  stroke="#ffffff"
                  strokeWidth="1.2"
                  opacity="0.9"
                />

                {/* Driver (Prajeeth) & Passenger (Manju) */}
                <g>
                  {/* Prajeeth */}
                  <circle cx="112" cy="40" r="6" fill="#f4dfb4" />
                  <path d="M106 37 Q 112 33 118 37" stroke="#3b0724" strokeWidth="2" strokeLinecap="round" />
                  {/* Manju */}
                  <circle cx="130" cy="40" r="6" fill="#fcd34d" />
                  <path d="M124 37 Q 130 33 136 37" stroke="#3b0724" strokeWidth="2" strokeLinecap="round" />
                  {/* Love heart between them */}
                  <path
                    d="M121 34 C121 32 119 31 118 32 C117 33 121 37 121 37 C121 37 125 33 124 32 C123 31 121 32 121 34 Z"
                    fill="#ff2e93"
                    className="animate-pulse"
                  />
                </g>

                {/* Front Headlight (High Beam LED Projector) */}
                <circle cx="206" cy="62" r="6" fill="#fffbe8" />
                <circle cx="206" cy="62" r="10" fill={isNitro ? "#38bdf8" : "#ffd700"} opacity="0.6" />

                {/* Rear Taillight Bar */}
                <rect x="16" y="60" width="8" height="8" rx="2" fill="#ff2e93" className="animate-pulse" />

                {/* Side Racing Stripe */}
                <path d="M54 62 L178 62" stroke="#f4dfb4" strokeWidth="2" opacity="0.9" />

                {/* Wheel Arches */}
                <path d="M42 79 A 20 20 0 0 1 82 79 Z" fill="#08030c" />
                <path d="M150 79 A 20 20 0 0 1 190 79 Z" fill="#08030c" />

                {/* Front Sports Alloy Wheel */}
                <g className={isDriving ? "animate-[spin_0.15s_linear_infinite]" : ""}>
                  <circle cx="170" cy="78" r="15" fill="#140d1a" stroke="#f4dfb4" strokeWidth="2.5" />
                  <circle cx="170" cy="78" r="8" fill="#ff2e93" />
                  <path d="M170 65 L170 91 M157 78 L183 78" stroke="#ffffff" strokeWidth="1.8" />
                  <circle cx="170" cy="78" r="3" fill="#ffd700" />
                </g>

                {/* Rear Sports Alloy Wheel */}
                <g className={isDriving ? "animate-[spin_0.15s_linear_infinite]" : ""}>
                  <circle cx="62" cy="78" r="15" fill="#140d1a" stroke="#f4dfb4" strokeWidth="2.5" />
                  <circle cx="62" cy="78" r="8" fill="#ff2e93" />
                  <path d="M62 65 L62 91 M49 78 L75 78" stroke="#ffffff" strokeWidth="1.8" />
                  <circle cx="62" cy="78" r="3" fill="#ffd700" />
                </g>

                {/* Gradients */}
                <defs>
                  <linearGradient id="sportsCarGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ff2e93" />
                    <stop offset="50%" stopColor="#be123c" />
                    <stop offset="100%" stopColor="#3f0314" />
                  </linearGradient>
                  <linearGradient id="glassGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Dual Exhaust: Nitro Flames & Heart Smoke */}
              {isDriving && (
                <>
                  {isNitro ? (
                    /* Rocket Nitro Flame */
                    <div className="absolute bottom-3 -left-7 animate-[nitroFlame_0.1s_linear_infinite] flex items-center">
                      <Flame size={24} className="text-cyan-300 drop-shadow-[0_0_12px_#38bdf8]" fill="currentColor" />
                    </div>
                  ) : (
                    /* Puffed Heart Exhaust Smoke */
                    <div className="absolute bottom-3 -left-4 animate-ping">
                      <Heart size={16} className="text-[color:var(--rose)]" fill="currentColor" />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              CHECKPOINT DESTINATION: THE 3D GIFT BOX STAND
              ══════════════════════════════════════════════════════════ */}
          <div ref={giftRef} className="relative z-20 flex flex-col items-center">
            {/* Glowing Pedestal */}
            <div className="absolute -bottom-2 w-28 h-7 rounded-full bg-[radial-gradient(ellipse,rgba(255,46,147,0.6)_0%,transparent_70%)] pointer-events-none" />

            {/* Gift Box Container */}
            <div
              onClick={openGift}
              className={`relative cursor-pointer transition-transform duration-300 ${
                !isGiftOpened ? "hover:scale-110 active:scale-95 animate-bounce" : "scale-100"
              }`}
              title={isGiftOpened ? "Gift is unwrapped" : "Tap to open this gift!"}
            >
              {/* Unopened 3D Gift Box SVG */}
              {!isGiftOpened ? (
                <div className="relative flex flex-col items-center">
                  {/* Floating Prompt Pill */}
                  <div className="absolute -top-9 whitespace-nowrap rounded-full border border-[color:var(--champagne)] bg-[rgba(18,6,26,0.95)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[color:var(--champagne)] shadow-[0_0_16px_rgba(255,46,147,0.7)] animate-pulse">
                    🎁 Tap to Open!
                  </div>

                  {/* 3D Box Illustration */}
                  <div
                    className={`h-22 w-22 rounded-2xl bg-gradient-to-br ${activeMilestone.boxColor.base} border-2 border-white/30 shadow-[0_10px_25px_rgba(0,0,0,0.7)] flex items-center justify-center relative overflow-hidden`}
                    style={{ filter: `drop-shadow(0 0 18px ${activeMilestone.boxColor.glow})` }}
                  >
                    {/* Vertical Ribbon */}
                    <div
                      className="absolute inset-y-0 w-4 shadow-sm"
                      style={{ backgroundColor: activeMilestone.boxColor.ribbon }}
                    />
                    {/* Horizontal Ribbon */}
                    <div
                      className="absolute inset-x-0 h-4 shadow-sm"
                      style={{ backgroundColor: activeMilestone.boxColor.ribbon }}
                    />
                    {/* Center Ribbon Bow */}
                    <div
                      className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/40 shadow-md font-bold text-xs"
                      style={{ backgroundColor: activeMilestone.boxColor.ribbon }}
                    >
                      🎀
                    </div>
                  </div>
                </div>
              ) : (
                /* Opened Gift Box with Stardust */
                <div className="relative flex flex-col items-center animate-[fadeUp_.5s_ease_both]">
                  <div
                    className={`h-18 w-20 rounded-xl bg-gradient-to-br ${activeMilestone.boxColor.base} border border-white/20 shadow-lg flex items-center justify-center relative opacity-90`}
                  >
                    <span className="text-3xl animate-spin" style={{ animationDuration: "8s" }}>
                      {activeMilestone.emoji}
                    </span>
                  </div>
                  <span className="mt-1 text-[10px] uppercase font-bold text-[color:var(--neon)] tracking-wider">
                    Unwrapped ✓
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── THE UNWRAPPED MEMORY CARD ── */}
      <div className="mt-6 w-full animate-[fadeUp_.7s_ease_both]">
        {!isGiftOpened ? (
          /* Card when gift is waiting to be opened */
          <div className="rounded-2xl border border-[color:var(--rose)]/30 bg-[rgba(18,6,26,0.7)] p-6 text-center backdrop-blur-md shadow-[0_0_24px_rgba(0,0,0,0.5)]">
            <Gift size={36} className="mx-auto text-[color:var(--rose)] animate-bounce" />
            <h3 className="font-display mt-2 text-xl font-bold text-[color:var(--champagne)]">
              A Memory Gift Awaits You at {activeMilestone.displayDate}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-[color:var(--text-soft)]">
              Tap the gift box above to unwrap our special story from this day!
            </p>
            <button
              type="button"
              onClick={openGift}
              className="btn-museum mt-4 !min-h-0 !py-2.5 !px-6 text-sm shadow-[0_0_20px_rgba(255,46,147,0.6)]"
            >
              <Gift size={16} aria-hidden="true" />
              <span>Unwrap This Gift 🎁</span>
            </button>
          </div>
        ) : (
          /* Beautifully Revealed Memory Card */
          <div className="ornate-card relative w-full p-6 text-left animate-[scaleUp_.4s_ease_both] shadow-[0_0_35px_rgba(255,46,147,0.25)]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(255,46,147,0.2)] text-xl border border-[color:var(--rose)]/40 shadow-[0_0_12px_rgba(255,46,147,0.4)]">
                  {activeMilestone.emoji}
                </span>
                <div>
                  <time className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--brass)] font-semibold font-mono">
                    {activeMilestone.date}
                    {activeMilestone.time ? ` · ${activeMilestone.time}` : ""}
                  </time>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-[color:var(--champagne)]">
                    {activeMilestone.title}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-[color:var(--rose)]/30 bg-[rgba(255,46,147,0.15)] px-3 py-1 text-[11px] font-semibold text-[color:var(--neon)]">
                <Sparkles size={12} className="text-[color:var(--rose)]" />
                <span>Memory Gift Unwrapped</span>
              </div>
            </div>

            {/* Subtitle in romantic script */}
            <p className="font-script mt-3 text-lg text-[color:var(--rose)]">
              &ldquo;{activeMilestone.subtitle}&rdquo;
            </p>

            {/* Detailed Description */}
            <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-[color:var(--text-primary)]">
              {activeMilestone.description}
            </p>

            {/* Tags row */}
            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-white/10 pt-3">
              {activeMilestone.tags.map((t) => (
                <span key={t} className="chip">
                  #{t}
                </span>
              ))}
              {activeMilestone.location && <span className="chip">📍 {activeMilestone.location}</span>}
            </div>
          </div>
        )}
      </div>

      {/* ── DRIVING CONTROLS ── */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={drivePrev}
          disabled={currentIdx === 0 || isDriving}
          className="btn-brass !min-h-0 !py-2 !px-4 text-xs disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
        >
          <ChevronLeft size={16} />
          <span>← Previous Stop</span>
        </button>

        <span className="text-[11px] text-[color:var(--brass)] font-mono">
          Stop {currentIdx + 1} of {MILESTONES.length}
        </span>

        <button
          type="button"
          onClick={driveNext}
          disabled={currentIdx === MILESTONES.length - 1 || isDriving}
          className="btn-brass !min-h-0 !py-2 !px-4 text-xs disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
        >
          <span>Drive to Next Stop 🏎️</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ── ROAD TRIP FINALE: PROCEED TO FINAL TOUCH ── */}
      {onNext && (
        <div className="mt-12 rounded-2xl border border-[color:var(--champagne)]/30 bg-[rgba(26,8,36,0.8)] p-6 text-center backdrop-blur-md shadow-[0_0_30px_rgba(255,46,147,0.3)] animate-[fadeUp_.8s_ease_both]">
          <Heart
            size={32}
            className="mx-auto text-[color:var(--rose)] animate-pulse"
            fill="currentColor"
            style={{ filter: "drop-shadow(0 0 12px rgba(255,46,147,0.8))" }}
          />
          <h4 className="font-display mt-2 text-xl sm:text-2xl font-bold text-[color:var(--champagne)]">
            {allOpened
              ? "All Gift Memories Unwrapped With Love! 💖"
              : "Every Mile With You Has Been a Blessing"}
          </h4>
          <p className="mt-1 text-xs sm:text-sm text-[color:var(--text-soft)] max-w-md mx-auto">
            Candles blown, fireworks lit, history remembered. The sky has one last tender secret to whisper to you,{" "}
            {love.recipientName}…
          </p>
          <div className="mt-4">
            <MagneticButton
              onClick={() => {
                sound.chime(940);
                sound.heartBoom();
                onNext();
              }}
              className="btn-museum"
              ariaLabel="Continue to the Final Touch"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={16} aria-hidden="true" />
                <span>Continue to the Final Touch</span>
              </span>
            </MagneticButton>
          </div>
        </div>
      )}
    </section>
  );
}
