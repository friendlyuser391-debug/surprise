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
  Gift,
  Heart,
  Navigation,
  Sparkles,
  Utensils,
  Volume2,
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

  // Navigate / drive the car to a target milestone
  const driveTo = useCallback(
    (targetIdx: number) => {
      if (targetIdx === currentIdx || isDriving) return;
      setIsDriving(true);
      sound.carRev();
      sound.whoosh();

      // Exhaust heart smoke while driving
      if (!reduced) {
        fx.trailSpark(window.innerWidth * 0.45, window.innerHeight * 0.42, "#ff2e93");
      }

      setTimeout(() => {
        setCurrentIdx(targetIdx);
        setIsDriving(false);
        sound.chime(880);
      }, 750);
    },
    [currentIdx, isDriving, reduced]
  );

  const driveNext = useCallback(() => {
    if (currentIdx < MILESTONES.length - 1) {
      driveTo(currentIdx + 1);
    }
  }, [currentIdx, driveTo]);

  const drivePrev = useCallback(() => {
    if (currentIdx > 0) {
      driveTo(currentIdx - 1);
    }
  }, [currentIdx, driveTo]);

  // Honk horn
  const honkHorn = useCallback(() => {
    sound.carHorn();
    setHonking(true);
    if (!reduced) {
      fx.sealBurst(window.innerWidth * 0.5, window.innerHeight * 0.35);
    }
    setTimeout(() => setHonking(false), 900);
  }, [reduced]);

  // Keyboard controls (Left/Right arrow keys for driving)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") driveNext();
      if (e.key === "ArrowLeft") drivePrev();
      if (e.key === " " || e.key === "Enter") {
        if (!isGiftOpened) openGift();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [driveNext, drivePrev, isGiftOpened, openGift]);

  return (
    <section
      className="relative z-10 mx-auto min-h-dvh w-full max-w-4xl px-3 sm:px-4 py-12 pb-32 lg:pb-24 text-center select-none"
      aria-labelledby="road-title"
    >
      {/* ── HEADER & HUD ── */}
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
          Drive the car along our special dates and unwrap each memory gift box! 🎁
        </p>

        {/* HUD Dash: Progress & Quick Jumps */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <div className="rounded-xl border border-[color:var(--brass)]/30 bg-[rgba(18,6,26,0.7)] px-3 py-1.5 backdrop-blur-md text-xs text-[color:var(--champagne)]">
            <span className="text-[color:var(--brass)] uppercase text-[10px] tracking-wider block">Stop</span>
            <strong className="font-mono text-sm">{currentIdx + 1}</strong> of {MILESTONES.length}
          </div>

          <div className="rounded-xl border border-[color:var(--brass)]/30 bg-[rgba(18,6,26,0.7)] px-3 py-1.5 backdrop-blur-md text-xs text-[color:var(--champagne)]">
            <span className="text-[color:var(--brass)] uppercase text-[10px] tracking-wider block">Gifts Unwrapped</span>
            <strong className="font-mono text-sm text-[color:var(--neon)]">
              {openedGifts.size} / {MILESTONES.length}
            </strong>{" "}
            🎁
          </div>

          {/* Beep Beep Horn Button */}
          <button
            type="button"
            onClick={honkHorn}
            className="flex items-center gap-1.5 rounded-xl border border-[color:var(--rose)]/40 bg-[rgba(255,46,147,0.2)] px-3 py-1.5 text-xs font-bold text-[color:var(--champagne)] shadow-[0_0_12px_rgba(255,46,147,0.3)] active:scale-95 transition-all hover:border-[color:var(--rose)]"
            title="Honk Car Horn"
          >
            <Volume2 size={14} className="text-[color:var(--rose)]" />
            <span>Honk Horn 🎺</span>
          </button>
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
                onClick={() => driveTo(idx)}
                className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${isActive
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

      {/* ── THE HIGHWAY & CAR STAGE ── */}
      <div className="relative mt-6 w-full rounded-2xl border border-[color:var(--brass)]/30 bg-[radial-gradient(ellipse_at_center,rgba(26,10,36,0.85)_0%,rgba(10,3,16,0.95)_100%)] p-4 sm:p-6 shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-md overflow-hidden">
        {/* Night Road Horizon & Streetlights */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[rgba(255,46,147,0.15)] to-transparent" />
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[color:var(--brass)]/40 to-transparent" />
        </div>

        {/* Milestone Road Signpost */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="text-left">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--brass)]">Destination</span>
            <h2 className="font-display text-lg sm:text-xl font-bold text-[color:var(--champagne)]">
              {activeMilestone.displayDate}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--brass)]">Road Stop</span>
            <p className="text-xs font-mono font-semibold text-[color:var(--rose)]">
              Mile {currentIdx * 25 + 10} km · {activeMilestone.time || "Memories"}
            </p>
          </div>
        </div>

        {/* THE ROADWAY */}
        <div className="relative mt-4 h-36 sm:h-44 w-full rounded-xl bg-gradient-to-b from-[#1b1724] via-[#120f18] to-[#0c0910] border border-white/10 overflow-hidden shadow-inner flex items-center justify-between px-4 sm:px-12">
          {/* Animated Road Lane Dashes */}
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[3px] flex items-center justify-around pointer-events-none overflow-hidden">
            <div
              className={`w-full flex justify-between gap-4 transition-transform duration-500 ${isDriving ? "animate-[roadDash_0.2s_linear_infinite]" : ""
                }`}
            >
              {Array.from({ length: 16 }).map((_, i) => (
                <span
                  key={i}
                  className="h-[3px] w-8 sm:w-12 bg-gradient-to-r from-[color:var(--brass)] to-yellow-200/90 rounded-full shadow-[0_0_8px_rgba(244,223,180,0.8)] shrink-0"
                />
              ))}
            </div>
          </div>

          {/* Road Curb Reflectors */}
          <div className="absolute bottom-1 left-0 right-0 flex justify-around opacity-40">
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} className="h-1.5 w-1.5 rounded-full bg-red-400 shadow-[0_0_4px_red]" />
            ))}
          </div>

          {/* THE CAR (Animated SVG) */}
          <div
            className={`relative z-20 flex flex-col items-center transition-all duration-700 ${isDriving ? "translate-x-6 scale-95" : "translate-x-0 scale-100"
              }`}
          >
            {/* Honk bubble */}
            {honking && (
              <div className="absolute -top-10 flex items-center gap-1 rounded-full border border-[color:var(--rose)] bg-[rgba(255,46,147,0.9)] px-3 py-1 font-script text-xs text-white shadow-[0_0_15px_rgba(255,46,147,0.8)] animate-bounce z-30">
                <span>Beep Beep!</span>
                <Heart size={12} fill="white" />
              </div>
            )}

            {/* Car Vector */}
            <div className="relative w-36 sm:w-44 select-none">
              {/* Headlights Light Cone on the Road */}
              <div
                className="absolute top-4 -right-16 sm:-right-24 w-28 sm:w-36 h-12 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at left, rgba(255,255,220,0.7) 0%, rgba(255,240,180,0.35) 45%, transparent 80%)",
                  filter: "blur(4px)",
                  transform: "perspective(200px) rotateY(-18deg)",
                }}
              />

              {/* SVG Convertible Car */}
              <svg
                viewBox="0 0 200 90"
                className="w-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Underglow Neon */}
                <ellipse cx="100" cy="82" rx="75" ry="6" fill="#ff2e93" opacity="0.6" filter="blur(5px)" />

                {/* Car Main Body (Metallic Rose-Red) */}
                <path
                  d="M15 65 C15 55 30 50 50 48 L75 32 C85 24 125 24 140 32 L170 48 C185 52 195 58 195 68 C195 72 190 75 180 75 L30 75 C20 75 15 72 15 65 Z"
                  fill="url(#carBodyGrad)"
                  stroke="#ff7eb6"
                  strokeWidth="1.5"
                />

                {/* Windshield & Cabin */}
                <path
                  d="M78 34 L125 34 C132 34 138 38 142 45 L155 48 L70 48 L78 34 Z"
                  fill="url(#windshieldGrad)"
                  stroke="#ffffff"
                  strokeWidth="1"
                  opacity="0.85"
                />

                {/* Driver & Passenger Romantic Silhouettes */}
                <circle cx="102" cy="40" r="5" fill="#f4dfb4" />
                <circle cx="118" cy="40" r="5" fill="#ff7eb6" />
                <path d="M110 38 L110 44" stroke="#ff2e93" strokeWidth="2" strokeLinecap="round" />

                {/* Front Headlight (Bright Gold Glow) */}
                <circle cx="188" cy="58" r="5" fill="#fff9d6" />
                <circle cx="188" cy="58" r="9" fill="#ffd700" opacity="0.5" />

                {/* Rear Taillight */}
                <rect x="15" y="56" width="6" height="7" rx="2" fill="#ff2e93" />

                {/* Chrome Side Trim Accent */}
                <path d="M50 58 L160 58" stroke="#f4dfb4" strokeWidth="1.5" opacity="0.8" />

                {/* Wheel Arches */}
                <path d="M38 75 A 18 18 0 0 1 74 75 Z" fill="#0c0414" />
                <path d="M136 75 A 18 18 0 0 1 172 75 Z" fill="#0c0414" />

                {/* Front Wheel */}
                <g className={isDriving ? "animate-[spin_0.3s_linear_infinite]" : ""}>
                  <circle cx="154" cy="74" r="14" fill="#171220" stroke="#f4dfb4" strokeWidth="2" />
                  <circle cx="154" cy="74" r="7" fill="#ff2e93" />
                  <path d="M154 62 L154 86 M142 74 L166 74" stroke="#ffffff" strokeWidth="1.5" />
                </g>

                {/* Rear Wheel */}
                <g className={isDriving ? "animate-[spin_0.3s_linear_infinite]" : ""}>
                  <circle cx="56" cy="74" r="14" fill="#171220" stroke="#f4dfb4" strokeWidth="2" />
                  <circle cx="56" cy="74" r="7" fill="#ff2e93" />
                  <path d="M56 62 L56 86 M44 74 L68 74" stroke="#ffffff" strokeWidth="1.5" />
                </g>

                {/* Gradients */}
                <defs>
                  <linearGradient id="carBodyGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ff2e93" />
                    <stop offset="60%" stopColor="#be123c" />
                    <stop offset="100%" stopColor="#4c0519" />
                  </linearGradient>
                  <linearGradient id="windshieldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Exhaust Floating Heart Puff */}
              {isDriving && (
                <div className="absolute bottom-2 -left-3 animate-ping">
                  <Heart size={14} className="text-[color:var(--rose)]" fill="currentColor" />
                </div>
              )}
            </div>
          </div>

          {/* CHECKPOINT DESTINATION: THE 3D GIFT BOX STAND */}
          <div ref={giftRef} className="relative z-20 flex flex-col items-center">
            {/* Glowing Pedestal */}
            <div className="absolute -bottom-2 w-24 h-6 rounded-full bg-[radial-gradient(ellipse,rgba(255,46,147,0.5)_0%,transparent_70%)] pointer-events-none" />

            {/* Gift Box Container */}
            <div
              onClick={openGift}
              className={`relative cursor-pointer transition-transform duration-300 ${!isGiftOpened ? "hover:scale-110 active:scale-95 animate-bounce" : "scale-100"
                }`}
              title={isGiftOpened ? "Gift is unwrapped" : "Tap to open this gift!"}
            >
              {/* Unopened 3D Gift Box SVG */}
              {!isGiftOpened ? (
                <div className="relative flex flex-col items-center">
                  {/* Floating Prompt Pill */}
                  <div className="absolute -top-8 whitespace-nowrap rounded-full border border-[color:var(--champagne)] bg-[rgba(18,6,26,0.9)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--champagne)] shadow-[0_0_12px_rgba(255,46,147,0.6)] animate-pulse">
                    🎁 Tap to Open!
                  </div>

                  {/* 3D Box Illustration */}
                  <div
                    className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${activeMilestone.boxColor.base} border-2 border-white/30 shadow-[0_10px_25px_rgba(0,0,0,0.6)] flex items-center justify-center relative overflow-hidden`}
                    style={{ filter: `drop-shadow(0 0 16px ${activeMilestone.boxColor.glow})` }}
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
                    className={`h-16 w-18 rounded-xl bg-gradient-to-br ${activeMilestone.boxColor.base} border border-white/20 shadow-lg flex items-center justify-center relative opacity-85`}
                  >
                    <span className="text-2xl animate-spin">{activeMilestone.emoji}</span>
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
          <span>Previous Stop</span>
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
          <span>Drive to Next Stop</span>
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
