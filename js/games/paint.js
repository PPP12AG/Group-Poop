// Stage 2 — THE SMALL INTESTINE: "Nutrient Painter"
// Drag to paint the villi with sparkly nutrients. Bubbly enzyme washes sweep
// through and rinse the color away — keep as much of the gut glowing as you can!
(function () {
  const GP = window.GP, W = GP.W, H = GP.H;
  const COLS = 8, ROWS = 11, CS = 58, X0 = (W - COLS * CS) / 2, Y0 = 190;

  class NutrientPainter {
    constructor(o) {
      this.o = o; this.rng = o.rng; this.ch = o.ch; this.skill = o.bot;
      this.sfx = (n) => { if (!o.quiet) GP.audio.sfx(n); };
      this.t = 0; this.duration = 30; this.finished = false; this.post = 0;
      // serpentine tube of cells
      this.cells = [];
      this.path = [];
      for (let r = 0; r < ROWS; r++) {
        if (r % 2 === 0) {
          const row = [];
          for (let c = 0; c < COLS; c++) row.push(c);
          if ((r / 2) % 2 === 1) row.reverse();
          for (const c of row) this.addCell(r, c);
        } else {
          const c = (r % 4 === 1) ? COLS - 1 : 0;
          this.addCell(r, c);
        }
      }
      this.N = this.cells.length;
      this.painting = false; this.px = -100; this.py = -100;
      this.events = []; // enzyme washes
      this.nextWash = 2.0; this.nextSplash = 3.2;
      this.parts = new GP.Particles();
      this.paintSfx = 0;
      this.bot = { x: W / 2, y: H / 2, tx: W / 2, ty: H / 2, retarget: 0, lift: 0 };
    }
    addCell(r, c) {
      const cell = { r, c, x: X0 + c * CS + CS / 2, y: Y0 + r * CS + CS / 2, lv: 0, i: this.cells.length, wig: this.rng() * 6 };
      this.cells.push(cell); this.path.push(cell);
    }
    down(x, y) { this.painting = true; this.px = x; this.py = y; }
    move(x, y) { this.px = x; this.py = y; }
    up() { this.painting = false; }
    coverage() {
      let s = 0;
      for (const c of this.cells) s += Math.min(c.lv, 1);
      return s / this.N;
    }
    spawnWash() {
      // a wave rushes along one horizontal stretch of the tube
      const rows = [0, 2, 4, 6, 8, 10];
      const r = rows[Math.floor(this.rng() * rows.length)];
      const dir = this.rng() < 0.5 ? 1 : -1;
      this.events.push({ type: 'wave', r, dir, t: 0, warn: 1.1, dur: 0.9, hit: new Set() });
    }
    spawnSplash() {
      const c = this.cells[Math.floor(this.rng() * this.N)];
      this.events.push({ type: 'splash', x: c.x, y: c.y, rad: 85, t: 0, warn: 1.0, done: false });
    }
    botThink(dt) {
      const b = this.bot, sk = this.skill;
      b.retarget -= dt;
      if (b.lift > 0) { b.lift -= dt; this.painting = false; if (b.lift <= 0) this.painting = true; return; }
      if (b.retarget <= 0 || !b.cell || b.cell.lv >= 1.6 + sk) {
        // pick a weakly painted cell, preferring nearby ones; good bots avoid incoming washes
        let best = null, bestS = 1e9;
        for (const c of this.cells) {
          const d = Math.hypot(c.x - b.x, c.y - b.y);
          let s = c.lv * 300 + d * (0.6 + sk) + this.rng() * (1 - sk) * 400;
          if (sk > 0.5) for (const e of this.events) if (e.type === 'wave' && e.t < e.warn && e.r === c.r) s += 250 * sk;
          if (s < bestS) { bestS = s; best = c; }
        }
        b.cell = best; b.retarget = 0.35 + (1 - sk) * 0.6;
        if (this.rng() < (1 - sk) * 0.12) b.lift = this.rng() * (1 - sk) * 1.2;
      }
      const speed = 380 + 720 * sk;
      const dx = b.cell.x - b.x, dy = b.cell.y - b.y, d = Math.hypot(dx, dy);
      if (d > 1) { const m = Math.min(d, speed * dt); b.x += (dx / d) * m; b.y += (dy / d) * m; }
      b.x += this.rng.normal() * (1 - sk) * 6; b.y += this.rng.normal() * (1 - sk) * 6;
      this.painting = true; this.px = b.x; this.py = b.y;
    }
    update(dt) {
      if (this.finished) return;
      this.t += dt;
      const live = this.t < this.duration;
      if (this.skill != null && live) this.botThink(dt);
      if (this.painting && live) {
        let any = false;
        for (const c of this.cells) {
          const d = Math.hypot(c.x - this.px, c.y - this.py);
          if (d < 52) {
            const before = c.lv;
            c.lv = Math.min(3, c.lv + dt * 9 * (1 - d / 80));
            if (before < 1 && c.lv >= 1) any = true;
          }
        }
        if (any && !this.o.quiet) {
          this.parts.burst(this.px, this.py, 4, ['#fff', this.ch.light, '#fff36b'], this.rng, { speed: 120, life: 0.4, size: 6, shape: 'star' });
        }
        this.paintSfx -= dt;
        if (any && this.paintSfx <= 0) { this.sfx('tap'); this.paintSfx = 0.12; }
      }
      if (live) {
        const k = 1 + this.t / 25;
        this.nextWash -= dt * k; this.nextSplash -= dt * k;
        if (this.nextWash <= 0) { this.spawnWash(); this.nextWash = this.rng.range(2.0, 2.8); }
        if (this.nextSplash <= 0) { this.spawnSplash(); this.nextSplash = this.rng.range(2.0, 2.8); }
      }
      for (const e of this.events) {
        e.t += dt;
        if (e.type === 'wave' && e.t > e.warn) {
          const p = (e.t - e.warn) / e.dur;
          if (p <= 1.1) {
            const front = e.dir > 0 ? X0 + p * COLS * CS : X0 + (1 - p) * COLS * CS;
            for (const c of this.cells) {
              if (c.r === e.r && !e.hit.has(c.i) && Math.abs(c.x - front) < CS * 0.6) {
                e.hit.add(c.i); c.lv = Math.max(0, c.lv - 1.6);
              }
            }
            if (e.hit.size > 0 && !e.sounded) { e.sounded = true; this.sfx('wash'); }
          }
        }
        if (e.type === 'splash' && e.t > e.warn && !e.done) {
          e.done = true; this.sfx('splash');
          for (const c of this.cells) if (Math.hypot(c.x - e.x, c.y - e.y) < e.rad) c.lv = Math.max(0, c.lv - 1.3);
          this.parts.burst(e.x, e.y, 14, ['#9fe7ff', '#ffffff', '#6fc8ff'], this.rng, { speed: 220, life: 0.6, size: 9 });
        }
      }
      this.events = this.events.filter((e) => (e.type === 'wave' ? e.t < e.warn + e.dur * 1.2 : e.t < e.warn + 0.5));
      this.parts.update(dt);
      if (!live) {
        this.painting = false;
        this.post += dt;
        if (this.post > 0.8) this.finish();
      }
    }
    finish() {
      this.finished = true;
      const cov = this.coverage();
      this.pct = Math.round(cov * 100);
      this.score = Math.round(GP.clamp(cov * 1.12, 0, 1) * 100);
      this.summary = `${this.pct}% of the gut glowing`;
    }
    render(ctx, opts = {}) {
      const t = this.t, ch = this.ch;
      GP.drawInsideBG(ctx, '#ffb86b', '#e8743b', t, 22);
      // tube body
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      this.path.forEach((c, i) => (i ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y)));
      ctx.strokeStyle = '#a8432a'; ctx.lineWidth = CS + 16; ctx.stroke();
      ctx.strokeStyle = '#ffd7b5'; ctx.lineWidth = CS + 4; ctx.stroke();
      // villi cells
      for (const c of this.cells) {
        const lv = c.lv, on = Math.min(lv, 1);
        const sway = Math.sin(t * 3 + c.wig) * 3;
        ctx.save(); ctx.translate(c.x, c.y);
        // three little finger bumps
        for (let k = -1; k <= 1; k++) {
          const bx = k * 15 + sway * 0.3, h = 20 + (k === 0 ? 6 : 0);
          ctx.fillStyle = on > 0.02 ? mix('#ffc4a8', ch.color, on) : '#ffc4a8';
          ctx.strokeStyle = on > 0.5 ? ch.dark : '#d9826a'; ctx.lineWidth = 3;
          GP.rr(ctx, bx - 8, -h / 2 + 4, 16, h, 8); ctx.fill(); ctx.stroke();
          if (lv > 1.8) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; GP.ell(ctx, bx - 2, -h / 2 + 9, 3, 4); ctx.fill(); }
        }
        if (lv >= 2.6) { // sealed with extra sparkle
          ctx.fillStyle = '#fff7a0';
          GP.star(ctx, 16, -16, 6 + Math.sin(t * 6 + c.wig) * 2, 3, 4); ctx.fill();
        }
        ctx.restore();
      }
      // washes
      for (const e of this.events) {
        if (e.type === 'wave') {
          const y = Y0 + e.r * CS;
          if (e.t < e.warn) {
            const a = 0.35 + Math.sin(e.t * 18) * 0.25;
            ctx.fillStyle = `rgba(110,200,255,${a})`;
            GP.rr(ctx, X0, y + 4, COLS * CS, CS - 8, 20); ctx.fill();
            GP.text(ctx, e.dir > 0 ? '>>> ENZYME WASH >>>' : '<<< ENZYME WASH <<<', W / 2, y + CS / 2, { size: 18, color: '#e6f7ff' });
          } else {
            const p = (e.t - e.warn) / e.dur;
            const front = e.dir > 0 ? X0 + p * COLS * CS : X0 + (1 - p) * COLS * CS;
            for (let k = 0; k < 6; k++) {
              ctx.fillStyle = k % 2 ? 'rgba(160,225,255,0.9)' : 'rgba(255,255,255,0.9)';
              GP.ell(ctx, front - e.dir * k * 14, y + 10 + ((k * 13) % (CS - 18)), 16 - k, 16 - k); ctx.fill();
            }
          }
        } else {
          if (e.t < e.warn) {
            ctx.strokeStyle = 'rgba(120,210,255,0.9)'; ctx.lineWidth = 4; ctx.setLineDash([8, 8]);
            ctx.beginPath(); ctx.arc(e.x, e.y, e.rad * (1.2 - (e.t / e.warn) * 0.2), 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
            // falling bile droplet
            const fy = GP.lerp(e.y - 180, e.y, GP.ease.inCubic(e.t / e.warn));
            ctx.fillStyle = '#7fd3ff'; ctx.strokeStyle = '#2b78a8'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(e.x, fy - 26); ctx.quadraticCurveTo(e.x - 16, fy, e.x, fy + 8); ctx.quadraticCurveTo(e.x + 16, fy, e.x, fy - 26); ctx.fill(); ctx.stroke();
          }
        }
      }
      this.parts.render(ctx);
      // brush cursor
      if (this.painting && this.t < this.duration) {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(this.px, this.py, 44, 0, Math.PI * 2); ctx.stroke();
        GP.drawBuddy(ctx, this.px, this.py - 58, 16, ch, { t, mood: 'squint', feet: false });
      }
      if (opts.hud !== false) {
        GP.drawHUD(ctx, 'Nutrient Painter', Math.max(0, this.duration - this.t), this.duration, '#ffd23f');
        GP.text(ctx, `Glowing: ${Math.round(this.coverage() * 100)}%`, 270, 104, { size: 22 });
      }
      // little legend
      GP.text(ctx, 'Paint thick to resist the wash!', 270, 160, { size: 18, color: '#fff3d6' });
      if (this.finished) {
        ctx.fillStyle = 'rgba(40,10,60,0.75)'; GP.rr(ctx, 40, 830, W - 80, 110, 30); ctx.fill();
        GP.text(ctx, `${this.pct}% GLOWING!`, 270, 872, { size: 46, color: '#ffd23f' });
        GP.text(ctx, 'of the small intestine', 270, 914, { size: 20, color: '#ffe0c0' });
      }
    }
  }

  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(a, b, t) {
    const A = hex(a), B = hex(b);
    return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
  }
  GP.mixColor = mix;

  NutrientPainter.info = {
    id: 'paint', stage: 'The Small Intestine', title: 'Nutrient Painter', color: '#ffb347', icon: 'small',
    howto: [
      'DRAG your finger to paint the wiggly villi with nutrients.',
      'Blue ENZYME WASHES rinse color away — watch for the warning!',
      'Paint over a spot again to make it thick and extra sparkly.',
      'The more of the gut that is glowing at the end, the better!',
    ],
  };
  GP.GAMES = GP.GAMES || [];
  GP.GAMES[1] = NutrientPainter;
})();
