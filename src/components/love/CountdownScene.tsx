"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, Cake } from "lucide-react";
import { getBirthdayDate, love } from "@/lib/love-config";
import { sound } from "@/lib/sound";
import FlipUnit from "./FlipUnit";

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

function computeRemaining(target: Date): Remaining {
  const diff = Math.max(0, target.getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    done: diff <= 0,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function CountdownScene({ onNext }: { onNext: () => void }) {
  const target = useMemo(() => getBirthdayDate(), []);
  const [r, setR] = useState<Remaining>(() => computeRemaining(target));
  const [arrived, setArrived] = useState(() => Date.now() >= target.getTime());
  const autoAdvanced = useRef(false);

  useEffect(() => {
    const tick = () => {
      const next = computeRemaining(target);
      setR(next);
      if (next.done) setArrived(true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  // When the clock strikes midnight: celebrate + auto-advance (once, no loop)
  useEffect(() => {
    if (arrived && !autoAdvanced.current) {
      autoAdvanced.current = true;
      const t = setTimeout(() => onNext(), 3200);
      return () => clearTimeout(t);
    }
  }, [arrived, onNext]);

  const dateLabel = useMemo(
    () =>
      target.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [target]
  );

  return (
    <section
      className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 py-16 text-center"
      aria-labelledby="cd-title"
    >
      <p className="font-script text-xl sm:text-2xl text-[color:var(--rose)] animate-[fadeUp_.8s_ease_both]">
        The Midnight Museum keeps one clock ticking
      </p>
      <h1
        id="cd-title"
        className="font-display neon-text mt-2 text-3xl sm:text-5xl lg:text-6xl font-semibold animate-[fadeUp_.9s_ease_.1s_both]"
      >
        Until Your Birthday, {love.recipientName} ❤️
      </h1>
      <p className="mt-3 text-sm sm:text-base text-[color:var(--text-soft)] animate-[fadeUp_1s_ease_.2s_both]">
        {dateLabel} · 12:00 AM · your local time
      </p>

      {/* The velvet table exhibit */}
      <div className="relative mt-10 mb-8 animate-[fadeUp_1.1s_ease_.3s_both]">
        <div className="ornate-card texture-velvet relative p-5 sm:p-7 max-w-lg mx-auto">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-40 h-1 rounded-full bg-gradient-to-r from-transparent via-[color:var(--brass)] to-transparent opacity-70" />
          <figure className="relative overflow-hidden rounded-xl border border-[color:var(--brass)]/40">
            <Image
              src="/images/museum-clock.png"
              alt="An antique brass flip clock glowing on a velvet table, lit by candlelight"
              width={640}
              height={640}
              priority
              sizes="(max-width: 640px) 88vw, 480px"
              className="w-full h-auto"
              style={{ filter: "saturate(1.05)" }}
            />
            <span
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(80% 60% at 50% 40%, transparent 55%, rgba(7,3,10,.55))",
              }}
            />
          </figure>
          <figcaption className="mt-2 text-[11px] tracking-[0.25em] uppercase text-[color:var(--brass)]">
            Exhibit 01 · The Waiting Room
          </figcaption>
        </div>
      </div>

      {arrived ? (
        <div role="status" className="animate-[fadeUp_.8s_ease_both]">
          <p className="font-script text-3xl sm:text-4xl text-[color:var(--champagne)]">
            It&apos;s time! 🎉
          </p>
          <p className="mt-2 text-[color:var(--text-soft)]">
            The clock has struck midnight — the museum doors are opening…
          </p>
          <button onClick={onNext} className="btn-museum mt-6">
            <Cake size={18} aria-hidden="true" />
            Enter the Celebration
          </button>
        </div>
      ) : (
        <>
          {/* flip clock */}
          <div
            className="flip-clock animate-[fadeUp_1.2s_ease_.4s_both]"
            role="timer"
            aria-live="off"
            aria-label={`${r.days} days, ${r.hours} hours, ${r.minutes} minutes, ${r.seconds} seconds remaining`}
          >
            <FlipUnit value={pad(r.days)} label="Days" />
            <FlipUnit value={pad(r.hours)} label="Hours" />
            <FlipUnit value={pad(r.minutes)} label="Minutes" />
            <FlipUnit value={pad(r.seconds)} label="Seconds" />
          </div>

          <p className="mt-8 max-w-md text-sm text-[color:var(--text-soft)] animate-[fadeUp_1.2s_ease_.55s_both]">
            Every second is one step closer to candles, cake and confetti —
            all waiting right behind this clock.
          </p>

          <button
            onClick={() => {
              sound.chime(700);
              onNext();
            }}
            className="btn-brass mt-6 animate-[fadeUp_1.2s_ease_.65s_both]"
          >
            Open My Surprise — Continue
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </>
      )}
    </section>
  );
}
