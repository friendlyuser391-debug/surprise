"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A single antique flip-clock digit group (e.g. "05").
 * Mechanical 3D rotateX flip with shadow flick on change.
 */
function FlipDigit({ digit }: { digit: string }) {
  const [prev, setPrev] = useState(digit);
  // flipping is derived: true while the leaf is animating from prev -> digit
  const flipping = digit !== prev;

  useEffect(() => {
    if (digit === prev) return;
    const t = setTimeout(() => setPrev(digit), 640);
    return () => clearTimeout(t);
  }, [digit, prev]);

  return (
    <span className="flip-digit" aria-hidden="true">
      {/* static top shows the NEW value arriving */}
      <span className="half top">
        <span>{flipping ? digit : prev}</span>
      </span>
      {/* static bottom shows the OLD value until the leaf lands */}
      <span className="half bottom">
        <span>{flipping ? prev : digit}</span>
      </span>
      {flipping && (
        <>
          <span className="leaf front">
            <span
              className="half top"
              style={{
                position: "absolute",
                background: "linear-gradient(180deg,#241031,#1c0b28)",
                boxShadow:
                  "inset 0 0 0 1px rgba(201,165,106,.35), 0 6px 14px rgba(0,0,0,.55)",
              }}
            >
              <span>{prev}</span>
            </span>
          </span>
          <span className="leaf back">
            <span
              className="half bottom"
              style={{
                position: "absolute",
                background: "linear-gradient(180deg,#221030,#150818)",
                boxShadow:
                  "inset 0 0 0 1px rgba(201,165,106,.35), 0 -6px 14px rgba(0,0,0,.5)",
              }}
            >
              <span>{digit}</span>
            </span>
          </span>
        </>
      )}
    </span>
  );
}

export default function FlipUnit({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="flip-unit">
      <div className="flip-stack">
        {value.split("").map((d, i) => (
          <FlipDigit key={i} digit={d} />
        ))}
      </div>
      <span className="flip-label">{label}</span>
      <span className="sr-only">
        {label}: {value}
      </span>
    </div>
  );
}
