"use client";

/**
 * THE CAKE CELEBRATION — Birthday Scene
 *
 * Requirements:
 *   - In cake celebrations: DO NOT USE CRACKERS! Use party pops (confetti cannons,
 *     streamers, party popper audio) instead.
 *   - Rich realistic background animations all oriented on friendship (drifting
 *     friendship polaroids, quotes, promises, warm candlelight ambiance).
 *   - The cake was idle: now it is fully animated! The plate slides in, tiers assemble,
 *     frosting and strawberry toppings drop in, candles descend and place themselves
 *     one by one, wicks ignite with sparks, and then Manju can blow them!
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Heart, Music, RotateCcw, ScrollText, Sparkles, Wind } from "lucide-react";
import { love } from "@/lib/love-config";
import { fx } from "@/lib/fx";
import { sound } from "@/lib/sound";
import { useSettings } from "@/lib/store";
import { useIsReducedMotion } from "./Ambient";

const CANDLE_COUNT = 5;
const BALLOON_COLORS = ["#ff2e93", "#ff7eb6", "#cdb8ff", "#f4dfb4", "#a3125f", "#e75a9b"];
const HBD_DEPTH = 9;

function hbdLayerColor(i: number) {
  const t = i / HBD_DEPTH;
  const h = 330 - t * 24;
  const l = 34 - t * 24;
  return `hsl(${h.toFixed(0)} 62% ${l.toFixed(0)}%)`;
}

// Romantic memories & love charms drifting in the background
const LOVE_CHARMS = [
  { text: "My Whole Heart ❤️", sub: "The foundation of everything" },
  { text: "Every Beat for You 💖", sub: "You make life pure magic" },
  { text: "Forever With Manju 💫", sub: "My one and only love" },
  { text: "Always My Safe Place 🤍", sub: "Home is wherever you are" },
  { text: "Soulmates Forever 🌹", sub: "In every heartbeat and dream" },
  { text: "Infinite Love 🏆", sub: "Cherishing you endlessly" },
];

export default function BirthdayScene({ onNext }: { onNext?: () => void }) {
  const reduced = useIsReducedMotion();
  const overrideMsgs = useSettings((s) => s.birthdayMessagesOverride);
  const messages = overrideMsgs ?? love.birthdayMessages;

  // Cake animation sequence stages:
  // 0: Initial
  // 1: Plate enters
  // 2: Bottom tier (t2) arrives
  // 3: Top tier (t1) lands
  // 4: Frosting & toppings appear
  // 5: Candles descending (placed one by one)
  // 6: Candles ignited! Ready to blow
  const [cakeStage, setCakeStage] = useState(0);
  const [placedCandles, setPlacedCandles] = useState<number[]>([]);
  const [litCandles, setLitCandles] = useState<number[]>([]);

  const [blowing, setBlowing] = useState(false);
  const [celebrated, setCelebrated] = useState(false);
  const [revealedLines, setRevealedLines] = useState(0);
  const [smoke, setSmoke] = useState<number[]>([]);
  const [balloons, setBalloons] = useState<number[]>([]);
  const [musicOn, setMusicOn] = useState(false);
  const [finale, setFinale] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const [giftOpen, setGiftOpen] = useState(false);

  const giftRef = useRef<HTMLDivElement>(null);
  const finaleRef = useRef<HTMLDivElement>(null);
  const animTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const addAnim = useCallback((fn: () => void, ms: number) => {
    animTimers.current.push(setTimeout(fn, ms));
  }, []);

  const clearAnims = useCallback(() => {
    animTimers.current.forEach(clearTimeout);
    animTimers.current = [];
  }, []);

  // ══════════════════════════════════════════════════════════
  // ANIMATED CAKE ASSEMBLY SEQUENCE
  // Plate -> Tier 2 -> Tier 1 -> Toppings -> Candles Placed -> Candles Lit
  // ══════════════════════════════════════════════════════════
  const startCakeAssembly = useCallback(() => {
    clearAnims();
    setCakeStage(0);
    setPlacedCandles([]);
    setLitCandles([]);
    setSmoke([]);

    if (reduced) {
      setCakeStage(6);
      setPlacedCandles(Array.from({ length: CANDLE_COUNT }, (_, i) => i));
      setLitCandles(Array.from({ length: CANDLE_COUNT }, (_, i) => i));
      return;
    }

    // Step 1: Plate slides in
    addAnim(() => {
      setCakeStage(1);
      sound.chime(520);
    }, 400);

    // Step 2: Base tier (t2) drops
    addAnim(() => {
      setCakeStage(2);
      sound.pop();
    }, 1100);

    // Step 3: Top tier (t1) lands with frosting ripples
    addAnim(() => {
      setCakeStage(3);
      sound.pop();
    }, 1800);

    // Step 4: Strawberry & golden sugar pearl toppings drop in
    addAnim(() => {
      setCakeStage(4);
      sound.chime(660);
    }, 2400);

    // Step 5: Candles descend and get placed one by one!
    addAnim(() => setCakeStage(5), 2900);
    for (let i = 0; i < CANDLE_COUNT; i++) {
      addAnim(() => {
        setPlacedCandles((prev) => [...prev, i]);
        sound.click();
      }, 3100 + i * 280);
    }

    // Step 6: Candles ignite with warm sparks one by one!
    for (let i = 0; i < CANDLE_COUNT; i++) {
      addAnim(() => {
        setLitCandles((prev) => [...prev, i]);
        sound.chime(700 + i * 80);
      }, 4700 + i * 260);
    }

    // Step 7: Ready to blow!
    addAnim(() => {
      setCakeStage(6);
      sound.chime(1040);
    }, 6200);
  }, [clearAnims, addAnim, reduced]);

  useEffect(() => {
    startCakeAssembly();
    return clearAnims;
  }, [startCakeAssembly, clearAnims]);

  // ══════════════════════════════════════════════════════════
  // CELEBRATION (NO CRACKERS — ONLY PARTY POPS!)
  // ══════════════════════════════════════════════════════════
  const celebrate = useCallback(() => {
    setCelebrated(true);

    // Multiple party poppers popping across the room!
    const w = window.innerWidth;
    const h = window.innerHeight;
    fx.partyPopper(w * 0.2, h * 0.5, 90);
    fx.partyPopper(w * 0.8, h * 0.5, 90);
    fx.partyPopper(w * 0.5, h * 0.45, 120);
    sound.popper();

    setTimeout(() => {
      fx.partyPopper(w * 0.35, h * 0.4, 80);
      fx.partyPopper(w * 0.65, h * 0.4, 80);
      sound.popper();
    }, 380);

    if (!reduced) {
      setBalloons(Array.from({ length: 8 }, (_, i) => i));
    }

    // Music box "Happy Birthday" tune plays
    addAnim(() => sound.playHappyBirthday(), 650);

    // Reveal birthday messages line by line
    messages.forEach((_, i) => {
      addAnim(
        () => setRevealedLines(i + 1),
        (reduced ? 200 : 900) + i * (reduced ? 200 : 1300)
      );
    });
  }, [reduced, messages, addAnim]);

  // Blow out candles
  const blowOut = useCallback(() => {
    if (cakeStage < 6 || litCandles.length < CANDLE_COUNT || blowing) return;
    setBlowing(true);
    sound.unlock();
    sound.whoosh();

    // Candles go out one by one with gentle smoke
    for (let i = 0; i < CANDLE_COUNT; i++) {
      addAnim(() => {
        setLitCandles((lit) => lit.filter((c) => c !== i));
        setSmoke((s) => [...s, i]);
        sound.pop();
      }, reduced ? 0 : 240 * i + 140);
    }

    addAnim(
      () => {
        setBlowing(false);
        celebrate();
      },
      reduced ? 300 : 240 * CANDLE_COUNT + 450
    );
  }, [cakeStage, litCandles.length, blowing, reduced, addAnim, celebrate]);

  const replay = () => {
    clearAnims();
    fx.clear();
    setBalloons([]);
    setRevealedLines(0);
    setCelebrated(false);
    setBlowing(false);
    setFinale(false);
    setGiftOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    startCakeAssembly();
  };

  const openGift = () => {
    if (giftOpen) return;
    setGiftOpen(true);
    fx.partyPopper(window.innerWidth / 2, window.innerHeight * 0.4, 130);
    sound.popper();
    sound.chime(920);
    setTimeout(
      () => giftRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" }),
      250
    );
  };

  const replay3d = () => {
    setSpinKey((k) => k + 1);
    fx.partyPopper(window.innerWidth / 2, window.innerHeight * 0.35, 80);
    sound.popper();
  };

  const toggleMusic = () => {
    const on = sound.toggleAmbient();
    setMusicOn(on);
  };

  // Grand 3D finale after message reveal
  const finaleDue = celebrated && revealedLines >= messages.length;
  useEffect(() => {
    if (!finaleDue || finale) return;
    const t = setTimeout(() => {
      setFinale(true);
      fx.partyPopper(window.innerWidth / 2, window.innerHeight * 0.3, 100);
      sound.popper();
      sound.chime(1180);
    }, 900);
    return () => clearTimeout(t);
  }, [finaleDue, finale]);

  useEffect(() => {
    if (!finale) return;
    const t = setTimeout(
      () => finaleRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" }),
      300
    );
    return () => clearTimeout(t);
  }, [finale, reduced]);

  const cakeReady = cakeStage >= 6;

  return (
    <section
      className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 py-16 text-center overflow-hidden"
      aria-labelledby="bday-title"
    >
      {/* ══════════════════════════════════════════════════════════
          FRIENDSHIP-ORIENTED REALISTIC BACKGROUND ANIMATIONS
          Floating love memory tokens, warm romantic ambient glow
          ══════════════════════════════════════════════════════════ */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* Soft romantic ambient aura */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(255,126,182,0.18), rgba(205,184,255,0.08) 45%, transparent 70%)",
            animation: "aurora-drift 20s ease-in-out infinite alternate",
          }}
        />

        {/* Floating romantic love memory tokens drifting gently */}
        {LOVE_CHARMS.map((charm, i) => {
          const left = 5 + (i * 16) % 85;
          const top = 12 + ((i * 23) % 70);
          return (
            <div
              key={charm.text}
              className="absolute hidden md:flex flex-col items-center rounded-2xl border border-[color:var(--brass)]/25 bg-[rgba(18,6,26,0.65)] px-3 py-2 text-center backdrop-blur-sm shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                animation: `float-heart ${14 + i * 2}s ease-in-out infinite alternate`,
                animationDelay: `${i * 1.8}s`,
                opacity: 0.65,
              }}
            >
              <span className="font-script text-base text-[color:var(--champagne)]">{charm.text}</span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-[color:var(--rose)]/80">
                {charm.sub}
              </span>
            </div>
          );
        })}
      </div>

      {/* Balloons rising when celebrated */}
      {balloons.map((b, i) => (
        <span
          key={b}
          className="balloon"
          aria-hidden="true"
          style={{
            left: `${8 + i * 12}%`,
            background: `radial-gradient(circle at 34% 28%, #ffffff59, ${BALLOON_COLORS[i % BALLOON_COLORS.length]} 46%)`,
            animationDuration: `${7 + i * 1.2}s`,
            animationDelay: `${i * 0.35}s`,
          }}
        />
      ))}

      {/* Romantic Header Badge */}
      <div className="relative z-10 inline-flex items-center gap-2 rounded-full border border-[color:var(--brass)]/30 bg-[rgba(18,6,26,.8)] px-4 py-1.5 backdrop-blur-md mb-2 animate-[fadeUp_.7s_ease_both]">
        <Heart size={14} className="text-[color:var(--neon)]" fill="currentColor" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[color:var(--champagne)]">
          Forever in Love · Celebrating You
        </span>
      </div>

      <h1
        id="bday-title"
        className="relative z-10 font-display neon-text text-[clamp(2.4rem,8.5vw,5.5rem)] font-bold leading-tight animate-[fadeUp_.9s_ease_both]"
      >
        Happy Birthday,
        <br />
        {love.recipientName}! 🎂
      </h1>
      <p className="relative z-10 font-script mt-2 text-2xl sm:text-3xl text-[color:var(--champagne)] animate-[fadeUp_1s_ease_.15s_both]">
        Loving you makes every single moment extraordinary.
      </p>

      {/* ══════════════════════════════════════════════════════════
          ANIMATED CAKE — Builds tier by tier, places candles, lights up!
          ══════════════════════════════════════════════════════════ */}
      <div
        className="cake-stage relative z-10 mt-12 animate-[fadeUp_1.1s_ease_.3s_both]"
        aria-label="Animated birthday cake"
      >
        <div className="cake">
          {/* CANDLES — Descend and get placed onto the top tier */}
          {Array.from({ length: CANDLE_COUNT }).map((_, i) => {
            const offset = (i - (CANDLE_COUNT - 1) / 2) * 26;
            const isPlaced = placedCandles.includes(i);
            const isLit = litCandles.includes(i);

            return (
              <div
                key={i}
                className="candle"
                style={{
                  left: `calc(50% + ${offset}px)`,
                  bottom: "100%",
                  zIndex: 5,
                  opacity: isPlaced ? 1 : 0,
                  transform: isPlaced ? "translateY(0)" : "translateY(-45px)",
                  transition: "opacity 0.4s ease, transform 0.5s cubic-bezier(0.34, 1.4, 0.64, 1)",
                }}
              >
                {/* Multi-layered Candle Flame */}
                {isLit && (
                  <span className="flame-wrap">
                    <span className="flame-halo" aria-hidden="true" />
                    <span
                      className="flame"
                      style={{
                        animationDuration: `${0.32 + ((i * 7) % 5) * 0.05}s`,
                        animationDelay: `${((i * 13) % 7) * 0.07}s`,
                      }}
                    />
                    <span
                      className="flame-core"
                      style={{
                        animationDuration: `${0.28 + ((i * 5) % 4) * 0.04}s`,
                        animationDelay: `${((i * 11) % 5) * 0.05}s`,
                      }}
                      aria-hidden="true"
                    />
                    <span className="flame-base" aria-hidden="true" />
                  </span>
                )}
                {smoke.includes(i) && (
                  <span className="smoke" style={{ animationDelay: `${i * 0.1}s` }} />
                )}
              </div>
            );
          })}

          {/* TOP TIER (t1) */}
          <div
            className="cake-tier t1"
            style={{
              opacity: cakeStage >= 3 ? 1 : 0,
              transform: cakeStage >= 3 ? "translateY(0) scale(1)" : "translateY(-30px) scale(0.9)",
              transition: "opacity 0.5s ease, transform 0.6s cubic-bezier(0.34, 1.3, 0.64, 1)",
            }}
          >
            {/* Strawberries topping */}
            {cakeStage >= 4 && (
              <div className="absolute -top-3 left-0 right-0 flex justify-around px-2 z-10 animate-[fadeUp_.4s_ease_both]">
                <span className="text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">🍓</span>
                <span className="text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">✨</span>
                <span className="text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">🍓</span>
              </div>
            )}
            <div className="icing">
              <span className="icing-drip" style={{ left: "28%", height: "24px" }} />
              <span className="icing-drip" style={{ right: "30%" }} />
            </div>
          </div>

          {/* BASE TIER (t2) */}
          <div
            className="cake-tier t2"
            style={{
              opacity: cakeStage >= 2 ? 1 : 0,
              transform: cakeStage >= 2 ? "translateY(0) scale(1)" : "translateY(-40px) scale(0.85)",
              transition: "opacity 0.5s ease, transform 0.6s cubic-bezier(0.34, 1.3, 0.64, 1)",
            }}
          >
            <div className="icing">
              <span className="icing-drip" style={{ left: "20%" }} />
              <span className="icing-drip" style={{ left: "48%", height: "34px" }} />
              <span className="icing-drip" style={{ right: "22%" }} />
            </div>
          </div>

          {/* PLATE */}
          <div
            className="cake-plate"
            style={{
              opacity: cakeStage >= 1 ? 1 : 0,
              transform: cakeStage >= 1 ? "scale(1)" : "scale(0.6)",
              transition: "opacity 0.4s ease, transform 0.5s ease",
            }}
          />
        </div>
      </div>

      {/* Cake Assembly Status / Invitation */}
      <div className="relative z-10 mt-3 text-xs tracking-[0.25em] uppercase text-[color:var(--brass)]">
        {cakeStage < 5 ? (
          <span className="animate-pulse">Decorating your birthday cake… 🎂</span>
        ) : cakeStage === 5 ? (
          <span className="animate-pulse">Placing candles with love… 🕯️</span>
        ) : litCandles.length > 0 ? (
          <span className="text-[color:var(--rose)] font-semibold">Candles are glowing! Make your wish ✨</span>
        ) : (
          <span>Wish made & celebration begun! 🎉</span>
        )}
      </div>

      {/* Blow / Celebrate Controls */}
      <div className="relative z-10 mt-8 flex flex-col items-center gap-4">
        {cakeReady && litCandles.length > 0 ? (
          <button
            onClick={blowOut}
            disabled={blowing}
            className="btn-museum shadow-[0_0_30px_rgba(255,46,147,0.6)] animate-[pulse_2s_ease-in-out_infinite]"
          >
            <Wind size={20} aria-hidden="true" />
            {blowing ? "Blowing candles…" : "Blow the Candles, Manju! 🎂"}
          </button>
        ) : cakeReady && litCandles.length === 0 && !celebrated ? (
          <p className="comedy-bubble animate-[fadeUp_.6s_ease_both]">
            Candles out! Preparing the celebration pops… 🎀
          </p>
        ) : null}

        {/* Line by line message reveal */}
        <div aria-live="polite" className="min-h-[7rem] flex flex-col gap-2 mt-2 max-w-xl">
          {messages.slice(0, revealedLines).map((line, i) => (
            <p
              key={i}
              className={`animate-[fadeUp_.8s_ease_both] ${
                i === 0
                  ? "font-display text-2xl sm:text-3xl text-[color:var(--champagne)] neon-text"
                  : "text-base sm:text-lg text-[color:var(--text-soft)]"
              }`}
            >
              {line}
            </p>
          ))}
          {celebrated && revealedLines >= messages.length && (
            <p className="font-script text-2xl sm:text-3xl text-[color:var(--rose)] animate-[fadeUp_1s_ease_both]">
              — {love.finalMessage} —
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {celebrated && (
            <button onClick={replay} className="btn-brass">
              <RotateCcw size={15} aria-hidden="true" />
              Re-Assemble & Celebrate Again
            </button>
          )}
          <button onClick={toggleMusic} className="btn-brass" aria-pressed={musicOn}>
            <Music size={15} aria-hidden="true" />
            {musicOn ? "Pause Music" : "Play Music Box"}
          </button>
        </div>
      </div>

      {/* Exhibit Card */}
      <div className="ornate-card relative z-10 mt-14 p-3 rotate-[1.5deg] max-w-[240px] animate-[fadeUp_1.2s_ease_.5s_both]">
        <Image
          src="/images/birthday-cake.png"
          alt="An elegant pink birthday cake with glowing golden candles"
          width={320}
          height={320}
          sizes="240px"
          className="w-full h-auto rounded-lg"
        />
        <p className="mt-2 text-[11px] tracking-[0.25em] uppercase text-[color:var(--brass)]">
          Exhibit 03 · Sweet Love &amp; Cake
        </p>
      </div>

      {/* ═══ THE GRAND 3D FINALE — Extruded Happy Birthday ═══ */}
      {finale && (
        <div
          ref={finaleRef}
          className="hbd3d-stage relative z-10 mt-16 w-full max-w-3xl animate-[fadeUp_1s_ease_both]"
          role="img"
          aria-label={`Happy Birthday ${love.recipientName} 3D lettering`}
        >
          <p className="mb-8 text-[11px] tracking-[0.3em] uppercase text-[color:var(--brass)]">
            ✦ Dedicated to the Love of My Life ✦
          </p>

          <span className="hbd3d-spot" style={{ left: "10%", animationDuration: "4.6s" }} aria-hidden="true" />
          <span
            className="hbd3d-spot"
            style={{ left: "44%", animationDuration: "6.2s", animationDelay: "-1.4s" }}
            aria-hidden="true"
          />
          <span
            className="hbd3d-spot"
            style={{ left: "78%", animationDuration: "5.2s", animationDelay: "-2.6s" }}
            aria-hidden="true"
          />

          <div className="hbd3d-persp">
            <div key={spinKey} className="hbd3d-block">
              <div className="hbd3d-float">
                <div className="hbd3d-text font-display">
                  {Array.from({ length: HBD_DEPTH }, (_, i) => {
                    const depth = HBD_DEPTH - i;
                    return (
                      <span
                        key={depth}
                        className="hbd3d-layer"
                        aria-hidden="true"
                        style={{
                          transform: `translateZ(${depth * -11}px)`,
                          color: hbdLayerColor(depth),
                        }}
                      >
                        HAPPY BIRTHDAY
                      </span>
                    );
                  })}
                  <span className="hbd3d-layer hbd3d-top">HAPPY BIRTHDAY</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hbd3d-floor" aria-hidden="true" />

          <p className="hbd3d-name font-script text-3xl sm:text-4xl text-[color:var(--rose)]">
            dear {love.recipientName} ❤️
          </p>

          <button onClick={replay3d} className="btn-brass mt-7">
            <Sparkles size={15} aria-hidden="true" />
            Spin the 3D Stage
          </button>
        </div>
      )}

      {/* ═══ SURPRISE GIFT BOX ═══ */}
      {finale && (
        <div
          ref={giftRef}
          className="gift-wrap relative z-10 mt-16 flex w-full max-w-3xl flex-col items-center animate-[fadeUp_1s_ease_both]"
        >
          <p className="mb-6 text-[11px] tracking-[0.3em] uppercase text-[color:var(--brass)]">
            A Gift of Pure Love Inside…
          </p>

          <button
            onClick={openGift}
            disabled={giftOpen}
            className={`gift-box ${giftOpen ? "open" : ""}`}
            aria-label={giftOpen ? "Gift opened" : "Open your surprise gift"}
          >
            <span className="gift-lid" aria-hidden="true">
              <span className="gift-bow" />
            </span>
            <span className="gift-body" aria-hidden="true" />
          </button>

          {!giftOpen ? (
            <p className="font-script mt-5 animate-pulse text-xl text-[color:var(--champagne)]">
              Tap to open your love keepsakes, {love.recipientName}…
            </p>
          ) : (
            <>
              <p className="font-script mt-5 text-2xl text-[color:var(--rose)] animate-[fadeUp_.7s_ease_both]">
                six little promises, always yours with all my heart and love 🎀
              </p>
              <div className="coupons mt-6 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {love.giftCoupons.map((c, i) => (
                  <div key={c.title} className="coupon" style={{ animationDelay: `${0.15 + i * 0.16}s` }}>
                    <span className="coupon-emoji" aria-hidden="true">
                      {c.emoji}
                    </span>
                    <p className="font-display mt-1 text-base text-[color:var(--champagne)]">{c.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[color:var(--text-soft)]">{c.desc}</p>
                    <p className="coupon-snip text-[10px] tracking-[0.25em] uppercase text-[color:var(--brass)]/70">
                      ✂ no expiry
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Continue to Letter */}
      {finale && giftOpen && onNext && (
        <div className="relative z-10 mt-12 flex flex-col items-center gap-3 animate-[fadeUp_1s_ease_both]">
          <button onClick={() => { sound.chime(1000); onNext(); }} className="btn-museum">
            <ScrollText size={18} aria-hidden="true" />
            Continue to Your Letter 💌
          </button>
          <p className="text-[11px] tracking-[0.25em] uppercase text-[color:var(--brass)]/80">
            our story continues
          </p>
        </div>
      )}

      <p className="relative z-10 mt-10 flex items-center gap-2 text-sm text-[color:var(--text-soft)]">
        <Sparkles size={15} aria-hidden="true" className="text-[color:var(--rose)]" />
        Crafted with all my heart and eternal love, for {love.recipientName}
      </p>
    </section>
  );
}
