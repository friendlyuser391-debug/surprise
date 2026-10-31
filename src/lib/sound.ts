/**
 * Synthesized Web Audio Sound Engine for "Forever With Manju".
 * Real synthesized cracker sound effects, rocket whistles, laddu bursts,
 * gentle party pops, music-box Happy Birthday, and ambient soundscapes.
 * Sound is enabled by default as requested.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientNodes: { stop: () => void }[] = [];
  enabled = true; // Always on as requested
  ambientOn = false;
  private initialized = false;

  constructor() {
    if (typeof window !== "undefined") {
      const autoUnlock = () => {
        this.unlock();
        window.removeEventListener("pointerdown", autoUnlock);
        window.removeEventListener("keydown", autoUnlock);
        window.removeEventListener("touchstart", autoUnlock);
      };
      window.addEventListener("pointerdown", autoUnlock, { passive: true });
      window.addEventListener("keydown", autoUnlock, { passive: true });
      window.addEventListener("touchstart", autoUnlock, { passive: true });
    }
  }

  private ensureCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.65;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  setVolume(v: number) {
    if (this.master) this.master.gain.value = Math.max(0, Math.min(1, v));
  }

  /** Unlock audio after any user gesture */
  unlock() {
    this.enabled = true;
    const ctx = this.ensureCtx();
    if (ctx && ctx.state === "suspended") {
      void ctx.resume();
    }
  }

  /** One soft music-box note: fast attack, long exponential fade. */
  private pluck(freq: number, t: number, dur: number, vol: number) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  /** Soft warm acoustic string/pad harmony for chords */
  private warmPad(freq: number, t: number, dur: number, vol: number) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  /**
   * The rich celebratory Happy Birthday Song!
   * Rich musical chords, bell harmonics, celesta sparkle, and warm resonance.
   * Default tempo: 0.38s/beat = ~10 seconds of full celebratory melody.
   */
  playHappyBirthday(tempo = 0.38) {
    this.enabled = true;
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return;
    const N = {
      G4: 392.0, A4: 440.0, B4: 493.88, C5: 523.25,
      D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
    } as const;
    const beat = tempo;
    const score: [keyof typeof N | 0, number][] = [
      // Phrase 1: Happy Birthday to You
      ["G4", 0.75], ["G4", 0.25], ["A4", 1], ["G4", 1], ["C5", 1], ["B4", 2],
      [0, 0.5],
      // Phrase 2: Happy Birthday to You
      ["G4", 0.75], ["G4", 0.25], ["A4", 1], ["G4", 1], ["D5", 1], ["C5", 2],
      [0, 0.5],
      // Phrase 3: Happy Birthday Dear Manju
      ["G4", 0.75], ["G4", 0.25], ["G5", 1], ["E5", 1], ["C5", 1], ["B4", 1], ["A4", 2],
      [0, 0.5],
      // Phrase 4: Happy Birthday to You
      ["F5", 0.75], ["F5", 0.25], ["E5", 1], ["C5", 1], ["D5", 1], ["C5", 2.5],
    ];

    let t = ctx.currentTime + 0.1;

    // Harmonic backing chords across the 4 phrases
    const p1Duration = 6 * beat;
    const p2Duration = 6 * beat;
    const p3Duration = 7 * beat;
    const p4Duration = 6.5 * beat;

    // Phrase 1: C Major warmth (C3 + G3 + E4)
    [130.81, 196.0, 329.63].forEach((f) => this.warmPad(f, t, p1Duration, 0.045));

    // Phrase 2: G Major warmth (98.0 G2 + 146.83 D3 + 246.94 B3)
    const t2 = t + p1Duration + 0.5 * beat;
    [98.0, 146.83, 246.94].forEach((f) => this.warmPad(f, t2, p2Duration, 0.045));

    // Phrase 3: C Major to F Major warmth
    const t3 = t2 + p2Duration + 0.5 * beat;
    [130.81, 196.0].forEach((f) => this.warmPad(f, t3, 2.5 * beat, 0.045));
    [174.61, 220.0, 261.63].forEach((f) => this.warmPad(f, t3 + 2.5 * beat, 4.5 * beat, 0.045));

    // Phrase 4: F Major -> G Major -> C Major resolve!
    const t4 = t3 + p3Duration + 0.5 * beat;
    [174.61, 261.63].forEach((f) => this.warmPad(f, t4, 2 * beat, 0.045));
    [196.0, 293.66].forEach((f) => this.warmPad(f, t4 + 2 * beat, 2 * beat, 0.045));
    [130.81, 196.0, 261.63, 329.63, 523.25].forEach((f) => this.warmPad(f, t4 + 4 * beat, 3.5 * beat, 0.06));

    // Melody plucks with bright celesta overtones
    for (const [note, beats] of score) {
      const dur = beats * beat;
      if (note !== 0) {
        // Fundamental bell tone
        this.pluck(N[note], t, Math.min(dur * 1.9, 2.4), 0.22);
        // Soft chime octave (+1 octave)
        this.pluck(N[note] * 2, t, Math.min(dur * 1.3, 1.6), 0.055);
        // Soft warm triangle overtone for body
        this.warmPad(N[note], t, Math.min(dur * 1.2, 1.8), 0.08);
      }
      t += dur;
    }
  }

  /** Soft multi-tone chime */
  chime(base = 660) {
    if (!this.enabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    [base, base * 1.5, base * 2].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      g.gain.setValueAtTime(0, t + i * 0.08);
      g.gain.linearRampToValueAtTime(0.18 / (i + 1), t + i * 0.08 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.08 + 0.9);
      osc.connect(g).connect(this.master!);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 1);
    });
  }

  /** Soft mechanical click */
  click() {
    if (!this.enabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.04), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2400;
    const g = ctx.createGain();
    g.gain.value = 0.22;
    src.connect(filter).connect(g).connect(this.master);
    src.start(t);
  }

  /** Gentle pop */
  pop() {
    if (!this.enabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(340, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.16);
    g.gain.setValueAtTime(0.24, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  /** Soft whoosh */
  whoosh() {
    if (!this.enabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const env = Math.sin((i / data.length) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env * 0.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.5);
    const g = ctx.createGain();
    g.gain.value = 0.3;
    src.connect(filter).connect(g).connect(this.master);
    src.start(t);
  }

  /** Playful car horn beep-beep (musical dual-tone F# and A) */
  carHorn() {
    if (!this.enabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const playBeep = (time: number, dur: number) => {
      [440, 554.37].forEach((freq) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(0.18, time + 0.015);
        g.gain.setValueAtTime(0.18, time + dur - 0.02);
        g.gain.linearRampToValueAtTime(0, time + dur);
        osc.connect(g).connect(this.master!);
        osc.start(time);
        osc.stop(time + dur + 0.02);
      });
    };
    playBeep(t, 0.12);
    playBeep(t + 0.16, 0.16);
  }

  /** Car acceleration engine rev / cruise sound */
  carRev() {
    if (!this.enabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.35);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.7);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(350, t);
    filter.frequency.linearRampToValueAtTime(700, t + 0.35);
    filter.frequency.linearRampToValueAtTime(300, t + 0.7);

    g.gain.setValueAtTime(0.01, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.18);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

    osc.connect(filter).connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.8);
  }

  // ══════════════════════════════════════════════════════════
  // ORIGINAL CRACKER SOUNDS — Real explosive dynamics!
  // ══════════════════════════════════════════════════════════

  /**
   * Sky Rocket Launch — ascending whistling roar.
   * Real rocket trajectory audio: propulsion hiss + sweeping whistle!
   */
  rocketLaunch() {
    if (!this.enabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const dur = 0.75;

    // 1. Whistling motor
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(1600, t + dur);
    oscGain.gain.setValueAtTime(0.02, t);
    oscGain.gain.linearRampToValueAtTime(0.18, t + dur * 0.6);
    oscGain.gain.linearRampToValueAtTime(0.001, t + dur);
    osc.connect(oscGain).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);

    // 2. Fiery propulsion hiss
    const bufLen = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.min(1, i / (ctx.sampleRate * 0.1));
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.linearRampToValueAtTime(2200, t + dur);
    filter.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter).connect(g).connect(this.master);
    src.start(t);
  }

  /**
   * Original Cracker Explosion (Aerial Shell BOOM!)
   * Sharp detonation crack + heavy punchy sub-bass drop + atmospheric reverb tail.
   */
  boom() {
    if (!this.enabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;

    // 1. Initial sharp supersonic crack (0.04s)
    const crackLen = Math.floor(ctx.sampleRate * 0.06);
    const crackBuf = ctx.createBuffer(1, crackLen, ctx.sampleRate);
    const crackData = crackBuf.getChannelData(0);
    for (let i = 0; i < crackLen; i++) {
      crackData[i] = (Math.random() * 2 - 1) * (1 - i / crackLen) ** 2;
    }
    const crackSrc = ctx.createBufferSource();
    crackSrc.buffer = crackBuf;
    const crackFilter = ctx.createBiquadFilter();
    crackFilter.type = "bandpass";
    crackFilter.frequency.value = 2200;
    const crackGain = ctx.createGain();
    crackGain.gain.setValueAtTime(0.7, t);
    crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    crackSrc.connect(crackFilter).connect(crackGain).connect(this.master);
    crackSrc.start(t);

    // 2. Heavy Sub-Bass detonation drop (160Hz -> 34Hz)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(170, t);
    subOsc.frequency.exponentialRampToValueAtTime(34, t + 0.38);
    subGain.gain.setValueAtTime(0.8, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    subOsc.connect(subGain).connect(this.master);
    subOsc.start(t);
    subOsc.stop(t + 0.5);

    // 3. Low-frequency chest thump (triangular pressure wave)
    const midOsc = ctx.createOscillator();
    const midGain = ctx.createGain();
    midOsc.type = "triangle";
    midOsc.frequency.setValueAtTime(95, t);
    midOsc.frequency.exponentialRampToValueAtTime(26, t + 0.28);
    midGain.gain.setValueAtTime(0.45, t);
    midGain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    midOsc.connect(midGain).connect(this.master);
    midOsc.start(t);
    midOsc.stop(t + 0.35);

    // 4. Distant night sky rumble / echo tail (1.2s)
    const tailLen = Math.floor(ctx.sampleRate * 0.9);
    const tailBuf = ctx.createBuffer(1, tailLen, ctx.sampleRate);
    const tailData = tailBuf.getChannelData(0);
    for (let i = 0; i < tailLen; i++) {
      tailData[i] = (Math.random() * 2 - 1) * (1 - i / tailLen) ** 3.5;
    }
    const tailSrc = ctx.createBufferSource();
    tailSrc.buffer = tailBuf;
    const tailFilter = ctx.createBiquadFilter();
    tailFilter.type = "lowpass";
    tailFilter.frequency.setValueAtTime(650, t);
    tailFilter.frequency.exponentialRampToValueAtTime(90, t + 0.9);
    const tailGain = ctx.createGain();
    tailGain.gain.setValueAtTime(0.35, t + 0.04);
    tailGain.gain.exponentialRampToValueAtTime(0.001, t + 0.95);
    tailSrc.connect(tailFilter).connect(tailGain).connect(this.master);
    tailSrc.start(t + 0.02);
  }

  /**
   * Heart Firework Boom — deep romantic thump with celestial chimes.
   */
  heartBoom() {
    this.boom();
    if (!this.enabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime + 0.12;
    // fairy sparkle chime sprinkle
    const freqs = [880, 1174, 1318, 1760, 2093];
    freqs.forEach((f, i) => {
      this.pluck(f, t + i * 0.05, 0.9, 0.08);
    });
  }

  /**
   * Heartbeat pulse sound (lub-dub) with low-frequency romantic warmth.
   */
  heartbeat() {
    if (!this.enabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    // Pulse 1: "Lub"
    const o1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    o1.type = "sine";
    o1.frequency.setValueAtTime(85, t);
    o1.frequency.exponentialRampToValueAtTime(32, t + 0.14);
    g1.gain.setValueAtTime(0.5, t);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    o1.connect(g1).connect(this.master);
    o1.start(t);
    o1.stop(t + 0.18);

    // Pulse 2: "Dub"
    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = "sine";
    o2.frequency.setValueAtTime(75, t + 0.15);
    o2.frequency.exponentialRampToValueAtTime(28, t + 0.32);
    g2.gain.setValueAtTime(0.65, t + 0.15);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o2.connect(g2).connect(this.master);
    o2.start(t + 0.15);
    o2.stop(t + 0.38);

    // Soft chime sparkle
    this.pluck(1174, t + 0.18, 0.8, 0.08);
  }

  /**
   * Cupid Arrow zip & sparkle sound.
   */
  cupidWhistle() {
    if (!this.enabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(1450, t + 0.22);
    g.gain.setValueAtTime(0.02, t);
    g.gain.linearRampToValueAtTime(0.14, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.25);
    this.pluck(1760, t + 0.22, 0.9, 0.09);
  }

  /**
   * Indian Garland / Laddu / 1000-Wala Cracker Chain!
   * Rapid machine-gun bursts of snappy pops with a big finale thud.
   */
  garland(burstCount = 18) {
    if (!this.enabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return;

    for (let i = 0; i < burstCount; i++) {
      const delay = i * 0.045 + Math.random() * 0.025;
      const isLast = i >= burstCount - 2;
      setTimeout(() => {
        if (!this.ctx || !this.master) return;
        const nt = this.ctx.currentTime;
        const bLen = Math.floor(this.ctx.sampleRate * (isLast ? 0.18 : 0.04));
        const buf = this.ctx.createBuffer(1, bLen, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let j = 0; j < bLen; j++) d[j] = (Math.random() * 2 - 1) * (1 - j / bLen) ** 2;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filt = this.ctx.createBiquadFilter();
        filt.type = "highpass";
        filt.frequency.value = isLast ? 800 : 1800 + Math.random() * 800;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(isLast ? 0.45 : 0.22 + Math.random() * 0.1, nt);
        g.gain.exponentialRampToValueAtTime(0.001, nt + (isLast ? 0.2 : 0.05));
        src.connect(filt).connect(g).connect(this.master!);
        src.start(nt);
        if (isLast) this.boom();
      }, delay * 1000);
    }
  }

  /**
   * Catherine-wheel crackle — a scatter of tiny high-passed pops.
   */
  crackle() {
    if (!this.enabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return;
    for (let i = 0; i < 11; i++) {
      const t = ctx.currentTime + i * 0.04 + Math.random() * 0.035;
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < data.length; j++) data[j] = (Math.random() * 2 - 1) * (1 - j / data.length) ** 2;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 2400 + Math.random() * 800;
      const g = ctx.createGain();
      g.gain.value = 0.16;
      src.connect(filter).connect(g).connect(this.master);
      src.start(t);
    }
  }

  /** Sizzling fountain / flower-pot / chakkar sound */
  fizz(durationMs = 3000) {
    if (!this.enabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const dur = Math.min(durationMs, 12000) / 1000;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const env = Math.min(1, i / (ctx.sampleRate * 0.1)) * Math.min(1, (data.length - i) / (ctx.sampleRate * 0.3));
      data[i] = (Math.random() * 2 - 1) * env * 0.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 3600;
    filter.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.value = 0.14;
    src.connect(filter).connect(g).connect(this.master);
    src.start(t);
  }

  // ══════════════════════════════════════════════════════════
  // PARTY POPS (FOR CAKE CELEBRATION — NO CRACKERS HERE)
  // ══════════════════════════════════════════════════════════

  /**
   * Party Popper / Confetti Cannon pop:
   * Pressurized cork pop ("puck!") + soft paper streamer flutter + celebratory chime.
   * Completely distinct from fireworks!
   */
  popper() {
    if (!this.enabled) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;

    // 1. Pressurized "thump-puck" air pop
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(460, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.12);
    g.gain.setValueAtTime(0.42, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.15);

    // 2. Confetti scatter hiss (gentle paper flutter)
    const bLen = Math.floor(ctx.sampleRate * 0.35);
    const buf = ctx.createBuffer(1, bLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bLen; i++) {
      const env = Math.sin((i / bLen) * Math.PI) * (1 - i / bLen);
      data[i] = (Math.random() * 2 - 1) * env * 0.3;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.value = 3200;
    filt.Q.value = 0.6;
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.2, t + 0.02);
    sg.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    src.connect(filt).connect(sg).connect(this.master);
    src.start(t + 0.01);

    // 3. Gentle cheerful harp bell
    this.pluck(1046.5, t + 0.05, 0.8, 0.12); // C6
    this.pluck(1318.5, t + 0.12, 0.7, 0.09); // E6
    this.pluck(1567.98, t + 0.18, 0.9, 0.08); // G6
  }

  /**
   * Ambient warm soundscape
   */
  toggleAmbient(): boolean {
    if (this.ambientOn) {
      this.ambientNodes.forEach((n) => n.stop());
      this.ambientNodes = [];
      this.ambientOn = false;
      return false;
    }
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return false;
    this.enabled = true;
    const t = ctx.currentTime;

    const padGain = ctx.createGain();
    padGain.gain.setValueAtTime(0, t);
    padGain.gain.linearRampToValueAtTime(0.09, t + 2.4);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 750;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start(t);
    const oscs: OscillatorNode[] = [];
    [110, 164.81, 220, 277.18].forEach((f) => {
      [0, 3].forEach((detune) => {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = f;
        o.detune.value = detune;
        o.connect(padGain);
        o.start(t);
        oscs.push(o);
      });
    });
    padGain.connect(filter).connect(this.master);

    const notes = [440, 523.25, 659.25, 587.33, 880];
    let stopped = false;
    const sparkler = () => {
      if (stopped) return;
      const f = notes[(Math.random() * notes.length) | 0];
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      const nt = ctx.currentTime;
      g.gain.setValueAtTime(0, nt);
      g.gain.linearRampToValueAtTime(0.045, nt + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, nt + 2.4);
      o.connect(g).connect(this.master!);
      o.start(nt);
      o.stop(nt + 2.6);
      timer = window.setTimeout(sparkler, 1600 + Math.random() * 2600);
    };
    let timer = window.setTimeout(sparkler, 1800);

    this.ambientNodes.push({
      stop: () => {
        stopped = true;
        clearTimeout(timer);
        const nt = ctx.currentTime;
        padGain.gain.cancelScheduledValues(nt);
        padGain.gain.setValueAtTime(padGain.gain.value, nt);
        padGain.gain.linearRampToValueAtTime(0, nt + 0.8);
        oscs.forEach((o) => o.stop(nt + 1));
        lfo.stop(nt + 1);
      },
    });
    this.ambientOn = true;
    return true;
  }
}

export const sound = new SoundEngine();
