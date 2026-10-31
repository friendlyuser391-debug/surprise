"use client";

import { useEffect, useState } from "react";
import { MailOpen, FastForward } from "lucide-react";
import { love } from "@/lib/love-config";
import { sound } from "@/lib/sound";
import { useIsReducedMotion } from "./Ambient";

/** Split text into animated letters (blur-to-sharp reveal). */
function RevealText({ text, delay = 0, skipped }: { text: string; delay?: number; skipped: boolean }) {
  if (skipped) return <>{text}</>;
  return (
    <>
      {text.split("").map((ch, i) => (
        <span
          key={i}
          className="reveal-letter"
          style={{ animationDelay: `${delay + i * 0.045}s` }}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </>
  );
}

export default function SurpriseScene({ onNext }: { onNext: () => void }) {
  const reduced = useIsReducedMotion();
  const [curtainsOpen, setCurtainsOpen] = useState(false);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    // curtains part shortly after the scene loads
    const t = setTimeout(() => {
      setCurtainsOpen(true);
      sound.chime(820);
    }, reduced ? 0 : 700);
    return () => clearTimeout(t);
  }, [reduced]);

  const skip = () => {
    setSkipped(true);
    setCurtainsOpen(true);
  };

  return (
    <section
      className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 py-16 text-center"
      aria-labelledby="sur-title"
    >
      {/* theatre curtains + rod + spotlight */}
      <div className="curtain-rod" aria-hidden="true" />
      <div className={`curtain left ${curtainsOpen ? "open" : ""}`} aria-hidden="true" />
      <div className={`curtain right ${curtainsOpen ? "open" : ""}`} aria-hidden="true" />
      {curtainsOpen && !reduced && !skipped && <div className="spotlight" aria-hidden="true" />}

      {/* skip control, visible while the sequence plays */}
      {!curtainsOpen && (
        <button
          onClick={skip}
          className="btn-brass fixed top-4 left-1/2 -translate-x-1/2 z-40 !text-xs"
        >
          <FastForward size={14} aria-hidden="true" />
          Skip animation
        </button>
      )}

      <p className="font-script text-xl sm:text-2xl text-[color:var(--rose)]">
        <RevealText text="The curtain rises…" delay={reduced ? 0 : 1.2} skipped={skipped || reduced} />
      </p>
      <h1
        id="sur-title"
        className="font-display neon-text mt-3 text-4xl sm:text-6xl lg:text-7xl font-semibold max-w-3xl leading-tight"
      >
        <RevealText
          text={`${love.recipientName}, Someone Has a Surprise for You! ❤️`}
          delay={reduced ? 0 : 1.6}
          skipped={skipped || reduced}
        />
      </h1>
      <p className="mt-5 max-w-lg text-base sm:text-lg text-[color:var(--text-soft)]">
        <RevealText
          text="Somewhere in this little museum, a letter is waiting — sealed with wax, written with a heartbeat."
          delay={reduced ? 0 : 2.6}
          skipped={skipped || reduced}
        />
      </p>

      <button
        onClick={() => {
          sound.chime(940);
          onNext();
        }}
        className="btn-museum mt-10 animate-[fadeUp_.9s_ease_both]"
        style={{ animationDelay: reduced ? "0s" : "3.6s" }}
      >
        <MailOpen size={18} aria-hidden="true" />
        Open Your Letter 💌
      </button>

      {/* glowing sparkle + heart row */}
      <div className="mt-10 flex gap-6 text-2xl" aria-hidden="true">
        {["💖", "✨", "💝", "✨", "💖"].map((h, i) => (
          <span
            key={i}
            className="inline-block"
            style={{
              animation: `heart-breathe 3s ease-in-out ${i * 0.4}s infinite`,
              filter: "drop-shadow(0 0 12px rgba(255,46,147,.8))",
            }}
          >
            {h}
          </span>
        ))}
      </div>
    </section>
  );
}
