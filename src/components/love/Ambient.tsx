"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

export function useIsReducedMotion() {
  return useReducedMotion();
}

/**
 * Hydration-safe "is this running on the client yet?" flag.
 * Returns false during SSR and the first client render, true afterwards —
 * without calling setState inside an effect.
 */
const subscribeHydrated = () => () => {};
function useHydrated() {
  return useSyncExternalStore(subscribeHydrated, () => true, () => false);
}
export { useHydrated };

/** Deterministic pseudo-random so SSR and client agree. */
function seeded(i: number, salt = 1) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * The museum atmosphere: aurora, bokeh, lamp beam, dust motes,
 * petals, floating hearts, sparkles, occasional shooting star,
 * film grain and vignette. Pointer-reactive parallax on desktop.
 */
export default function Ambient({ intensity = 1 }: { intensity?: number }) {
  const reduced = useReducedMotion();
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const frame = useRef(0);

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        setParallax({
          x: (e.clientX / window.innerWidth - 0.5) * 2,
          y: (e.clientY / window.innerHeight - 0.5) * 2,
        });
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame.current);
    };
  }, [reduced]);

  const motes = useMemo(
    () =>
      Array.from({ length: Math.round(14 * intensity) }, (_, i) => ({
        left: `${(seeded(i, 1) * 96 + 2).toFixed(2)}%`,
        size: Math.round(2 + seeded(i, 2) * 4),
        dur: `${(14 + seeded(i, 3) * 18).toFixed(1)}s`,
        delay: `${(-seeded(i, 4) * 20).toFixed(1)}s`,
      })),
    [intensity]
  );

  const petals = useMemo(
    () =>
      Array.from({ length: Math.round(9 * intensity) }, (_, i) => ({
        left: `${(seeded(i, 5) * 94 + 3).toFixed(2)}%`,
        dur: `${(11 + seeded(i, 6) * 9).toFixed(1)}s`,
        delay: `${(-seeded(i, 7) * 14).toFixed(1)}s`,
        scale: `${(0.7 + seeded(i, 8) * 0.7).toFixed(2)}`,
      })),
    [intensity]
  );

  const hearts = useMemo(
    () =>
      Array.from({ length: Math.round(6 * intensity) }, (_, i) => ({
        left: `${(seeded(i, 9) * 92 + 4).toFixed(2)}%`,
        size: Math.round(12 + seeded(i, 10) * 16),
        dur: `${(13 + seeded(i, 11) * 10).toFixed(1)}s`,
        delay: `${(-seeded(i, 12) * 16).toFixed(1)}s`,
      })),
    [intensity]
  );

  const sparkles = useMemo(
    () =>
      Array.from({ length: Math.round(10 * intensity) }, (_, i) => ({
        left: `${(seeded(i, 13) * 96 + 2).toFixed(2)}%`,
        top: `${(seeded(i, 14) * 88 + 4).toFixed(2)}%`,
        dur: `${(2.6 + seeded(i, 15) * 3.4).toFixed(1)}s`,
        delay: `${(-seeded(i, 16) * 5).toFixed(1)}s`,
      })),
    [intensity]
  );

  const [starKey, setStarKey] = useState(0);
  useEffect(() => {
    if (reduced) return;
    let alive = true;
    const t = setTimeout(function scheduleNext() {
      if (!alive) return;
      setStarKey((k) => k + 1);
      setTimeout(scheduleNext, 12000 + Math.random() * 16000);
    }, 9000);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [reduced]);

  return (
    <div aria-hidden="true">
      <div className="aurora" />
      <div
        className="bokeh"
        style={
          reduced
            ? undefined
            : { transform: `translate3d(${parallax.x * -14}px, ${parallax.y * -10}px, 0)` }
        }
      />
      <div className="lamp-beam" />
      <div
        className="fixed inset-0 z-[-1] overflow-hidden"
        style={
          reduced
            ? undefined
            : { transform: `translate3d(${parallax.x * 7}px, ${parallax.y * 5}px, 0)` }
        }
      >
        {starKey > 0 && !reduced && <span key={starKey} className="shooting-star" />}
        {!reduced &&
          motes.map((m, i) => (
            <span
              key={`m${i}`}
              className="dust-mote"
              style={{
                left: m.left,
                bottom: "-4vh",
                width: m.size,
                height: m.size,
                animationDuration: m.dur,
                animationDelay: m.delay,
              }}
            />
          ))}
        {!reduced &&
          sparkles.map((s, i) => (
            <span
              key={`s${i}`}
              className="sparkle"
              style={{
                left: s.left,
                top: s.top,
                animationDuration: s.dur,
                animationDelay: s.delay,
              }}
            />
          ))}
      </div>
      {!reduced && (
        <div className="fixed inset-0 z-[1] overflow-hidden pointer-events-none">
          {petals.map((p, i) => (
            <span
              key={`p${i}`}
              className="petal"
              style={{
                left: p.left,
                animationDuration: p.dur,
                animationDelay: p.delay,
                scale: p.scale,
              }}
            />
          ))}
          {hearts.map((h, i) => (
            <span
              key={`h${i}`}
              className="float-heart"
              style={{
                left: h.left,
                fontSize: h.size,
                animationDuration: h.dur,
                animationDelay: h.delay,
              }}
            >
              ❤
            </span>
          ))}
        </div>
      )}
      <div className="grain" />
      <div className="vignette" />
    </div>
  );
}
