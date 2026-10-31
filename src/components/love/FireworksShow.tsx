"use client";

/**
 * THE CRACKER SHOW — a 30-second automated fireworks spectacle
 * that plays right before the cake celebration.
 *
 * 100% Automated Fireworks (No pressing needed!):
 *   - The entire sky ignites automatically with non-stop diverse fireworks:
 *     Neon Double Hearts, Weeping Willows, Rainbow Peonies, Double Celestial Rings,
 *     Indian Laddu Garlands, Flower Pot Fountains, Spinning Chakkars, and Triple Hearts.
 *
 * Final 10 Seconds (20s - 30s) — Crackers Removed & Birthday Song:
 *   - At 20s, all loud explosions stop completely.
 *   - The rich celebratory Happy Birthday Song plays across the final 10 seconds.
 *   - 3D glowing neon typography: "HAPPY BIRTHDAY MANJU! 💖"
 *   - Soft gentle heart showers and golden afterglow.
 *   - Smooth handover to "Cake Time — Cut the Cake! 🎂" at 30 seconds.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Cake, Heart, Sparkles } from "lucide-react";
import { love } from "@/lib/love-config";
import { fx, RocketStyle } from "@/lib/fx";
import { sound } from "@/lib/sound";
import { useIsReducedMotion } from "./Ambient";

// 30 Seconds Total Duration as requested
const SHOW_MS = 30_000;
const AUTO_NEXT_MS = 6_000; // Hand over to the cake celebration

/** Deterministic star positions */
function starStyle(i: number) {
  const x = ((Math.sin(i * 127.1) + 1) / 2) * 100;
  const y = ((Math.sin(i * 311.7) + 1) / 2) * 42;
  return {
    left: `${x}%`,
    top: `${y}%`,
    animationDelay: `${(i % 7) * 0.8}s`,
    animationDuration: `${2.6 + (i % 5) * 0.7}s`,
  };
}

export default function FireworksShow({ onNext }: { onNext: () => void }) {
  const reduced = useIsReducedMotion();
  const [done, setDone] = useState(false);
  const [showGrandFinale, setShowGrandFinale] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const finished = useRef(false);
  const lastTrail = useRef(0);

  const addT = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const cleanup = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const stars = useMemo(() => Array.from({ length: 26 }, (_, i) => starStyle(i)), []);
  const quotes = useMemo(() => [...love.crackerQuotes, ...love.crackerQuotes], []);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    cleanup();
    setDone(true);
    setShowGrandFinale(true);
    fx.confettiBurst(window.innerWidth / 2, window.innerHeight * 0.35, 120);
    fx.doubleHeartBurst(window.innerWidth / 2, window.innerHeight * 0.3);
    addT(() => onNext(), AUTO_NEXT_MS);
  }, [cleanup, addT, onNext]);

  // ══════════════════════════════════════════════════════════
  // 100% AUTOMATED 30-SECOND FIREWORKS SPECTACLE
  // No pressing needed — burns and bursts automatically!
  // ══════════════════════════════════════════════════════════
  useEffect(() => {
    if (reduced) {
      setDone(true);
      setShowGrandFinale(true);
      return;
    }

    const launchRocket = (ms: number, fxRatio?: number, style?: RocketStyle) =>
      addT(() => {
        sound.rocketLaunch();
        fx.rocket(fxRatio !== undefined ? window.innerWidth * fxRatio : undefined, style);
        addT(() => {
          if (style === "heart" || style === "doubleHeart") sound.heartBoom();
          else sound.boom();
        }, 760);
      }, ms);

    // ──────────────────────────────────────────────────────────
    // PART 1 (0s – 20s): Dynamic Romantic Love Fireworks Spectacle
    // Packed with diverse love-themed crackers & automated ignition
    // ──────────────────────────────────────────────────────────

    // 0.5s: Giant Neon Double Heart Shell (rose + inner gold core)
    launchRocket(500, 0.5, "doubleHeart");

    // 2.2s: Cupid's Arrow Heart — Glowing rose heart pierced by golden comet arrow!
    addT(() => {
      fx.cupidArrowHeart(window.innerWidth * 0.48, window.innerHeight * 0.22);
      sound.cupidWhistle();
    }, 2_200);

    // 4.0s: Blooming Red Rose Bouquet — Spiraling crimson & ruby petals unfurl in the sky
    addT(() => {
      fx.roseBouquetBurst(window.innerWidth * 0.72, window.innerHeight * 0.22);
      sound.boom();
    }, 4_000);

    // 5.8s: Infinity Love Knot — Geometric Bernoulli lemniscate ∞ in stardust
    addT(() => {
      fx.infinityLoveBurst(window.innerWidth * 0.38, window.innerHeight * 0.22);
      sound.boom();
    }, 5_800);

    // 7.6s: Pulsing Beating Heart Shell — Real human heartbeat (lub-dub) shockwaves!
    addT(() => {
      fx.pulsingBeatingHeart(window.innerWidth * 0.55, window.innerHeight * 0.22);
      sound.heartbeat();
    }, 7_600);

    // 9.4s: Constellation of Little Hearts — 7 twinkling miniature hearts in the night sky
    addT(() => {
      fx.heartConstellation(window.innerWidth * 0.5, window.innerHeight * 0.2);
      sound.chime(920);
    }, 9_400);

    // 11.2s: Twin Interlocking Hearts — Two entwined glowing hearts (rose + gold)
    addT(() => {
      fx.interlockingHearts(window.innerWidth * 0.5, window.innerHeight * 0.22);
      sound.heartBoom();
    }, 11_200);

    // 13.0s: Ground Carnival Ignition — Dual Flower Pot Fountains + Spinning Chakkar
    addT(() => {
      fx.fountain(window.innerWidth * 0.18, 5_500);
      fx.fountain(window.innerWidth * 0.82, 5_500);
      sound.fizz(5_500);
    }, 13_000);

    addT(() => {
      fx.chakkar(window.innerWidth * 0.5, undefined, 4_500);
      sound.crackle();
    }, 13_800);

    // 14.8s: Golden Willow Rain & Rainbow Peony over the fountains
    addT(() => {
      fx.willow(window.innerWidth * 0.3, window.innerHeight * 0.22);
      fx.rainbowPeony(window.innerWidth * 0.7, window.innerHeight * 0.22);
      sound.boom();
    }, 14_800);

    // 16.6s: Indian Laddu Garland Cracker Salvo
    addT(() => {
      sound.garland(16);
      fx.crackleSalvo(window.innerWidth * 0.5, window.innerHeight * 0.24);
    }, 16_600);

    // 18.5s: Cascading Triple Heart Bloom Crescendo (Left, Center, Right)
    addT(() => {
      fx.tripleHeartBurst(window.innerWidth * 0.5, window.innerHeight * 0.2);
      sound.heartBoom();
    }, 18_500);

    // ──────────────────────────────────────────────────────────
    // PART 2 (20s – 30s): FINAL 10 SECONDS — ALL CRACKERS REMOVED
    // & THE CELEBRATORY BIRTHDAY SONG PLAYS!
    // ──────────────────────────────────────────────────────────
    addT(() => {
      setShowGrandFinale(true);
      // Play the full celebratory Birthday Song across the final 10 seconds!
      sound.playHappyBirthday(0.36);
    }, 20_000);

    // Gentle silent romantic visual celebration during the birthday song (no loud crackers!)
    addT(() => fx.heartShower(), 20_600);
    addT(() => fx.heartShower(), 25_000);

    // Soft luminous glowing background pulses behind the birthday title
    [20_400, 23_500, 26_800].forEach((ms, i) =>
      addT(
        () =>
          fx.afterglow(
            window.innerWidth * (0.35 + 0.15 * (i % 2)),
            window.innerHeight * 0.28,
            200,
            "rgba(255,160,90,0.2)"
          ),
        ms
      )
    );

    // Conclude the 30-second show
    addT(finish, SHOW_MS);

    return cleanup;
  }, [reduced, addT, finish, cleanup]);

  // Optional: Touching or dragging across the sky draws gentle stardust trails
  const handleSkyPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const now = performance.now();
    if (now - lastTrail.current < 30) return;
    lastTrail.current = now;
    fx.trailSpark(e.clientX, e.clientY);
  };

  return (
    <section
      onPointerMove={handleSkyPointerMove}
      className="fw-interactive relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 py-16 text-center select-none"
      aria-label="A 30-second automated fireworks show — the sky lights up for you"
    >
      {/* Night sky backdrop + stars */}
      <div className="fw-sky pointer-events-none" aria-hidden="true" />
      {stars.map((s, i) => (
        <span key={i} className="sparkle pointer-events-none" style={s} aria-hidden="true" />
      ))}

      {/* Ground silhouette + glow */}
      <div className="fw-ground pointer-events-none" aria-hidden="true" />
      <div className="fw-skyline pointer-events-none" aria-hidden="true" />

      {/* Elegant atmospheric title header while automated show is running */}
      {!showGrandFinale && (
        <div className="pointer-events-none fixed top-6 left-1/2 z-30 -translate-x-1/2 flex flex-col items-center gap-1 text-center animate-[fadeUp_.8s_ease_both]">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--rose)]/50 bg-[rgba(18,6,26,0.85)] px-4 py-1.5 text-xs text-[color:var(--champagne)] backdrop-blur-md shadow-[0_0_20px_rgba(255,46,147,0.35)]">
            <Sparkles size={13} className="text-[color:var(--rose)] animate-spin" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              Automated Celebration Show · Burning for Manju ✨
            </span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          GRAND FINALE DISPLAY: "HAPPY BIRTHDAY MANJU" (20s – 30s)
          Animated 3D glowing neon typography + Birthday Song playing!
          ══════════════════════════════════════════════════════════ */}
      {showGrandFinale && (
        <div
          className="relative z-30 mx-auto my-auto flex w-full max-w-2xl flex-col items-center justify-center px-4 animate-[fadeUp_.9s_ease_both]"
          role="status"
          aria-label="Happy Birthday Manju Fireworks Display"
        >
          {/* Decorative glowing header badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--rose)]/60 bg-[rgba(18,6,26,.85)] px-3.5 py-1 backdrop-blur-md shadow-[0_0_20px_rgba(255,46,147,.4)]">
            <Sparkles size={13} className="text-[color:var(--rose)] animate-spin" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[color:var(--champagne)]">
              ✦ The Sky Celebrates You ✦
            </span>
            <Heart size={13} className="text-[color:var(--neon)]" fill="currentColor" />
          </div>

          {/* Grand Animated 3D Neon Title — Mobile & Desktop responsive */}
          <h1
            className="font-display neon-text mt-3 text-[clamp(1.85rem,7.2vw,4.8rem)] font-extrabold leading-tight tracking-tight text-center"
            style={{
              textShadow:
                "0 0 10px #ff2e93, 0 0 25px #ff2e93, 0 0 45px #ff2e93, 0 0 70px #a3125f",
              animation: "heart-breathe 2.6s ease-in-out infinite",
            }}
          >
            HAPPY BIRTHDAY
            <br />
            <span className="text-[color:var(--champagne)]" style={{ textShadow: "0 0 16px #f4dfb4, 0 0 35px #c9a56a" }}>
              MANJU! 💖
            </span>
          </h1>

          {/* Subtitle animation */}
          <p className="font-script mt-3 text-xl sm:text-2xl md:text-3xl text-[color:var(--rose)] animate-[fadeUp_1.1s_ease_.2s_both]">
            Every single spark up there is for you ✨
          </p>

          {/* Birthday Song notification badge */}
          <div className="mt-3.5 inline-flex items-center gap-2 rounded-full border border-[color:var(--champagne)]/40 bg-[rgba(18,6,26,.85)] px-3.5 py-1 text-xs text-[color:var(--champagne)] shadow-[0_0_15px_rgba(255,46,147,0.4)] animate-pulse">
            <span className="text-sm">🎶</span>
            <span className="font-medium tracking-wide">Playing: Happy Birthday Song for Manju 💖</span>
          </div>
        </div>
      )}

      {/* Love quotes scrolling ribbon */}
      <div className="fw-quotes pointer-events-none" aria-hidden="true">
        <div className="fw-quotes-track">
          {quotes.map((q, i) => (
            <span key={i} className="fw-quote">
              {q}
              <span className="fw-quote-sep">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Handover: Cake Cutting Button */}
      {(done || showGrandFinale) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="btn-museum fw-cake-btn fixed bottom-14 sm:bottom-16 left-1/2 z-50 -translate-x-1/2 px-5 py-2.5 text-sm sm:text-base shadow-[0_0_30px_rgba(255,46,147,0.7)] animate-[pulse_2s_ease-in-out_infinite]"
        >
          <Cake size={18} aria-hidden="true" />
          <span>Cake Time — Cut the Cake! 🎂</span>
        </button>
      )}
    </section>
  );
}