// Stage 3 — THE LARGE INTESTINE: "Germ Patrol"
// Friendly gut bacteria live here. Grumpy germs sneak in and turn them grumpy too.
// Tap the grumpy germs to pop them — but don't pop your friends!
(function () {
  const GP = window.GP, W = GP.W, H = GP.H;
  const AREA = { x: 30, y: 130, w: W - 60, h: 760 };
  const N_GOOD = 12;
  // friends live inside this ellipse, well away from where germs sneak in
  const SAFE = { cx: W / 2, cy: 500, rx: 145, ry: 250 };

  function drawGood(ctx, g, t) {
    const r = g.r, bob = Math.sin(t * 4 + g.seed) * 2;
    ctx.save(); ctx.translate(g.x, g.y + bob);
    if (g.scared > 0) ctx.rotate(Math.sin(t * 40) * 0.15);
    // little hairs (cilia)
    ctx.strokeStyle = '#2f9e5a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.sin(t * 6 + i) * 0.15;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r * 0.75); ctx.lineTo(Math.cos(a) * (r + 7), Math.sin(a) * (r * 0.75 + 7)); ctx.stroke();
    }
    ctx.fillStyle = g.tint; ctx.strokeStyle = '#2f9e5a'; ctx.lineWidth = 3;
    GP.ell(ctx, 0, 0, r * 1.15, r * 0.85); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; GP.ell(ctx, -r * 0.4, -r * 0.35, r * 0.3, r * 0.15, -0.4); ctx.fill();
    ctx.fillStyle = '#1e3b2a';
    GP.ell(ctx, -r * 0.35, -r * 0.1, r * 0.13, r * (g.scared > 0 ? 0.2 : 0.16)); ctx.fill();
    GP.ell(ctx, r * 0.35, -r * 0.1, r * 0.13, r * (g.scared > 0 ? 0.2 : 0.16)); ctx.fill();
    ctx.strokeStyle = '#1e3b2a'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (g.scared > 0) { GP.ell(ctx, 0, r * 0.3, r * 0.15, r * 0.18); ctx.stroke(); }
    else { ctx.arc(0, r * 0.15, r * 0.3, 0.3, Math.PI - 0.3); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,100,130,0.4)'; GP.ell(ctx, -r * 0.7, r * 0.15, r * 0.15, r * 0.08); ctx.fill(); GP.ell(ctx, r * 0.7, r * 0.15, r * 0.15, r * 0.08); ctx.fill();
    ctx.restore();
  }
  function drawBad(ctx, b, t) {
    const r = b.r;
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(t * 1.5 + b.seed);
    ctx.fillStyle = b.converted ? '#c06bd8' : '#8b4fd1'; ctx.strokeStyle = '#4a1f7a'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2, rad = i % 2 ? r : r * 1.35;
      ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.rotate(-(t * 1.5 + b.seed));
    // grumpy face
    ctx.fillStyle = '#fff';
    GP.ell(ctx, -r * 0.33, -r * 0.05, r * 0.24, r * 0.22); ctx.fill(); GP.ell(ctx, r * 0.33, -r * 0.05, r * 0.24, r * 0.22); ctx.fill();
    ctx.fillStyle = '#2b1a33';
    GP.ell(ctx, -r * 0.3, 0, r * 0.11, r * 0.11); ctx.fill(); GP.ell(ctx, r * 0.3, 0, r * 0.11, r * 0.11); ctx.fill();
    ctx.strokeStyle = '#2b1a33'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.4); ctx.lineTo(-r * 0.1, -r * 0.2); ctx.moveTo(r * 0.6, -r * 0.4); ctx.lineTo(r * 0.1, -r * 0.2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, r * 0.6, r * 0.25, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke();
    ctx.restore();
  }

  class GermPatrol {
    constructor(o) {
      this.o = o; this.rng = o.rng; this.ch = o.ch; this.skill = o.bot;
      this.sfx = (n) => { if (!o.quiet) GP.audio.sfx(n); };
      this.t = 0; this.duration = 30; this.finished = false; this.post = 0;
      this.goods = []; this.bads = []; this.sick = []; this.popped = 0; this.oops = 0; this.lost = 0;
      const tints = ['#7cf29a', '#9df5b0', '#6fe3a0', '#b4f78f'];
      for (let i = 0; i < N_GOOD; i++) {
        this.goods.push({
          x: SAFE.cx + (this.rng() - 0.5) * SAFE.rx * 1.2, y: SAFE.cy + (this.rng() - 0.5) * SAFE.ry * 1.2,
          vx: 0, vy: 0, r: 20, seed: this.rng() * 10, tint: tints[i % 4], scared: 0, wander: this.rng() * 6,
        });
      }
      this.spawnT = 1.2;
      this.parts = new GP.Particles();
      this.floaters = [];
      this.botT = 0.6;
      this.taps = [];
    }
    spawnBad() {
      const side = Math.floor(this.rng() * 4);
      let x, y;
      if (side === 0) { x = -20; y = AREA.y + this.rng() * AREA.h; }
      else if (side === 1) { x = W + 20; y = AREA.y + this.rng() * AREA.h; }
      else if (side === 2) { x = AREA.x + this.rng() * AREA.w; y = AREA.y - 30; }
      else { x = AREA.x + this.rng() * AREA.w; y = H + 20; }
      this.bads.push({ x, y, r: 18, seed: this.rng() * 10, speed: 45 + this.t * 2.2 + this.rng() * 20, converted: false });
    }
    down(x, y) {
      if (this.t >= this.duration) return;
      this.taps.push({ x, y, t: 0.3 });
      let best = null, bd = 46;
      for (const b of this.bads) { const d = Math.hypot(b.x - x, b.y - y); if (d < bd) { bd = d; best = b; } }
      if (best) {
        this.bads.splice(this.bads.indexOf(best), 1);
        this.popped++;
        this.sfx('pop');
        this.parts.burst(best.x, best.y, 12, ['#8b4fd1', '#c06bd8', '#fff'], this.rng, { speed: 240, life: 0.5, size: 8, shape: 'star' });
        this.floaters.push({ x: best.x, y: best.y, s: 'POP!', c: '#ffd23f', t: 0.8 });
        return;
      }
      for (const g of this.goods) {
        if (Math.hypot(g.x - x, g.y - y) < 30) {
          this.goods.splice(this.goods.indexOf(g), 1);
          this.sick.push(g);
          this.oops++;
          this.sfx('ouch');
          this.parts.burst(g.x, g.y, 10, ['#7cf29a', '#fff'], this.rng, { speed: 180, life: 0.5, size: 7 });
          this.floaters.push({ x: g.x, y: g.y, s: 'OOPS!', c: '#ff7f7f', t: 0.9 });
          return;
        }
      }
    }
    botThink(dt) {
      const sk = this.skill;
      this.botT -= dt;
      if (this.botT > 0) return;
      this.botT = 0.3 + (1 - sk) * 0.3 + this.rng() * 0.2;
      // tap the germ that is closest to a friend
      let best = null, bs = 1e9;
      for (const b of this.bads) {
        if (b.x < 0 || b.x > W || b.y < AREA.y - 40 || b.y > H) continue;
        let md = 1e9;
        for (const g of this.goods) md = Math.min(md, Math.hypot(g.x - b.x, g.y - b.y));
        const s = md + this.rng() * (1 - sk) * 300;
        if (s < bs) { bs = s; best = b; }
      }
      if (!best) return;
      const err = 6 + (1 - sk) * 38;
      const lead = 0.15 * sk;
      this.down(best.x + (best.vx || 0) * lead + this.rng.normal() * err, best.y + (best.vy || 0) * lead + this.rng.normal() * err);
    }
    update(dt) {
      if (this.finished) return;
      this.t += dt;
      const live = this.t < this.duration;
      if (live && this.skill != null) this.botThink(dt);
      if (live) {
        this.spawnT -= dt;
        if (this.spawnT <= 0) { this.spawnBad(); this.spawnT = Math.max(0.42, 1.15 - this.t * 0.03) * this.rng.range(0.7, 1.2); }
      }
      // friendly bugs zip around, but always stay in the safe middle zone
      // (never out by the edges, so there's always time to save them)
      const damp = Math.pow(0.94, dt * 60);
      for (const g of this.goods) {
        g.wander += dt * this.rng.range(-3, 3);
        g.vx += Math.cos(g.wander) * 260 * dt; g.vy += Math.sin(g.wander) * 260 * dt;
        g.scared = Math.max(0, g.scared - dt);
        for (const b of this.bads) {
          const d = Math.hypot(g.x - b.x, g.y - b.y);
          if (d < 110) { g.scared = 0.3; g.vx += ((g.x - b.x) / d) * 120 * dt; g.vy += ((g.y - b.y) / d) * 120 * dt; }
        }
        const nx = (g.x - SAFE.cx) / SAFE.rx, ny = (g.y - SAFE.cy) / SAFE.ry, d = Math.hypot(nx, ny);
        if (d > 0.85) { g.vx -= nx / d * 600 * (d - 0.85) * dt * 4; g.vy -= ny / d * 600 * (d - 0.85) * dt * 4; }
        g.vx *= damp; g.vy *= damp;
        g.x += g.vx * dt; g.y += g.vy * dt;
        const d2 = Math.hypot((g.x - SAFE.cx) / SAFE.rx, (g.y - SAFE.cy) / SAFE.ry);
        if (d2 > 1) { g.x = SAFE.cx + (g.x - SAFE.cx) / d2; g.y = SAFE.cy + (g.y - SAFE.cy) / d2; }
      }
      // germs chase the nearest friend
      for (const b of this.bads.slice()) {
        let tgt = null, md = 1e9;
        for (const g of this.goods) { const d = Math.hypot(g.x - b.x, g.y - b.y); if (d < md) { md = d; tgt = g; } }
        if (tgt) {
          const dx = tgt.x - b.x, dy = tgt.y - b.y, d = Math.max(1, Math.hypot(dx, dy));
          b.vx = (dx / d) * b.speed; b.vy = (dy / d) * b.speed;
          b.x += b.vx * dt; b.y += b.vy * dt;
          if (d < b.r + tgt.r - 4 && live) {
            // friend gets sick and floats away; the germ is used up
            this.goods.splice(this.goods.indexOf(tgt), 1);
            this.bads.splice(this.bads.indexOf(b), 1);
            this.lost++;
            this.sick.push({ x: tgt.x, y: tgt.y, seed: tgt.seed, r: tgt.r, tint: '#b9a7c9', scared: 1 });
            this.sfx('convert');
            this.floaters.push({ x: tgt.x, y: tgt.y - 20, s: 'SICK!', c: '#d9a6ff', t: 1 });
            this.parts.burst(tgt.x, tgt.y, 10, ['#c06bd8', '#7cf29a'], this.rng, { speed: 150, life: 0.6, size: 7 });
          }
        } else {
          b.x += Math.sin(this.t * 2 + b.seed) * 20 * dt;
        }
      }
      for (const f of this.floaters) { f.t -= dt; f.y -= 40 * dt; }
      this.floaters = this.floaters.filter((f) => f.t > 0);
      for (const tp of this.taps) tp.t -= dt;
      this.taps = this.taps.filter((tp) => tp.t > 0);
      this.parts.update(dt);
      if (!live) { this.post += dt; if (this.post > 1) this.finish(); }
    }
    finish() {
      this.finished = true;
      this.saved = this.goods.length;
      this.score = Math.round((this.saved / N_GOOD) * 80 + Math.min(20, this.popped * 0.6));
      this.summary = `${this.saved}/${N_GOOD} friendly bacteria saved`;
    }
    render(ctx, opts = {}) {
      const t = this.t;
      GP.drawInsideBG(ctx, '#d77fe0', '#7b3aa0', t, 33);
      // the colon's pouchy wall (haustra) frame
      ctx.fillStyle = '#ffe3f4'; ctx.strokeStyle = '#a3459f'; ctx.lineWidth = 6;
      GP.rr(ctx, AREA.x, AREA.y, AREA.w, AREA.h, 60); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(200,110,190,0.35)'; ctx.lineWidth = 5;
      for (let i = 1; i < 7; i++) {
        const y = AREA.y + (i * AREA.h) / 7;
        ctx.beginPath(); ctx.moveTo(AREA.x + 10, y); ctx.quadraticCurveTo(W / 2, y + 26, AREA.x + AREA.w - 10, y); ctx.stroke();
      }
      // garden sprinkles
      const r = GP.makeRng(5);
      for (let i = 0; i < 26; i++) {
        ctx.fillStyle = ['#ffd1ec', '#e6f9ff', '#fff3c4'][i % 3];
        GP.ell(ctx, AREA.x + 20 + r() * (AREA.w - 40), AREA.y + 20 + r() * (AREA.h - 40), 5 + r() * 6, 5 + r() * 6); ctx.fill();
      }
      this.sick.forEach((g, i) => { drawGood(ctx, { x: AREA.x + 40 + (i % 9) * 52, y: AREA.y + AREA.h - 36 - Math.floor(i / 9) * 46, r: 16, seed: g.seed, tint: '#b9a7c9', scared: 1 }, t); });
      for (const g of this.goods) drawGood(ctx, g, t);
      for (const b of this.bads) drawBad(ctx, b, t);
      this.parts.render(ctx);
      for (const tp of this.taps) {
        ctx.strokeStyle = `rgba(255,255,255,${tp.t * 3})`; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(tp.x, tp.y, 40 - tp.t * 60, 0, Math.PI * 2); ctx.stroke();
      }
      for (const f of this.floaters) GP.text(ctx, f.s, f.x, f.y, { size: 22, color: f.c });
      if (opts.hud !== false) {
        GP.drawHUD(ctx, 'Germ Patrol', Math.max(0, this.duration - this.t), this.duration, '#7cf29a');
        GP.text(ctx, `Friends: ${this.goods.length}/${N_GOOD}`, 270, 104, { size: 22 });
      }
      if (this.finished) {
        ctx.fillStyle = 'rgba(40,10,60,0.75)'; GP.rr(ctx, 40, 410, W - 80, 130, 30); ctx.fill();
        GP.text(ctx, `${this.saved}/${N_GOOD} SAVED!`, 270, 458, { size: 46, color: '#7cf29a' });
        GP.text(ctx, `${this.popped} germs popped · ${this.oops} oopsies`, 270, 506, { size: 20, color: '#f3dcff' });
      }
    }
  }
  GermPatrol.info = {
    id: 'germs', stage: 'The Large Intestine', title: 'Germ Patrol', color: '#c98be0', icon: 'large',
    howto: [
      'The green bacteria are your gut FRIENDS. Keep them safe!',
      'Grumpy purple germs sneak in and make your friends sick.',
      'TAP the grumpy germs to POP them.',
      'Careful — tapping a friend pops them too!',
    ],
  };
  GP.GAMES = GP.GAMES || [];
  GP.GAMES[2] = GermPatrol;
})();
