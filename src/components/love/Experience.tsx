"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { fx } from "@/lib/fx";
import { sound } from "@/lib/sound";
import { useSettings } from "@/lib/store";
import Ambient, { useIsReducedMotion, useHydrated } from "./Ambient";
import DoorScene from "./scenes/DoorScene";
import CountdownScene from "./CountdownScene";
import SurpriseScene from "./SurpriseScene";
import SecretGameScene from "./scenes/SecretGameScene";
import LetterScene from "./LetterScene";
import FireworksShow from "./FireworksShow";
import BirthdayScene from "./BirthdayScene";
import GalleryScene from "./scenes/GalleryScene";
import HistoryScene from "./scenes/HistoryScene";
import FinalTouchScene from "./scenes/FinalTouchScene";
import MusicScene from "./scenes/MusicScene";
import DiaryScene from "./scenes/DiaryScene";
import JournalScene from "./scenes/JournalScene";
import SpecialDaysScene from "./scenes/SpecialDaysScene";
import VaultScene from "./scenes/VaultScene";
import SettingsScene from "./scenes/SettingsScene";

export const VALID_ROOMS = [
  "door", "secret-game", "fireworks", "birthday", "letter", "history", "final-touch",
  "countdown", "surprise",
  "gallery", "music", "diary", "journal", "special-days",
  "vault", "settings",
] as const;
export type RoomId = (typeof VALID_ROOMS)[number];

/** Candle-lit loading screen — flame lights, then the museum wakes. */
function CandleLoader({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-[color:var(--ink)]"
      role="status"
      aria-label="Lighting the candles — loading"
    >
      <div className="text-center">
        <div className="relative mx-auto h-28 w-10" aria-hidden="true">
          <span
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3.5 h-16 rounded-[3px]"
            style={{
              background: "repeating-linear-gradient(-45deg,#f4dfb4 0 5px,#a3125f 5px 10px)",
            }}
          />
          <span
            className="absolute bottom-[64px] left-1/2 -translate-x-1/2 w-4 h-9"
            style={{
              borderRadius: "50% 50% 50% 50% / 62% 62% 38% 38%",
              background:
                "radial-gradient(circle at 50% 78%, #fff8d8 0 18%, #ffd475 34%, #ff9d3c 58%, rgba(255,110,60,0) 78%)",
              filter: "drop-shadow(0 0 10px rgba(255,190,90,.95)) drop-shadow(0 0 26px rgba(255,140,60,.55))",
              transformOrigin: "50% 100%",
              animation: "flame-flicker .45s ease-in-out infinite alternate",
            }}
          />
        </div>
        <p className="mt-6 font-display text-lg text-[color:var(--champagne)] tracking-wide">
          Lighting the candles…
        </p>
        <p className="mt-1 font-script text-xl text-[color:var(--rose)]">for Manju</p>
      </div>
    </div>
  );
}

export default function Experience() {
  const reduced = useIsReducedMotion();
  const mounted = useHydrated();
  const animLevel = useSettings((s) => s.animLevel);
  const [loaded, setLoaded] = useState(false);
  const [scene, setScene] = useState<RoomId>("door");
  const [wiping, setWiping] = useState(false);
  const [heartTaps, setHeartTaps] = useState(0);
  const [musicOn, setMusicOn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pendingNav = useRef<string | null>(null);

  useEffect(() => {
    fx.probe();
    if (animLevel !== "full") fx.quality = animLevel;
    if (canvasRef.current) fx.attach(canvasRef.current);
    return () => fx.detach();
  }, [animLevel]);

  // hash router (#/gallery ↔ gallery.html in the classic spec)
  useEffect(() => {
    const readHash = () => {
      const id = window.location.hash.replace(/^#\/?/, "") as RoomId;
      setScene(VALID_ROOMS.includes(id) ? id : "door");
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  const navigate = useCallback(
    (next: string) => {
      const target = (VALID_ROOMS.includes(next as RoomId) ? next : "door") as RoomId;
      setScene(target);
      if (window.location.hash !== `#/${target}`) {
        window.location.hash = `/${target}`;
      }
      if (reduced) {
        window.scrollTo({ top: 0 });
        return;
      }
      setWiping(true);
      pendingNav.current = target;
    },
    [reduced]
  );

  // NOTE: scene actually changes via hashchange; the wipe is purely cosmetic.
  useEffect(() => {
    if (!wiping) return;
    const done = setTimeout(() => {
      setWiping(false);
      pendingNav.current = null;
    }, 1350);
    window.scrollTo({ top: 0 });
    return () => clearTimeout(done);
  }, [wiping, scene]);

  const toggleMusic = useCallback(() => {
    const on = sound.toggleAmbient();
    setMusicOn(on);
  }, []);

  // hidden delight: 7 taps on the floating heart → heart shower
  const tapHeart = (e: React.MouseEvent<HTMLButtonElement>) => {
    sound.chime(560 + heartTaps * 40);
    const next = heartTaps + 1;
    setHeartTaps(next);
    if (next >= 7) {
      fx.heartShower();
      setHeartTaps(0);
    }
    const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    fx.sealBurst(r.left + r.width / 2, r.top + r.height / 2);
  };

  const renderRoom = () => {
    switch (scene) {
      // ── the main celebration journey ──
      case "secret-game": return <SecretGameScene onNext={() => navigate("fireworks")} />;
      case "fireworks": return <FireworksShow onNext={() => navigate("birthday")} />;
      case "birthday": return <BirthdayScene onNext={() => navigate("letter")} />;
      case "letter": return <LetterScene onNext={() => navigate("history")} />;
      case "history": return <HistoryScene onNext={() => navigate("final-touch")} />;
      case "final-touch": return (
        <FinalTouchScene
          onReplay={() => navigate("door")}
          onVisit={(room) => navigate(room)}
        />
      );
      // ── the museum rooms that stay open ──
      case "countdown": return <CountdownScene onNext={() => navigate("surprise")} />;
      case "surprise": return <SurpriseScene onNext={() => navigate("letter")} />;
      case "gallery": return <GalleryScene />;
      case "music": return <MusicScene ambientOn={musicOn} onToggleAmbient={toggleMusic} />;
      case "diary": return <DiaryScene />;
      case "journal": return <JournalScene />;
      case "special-days": return <SpecialDaysScene />;
      case "vault": return <VaultScene />;
      case "settings": return <SettingsScene />;
      default: return <DoorScene onUnlock={() => navigate("secret-game")} />;
    }
  };

  return (
    <main
      className="relative min-h-dvh"
      style={{
        filter: wiping && !reduced ? "brightness(.75)" : undefined,
        transition: "filter .5s ease",
      }}
    >
      {!loaded && <CandleLoader onDone={() => setLoaded(true)} />}

      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[45]" />
      <Ambient intensity={scene === "birthday" || scene === "fireworks" ? 1.25 : 1} />

      {/* scene progress — the main journey breadcrumb */}
      <div
        aria-label="Journey progress"
        className="fixed top-2 left-1/2 z-30 -translate-x-1/2 rounded-full border border-[color:var(--brass)]/30 bg-[rgba(12,4,20,.7)] px-3 py-1.5 backdrop-blur-md lg:hidden"
      >
        <ul className="flex items-center gap-1.5">
          {["door", "secret-game", "fireworks", "birthday", "letter", "history", "final-touch"].map((id, i, arr) => {
            const idx = arr.indexOf(scene);
            return (
              <li key={id} className="flex items-center gap-1.5">
                <span className={`progress-dot ${i === idx ? "active" : i < idx ? "done" : ""}`} />
                {i < arr.length - 1 && <span aria-hidden="true" className="text-[9px] text-[color:var(--brass)]/40">✦</span>}
              </li>
            );
          })}
        </ul>
      </div>

      {/* hidden delight — floating heart */}
      <button
        onClick={tapHeart}
        aria-label="A little heart — tap it seven times for a surprise"
        title="Tap me 7 times… ❤️"
        className="fixed bottom-20 left-4 z-30 grid h-11 w-11 place-items-center rounded-full border border-[color:var(--brass)]/40 bg-[rgba(12,4,20,.7)] backdrop-blur-md text-[color:var(--neon)] shadow-[0_0_18px_rgba(255,46,147,.45)] transition-transform hover:scale-110 active:scale-95 lg:bottom-5"
      >
        <Heart size={20} style={{ animation: "heart-breathe 3s ease-in-out infinite" }} aria-hidden="true" />
      </button>

      {mounted && renderRoom()}

      {/* petal-wipe transition overlay */}
      {wiping && !reduced && (
        <div className="curtain3d-overlay" aria-hidden="true">
          <div className="curtain3d-rod" />
          <div className="curtain3d-panel left" />
          <div className="curtain3d-panel right" />
          <div className="curtain3d-bloom">
            <Heart size={48} className="text-[color:var(--rose)]" fill="currentColor" style={{ filter: "drop-shadow(0 0 18px rgba(255,46,147,.85))" }} />
          </div>
        </div>
      )}
    </main>
  );
}
