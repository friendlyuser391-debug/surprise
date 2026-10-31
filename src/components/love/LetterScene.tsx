"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { FastForward, RotateCcw, ScrollText } from "lucide-react";
import { love } from "@/lib/love-config";
import { fx } from "@/lib/fx";
import { sound } from "@/lib/sound";
import { useSettings } from "@/lib/store";
import { useIsReducedMotion } from "./Ambient";

type Stage = "sealed" | "open" | "reading" | "done";

function buildLetter(l: {
  greeting: string;
  paragraphs: readonly string[];
  closing: string;
  signature: string;
  postscript: string;
}): string {
  const body = l.paragraphs.join("\n\n");
  return `${l.greeting}\n\n${body}\n\n${l.closing}\n${l.signature}\n\n${l.postscript}`;
}

export default function LetterScene({ onNext }: { onNext: () => void }) {
  const reduced = useIsReducedMotion();
  const override = useSettings((s) => s.letterOverride);
  const FULL_LETTER = useMemo(
    () => buildLetter(override ?? love.letter),
    [override]
  );
  const [stage, setStage] = useState<Stage>("sealed");
  const [typed, setTyped] = useState(0);
  const sealRef = useRef<HTMLDivElement>(null);
  const typeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fullLength = FULL_LETTER.length;
  const typing = stage === "reading" && typed < fullLength;
  // "done" is derived: the typewriter finished on its own or was skipped
  const isDone = stage === "done" || (stage === "reading" && typed >= fullLength);

  // typewriter with a soft pen-scratch rhythm (varied cadence)
  useEffect(() => {
    if (stage !== "reading" || typed >= fullLength) return;
    const ch = FULL_LETTER[typed];
    const base = reduced ? 0 : ch === "\n" ? 220 : /[.,!?…]/.test(ch) ? 150 : 18 + Math.random() * 26;
    typeTimer.current = setTimeout(() => setTyped((t) => t + 1), base);
    return () => {
      if (typeTimer.current) clearTimeout(typeTimer.current);
    };
  }, [stage, typed, fullLength, reduced]);

  const openEnvelope = useCallback(() => {
    if (stage !== "sealed") return;
    sound.pop();
    const rect = sealRef.current?.getBoundingClientRect();
    if (rect) fx.sealBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
    setStage("open");
  }, [stage]);

  const startReading = () => {
    sound.chime(760);
    setStage("reading");
    setTyped(0);
  };

  const showFull = () => {
    if (typeTimer.current) clearTimeout(typeTimer.current);
    setTyped(fullLength);
    setStage("done");
  };

  const replay = () => {
    if (typeTimer.current) clearTimeout(typeTimer.current);
    setTyped(0);
    setStage("sealed");
    // let the envelope close before allowing reopen
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  };

  return (
    <section
      className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 py-16 text-center"
      aria-labelledby="letter-title"
    >
      <p className="font-script text-xl sm:text-2xl text-[color:var(--rose)] animate-[fadeUp_.8s_ease_both]">
        Exhibit 02 · Sealed With Wax
      </p>
      <h1
        id="letter-title"
        className="font-display neon-text mt-2 text-3xl sm:text-5xl font-semibold animate-[fadeUp_.9s_ease_.1s_both]"
      >
        A Letter, Just for You
      </h1>

      {/* museum exhibit image */}
      <div className="ornate-card relative mt-8 p-3 rotate-[-2deg] max-w-[240px] animate-[fadeUp_1s_ease_.2s_both]">
        <Image
          src="/images/love-letter.png"
          alt="A love letter on aged paper with a red wax heart seal, beside dried rose petals"
          width={320}
          height={320}
          sizes="240px"
          className="w-full h-auto rounded-lg"
        />
      </div>

      {/* the envelope */}
      <div className="envelope-stage mt-10 w-full">
        <div
          className={`envelope ${stage !== "sealed" ? "open" : ""}`}
          role="button"
          tabIndex={stage === "sealed" ? 0 : -1}
          onClick={openEnvelope}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openEnvelope();
            }
          }}
          aria-label={
            stage === "sealed"
              ? "Open the envelope — press Enter or tap"
              : "Envelope open"
          }
        >
          <div className="env-letter texture-paper" aria-hidden="true">
            <p className="font-script text-center text-[#7a1740] text-lg leading-[27px] pt-2">
              For {love.recipientName}
            </p>
          </div>
          <div className="env-body texture-paper" />
          <div className="env-flap" />
          <div className="wax-seal" ref={sealRef}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 21s-7.5-4.9-10-9.2C.4 8.6 2 4.5 5.7 4.1c2-.2 3.9.9 5 2.6 1.1-1.7 3-2.8 5-2.6C19.4 4.5 21 8.6 19 11.8 16.5 16.1 12 21 12 21z" />
            </svg>
          </div>
        </div>

        {stage === "sealed" && (
          <p className="mt-4 text-xs tracking-[0.3em] uppercase text-[color:var(--brass)]">
            tap the seal to break the wax
          </p>
        )}
      </div>

      {/* actions per stage */}
      <div className="mt-8 flex flex-col items-center gap-4" aria-live="polite">
        {stage === "open" && (
          <button onClick={startReading} className="btn-museum animate-[fadeUp_.6s_ease_both]">
            <ScrollText size={18} aria-hidden="true" />
            Unfold &amp; Read the Letter
          </button>
        )}

        {(stage === "reading" || isDone) && (
          <>
            <div className="lined-paper texture-paper relative mx-auto w-full max-w-xl p-6 sm:p-9 text-left shadow-2xl animate-[fadeUp_.8s_ease_both]">
              <div className="absolute left-0 top-8 bottom-8 w-[2px] bg-[rgba(163,18,95,.25)]" aria-hidden="true" />
              <p
                className={`typewriter-text text-[15px] sm:text-[17px] leading-[28px] ${typing ? "caret" : ""}`}
                style={{ minHeight: "300px" }}
                aria-label={FULL_LETTER}
              >
                {FULL_LETTER.slice(0, typed)}
              </p>
              <p className="sr-only">{FULL_LETTER.slice(typed)}</p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {typing && (
                <button onClick={showFull} className="btn-brass">
                  <FastForward size={15} aria-hidden="true" />
                  Show full letter
                </button>
              )}
              <button onClick={replay} className="btn-brass">
                <RotateCcw size={15} aria-hidden="true" />
                Replay animation
              </button>
            </div>

            {isDone && (
              <button
                onClick={() => {
                  sound.chime(1000);
                  onNext();
                }}
                className="btn-museum animate-[fadeUp_.7s_ease_both]"
              >
                <ScrollText size={18} aria-hidden="true" />
                Continue to the Story of Us
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
