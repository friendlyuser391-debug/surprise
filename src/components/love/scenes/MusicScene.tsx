"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Heart, Music4, Pause, Play, Repeat, Shuffle, SkipBack, SkipForward,
  Trash2, Upload, Volume2,
} from "lucide-react";
import { sound } from "@/lib/sound";
import { fileToDataUrl, uid, useTracks } from "@/lib/store";
import { useIsReducedMotion } from "../Ambient";
import { MagneticButton } from "../motion";

const MAX_AUDIO_BYTES = 8 * 1024 * 1024; // localStorage-safe cap

interface Track {
  id: string;
  title: string;
  artist: string;
  src: string;
  fav: boolean;
}

function fmt(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export default function MusicScene({
  ambientOn,
  onToggleAmbient,
}: {
  ambientOn: boolean;
  onToggleAmbient: () => void;
}) {
  const tracks = useTracks((s) => s.tracks);
  const addTrack = useTracks((s) => s.add);
  const removeTrack = useTracks((s) => s.remove);
  const toggleFav = useTracks((s) => s.toggleFav);
  const reduced = useIsReducedMotion();

  const [currentId, setCurrentId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [notice, setNotice] = useState("");
  const [angle, setAngle] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(48).fill(0));

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef(0);
  const velRef = useRef(0); // vinyl angular velocity (deg/frame)
  const fileRef = useRef<HTMLInputElement>(null);

  const current: Track | undefined = useMemo(
    () => tracks.find((t) => t.id === currentId),
    [tracks, currentId]
  );

  /* ---------- vinyl spin with speed ramp ---------- */
  useEffect(() => {
    const target = playing && !reduced ? 2.4 : 0;
    const step = () => {
      velRef.current += (target - velRef.current) * 0.06;
      setAngle((a) => (a + velRef.current) % 360);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, reduced]);

  /* ---------- visualizer ---------- */
  useEffect(() => {
    let t = 0;
    const loop = () => {
      t += 0.08;
      const analyser = analyserRef.current;
      if (analyser && playing && current) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const bars: number[] = [];
        for (let i = 0; i < 48; i++) {
          bars.push(data[Math.floor((i / 48) * data.length)] / 255);
        }
        setLevels(bars);
      } else if (playing && !current) {
        // gentle synthetic levels for the built-in ambient pad
        setLevels(Array.from({ length: 48 }, (_, i) => 0.18 + Math.abs(Math.sin(t + i * 0.4)) * 0.5 * Math.sin(t * 0.6 + i)));
      } else {
        setLevels((prev) => prev.map((v) => v * 0.9));
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, current]);

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) return;
    if (!ctxRef.current) {
      const AC = window.AudioContext;
      ctxRef.current = new AC();
      analyserRef.current = ctxRef.current.createAnalyser();
      analyserRef.current.fftSize = 128;
      sourceRef.current = ctxRef.current.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(ctxRef.current.destination);
    }
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
  }, []);

  const stopAll = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
    if (ambientOn) onToggleAmbient();
    setPlaying(false);
  }, [ambientOn, onToggleAmbient]);

  const playTrack = useCallback(
    (id: string) => {
      const t = tracks.find((x) => x.id === id);
      if (!t) return;
      if (ambientOn) onToggleAmbient();
      ensureAudio();
      const el = audioRef.current;
      if (!el) return;
      if (currentId !== id) {
        el.src = t.src;
        setCurrentId(id);
      }
      el.volume = volume;
      void el.play().then(() => setPlaying(true)).catch(() => {
        setNotice("The browser blocked playback — press play again.");
        setPlaying(false);
      });
    },
    [tracks, currentId, ambientOn, onToggleAmbient, ensureAudio, volume]
  );

  const togglePlay = () => {
    if (current) {
      const el = audioRef.current;
      if (!el) return;
      if (playing) {
        el.pause();
        setPlaying(false);
      } else {
        playTrack(current.id);
      }
    } else {
      // no uploaded track selected — play the built-in ambient
      if (ambientOn) {
        onToggleAmbient();
        setPlaying(false);
      } else {
        onToggleAmbient();
        setPlaying(true);
      }
      sound.chime(720);
    }
  };

  const next = () => {
    if (!tracks.length) return;
    const idx = tracks.findIndex((t) => t.id === currentId);
    const nextIdx = shuffle
      ? Math.floor(Math.random() * tracks.length)
      : (idx + 1) % tracks.length;
    playTrack(tracks[nextIdx].id);
  };

  const prev = () => {
    if (!tracks.length) return;
    const idx = tracks.findIndex((t) => t.id === currentId);
    playTrack(tracks[(idx - 1 + tracks.length) % tracks.length].id);
  };

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    let added = 0;
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("audio/")) {
        setNotice(`${f.name} is not an audio file — skipped.`);
        continue;
      }
      if (f.size > MAX_AUDIO_BYTES) {
        setNotice(`${f.name} is over 8 MB — skipped (browser storage limit).`);
        continue;
      }
      addTrack({
        id: uid(),
        title: f.name.replace(/\.[^.]+$/, ""),
        artist: "Your playlist",
        src: await fileToDataUrl(f),
        fav: false,
      });
      added++;
    }
    if (added) {
      setNotice(`${added} track${added > 1 ? "s" : ""} added to the crate. You keep the rights to your music.`);
      sound.chime(900);
    }
  };

  return (
    <section
      className="relative z-10 mx-auto flex min-h-dvh w-full max-w-4xl flex-col items-center px-4 py-16 pb-32 lg:pb-24"
      aria-labelledby="mus-title"
    >
      <h1 id="mus-title" className="font-display neon-text text-center text-4xl font-semibold sm:text-5xl">
        The Music Room
      </h1>
      <p className="mt-2 text-center text-sm text-[color:var(--text-soft)]">
        Drop the needle. Let the night sing.
      </p>

      {/* the turntable */}
      <div className="turntable mt-10" aria-hidden="true">
        <div className="vinyl" style={{ transform: `rotate(${angle}deg)` }}>
          <div className="grooves" />
          <div className="label">
            <canvas
              className="viz-ring"
              width={220}
              height={220}
              aria-hidden="true"
              ref={(c) => {
                if (!c) return;
                const ctx = c.getContext("2d");
                if (!ctx) return;
                ctx.clearRect(0, 0, 220, 220);
                const cx = 110, cy = 110;
                levels.forEach((v, i) => {
                  const a = (i / 48) * Math.PI * 2 - Math.PI / 2;
                  const r0 = 62, r1 = 62 + v * 26;
                  ctx.strokeStyle = `rgba(255,126,182,${0.25 + v * 0.75})`;
                  ctx.lineWidth = 2.4;
                  ctx.beginPath();
                  ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
                  ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
                  ctx.stroke();
                });
              }}
            />
            <span className="label-text">{current ? current.title : "Ambient"}</span>
          </div>
        </div>
        <div className={`tonearm ${playing ? "on" : ""}`} />
      </div>

      {/* transport controls */}
      <div className="mt-8 flex w-full max-w-md flex-col items-center gap-3">
        <p className="text-sm text-[color:var(--text-soft)]" aria-live="polite">
          {current
            ? `${current.title} — ${current.artist}`
            : "Built-in ambient soundscape (original, synthesized)"}
        </p>
        <div className="flex items-center gap-3">
          <button onClick={prev} aria-label="Previous track" className="ctrl-btn" disabled={!tracks.length}>
            <SkipBack size={17} aria-hidden="true" />
          </button>
          <MagneticButton onClick={togglePlay} className="btn-museum !h-14 !w-14 !rounded-full !p-0" ariaLabel={playing ? "Pause" : "Play"}>
            <span className="grid place-items-center">{playing ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}</span>
          </MagneticButton>
          <button onClick={next} aria-label="Next track" className="ctrl-btn" disabled={!tracks.length}>
            <SkipForward size={17} aria-hidden="true" />
          </button>
        </div>

        {/* seek */}
        <div className="flex w-full items-center gap-2 text-[11px] text-[color:var(--brass)]">
          <span className="tabular-nums">{fmt(time)}</span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.5}
            value={time}
            onChange={(e) => {
              const el = audioRef.current;
              if (el && current) {
                el.currentTime = Number(e.target.value);
                setTime(Number(e.target.value));
              }
            }}
            aria-label="Seek"
            className="slider flex-1"
            disabled={!current}
          />
          <span className="tabular-nums">{fmt(duration)}</span>
        </div>

        <div className="flex w-full items-center justify-center gap-4">
          <label className="flex items-center gap-2 text-[11px] text-[color:var(--brass)]">
            <Volume2 size={13} aria-hidden="true" />
            <input
              type="range" min={0} max={1} step={0.05} value={volume}
              onChange={(e) => {
                const v = Number(e.target.value);
                setVolume(v);
                sound.setVolume(v);
                if (audioRef.current) audioRef.current.volume = v;
              }}
              aria-label="Volume"
              className="slider w-24"
            />
          </label>
          <button onClick={() => setShuffle((s) => !s)} aria-pressed={shuffle} aria-label="Shuffle" className={`ctrl-btn small ${shuffle ? "active" : ""}`}>
            <Shuffle size={14} aria-hidden="true" />
          </button>
          <button onClick={() => setRepeat((r) => !r)} aria-pressed={repeat} aria-label="Repeat" className={`ctrl-btn small ${repeat ? "active" : ""}`}>
            <Repeat size={14} aria-hidden="true" />
          </button>
        </div>
        <p aria-live="polite" className="min-h-4 text-center text-xs text-[color:var(--brass)]">{notice}</p>
      </div>

      {/* playlist */}
      <div className="ornate-card mt-8 w-full max-w-lg p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[color:var(--champagne)]">
            <Music4 size={15} aria-hidden="true" /> The Crate ({tracks.length})
          </h2>
          <input ref={fileRef} type="file" accept="audio/*" multiple className="hidden" aria-label="Upload audio tracks"
            onChange={(e) => void onUpload(e.target.files)} />
          <button onClick={() => fileRef.current?.click()} className="btn-brass !min-h-0 !py-2 text-xs">
            <Upload size={12} aria-hidden="true" /> Add tracks
          </button>
        </div>

        {tracks.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-[color:var(--brass)]/40 p-5 text-center">
            <p className="font-script text-2xl text-[color:var(--champagne)]">The crate is empty</p>
            <p className="mt-1 text-xs leading-relaxed text-[color:var(--text-soft)]">
              Add songs you have the rights to use (mp3/m4a/ogg, up to 8&nbsp;MB each).
              Until then, the built-in ambient melody is on the turntable — or press play
              above to hear it now.
            </p>
          </div>
        ) : (
          <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto pr-1">
            {tracks.map((t) => (
              <li
                key={t.id}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                  t.id === currentId
                    ? "border-[color:var(--rose)]/60 bg-[rgba(255,46,147,.12)]"
                    : "border-[color:var(--brass)]/20 bg-[rgba(18,6,26,.5)]"
                }`}
              >
                <button onClick={() => playTrack(t.id)} className="flex-1 text-left" aria-label={`Play ${t.title}`}>
                  <span className="block truncate text-sm text-[color:var(--text-primary)]">{t.title}</span>
                  <span className="block text-[10px] text-[color:var(--brass)]/80">{t.artist}</span>
                </button>
                <button
                  onClick={() => toggleFav(t.id)}
                  aria-label={t.fav ? "Unfavourite track" : "Favourite track"}
                  aria-pressed={t.fav}
                  className={`grid h-8 w-8 place-items-center rounded-full ${t.fav ? "text-[color:var(--neon)]" : "text-white/50"}`}
                >
                  <Heart size={13} fill={t.fav ? "currentColor" : "none"} aria-hidden="true" />
                </button>
                <button
                  onClick={() => {
                    removeTrack(t.id);
                    if (currentId === t.id) stopAll();
                  }}
                  aria-label={`Remove ${t.title}`}
                  className="grid h-8 w-8 place-items-center rounded-full text-white/50 hover:text-[color:var(--rose)]"
                >
                  <Trash2 size={13} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* hidden audio element + repeat handling */}
      <audio
        ref={audioRef}
        hidden
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => {
          if (repeat && current) playTrack(current.id);
          else next();
        }}
        onError={() => setNotice("That track could not load — it may be an unsupported format.")}
      />
    </section>
  );
}
