"use client";

import { useCallback, useEffect, useState } from "react";

const MAX_CHANCES = 3;
const LOCK_MS = 2 * 60_000; // 2 minutes lock when 0 chances left
const REFILL_MS = 2 * 60_000; // 1 chance refilled every 2 minutes

interface StoredGate {
  chances: number;
  lockUntil: number; // epoch ms
  refillAt: number | null; // epoch ms
}

const FRESH: StoredGate = {
  chances: MAX_CHANCES,
  lockUntil: 0,
  refillAt: null,
};

function normalize(g: StoredGate, now: number): StoredGate {
  let chances = Math.min(MAX_CHANCES, Math.max(0, Math.floor(g.chances) || 0));
  let lockUntil = Math.max(0, Math.floor(g.lockUntil) || 0);
  let refillAt = g.refillAt != null && g.refillAt > 0 ? g.refillAt : null;

  if (chances >= MAX_CHANCES) {
    chances = MAX_CHANCES;
    lockUntil = 0;
    refillAt = null;
  } else {
    // If locked and lock has expired
    if (lockUntil && lockUntil <= now) {
      lockUntil = 0;
      if (chances === 0) {
        chances = 1;
        refillAt = now + REFILL_MS;
      }
    }
    // Drip refill: +1 chance every REFILL_MS
    while (refillAt && refillAt <= now && chances < MAX_CHANCES) {
      chances += 1;
      refillAt = chances >= MAX_CHANCES ? null : refillAt + REFILL_MS;
    }
    if (chances >= MAX_CHANCES) {
      chances = MAX_CHANCES;
      lockUntil = 0;
      refillAt = null;
    }
  }

  return { chances, lockUntil, refillAt };
}

export function usePasswordGate(storageKey: string) {
  const [gate, setGate] = useState<StoredGate>(() => {
    if (typeof window === "undefined") return FRESH;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return FRESH;
      return normalize(JSON.parse(raw), Date.now());
    } catch {
      return FRESH;
    }
  });

  const [now, setNow] = useState<number>(Date.now());

  // Tick every 500ms for countdown and auto-refill
  useEffect(() => {
    const id = setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);
      setGate((prev) => {
        const next = normalize(prev, currentNow);
        if (
          next.chances !== prev.chances ||
          next.lockUntil !== prev.lockUntil ||
          next.refillAt !== prev.refillAt
        ) {
          try {
            window.localStorage.setItem(storageKey, JSON.stringify(next));
          } catch {}
          return next;
        }
        return prev;
      });
    }, 500);
    return () => clearInterval(id);
  }, [storageKey]);

  const isLocked = gate.chances <= 0 && gate.lockUntil > now;
  const lockLeftMs = Math.max(0, gate.lockUntil - now);

  const formatMmSs = (ms: number) => {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const recordFail = useCallback(() => {
    setGate((prev) => {
      const currentNow = Date.now();
      const nextChances = Math.max(0, prev.chances - 1);
      let next: StoredGate;
      if (nextChances <= 0) {
        next = {
          chances: 0,
          lockUntil: currentNow + LOCK_MS,
          refillAt: currentNow + LOCK_MS + REFILL_MS,
        };
      } else {
        next = {
          chances: nextChances,
          lockUntil: 0,
          refillAt: prev.refillAt ?? currentNow + REFILL_MS,
        };
      }
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [storageKey]);

  const recordSuccess = useCallback(() => {
    setGate(FRESH);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {}
  }, [storageKey]);

  return {
    chances: gate.chances,
    maxChances: MAX_CHANCES,
    isLocked,
    lockLeftMs,
    lockLeftText: formatMmSs(lockLeftMs),
    refillLeftMs: gate.refillAt ? Math.max(0, gate.refillAt - now) : null,
    refillLeftText: gate.refillAt ? formatMmSs(Math.max(0, gate.refillAt - now)) : null,
    recordFail,
    recordSuccess,
  };
}

