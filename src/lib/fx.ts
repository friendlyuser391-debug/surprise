/**
 * Shared canvas FX engine — confetti, fireworks, heart shower, petals.
 * One canvas, one rAF loop, adaptive particle budget, pauses when
 * the tab is hidden and fully respects reduced motion.
 */

export type FxQuality = "full" | "balanced" | "minimal" | "off";

interface Particle {
  kind: "confetti" | "spark" | "heart" | "trail" | "petal" | "glow";
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number;
  size: number; color: string; rot: number; vr: number;
  gravity: number; sway?: number; phase?: number;
}

class FxEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private raf = 0;
  private running = false;
  private lastT = 0;
  private dpr = 1;
  quality: FxQuality = "full";
  reducedMotion = false;
  private frameTimes: number[] = [];
  private degraded = false;
  /** cancellable timeouts (rockets, shows) — cleared by clear() */
  private timers = new Set<ReturnType<typeof setTimeout>>();

  /** setTimeout that is auto-cancelled when clear() is called (e.g. scene skip). */
  private after(ms: number, fn: () => void) {
    const t = setTimeout(() => {
      this.timers.delete(t);
      fn();
    }, ms);
    this.timers.add(t);
  }

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.resize();
    window.addEventListener("resize", this.resize);
    document.addEventListener("visibilitychange", this.onVisibility);
  }

  detach() {
    window.removeEventListener("resize", this.resize);
    document.removeEventListener("visibilitychange", this.onVisibility);
    cancelAnimationFrame(this.raf);
    this.running = false;
    this.canvas = null;
    this.ctx = null;
  }

  private resize = () => {
    if (!this.canvas) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(window.innerWidth * this.dpr);
    this.canvas.height = Math.floor(window.innerHeight * this.dpr);
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
  };

  private onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(this.raf);
      this.running = false;
    } else if (this.particles.length) {
      this.loop(performance.now());
    }
  };

  /** Detect device capability once. */
  probe() {
    const small = typeof window !== "undefined" && window.innerWidth < 640;
    const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 4 : 4;
    const match = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.reducedMotion = match;
    if (match) this.quality = "off";
    else if (small || cores <= 4) this.quality = "balanced";
    else this.quality = "full";
  }

  private budget(multiplier: number) {
    const base = this.quality === "full" ? 1 : this.quality === "balanced" ? 0.8 : 0.5;
    const autoCut = this.degraded ? 0.65 : 1;
    return Math.max(0.3, base * multiplier * autoCut);
  }

  private ensureLoop() {
    if (this.reducedMotion || this.quality === "off" || this.running) return;
    this.running = true;
    this.lastT = performance.now();
    this.loop(this.lastT);
  }

  private loop = (t: number) => {
    if (!this.ctx || !this.canvas) return;
    const dt = Math.min((t - this.lastT) / 1000, 0.05);
    this.lastT = t;

    // FPS watch — degrade automatically below ~40fps
    this.frameTimes.push(dt);
    if (this.frameTimes.length > 90) {
      const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
      this.frameTimes = [];
      if (avg > 0.025 && !this.degraded && this.quality !== "minimal") {
        this.degraded = true;
      }
    }

    const w = this.canvas.width, h = this.canvas.height;
    this.ctx.clearRect(0, 0, w, h);

    const alive: Particle[] = [];
    for (const p of this.particles) {
      p.life += dt;
      if (p.life >= p.maxLife) continue;
      p.vy += p.gravity * dt;
      if (p.sway) {
        p.phase = (p.phase || 0) + dt * 3;
        p.x += Math.sin(p.phase) * p.sway * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;

      const alpha = Math.min(1, (p.maxLife - p.life) / (p.maxLife * 0.35));
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, alpha);
      this.ctx.translate(p.x * this.dpr, p.y * this.dpr);
      this.ctx.rotate(p.rot);
      this.ctx.fillStyle = p.color;

      if (p.kind === "confetti" || p.kind === "petal") {
        this.ctx.scale(1, Math.sin(p.life * 6 + p.rot) * 0.6 + 0.4);
        this.ctx.fillRect((-p.size * this.dpr) / 2, (-p.size * 0.6 * this.dpr) / 2, p.size * this.dpr, p.size * 0.6 * this.dpr);
      } else if (p.kind === "heart") {
        const s = p.size * this.dpr * 0.03;
        this.ctx.beginPath();
        this.ctx.moveTo(0, s * 0.35);
        this.ctx.bezierCurveTo(-s, -s * 0.5, -s * 0.4, -s * 1.3, 0, -s * 0.4);
        this.ctx.bezierCurveTo(s * 0.4, -s * 1.3, s, -s * 0.5, 0, s * 0.35);
        this.ctx.fill();
      } else if (p.kind === "glow") {
        // High-performance additive flash glow (no per-frame gradient allocation)
        const rad = p.size * this.dpr;
        this.ctx.globalCompositeOperation = "lighter";
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, rad * 0.65, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        // spark — velocity streak + glowing head using fast additive blending (zero shadowBlur lag!)
        this.ctx.globalCompositeOperation = "lighter";
        const speed = Math.hypot(p.vx, p.vy);
        if (speed > 130) {
          const k = Math.min(26, speed * 0.05) * this.dpr;
          this.ctx.strokeStyle = p.color;
          this.ctx.lineWidth = Math.max(1, p.size * this.dpr * 0.7);
          this.ctx.lineCap = "round";
          this.ctx.beginPath();
          this.ctx.moveTo((-p.vx / speed) * k, (-p.vy / speed) * k);
          this.ctx.lineTo(0, 0);
          this.ctx.stroke();
        }
        // Crisp bright core
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size * this.dpr * 0.52, 0, Math.PI * 2);
        this.ctx.fill();
        // Soft outer halo without shadowBlur
        this.ctx.globalAlpha = Math.max(0, alpha * 0.35);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size * this.dpr * 1.25, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
      alive.push(p);
    }
    this.particles = alive;

    if (this.particles.length) {
      this.raf = requestAnimationFrame(this.loop);
    } else {
      this.running = false;
      this.ctx.clearRect(0, 0, w, h);
    }
  };

  private push(p: Particle) {
    if (this.reducedMotion || this.quality === "off") return;
    const maxBudget = this.quality === "full" ? 1600 : this.quality === "balanced" ? 1000 : 500;
    if (this.particles.length >= maxBudget) return;
    this.particles.push(p);
    this.ensureLoop();
  }

  /** Classic confetti burst from a point. */
  confettiBurst(x: number, y: number, count = 120) {
    const colors = ["#ff2e93", "#ff7eb6", "#cdb8ff", "#f4dfb4", "#a3125f", "#ffffff"];
    const n = Math.round(count * this.budget(0.35));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 220 + Math.random() * 420;
      this.push({
        kind: "confetti",
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 260,
        life: 0, maxLife: 2.2 + Math.random() * 1.4,
        size: 6 + Math.random() * 7,
        color: colors[(Math.random() * colors.length) | 0],
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 10,
        gravity: 620, sway: 60, phase: Math.random() * 6,
      });
    }
  }

  /** Firework: launch + explosion with gravity, trails, fade. */
  fireworks(durationMs = 6000) {
    if (this.reducedMotion || this.quality === "off") return;
    const interval = this.quality === "full" ? 520 : 900;
    const end = performance.now() + durationMs;
    const shoot = () => {
      if (performance.now() > end) return;
      this.fireworkSingle();
      this.after(interval + Math.random() * 300, shoot);
    };
    shoot();
  }

  fireworkSingle() {
    const x = window.innerWidth * (0.15 + Math.random() * 0.7);
    const y = window.innerHeight * (0.16 + Math.random() * 0.3);
    this.flash(x, y, 16);
    this.fireworkAt(x, y);
  }

  /** Burst at an exact point with a given hue (peony). */
  fireworkAt(x: number, y: number, hue?: string) {
    const c = hue ?? ["#ff2e93", "#ff7eb6", "#cdb8ff", "#f4dfb4", "#ff9ec9", "#8ef2c4"][(Math.random() * 6) | 0];
    this.afterglow(x, y, 80 + Math.random() * 40, c === "#f4dfb4" ? "rgba(255,214,140,0.24)" : "rgba(255,120,170,0.20)");
    const n = Math.round(64 * this.budget(0.22));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.2;
      const sp = 130 + Math.random() * 260;
      this.push({
        kind: "spark",
        x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0, maxLife: 1.3 + Math.random() * 0.8,
        size: 2.4 + Math.random() * 2.4,
        color: Math.random() < 0.75 ? c : "#fff6e8",
        rot: 0, vr: 0, gravity: 170,
      });
    }
    // glitter settle — a second, slower dust wave slightly later
    this.after(320, () => {
      const m = Math.round(20 * this.budget(0.08));
      for (let i = 0; i < m; i++) {
        const a = Math.random() * Math.PI * 2;
        this.push({
          kind: "spark",
          x: x + (Math.random() - 0.5) * 60, y: y + (Math.random() - 0.5) * 40,
          vx: Math.cos(a) * 40, vy: Math.sin(a) * 30 - 20,
          life: 0, maxLife: 0.9 + Math.random() * 0.7,
          size: 1.1 + Math.random() * 1.4,
          color: "#ffe9b8", rot: 0, vr: 0, gravity: 120,
        });
      }
    });
  }

  /** Bright pop used for rocket apex / ignition. */
  flash(x: number, y: number, size = 22) {
    this.push({
      kind: "spark", x, y, vx: 0, vy: 0,
      life: 0, maxLife: 0.24, size,
      color: "#fffdf4", rot: 0, vr: 0, gravity: 0,
    });
  }

  /** Soft luminous cloud that lingers behind a big burst. */
  afterglow(x: number, y: number, size = 90, color = "rgba(255,196,120,0.22)") {
    this.push({
      kind: "glow", x, y, vx: 0, vy: 0,
      life: 0, maxLife: 0.7 + Math.random() * 0.5, size,
      color, rot: 0, vr: 0, gravity: 0,
    });
  }

  /**
   * Sky rocket (vanam vedai): rises with a crackling trail,
   * flashes at apex, then explodes into a styled shell.
   */
  rocket(x?: number, style?: RocketStyle) {
    if (this.reducedMotion || this.quality === "off") return;
    const w = window.innerWidth, h = window.innerHeight;
    const x0 = x ?? w * (0.12 + Math.random() * 0.76);
    const y0 = h + 8;
    const yA = h * (0.13 + Math.random() * 0.22);
    const dur = 0.72 + Math.random() * 0.4;
    const g = 260;
    const vy0 = (yA - y0 - 0.5 * g * dur * dur) / dur;
    const styles: RocketStyle[] = ["peony", "willow", "ring", "crackle", "heart", "doubleHeart", "palm", "crossette", "doubleRing", "rainbowPeony"];
    const st = style ?? styles[(Math.random() * styles.length) | 0];

    // bright rising head
    this.push({
      kind: "spark", x: x0, y: y0,
      vx: (Math.random() - 0.5) * 30, vy: vy0,
      life: 0, maxLife: dur, size: 3.4, color: "#fff3c4",
      rot: 0, vr: 0, gravity: g,
    });

    // golden trail puffs along the solved trajectory
    const steps = Math.round(dur / 0.05);
    for (let i = 1; i <= steps; i++) {
      const t = i * 0.05;
      const y = y0 + vy0 * t + 0.5 * g * t * t;
      const xj = x0 + (Math.random() - 0.5) * 5;
      this.after(t * 1000, () => {
        for (let k = 0; k < 2; k++) {
          this.push({
            kind: "spark",
            x: xj + (Math.random() - 0.5) * 5, y: y + (Math.random() - 0.5) * 5,
            vx: (Math.random() - 0.5) * 40, vy: 30 + Math.random() * 55,
            life: 0, maxLife: 0.45 + Math.random() * 0.5,
            size: 1.3 + Math.random() * 1.6,
            color: Math.random() < 0.6 ? "#ffd98e" : "#fff6e0",
            rot: 0, vr: 0, gravity: 150,
          });
        }
      });
    }

    // apex — flash + styled burst
    this.after(dur * 1000, () => {
      this.flash(x0, yA, 24);
      if (st === "willow") this.willow(x0, yA);
      else if (st === "ring") this.ringBurst(x0, yA);
      else if (st === "crackle") { this.fireworkAt(x0, yA); this.crackle(x0, yA); }
      else if (st === "heart") this.heartBurst(x0, yA);
      else if (st === "doubleHeart") this.doubleHeartBurst(x0, yA);
      else if (st === "interlockingHearts") this.interlockingHearts(x0, yA);
      else if (st === "cupidArrow") this.cupidArrowHeart(x0, yA);
      else if (st === "roseBouquet") this.roseBouquetBurst(x0, yA);
      else if (st === "infinityLove") this.infinityLoveBurst(x0, yA);
      else if (st === "pulsingHeart") this.pulsingBeatingHeart(x0, yA);
      else if (st === "palm") this.palmBurst(x0, yA);
      else if (st === "crossette") this.crossette(x0, yA);
      else if (st === "doubleRing") this.doubleRing(x0, yA);
      else if (st === "rainbowPeony") this.rainbowPeony(x0, yA);
      else this.fireworkAt(x0, yA);
    });
  }

  /** Flower-pot fountain: a hissing cone of sparks that shifts colour as it burns. */
  fountain(x: number, durationMs = 6000) {
    if (this.reducedMotion || this.quality === "off") return;
    const groundY = window.innerHeight * 0.94;
    const start = performance.now();
    const end = start + durationMs;
    const phases = [
      ["#ffd98e", "#fff6e0", "#ffb46e"], // gold
      ["#ff8f6b", "#ffd98e", "#fff6e0"], // ember
      ["#b9f5d0", "#fff6e0", "#ffe9b8"], // green crackle
    ];
    let tick = 0;
    const emit = () => {
      if (performance.now() > end) return;
      const phase = phases[Math.floor((performance.now() - start) / 2300) % phases.length];
      const n = this.quality === "full" ? 4 : 3;
      for (let i = 0; i < n; i++) {
        this.push({
          kind: "spark",
          x: x + (Math.random() - 0.5) * 10, y: groundY,
          vx: (Math.random() - 0.5) * 130, vy: -(360 + Math.random() * 300),
          life: 0, maxLife: 0.9 + Math.random() * 0.9,
          size: 1.3 + Math.random() * 1.7,
          color: phase[(Math.random() * phase.length) | 0],
          rot: 0, vr: 0, gravity: 460, sway: 10, phase: Math.random() * 6,
        });
      }
      // occasional big comet climbing out of the pot
      if (++tick % 26 === 0) {
        this.push({
          kind: "spark", x, y: groundY,
          vx: (Math.random() - 0.5) * 40, vy: -(520 + Math.random() * 120),
          life: 0, maxLife: 1.4, size: 3.2,
          color: "#fff3c4", rot: 0, vr: 0, gravity: 380,
        });
      }
      this.after(38, emit);
    };
    emit();
    this.flash(x, groundY - 6, 14);
  }

  /** Ground chakkar: two opposite jets spinning faster and faster like a pinwheel. */
  chakkar(x: number, y?: number, durationMs = 5200) {
    if (this.reducedMotion || this.quality === "off") return;
    const cy = y ?? window.innerHeight * 0.9;
    const start = performance.now();
    const end = start + durationMs;
    let angle = Math.random() * Math.PI * 2;
    const spin = () => {
      if (performance.now() > end) return;
      const t = (performance.now() - start) / durationMs; // 0 → 1
      angle += 0.7 + t * 0.9; // spins up as it burns out
      for (const dir of [0, Math.PI]) {
        const a = angle + dir;
        const sp = 160 + Math.random() * 110 + t * 90;
        this.push({
          kind: "spark", x, y: cy,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.55 - 30,
          life: 0, maxLife: 0.55 + Math.random() * 0.5,
          size: 1.4 + Math.random() * 1.4,
          color: Math.random() < 0.6 ? "#ffe9b8" : "#ff9d5c",
          rot: 0, vr: 0, gravity: 210,
        });
      }
      this.after(30, spin);
    };
    spin();
    this.flash(x, cy, 12);
  }

  /** Golden willow: long-lived drooping trails that rain down. */
  willow(x?: number, y?: number) {
    if (this.reducedMotion || this.quality === "off") return;
    const w = window.innerWidth, h = window.innerHeight;
    const px = x ?? w * (0.2 + Math.random() * 0.6);
    const py = y ?? h * (0.16 + Math.random() * 0.26);
    this.flash(px, py, 20);
    this.afterglow(px, py, 100, "rgba(255,214,140,0.25)");
    const n = Math.round(90 * this.budget(0.3));
    const hue = Math.random() < 0.5 ? "#f4dfb4" : "#ffd98e";
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 190;
      this.push({
        kind: "spark", x: px, y: py,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
        life: 0, maxLife: 2.8 + Math.random() * 1.8,
        size: 1.6 + Math.random() * 1.8,
        color: Math.random() < 0.85 ? hue : "#fff6e8",
        rot: 0, vr: 0, gravity: 78, sway: 14, phase: Math.random() * 6,
      });
    }
  }

  /** Ring shell: a perfect expanding circle. */
  ringBurst(x?: number, y?: number) {
    if (this.reducedMotion || this.quality === "off") return;
    const w = window.innerWidth, h = window.innerHeight;
    const px = x ?? w * (0.2 + Math.random() * 0.6);
    const py = y ?? h * (0.16 + Math.random() * 0.26);
    this.flash(px, py, 18);
    const n = Math.round(64 * this.budget(0.28));
    const hue = ["#cdb8ff", "#ff7eb6", "#f4dfb4"][(Math.random() * 3) | 0];
    const sp = 240 + Math.random() * 80;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const s = sp * (0.94 + Math.random() * 0.12);
      this.push({
        kind: "spark", x: px, y: py,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: 0, maxLife: 1.5 + Math.random() * 0.5,
        size: 2.2 + Math.random() * 1.6,
        color: Math.random() < 0.85 ? hue : "#fff6e8",
        rot: 0, vr: 0, gravity: 60,
      });
    }
  }

  /** Heart shell: a radiant heart traced in the sky with glowing spark trails. */
  heartBurst(x?: number, y?: number, colorSet?: string[]) {
    if (this.reducedMotion || this.quality === "off") return;
    const w = window.innerWidth, h = window.innerHeight;
    const px = x ?? w * (0.22 + Math.random() * 0.56);
    const py = y ?? h * (0.15 + Math.random() * 0.22);
    this.flash(px, py, 26);
    this.afterglow(px, py, 130, "rgba(255,46,147,0.32)");
    const n = Math.round(86 * this.budget(0.85));
    const colors = colorSet ?? ["#ff2e93", "#ff7eb6", "#ff5c8a", "#ffd4e5", "#ffffff", "#f4dfb4"];
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      const s = 145 + Math.random() * 85;
      this.push({
        kind: "spark", x: px, y: py,
        vx: (hx / 16) * s, vy: (-hy / 13) * s,
        life: 0, maxLife: 1.8 + Math.random() * 0.7,
        size: 2.6 + Math.random() * 2.2,
        color: colors[(Math.random() * colors.length) | 0],
        rot: 0, vr: 0, gravity: 105,
      });
    }
  }

  /** Double Heart Shell: Inner gold heart & outer neon-rose heart */
  doubleHeartBurst(x?: number, y?: number) {
    if (this.reducedMotion || this.quality === "off") return;
    const w = window.innerWidth, h = window.innerHeight;
    const px = x ?? w * (0.25 + Math.random() * 0.5);
    const py = y ?? h * (0.15 + Math.random() * 0.2);
    // Outer glowing rose heart
    this.heartBurst(px, py, ["#ff2e93", "#ff7eb6", "#ff5c8a", "#ffffff"]);
    // Inner golden heart slightly delayed
    this.after(140, () => {
      this.flash(px, py, 20);
      const n = Math.round(56 * this.budget(0.7));
      for (let i = 0; i < n; i++) {
        const t = (i / n) * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        const s = 86 + Math.random() * 42;
        this.push({
          kind: "spark", x: px, y: py,
          vx: (hx / 16) * s, vy: (-hy / 13) * s,
          life: 0, maxLife: 1.5 + Math.random() * 0.5,
          size: 2.2 + Math.random() * 1.6,
          color: Math.random() < 0.75 ? "#f4dfb4" : "#ffffff",
          rot: 0, vr: 0, gravity: 85,
        });
      }
    });
  }

  /** Triple Heart Bloom: 3 cascading hearts blooming left, center, right */
  tripleHeartBurst(cx?: number, cy?: number) {
    if (this.reducedMotion || this.quality === "off") return;
    const w = window.innerWidth, h = window.innerHeight;
    const x = cx ?? w * 0.5;
    const y = cy ?? h * 0.22;
    const offset = w > 640 ? 140 : 80;
    this.heartBurst(x, y, ["#ff2e93", "#ff7eb6", "#ffffff"]);
    this.after(200, () => this.heartBurst(x - offset, y + 30, ["#f4dfb4", "#ffd700", "#ff8f6b"]));
    this.after(400, () => this.heartBurst(x + offset, y + 30, ["#cdb8ff", "#b07cff", "#ff2e93"]));
  }

  /** Twin Interlocking Hearts: Two entwined glowing hearts (neon rose + champagne gold) */
  interlockingHearts(cx?: number, cy?: number) {
    if (this.reducedMotion || this.quality === "off") return;
    const w = window.innerWidth, h = window.innerHeight;
    const px = cx ?? w * 0.5;
    const py = cy ?? h * 0.22;
    const offset = w > 640 ? 55 : 35;
    // Left Heart (Neon Rose)
    this.heartBurst(px - offset, py, ["#ff2e93", "#ff7eb6", "#ff5c8a", "#ffffff"]);
    // Right Heart (Champagne Gold) intertwined
    this.after(90, () => {
      this.heartBurst(px + offset, py, ["#f4dfb4", "#ffd700", "#ffb46e", "#ffffff"]);
    });
    // Central diamond bond spark
    this.after(160, () => this.flash(px, py, 26));
  }

  /** Cupid's Arrow Heart: A glowing rose heart pierced by a golden comet arrow */
  cupidArrowHeart(cx?: number, cy?: number) {
    if (this.reducedMotion || this.quality === "off") return;
    const w = window.innerWidth, h = window.innerHeight;
    const px = cx ?? w * 0.5;
    const py = cy ?? h * 0.22;
    // Heart blooms first
    this.heartBurst(px, py, ["#ff2e93", "#ff7eb6", "#ff5c8a", "#ffffff"]);
    // Golden comet arrow shoots across from left to right through heart center
    this.after(140, () => {
      const arrowSteps = 16;
      for (let i = 0; i < arrowSteps; i++) {
        const tRatio = i / arrowSteps;
        const ax = px - 120 + tRatio * 240;
        const ay = py + 24 - tRatio * 48;
        this.after(i * 12, () => {
          this.push({
            kind: "spark",
            x: ax, y: ay,
            vx: 130, vy: -26,
            life: 0, maxLife: 0.6 + Math.random() * 0.3,
            size: i === arrowSteps - 1 ? 3.8 : 2.2,
            color: i === arrowSteps - 1 ? "#ffffff" : "#ffd700",
            rot: 0, vr: 0, gravity: 40,
          });
        });
      }
      // Arrow exit flash on right
      this.after(arrowSteps * 12 + 40, () => {
        this.flash(px + 122, py - 24, 20);
        this.crackle(px + 122, py - 24);
      });
    });
  }

  /** Blooming Red Rose Bouquet: Spiraling rose petals unfurling in the night sky */
  roseBouquetBurst(cx?: number, cy?: number) {
    if (this.reducedMotion || this.quality === "off") return;
    const w = window.innerWidth, h = window.innerHeight;
    const px = cx ?? w * (0.22 + Math.random() * 0.56);
    const py = cy ?? h * (0.16 + Math.random() * 0.22);
    this.flash(px, py, 26);
    this.afterglow(px, py, 130, "rgba(225,29,72,0.32)");
    const petalColors = ["#e11d48", "#ff2e93", "#ff4d6d", "#fb7185", "#ffd700"];
    const n = Math.round(76 * this.budget(0.8));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const petalOffset = Math.sin(a * 5) * 45;
      const sp = 125 + petalOffset + Math.random() * 95;
      this.push({
        kind: Math.random() < 0.25 ? "heart" : "spark",
        x: px, y: py,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0, maxLife: 1.7 + Math.random() * 0.6,
        size: 2.6 + Math.random() * 2.0,
        color: petalColors[i % petalColors.length],
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 5,
        gravity: 95,
      });
    }
  }

  /** Infinity Love Knot: Geometric Bernoulli lemniscate ∞ in stardust */
  infinityLoveBurst(cx?: number, cy?: number) {
    if (this.reducedMotion || this.quality === "off") return;
    const w = window.innerWidth, h = window.innerHeight;
    const px = cx ?? w * 0.5;
    const py = cy ?? h * 0.22;
    this.flash(px, py, 24);
    this.afterglow(px, py, 110, "rgba(244,223,180,0.26)");
    const n = Math.round(72 * this.budget(0.75));
    const colors = ["#ff2e93", "#f4dfb4", "#cdb8ff", "#ffd700", "#ff7eb6"];
    const scale = w > 640 ? 175 : 125;
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      const denom = 1 + Math.sin(t) * Math.sin(t);
      const ix = (scale * Math.cos(t)) / denom;
      const iy = (scale * Math.sin(t) * Math.cos(t)) / denom;
      this.push({
        kind: "spark",
        x: px, y: py,
        vx: ix * 1.4, vy: iy * 1.4,
        life: 0, maxLife: 1.6 + Math.random() * 0.5,
        size: 2.2 + Math.random() * 1.8,
        color: colors[i % colors.length],
        rot: 0, vr: 0, gravity: 70,
      });
    }
  }

  /** Pulsing Beating Heart: Real human heartbeat shockwaves (lub-dub) */
  pulsingBeatingHeart(cx?: number, cy?: number) {
    if (this.reducedMotion || this.quality === "off") return;
    const w = window.innerWidth, h = window.innerHeight;
    const px = cx ?? w * 0.5;
    const py = cy ?? h * 0.22;
    // Pulse 1: "Lub" — inner fast heart pulse
    this.heartBurst(px, py, ["#ff2e93", "#ff7eb6", "#ffffff"]);
    // Pulse 2: "Dub" — larger expansive outer heart shockwave
    this.after(160, () => {
      this.flash(px, py, 26);
      this.heartBurst(px, py, ["#ff007f", "#f4dfb4", "#ffd700", "#ff8f6b"]);
      this.afterglow(px, py, 140, "rgba(255,46,147,0.35)");
    });
  }

  /** Constellation of Little Hearts: 7 miniature hearts igniting across the sky */
  heartConstellation(cx?: number, cy?: number) {
    if (this.reducedMotion || this.quality === "off") return;
    const w = window.innerWidth, h = window.innerHeight;
    const baseX = cx ?? w * 0.5;
    const baseY = cy ?? h * 0.22;
    const positions = [
      { dx: 0, dy: -28 },
      { dx: -70, dy: -12 },
      { dx: 70, dy: -12 },
      { dx: -125, dy: 15 },
      { dx: 125, dy: 15 },
      { dx: -55, dy: 42 },
      { dx: 55, dy: 42 },
    ];
    positions.forEach((pos, idx) => {
      this.after(idx * 80, () => {
        const x = baseX + pos.dx;
        const y = baseY + pos.dy;
        this.flash(x, y, 14);
        for (let i = 0; i < 14; i++) {
          const t = (i / 14) * Math.PI * 2;
          const hx = 16 * Math.pow(Math.sin(t), 3);
          const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
          this.push({
            kind: "spark",
            x, y,
            vx: (hx / 16) * 55, vy: (-hy / 13) * 55,
            life: 0, maxLife: 1.1 + Math.random() * 0.4,
            size: 1.8 + Math.random() * 1.4,
            color: idx % 2 === 0 ? "#ff2e93" : "#f4dfb4",
            rot: 0, vr: 0, gravity: 65,
          });
        }
      });
    });
  }

  /** Rainbow Peony: vibrant multi-color explosion */
  rainbowPeony(x?: number, y?: number) {
    if (this.reducedMotion || this.quality === "off") return;
    const w = window.innerWidth, h = window.innerHeight;
    const px = x ?? w * (0.2 + Math.random() * 0.6);
    const py = y ?? h * (0.16 + Math.random() * 0.24);
    this.flash(px, py, 26);
    this.afterglow(px, py, 110, "rgba(255,180,220,0.25)");
    const colors = ["#ff2e93", "#3fd6c6", "#f4dfb4", "#b07cff", "#ff7e5f", "#ffd700", "#67e8f9"];
    const n = Math.round(76 * this.budget(0.75));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const sp = 150 + Math.random() * 240;
      this.push({
        kind: "spark", x: px, y: py,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0, maxLife: 1.6 + Math.random() * 0.7,
        size: 2.5 + Math.random() * 2.2,
        color: colors[i % colors.length],
        rot: 0, vr: 0, gravity: 140,
      });
    }
  }

  /** Indian Laddu / Garland Crackle Salvo: rapid crackle clusters across the sky */
  crackleSalvo(cx?: number, cy?: number) {
    if (this.reducedMotion || this.quality === "off") return;
    const w = window.innerWidth, h = window.innerHeight;
    const px = cx ?? w * (0.2 + Math.random() * 0.6);
    const py = cy ?? h * (0.16 + Math.random() * 0.24);
    for (let c = 0; c < 6; c++) {
      this.after(c * 85, () => {
        const ox = px + (Math.random() - 0.5) * 140;
        const oy = py + (Math.random() - 0.5) * 90;
        this.flash(ox, oy, 16);
        this.crackle(ox, oy);
      });
    }
  }

  /** Interactive touch / drag spark trail across the sky */
  trailSpark(x: number, y: number, color?: string) {
    if (this.reducedMotion || this.quality === "off") return;
    const colors = ["#ff2e93", "#f4dfb4", "#cdb8ff", "#ff7eb6", "#ffd475"];
    const c = color ?? colors[(Math.random() * colors.length) | 0];
    for (let i = 0; i < 2; i++) {
      this.push({
        kind: Math.random() < 0.2 ? "heart" : "spark",
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 70,
        vy: (Math.random() - 0.5) * 70 - 15,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.4,
        size: 2.0 + Math.random() * 2.2,
        color: c,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 6,
        gravity: 90,
      });
    }
  }

  /**
   * Party Popper / Confetti Cannon for Cake Celebrations.
   * Completely cracker-free: paper streamers, fluttering golden foils,
   * floating friendship stars.
   */
  partyPopper(x: number, y: number, count = 100) {
    if (this.reducedMotion || this.quality === "off") return;
    const colors = ["#ff7eb6", "#cdb8ff", "#f4dfb4", "#ffd700", "#ff9ec9", "#7ce8ff", "#ffffff"];
    const n = Math.round(count * this.budget(0.35));
    for (let i = 0; i < n; i++) {
      const a = (Math.random() - 0.5) * Math.PI * 0.9 - Math.PI / 2; // Upward cone
      const sp = 260 + Math.random() * 450;
      this.push({
        kind: Math.random() < 0.25 ? "heart" : "confetti",
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0,
        maxLife: 2.8 + Math.random() * 1.8,
        size: 7 + Math.random() * 9,
        color: colors[(Math.random() * colors.length) | 0],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 8,
        gravity: 480,
        sway: 85,
        phase: Math.random() * 6,
      });
    }
  }

  /** Palm shell: thick golden branches that rise, then droop like a coconut palm. */
  palmBurst(x?: number, y?: number) {
    if (this.reducedMotion || this.quality === "off") return;
    const w = window.innerWidth, h = window.innerHeight;
    const px = x ?? w * (0.2 + Math.random() * 0.6);
    const py = y ?? h * (0.16 + Math.random() * 0.24);
    this.flash(px, py, 22);
    this.afterglow(px, py, 110, "rgba(255,196,120,0.26)");
    const branches = Math.round(11 * this.budget(1));
    for (let b = 0; b < branches; b++) {
      const a = -Math.PI / 2 + (b / branches - 0.5) * Math.PI * 1.75;
      const sp = 150 + Math.random() * 130;
      const vx = Math.cos(a) * sp;
      const vy = Math.sin(a) * sp;
      const col = Math.random() < 0.8 ? (Math.random() < 0.5 ? "#ffd98e" : "#ffb46e") : "#fff6e0";
      // two staggered sparks per branch = thick fronds
      for (let d = 0; d < 2; d++) {
        this.push({
          kind: "spark", x: px, y: py,
          vx: vx * (1 - d * 0.14), vy: vy * (1 - d * 0.14),
          life: 0, maxLife: 2.1 + Math.random() * 1.1,
          size: 2.6 + Math.random() * 1.8,
          color: col, rot: 0, vr: 0, gravity: 105,
          sway: 8, phase: Math.random() * 6,
        });
      }
    }
  }

  /** Crossette: big stars fly out, then each splits into a small cross of sparks. */
  crossette(x?: number, y?: number) {
    if (this.reducedMotion || this.quality === "off") return;
    const w = window.innerWidth, h = window.innerHeight;
    const px = x ?? w * (0.2 + Math.random() * 0.6);
    const py = y ?? h * (0.16 + Math.random() * 0.24);
    this.flash(px, py, 20);
    const arms = Math.round(7 * this.budget(1));
    const gravity = 150;
    const splitT = 0.42;
    for (let i = 0; i < arms; i++) {
      const a = (i / arms) * Math.PI * 2 + Math.random() * 0.3;
      const sp = 190 + Math.random() * 70;
      const vx = Math.cos(a) * sp;
      const vy = Math.sin(a) * sp;
      const col = Math.random() < 0.5 ? "#ff5470" : "#f4dfb4";
      this.push({
        kind: "spark", x: px, y: py,
        vx, vy, life: 0, maxLife: 1.6,
        size: 3.2, color: col, rot: 0, vr: 0, gravity,
      });
      // schedule the cross-split where the star will be
      this.after(splitT * 1000, () => {
        const sx = px + vx * splitT;
        const sy = py + vy * splitT + 0.5 * gravity * splitT * splitT;
        this.flash(sx, sy, 10);
        for (let k = 0; k < 4; k++) {
          const ka = (k / 4) * Math.PI * 2 + a;
          this.push({
            kind: "spark", x: sx, y: sy,
            vx: Math.cos(ka) * 90 + vx * 0.2, vy: Math.sin(ka) * 90 + vy * 0.2,
            life: 0, maxLife: 0.7 + Math.random() * 0.5,
            size: 1.8 + Math.random() * 1.4,
            color: k % 2 ? "#fff6e0" : col, rot: 0, vr: 0, gravity: 220,
          });
        }
      });
    }
  }

  /** Double ring: two concentric halos in contrasting colours. */
  doubleRing(x?: number, y?: number) {
    if (this.reducedMotion || this.quality === "off") return;
    const w = window.innerWidth, h = window.innerHeight;
    const px = x ?? w * (0.2 + Math.random() * 0.6);
    const py = y ?? h * (0.16 + Math.random() * 0.26);
    this.flash(px, py, 20);
    this.afterglow(px, py, 95, "rgba(205,184,255,0.22)");
    const palettes: [string, string][] = [
      ["#cdb8ff", "#ff7eb6"],
      ["#ff7eb6", "#f4dfb4"],
      ["#8ef2c4", "#ff9ec9"],
    ];
    const [c1, c2] = palettes[(Math.random() * palettes.length) | 0];
    const ring = (n: number, sp: number, hue: string, life: number) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const s = sp * (0.95 + Math.random() * 0.1);
        this.push({
          kind: "spark", x: px, y: py,
          vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          life: 0, maxLife: life,
          size: 2.1 + Math.random() * 1.5,
          color: hue, rot: 0, vr: 0, gravity: 70,
        });
      }
    };
    ring(Math.round(46 * this.budget(0.2)), 250 + Math.random() * 60, c1, 1.5 + Math.random() * 0.4);
    this.after(120, () => ring(Math.round(34 * this.budget(0.15)), 150 + Math.random() * 40, c2, 1.3 + Math.random() * 0.4));
  }

  /** Crackle: delayed white micro-pops, like a photon crackle shell. */
  crackle(x?: number, y?: number) {
    if (this.reducedMotion || this.quality === "off") return;
    const w = window.innerWidth, h = window.innerHeight;
    const px = x ?? w * (0.2 + Math.random() * 0.6);
    const py = y ?? h * (0.14 + Math.random() * 0.26);
    const n = Math.round(46 * this.budget(0.22));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 20 + Math.random() * 90;
      this.after(Math.random() * 550, () => {
        this.push({
          kind: "spark",
          x: px + (Math.random() - 0.5) * 90, y: py + (Math.random() - 0.5) * 60,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
          life: 0, maxLife: 0.28 + Math.random() * 0.4,
          size: 1.6 + Math.random() * 1.8,
          color: Math.random() < 0.7 ? "#ffffff" : "#ffe9b8",
          rot: 0, vr: 0, gravity: 90,
        });
      });
    }
  }

  /** Heart shower (hidden delight). */
  heartShower() {
    const colors = ["#ff2e93", "#ff7eb6", "#e75a9b"];
    const n = Math.round(70 * this.budget(0.2));
    for (let i = 0; i < n; i++) {
      this.push({
        kind: "heart",
        x: window.innerWidth * Math.random(),
        y: -30 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 50,
        vy: 90 + Math.random() * 120,
        life: 0, maxLife: 3.4 + Math.random() * 1.6,
        size: 16 + Math.random() * 26,
        color: colors[(Math.random() * colors.length) | 0],
        rot: (Math.random() - 0.5) * 1.2, vr: (Math.random() - 0.5) * 2.4,
        gravity: 26, sway: 70, phase: Math.random() * 6,
      });
    }
  }

  /** Wax-seal crack micro burst. */
  sealBurst(x: number, y: number) {
    const n = Math.round(26 * this.budget(0.1));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 90 + Math.random() * 200;
      this.push({
        kind: "spark",
        x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120,
        life: 0, maxLife: 0.9 + Math.random() * 0.5,
        size: 1.8 + Math.random() * 2,
        color: Math.random() < 0.6 ? "#c93a4e" : "#f4dfb4",
        rot: 0, vr: 0, gravity: 480,
      });
    }
  }

  /** Stop everything — also cancels scheduled rockets/launches. */
  clear() {
    this.timers.forEach(clearTimeout);
    this.timers.clear();
    this.particles = [];
  }
}

export type RocketStyle =
  | "peony"
  | "willow"
  | "ring"
  | "crackle"
  | "heart"
  | "doubleHeart"
  | "interlockingHearts"
  | "cupidArrow"
  | "roseBouquet"
  | "infinityLove"
  | "pulsingHeart"
  | "palm"
  | "crossette"
  | "doubleRing"
  | "rainbowPeony";

export const fx = new FxEngine();
