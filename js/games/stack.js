// Stage 1 — THE STOMACH: "Snack Stack"
// Snacks swing overhead. Tap to drop them into the stomach. Pack it full —
// but the stomach gurgles, and anything that spills over the rim is lost.
(function () {
  const GP = window.GP, W = GP.W, H = GP.H;
  const FOODS = [
    { k: 'pea', r: 13, c: '#7bd65a', d: '#3f8f2a' },
    { k: 'blueberry', r: 15, c: '#5b7cff', d: '#2f40a8' },
    { k: 'grape', r: 17, c: '#a66bff', d: '#6a34b8' },
    { k: 'cherry', r: 18, c: '#ff4d6a', d: '#b01f3a' },
    { k: 'cheese', r: 20, c: '#ffd23f', d: '#c79a00' },
    { k: 'donut', r: 22, c: '#f0b070', d: '#a8662c' },
    { k: 'meatball', r: 25, c: '#b0704a', d: '#6e3d22' },
    { k: 'orange', r: 27, c: '#ff9a2e', d: '#c25f00' },
  ];

  function drawFood(ctx, f, x, y, rot, sc = 1) {
    const r = f.r * sc;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = f.c; ctx.strokeStyle = f.d; ctx.lineWidth = Math.max(1.5, r * 0.16);
    GP.ell(ctx, 0, 0, r, r); ctx.fill(); ctx.stroke();
    switch (f.k) {
      case 'cherry':
        ctx.strokeStyle = '#3f8f2a'; ctx.lineWidth = r * 0.15;
        ctx.beginPath(); ctx.moveTo(0, -r * 0.8); ctx.quadraticCurveTo(r * 0.3, -r * 1.3, r * 0.6, -r * 1.4); ctx.stroke();
        break;
      case 'donut':
        ctx.fillStyle = '#ff8fc8'; GP.ell(ctx, 0, 0, r * 0.75, r * 0.75); ctx.fill();
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 5; i++) { const a = i * 1.3; ctx.fillRect(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, r * 0.18, r * 0.07); }
        break;
      case 'orange':
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = r * 0.08;
        for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); ctx.stroke(); }
        break;
      case 'cheese':
        ctx.fillStyle = '#e6b400';
        GP.ell(ctx, -r * 0.3, -r * 0.2, r * 0.18, r * 0.18); ctx.fill();
        GP.ell(ctx, r * 0.35, r * 0.25, r * 0.14, r * 0.14); ctx.fill();
        break;
      case 'meatball':
        ctx.fillStyle = '#8a5030';
        GP.ell(ctx, -r * 0.3, r * 0.1, r * 0.15, r * 0.12); ctx.fill();
        GP.ell(ctx, r * 0.25, -r * 0.3, r * 0.12, r * 0.1); ctx.fill();
        break;
    }
    // shine + tiny face
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    GP.ell(ctx, -r * 0.35, -r * 0.4, r * 0.25, r * 0.15, -0.6); ctx.fill();
    if (r > 14) {
      ctx.fillStyle = '#2b1a33';
      GP.ell(ctx, -r * 0.25, 0, r * 0.08, r * 0.1); ctx.fill();
      GP.ell(ctx, r * 0.25, 0, r * 0.08, r * 0.1); ctx.fill();
      ctx.strokeStyle = '#2b1a33'; ctx.lineWidth = r * 0.07;
      ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.18, 0.3, Math.PI - 0.3); ctx.stroke();
    }
    ctx.restore();
  }

  class SnackStack {
    constructor(o) {
      this.o = o; this.rng = o.rng; this.ch = o.ch; this.skill = o.bot;
      this.sfx = (n) => { if (!o.quiet) GP.audio.sfx(n); };
      this.t = 0; this.duration = 30; this.post = 0; this.finished = false;
      this.cx = 270; this.rimY = 450; this.top = 520; this.rx = 140; this.ry = 270;
      const P = [[this.cx - this.rx, this.rimY]];
      const N = 24;
      for (let i = 0; i <= N; i++) {
        const a = Math.PI + (i / N) * Math.PI;
        P.push([this.cx + Math.cos(a) * this.rx, this.top - Math.sin(a) * this.ry]);
      }
      P.push([this.cx + this.rx, this.rimY]);
      this.pts = P;
      this.segs = [];
      for (let i = 0; i < P.length - 1; i++) this.segs.push(P[i].concat(P[i + 1]));
      this.bodies = []; this.spilled = 0; this.spillList = [];
      this.phase = this.rng() * 6; this.dropX = this.cx; this.dropVx = 0; this.cool = 0;
      this.next = this.pickFood();
      this.gurgleT = 4 + this.rng() * 2; this.gurgleAnim = 0; this.gurgleWarn = 0;
      this.parts = new GP.Particles();
      this.acc = 0; this.drops = 0;
      this.botTarget = null; this.botWait = 0.5;
    }
    pickFood() { return FOODS[Math.floor(this.rng() * FOODS.length)]; }
    get inside() {
      let n = 0;
      for (const b of this.bodies) if (b.y > this.rimY + 2 && Math.abs(b.x - this.cx) < this.rx) n++;
      return n;
    }
    drop() {
      if (this.cool > 0 || this.t >= this.duration) return;
      const f = this.next, x = this.dropX, y = 190;
      const vx = this.dropVx * 0.4 / 120;
      this.bodies.push({ f, r: f.r, x, y, px: x - vx, py: y, rot: 0 });
      this.next = this.pickFood();
      this.cool = 0.36; this.drops++;
      this.sfx('drop');
    }
    down() { this.drop(); }
    botThink(dt) {
      if (this.t >= this.duration) return;
      if (this.botWait > 0) { this.botWait -= dt; return; }
      const sk = this.skill;
      // aim: drop while the spoon is over the stomach; sloppier bots misjudge the edges
      const land = this.dropX + this.dropVx * 0.4 * 0.32;
      const reach = this.rx - 30 + (1 - sk) * this.rng.range(-20, 90);
      if (this.cool <= 0 && Math.abs(land - this.cx) < reach) {
        this.drop();
        this.botWait = this.rng.range(0, 0.1 + (1 - sk) * 0.9);
      }
    }
    physics(h) {
      const G = 1500, bs = this.bodies;
      for (const b of bs) {
        const vx = (b.x - b.px) * 0.998, vy = (b.y - b.py) * 0.998;
        b.px = b.x; b.py = b.y;
        b.x += vx; b.y += vy + G * h * h;
        b.rot += vx / b.r;
      }
      const wr = 9;
      for (let it = 0; it < 4; it++) {
        for (let i = 0; i < bs.length; i++) {
          const a = bs[i];
          for (let j = i + 1; j < bs.length; j++) {
            const b = bs[j];
            const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r;
            if (Math.abs(dx) > rr || Math.abs(dy) > rr) continue;
            const d2 = dx * dx + dy * dy;
            if (d2 < rr * rr && d2 > 0.0001) {
              const d = Math.sqrt(d2), ov = (rr - d) / d;
              const ma = a.r * a.r, mb = b.r * b.r, tot = ma + mb;
              a.x -= dx * ov * (mb / tot); a.y -= dy * ov * (mb / tot);
              b.x += dx * ov * (ma / tot); b.y += dy * ov * (ma / tot);
            }
          }
        }
        for (const b of bs) {
          for (const s of this.segs) {
            const sx = s[2] - s[0], sy = s[3] - s[1];
            let u = ((b.x - s[0]) * sx + (b.y - s[1]) * sy) / (sx * sx + sy * sy);
            u = u < 0 ? 0 : u > 1 ? 1 : u;
            const qx = s[0] + sx * u, qy = s[1] + sy * u;
            const dx = b.x - qx, dy = b.y - qy, d2 = dx * dx + dy * dy, m = b.r + wr;
            if (d2 < m * m && d2 > 0.0001) {
              const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
              b.x = qx + nx * m; b.y = qy + ny * m;
              const vx = b.x - b.px, vy = b.y - b.py;
              const vn = vx * nx + vy * ny;
              const tx = vx - vn * nx, ty = vy - vn * ny;
              const keep = Math.max(vn, 0);
              b.px = b.x - (tx * 0.9 + nx * keep);
              b.py = b.y - (ty * 0.9 + ny * keep);
            }
          }
        }
      }
      for (let i = bs.length - 1; i >= 0; i--) {
        const b = bs[i];
        if (b.y > H + 40 || b.x < -60 || b.x > W + 60) {
          bs.splice(i, 1);
          this.spilled++; this.spillList.push(b.f);
          if (this.t < this.duration + 3) this.sfx('splash');
        }
      }
    }
    update(dt) {
      if (this.finished) { this.parts.update(dt); return; }
      this.t += dt;
      if (this.skill != null) this.botThink(dt);
      this.cool -= dt;
      const sp = 1.7 + this.t * 0.045;
      this.phase += dt * sp;
      this.dropX = this.cx + Math.sin(this.phase) * 205;
      this.dropVx = Math.cos(this.phase) * 205 * sp;
      // gurgles
      if (this.t < this.duration) {
        this.gurgleT -= dt;
        if (this.gurgleT < 0.7 && this.gurgleWarn === 0) { this.gurgleWarn = 1; this.sfx('gurgle'); }
        if (this.gurgleT <= 0) {
          const power = 1 + this.t / 30;
          for (const b of this.bodies) {
            if (b.y > this.rimY - 80) {
              b.py += this.rng.range(2.5, 5.5) * power;
              b.px += this.rng.range(-1.5, 1.5) * power;
            }
          }
          this.gurgleAnim = 0.6; this.gurgleWarn = 0;
          this.gurgleT = this.rng.range(3.6, 5.2);
          for (let i = 0; i < 10; i++) this.parts.add({ x: this.cx + this.rng.range(-this.rx, this.rx) * 0.8, y: this.top + this.ry * 0.7, vy: -this.rng.range(60, 180), vx: this.rng.range(-30, 30), life: 0.9, size: this.rng.range(5, 12), color: 'rgba(255,255,255,0.7)', shape: 'ring' });
        }
      }
      this.gurgleAnim = Math.max(0, this.gurgleAnim - dt);
      this.acc += dt;
      while (this.acc >= 1 / 120) { this.physics(1 / 120); this.acc -= 1 / 120; }
      this.parts.update(dt);
      if (this.t >= this.duration) {
        this.post += dt;
        if (this.post > 2.2) this.finish();
      }
    }
    finish() {
      this.finished = true;
      const n = this.inside;
      this.packed = n;
      this.score = Math.round(GP.clamp((n / 38) * 100, 0, 100));
      this.summary = `${n} snacks packed · ${this.spilled} spilled`;
    }
    render(ctx, opts = {}) {
      const t = this.t;
      GP.drawInsideBG(ctx, '#5a2a7a', '#2e1450', t, 11);
      // gastric juice pool at bottom
      ctx.fillStyle = '#b6f06a';
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 880 + Math.sin(x * 0.03 + t * 2) * 6);
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      for (let i = 0; i < 6; i++) GP.ell(ctx, 40 + i * 90 + Math.sin(t + i) * 10, 905 + (i % 2) * 20, 8, 8), ctx.fill();
      // spilled pile, floating in the pool
      this.spillList.slice(-24).forEach((f, i) => {
        const col = i % 12, row = Math.floor(i / 12);
        drawFood(ctx, f, 26 + col * 44, 900 + row * 34 + Math.sin(t * 2 + i) * 3, i, 0.75);
      });
      // stomach wall
      const wob = this.gurgleAnim > 0 ? Math.sin(this.gurgleAnim * 40) * 5 * this.gurgleAnim : (this.gurgleWarn ? Math.sin(t * 50) * 1.5 : 0);
      ctx.save();
      ctx.translate(0, wob);
      ctx.beginPath();
      this.pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
      const g = ctx.createLinearGradient(0, this.rimY, 0, this.top + this.ry);
      g.addColorStop(0, '#ffd1dc'); g.addColorStop(1, '#ff9fb4');
      ctx.fillStyle = g; ctx.fill();
      // rugae folds
      ctx.strokeStyle = 'rgba(230,90,130,0.35)'; ctx.lineWidth = 4;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const yy = this.top + 40 + i * 50;
        ctx.moveTo(this.cx - this.rx * 0.8, yy);
        ctx.bezierCurveTo(this.cx - 50, yy + 20, this.cx + 50, yy - 20, this.cx + this.rx * 0.8, yy);
        ctx.stroke();
      }
      ctx.restore();
      // full line
      ctx.setLineDash([10, 10]); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(this.cx - this.rx, this.rimY); ctx.lineTo(this.cx + this.rx, this.rimY); ctx.stroke();
      ctx.setLineDash([]);
      GP.text(ctx, 'FULL LINE', this.cx, this.rimY - 16, { size: 14, color: '#fff' });
      // bodies
      for (const b of this.bodies) drawFood(ctx, b.f, b.x, b.y, b.rot);
      // wall outline on top
      ctx.save(); ctx.translate(0, wob);
      ctx.beginPath();
      this.pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.strokeStyle = '#8a2048'; ctx.lineWidth = 24; ctx.stroke();
      ctx.strokeStyle = '#ff6f91'; ctx.lineWidth = 16; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 4; ctx.stroke();
      // cute stomach face on the wall
      const fy = this.top + this.ry - 6;
      ctx.fillStyle = '#fff';
      GP.ell(ctx, this.cx - 28, fy + 30, 10, 12); ctx.fill(); GP.ell(ctx, this.cx + 28, fy + 30, 10, 12); ctx.fill();
      ctx.fillStyle = '#2b1a33';
      GP.ell(ctx, this.cx - 28, fy + 32, 5, 6); ctx.fill(); GP.ell(ctx, this.cx + 28, fy + 32, 5, 6); ctx.fill();
      ctx.restore();
      this.parts.render(ctx);
      // dropper (spoon on a rail)
      if (this.t < this.duration) {
        ctx.fillStyle = '#3a1d4d'; GP.rr(ctx, 30, 118, W - 60, 12, 6); ctx.fill();
        const dx = this.dropX;
        ctx.strokeStyle = '#d9d9e8'; ctx.lineWidth = 8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(dx, 124); ctx.lineTo(dx, 160); ctx.stroke();
        ctx.fillStyle = '#eef'; ctx.strokeStyle = '#3a1d4d'; ctx.lineWidth = 3;
        GP.ell(ctx, dx, 170, 28, 12); ctx.fill(); ctx.stroke();
        if (this.cool <= 0) drawFood(ctx, this.next, dx, 170 - this.next.r * 0.6, 0);
        // aim guide
        ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.setLineDash([4, 10]); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(dx, 200); ctx.lineTo(dx, this.rimY); ctx.stroke(); ctx.setLineDash([]);
      }
      if (this.gurgleWarn || this.gurgleAnim > 0) {
        const s = 1 + Math.sin(t * 20) * 0.08;
        ctx.save(); ctx.translate(this.cx, 300); ctx.scale(s, s);
        GP.text(ctx, 'GURGLE!', 0, 0, { size: 44, color: '#b6f06a' });
        ctx.restore();
      }
      if (opts.hud !== false) {
        GP.drawHUD(ctx, 'Snack Stack', this.duration - this.t > 0 ? this.duration - this.t : 0, this.duration, '#ff9fb4');
        GP.text(ctx, `Packed: ${this.inside}`, 270, 100, { size: 22, color: '#fff' });
      }
      if (this.finished) this.renderBanner(ctx);
    }
    renderBanner(ctx) {
      ctx.fillStyle = 'rgba(40,10,60,0.75)'; GP.rr(ctx, 40, 200, W - 80, 120, 30); ctx.fill();
      GP.text(ctx, `${this.packed} PACKED!`, 270, 245, { size: 48, color: '#ffd23f' });
      GP.text(ctx, `${this.spilled} spilled`, 270, 292, { size: 24, color: '#ffb3c7' });
    }
  }
  SnackStack.info = {
    id: 'stack', stage: 'The Stomach', title: 'Snack Stack', color: '#ff6f91', icon: 'stomach',
    howto: [
      'Snacks swing back and forth on the spoon.',
      'TAP to drop a snack into the stomach.',
      'Pack in as many as you can below the FULL LINE!',
      'Watch out — the stomach GURGLES and bounces food out!',
    ],
  };
  GP.GAMES = GP.GAMES || [];
  GP.GAMES[0] = SnackStack;
})();
