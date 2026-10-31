"use client";

/**
 * THE FINAL TOUCH — the closing scene of the whole celebration.
 *
 * After the countdown password, the secret game, the crackers, the
 * cake, the letter and the history of our journey, this is where it
 * all settles: more drifting quotes, a few honest words about the
 * friendship underneath all of it, and a soft place to land.
 *
 * From here the rest of the museum (gallery, music, diary, journal,
 * special days, vault, settings) is still open whenever she wants it.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, RotateCcw, Sparkles } from "lucide-react";
import { love } from "@/lib/love-config";
import { fx } from "@/lib/fx";
import { sound } from "@/lib/sound";
import { useIsReducedMotion } from "../Ambient";
import { MagneticButton } from "../motion";

interface FinalTouchSceneProps {
  /** Optional navigator — lets the journey loop back to the start. */
  onReplay?: () => void;
  /** Optional visit callback. */
  onVisit?: (room: string) => void;
}

export default function FinalTouchScene({ onReplay }: FinalTouchSceneProps) {
  const reduced = useIsReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const promiseRefs = useRef<(HTMLElement | null)[]>([]);

  const quotes = useMemo(() => [...love.finalQuotes, ...love.finalQuotes], []);

  // a gentle confetti + heart shower on arrival
  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => {
      fx.heartBurst(window.innerWidth / 2, window.innerHeight * 0.32);
      fx.confettiBurst(window.innerWidth / 2, window.innerHeight * 0.32, 90);
    }, 600);
    return () => clearTimeout(t);
  }, [reduced]);

  // scroll-reveal the friendship promises
  useEffect(() => {
    const obs = new IntersectionObserver(
      (items) => {
        items.forEach((it) => {
          if (it.isIntersecting) {
            const idx = Number((it.target as HTMLElement).dataset.idx);
            setRevealed((prev) => new Set(prev).add(idx));
          }
        });
      },
      { threshold: 0.3 }
    );
    promiseRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center px-4 py-16 pb-32 text-center lg:pb-24"
      aria-labelledby="ft-title"
    >
      <p className="font-script text-xl sm:text-2xl text-[color:var(--rose)] animate-[fadeUp_.8s_ease_both]">
        And so, the celebration finds its quiet ending
      </p>
      <h1
        id="ft-title"
        className="font-display neon-text mt-1 text-4xl sm:text-6xl font-semibold animate-[fadeUp_.9s_ease_.1s_both]"
      >
        The Final Touch
      </h1>
      <p className="mt-1 text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[color:var(--champagne)]/75 font-medium animate-[fadeUp_.95s_ease_.15s_both]">
        To Manju ❤️
      </p>
      <p className="mt-3 max-w-lg text-sm sm:text-base text-[color:var(--text-soft)] animate-[fadeUp_1s_ease_.2s_both]">
        Candles blown, sky lit, letter read, story remembered. What is left is
        the simplest truth of all — us.
      </p>

      {/* drifting quotes ribbon */}
      <div className="ft-quotes mt-10 w-full" aria-hidden="true">
        <div className="ft-quotes-track">
          {quotes.map((q, i) => (
            <span key={i} className="ft-quote">
              {q}
              <span className="ft-quote-sep">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* the friendship section */}
      <div className="mt-12 w-full">
        <h2 className="font-display text-2xl sm:text-3xl text-[color:var(--champagne)] animate-[fadeUp_1s_ease_both]">
          {love.friendship.heading}
        </h2>
        <div className="mx-auto mt-5 max-w-2xl space-y-4 text-left">
          {love.friendship.paragraphs.map((p, i) => (
            <p
              key={i}
              className="ft-para text-[15px] sm:text-base leading-relaxed text-[color:var(--text-primary)]"
              style={{ animationDelay: `${0.2 + i * 0.15}s` }}
            >
              {p}
            </p>
          ))}
        </div>
      </div>

      {/* friendship promises */}
      <div className="mt-12 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {love.friendship.promises.map((c, i) => (
          <div
            key={c.title}
            data-idx={i}
            ref={(el) => { promiseRefs.current[i] = el; }}
            className={`ft-promise ${revealed.has(i) ? "revealed" : ""}`}
          >
            <span className="ft-promise-emoji" aria-hidden="true">{c.emoji}</span>
            <p className="font-display mt-1 text-base text-[color:var(--champagne)]">{c.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-[color:var(--text-soft)]">{c.desc}</p>
          </div>
        ))}
      </div>

      {/* closing words */}
      <div className="mt-14 max-w-xl animate-[fadeUp_1s_ease_both]">
        <Heart
          size={36}
          className="mx-auto text-[color:var(--rose)]"
          fill="currentColor"
          style={{ filter: "drop-shadow(0 0 16px rgba(255,46,147,.8))", animation: "heart-breathe 3s ease-in-out infinite" }}
          aria-hidden="true"
        />
        <p className="mt-4 font-script text-xl sm:text-2xl text-[color:var(--champagne)] leading-relaxed">
          {love.friendship.closing}
        </p>
        <p className="mt-4 text-sm text-[color:var(--brass)]">{love.friendship.signature}</p>
        <p className="mt-1.5 text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[color:var(--rose)]/80 font-medium">
          To Manju ❤️
        </p>
        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-[color:var(--text-soft)]">
          <Sparkles size={15} aria-hidden="true" className="text-[color:var(--rose)]" />
          {love.projectName} — {love.tagline}
        </p>
      </div>

      {/* replay the celebration */}
      {onReplay && (
        <div className="mt-14 w-full">
          <MagneticButton
            onClick={() => { sound.chime(880); fx.heartShower?.(); onReplay(); }}
            className="btn-museum"
            ariaLabel="Replay the whole celebration from the start"
          >
            <span className="flex items-center gap-2">
              <RotateCcw size={16} aria-hidden="true" /> Replay the Celebration
            </span>
          </MagneticButton>
        </div>
      )}
    </section>
  );
}
