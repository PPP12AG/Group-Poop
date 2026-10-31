// Group Poop — core engine: canvas scaling, input, scenes, rng, helpers, audio.
(function () {
  const W = 540, H = 960;
  const GP = (window.GP = { W, H });

  // ---------- math / helpers ----------
  GP.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  GP.lerp = (a, b, t) => a + (b - a) * t;
  GP.ease = {
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inCubic: (t) => t * t * t,
    inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    outBack: (t) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    outElastic: (t) => {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
    },
  };

  GP.makeRng = function (seed) {
    let a = seed >>> 0;
    const r = () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.range = (lo, hi) => lo + r() * (hi - lo);
    r.int = (lo, hi) => Math.floor(lo + r() * (hi - lo + 1));
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    r.normal = () => {
      let u = 0, v = 0;
      while (u === 0) u = r();
      while (v === 0) v = r();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    return r;
  };

  GP.FONT = 'ui-rounded, "SF Pro Rounded", "Arial Rounded MT Bold", "Nunito", "Trebuchet MS", system-ui, sans-serif';

  GP.text = function (ctx, s, x, y, o = {}) {
    const size = o.size || 32;
    ctx.font = `${o.weight || 800} ${size}px ${GP.FONT}`;
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.base || 'middle';
    if (o.stroke !== false) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = o.lw || Math.max(3, size * 0.2);
      ctx.strokeStyle = o.stroke || '#3a1d4d';
      ctx.strokeText(s, x, y);
    }
    ctx.fillStyle = o.color || '#fff';
    ctx.fillText(s, x, y);
  };

  // word-wrapped text, returns height used
  GP.wrap = function (ctx, s, x, y, maxW, lineH, o = {}) {
    const size = o.size || 24;
    ctx.font = `${o.weight || 700} ${size}px ${GP.FONT}`;
    const words = s.split(' ');
    let line = '', lines = [];
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = w;
      } else line = test;
    }
    if (line) lines.push(line);
    lines.forEach((l, i) => GP.text(ctx, l, x, y + i * lineH, o));
    return lines.length * lineH;
  };

  GP.rr = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  GP.button = function (ctx, b, t = 0) {
    const pulse = b.pulse ? Math.sin(t * 5) * 0.03 + 1 : 1;
    ctx.save();
    ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = b.shadow || 'rgba(40,10,60,0.45)';
    GP.rr(ctx, -b.w / 2, -b.h / 2 + 7, b.w, b.h, b.h / 2);
    ctx.fill();
    ctx.fillStyle = b.color || '#ffcf3f';
    GP.rr(ctx, -b.w / 2, -b.h / 2, b.w, b.h, b.h / 2);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#3a1d4d';
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    GP.rr(ctx, -b.w / 2 + 12, -b.h / 2 + 6, b.w - 24, b.h * 0.3, b.h * 0.15);
    ctx.fill();
    GP.text(ctx, b.label, 0, 2, { size: b.size || 30, color: b.textColor || '#3a1d4d', stroke: false });
    ctx.restore();
  };
  GP.hit = (b, x, y) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;

  // ---------- particles ----------
  GP.Particles = class {
    constructor() { this.list = []; }
    add(p) {
      this.list.push(Object.assign({ vx: 0, vy: 0, life: 1, max: 1, size: 8, grav: 0, color: '#fff', shape: 'circle', rot: 0, vr: 0, drag: 1 }, p));
      const q = this.list[this.list.length - 1];
      q.max = q.life;
    }
    burst(x, y, n, colors, rng, o = {}) {
      const R = rng || Math.random;
      for (let i = 0; i < n; i++) {
        const a = R() * Math.PI * 2, s = (o.speed || 200) * (0.4 + R() * 0.8);
        this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (o.up || 0), life: (o.life || 0.6) * (0.6 + R() * 0.6), size: (o.size || 8) * (0.6 + R() * 0.8), color: colors[Math.floor(R() * colors.length)], grav: o.grav || 0, shape: o.shape || 'circle', vr: (R() - 0.5) * 10, drag: o.drag || 0.98 });
      }
    }
    update(dt) {
      for (const p of this.list) {
        p.vy += p.grav * dt;
        p.vx *= p.drag; p.vy *= p.drag;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.rot += p.vr * dt;
        p.life -= dt;
      }
      this.list = this.list.filter((p) => p.life > 0);
    }
    render(ctx) {
      for (const p of this.list) {
        const a = GP.clamp(p.life / p.max, 0, 1);
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        } else if (p.shape === 'ring') {
          ctx.strokeStyle = p.color; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.5 - a), 0, Math.PI * 2); ctx.stroke();
        } else if (p.shape === 'star') {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          GP.star(ctx, 0, 0, p.size, p.size * 0.45, 5); ctx.fill(); ctx.restore();
        } else {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + a * 0.5), 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
  };

  GP.star = function (ctx, x, y, R, r, n) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const rad = i % 2 ? r : R, a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
      ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    ctx.closePath();
  };

  // ---------- audio (all synthesized, no files) ----------
  const A = (GP.audio = {
    ctx: null, muted: false, master: null, sfxGain: null, musicGain: null, noiseBuf: null, musicOn: false, quiet: false,
    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.7;
      this.master.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.8; this.sfxGain.connect(this.master);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.16; this.musicGain.connect(this.master);
      const len = this.ctx.sampleRate * 2;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.startMusic();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.7;
    },
    tone(f, d, type = 'sine', vol = 0.3, f2 = null, delay = 0, dest = null) {
      const c = this.ctx; if (!c || this.quiet) return;
      const t = c.currentTime + delay;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(dest || this.sfxGain);
      o.start(t); o.stop(t + d + 0.05);
    },
    noise(d, vol = 0.3, f1 = 1000, f2 = null, ftype = 'lowpass', delay = 0) {
      const c = this.ctx; if (!c || this.quiet) return;
      const t = c.currentTime + delay;
      const s = c.createBufferSource(); s.buffer = this.noiseBuf;
      const f = c.createBiquadFilter(); f.type = ftype; f.Q.value = 2;
      f.frequency.setValueAtTime(f1, t);
      if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + d);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      s.connect(f); f.connect(g); g.connect(this.sfxGain);
      s.start(t, Math.random()); s.stop(t + d + 0.05);
    },
    sfx(name) {
      if (!this.ctx || this.quiet) return;
      const T = this.tone.bind(this), N = this.noise.bind(this);
      switch (name) {
        case 'tap': T(660, 0.08, 'triangle', 0.25, 880); break;
        case 'drop': T(500, 0.15, 'sine', 0.25, 250); break;
        case 'plop': T(300, 0.12, 'sine', 0.35, 120); T(900, 0.05, 'sine', 0.1, 600, 0.02); break;
        case 'pop': T(900, 0.08, 'square', 0.15, 1500); N(0.08, 0.2, 3000, 800, 'bandpass'); break;
        case 'splash': N(0.35, 0.3, 2500, 400, 'bandpass'); T(400, 0.2, 'sine', 0.15, 150); break;
        case 'gurgle': for (let i = 0; i < 5; i++) T(120 + Math.random() * 80, 0.12, 'sine', 0.3, 60 + Math.random() * 60, i * 0.09); break;
        case 'wash': N(0.7, 0.25, 600, 3000, 'bandpass'); break;
        case 'good': T(660, 0.1, 'triangle', 0.25); T(990, 0.15, 'triangle', 0.2, null, 0.06); break;
        case 'perfect': T(880, 0.1, 'triangle', 0.25); T(1320, 0.1, 'triangle', 0.22, null, 0.05); T(1760, 0.2, 'triangle', 0.18, null, 0.1); break;
        case 'miss': T(220, 0.2, 'sawtooth', 0.12, 150); break;
        case 'ouch': T(500, 0.25, 'square', 0.12, 200); break;
        case 'convert': T(300, 0.3, 'sawtooth', 0.1, 600); T(200, 0.3, 'square', 0.06, 100, 0.1); break;
        case 'whoosh': N(0.5, 0.25, 300, 4000, 'bandpass'); break;
        case 'door': T(180, 0.25, 'sawtooth', 0.06, 260); break;
        case 'slam': N(0.15, 0.4, 600, 100); T(90, 0.15, 'sine', 0.4, 50); break;
        case 'flush': N(1.6, 0.35, 400, 2500, 'bandpass'); N(1.6, 0.2, 1500, 200, 'lowpass', 0.3); break;
        case 'stamp': T(140, 0.18, 'sine', 0.5, 60); N(0.1, 0.3, 1200, 300); break;
        case 'tick': T(1200, 0.04, 'square', 0.08); break;
        case 'go': T(523, 0.12, 'triangle', 0.3); T(784, 0.25, 'triangle', 0.3, null, 0.12); break;
        case 'count': T(440, 0.12, 'triangle', 0.3); break;
        case 'fanfare': [523, 659, 784, 1047, 784, 1047].forEach((f, i) => T(f, i === 5 ? 0.6 : 0.16, 'triangle', 0.25, null, i * 0.13)); break;
        case 'drum': N(0.08, 0.3, 200, 80); T(80, 0.1, 'sine', 0.3, 40); break;
        case 'boing': T(200, 0.35, 'sine', 0.3, 700); break;
        case 'toot': T(170, 0.25, 'square', 0.08, 120); T(175, 0.25, 'sawtooth', 0.05, 110); break;
        case 'grow': T(200, 0.4, 'triangle', 0.15, 800); break;
        case 'sad': T(400, 0.25, 'triangle', 0.2, 300); T(300, 0.4, 'triangle', 0.2, 200, 0.22); break;
      }
    },
    // tiny bouncy background loop
    startMusic() {
      if (!this.ctx || this.musicOn) return;
      this.musicOn = true;
      const c = this.ctx;
      let next = c.currentTime + 0.1, step = 0;
      const mel = [72, 0, 76, 0, 79, 0, 76, 74, 72, 0, 69, 0, 72, 74, 0, 0, 77, 0, 76, 0, 74, 0, 72, 0, 74, 0, 76, 74, 72, 0, 0, 0];
      const roots = [48, 45, 41, 43];
      const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
      setInterval(() => {
        if (!this.musicEnabled) { next = c.currentTime + 0.1; return; }
        while (next < c.currentTime + 0.25) {
          const sp = 0.15;
          const delay = next - c.currentTime;
          const m = mel[step % 32];
          if (m) this.tone(mtof(m), sp * 1.6, 'triangle', 0.35, null, delay, this.musicGain);
          const bar = Math.floor((step % 32) / 8), s8 = step % 8;
          if (s8 === 0 || s8 === 3 || s8 === 4 || s8 === 6) this.tone(mtof(roots[bar] + (s8 === 4 ? 12 : 0)), sp * 1.2, 'sine', 0.5, null, delay, this.musicGain);
          next += sp; step++;
        }
      }, 60);
    },
    musicEnabled: true,
  });

  // ---------- canvas, scaling, input, loop ----------
  if (typeof document === 'undefined') return; // headless (node tuning)
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  GP.canvas = canvas; GP.ctx = ctx;
  let scale = 1, offX = 0, offY = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    scale = Math.min(w / W, h / H);
    offX = (w - W * scale) / 2; offY = (h - H * scale) / 2;
  }
  window.addEventListener('resize', resize);
  resize();
  GP.toLogical = (cx, cy) => ({ x: (cx - offX) / scale, y: (cy - offY) / scale });

  let scene = null;
  GP.setScene = (s) => {
    if (scene && scene.exit) scene.exit();
    scene = s;
    if (s.enter) s.enter();
  };
  GP.getScene = () => scene;

  function ptr(e, type) {
    e.preventDefault();
    if (type !== 'down' && !e.isPrimary) return;
    A.init();
    const p = GP.toLogical(e.clientX, e.clientY);
    if (scene && scene[type]) scene[type](p.x, p.y);
  }
  canvas.addEventListener('pointerdown', (e) => { try { canvas.setPointerCapture(e.pointerId); } catch (_) {} ptr(e, 'down'); });
  canvas.addEventListener('pointermove', (e) => ptr(e, 'move'));
  canvas.addEventListener('pointerup', (e) => ptr(e, 'up'));
  canvas.addEventListener('pointercancel', (e) => ptr(e, 'up'));
  // iOS needs audio unlocked inside a touchend/click too
  ['touchend', 'click'].forEach((ev) => document.addEventListener(ev, () => A.init(), { passive: true }));
  // keyboard: space/enter act as a tap in the middle of the screen (handy on PC)
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if ((e.code === 'Space' || e.code === 'Enter') && scene && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault(); A.init();
      if (scene.key) scene.key(e.code); else if (scene.down) { scene.down(W / 2, H / 2); scene.up && scene.up(W / 2, H / 2); }
    }
  });

  // ?speed=4 fast-forwards everything (handy for testing)
  GP.speed = Math.max(1, Math.min(10, parseInt(new URLSearchParams(location.search).get('speed') || '1', 10) || 1));
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    for (let k = 0; k < GP.speed; k++) if (scene && scene.update) scene.update(dt);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#2a1440';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offX, dpr * offY);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    if (scene && scene.render) scene.render(ctx);
    ctx.restore();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
