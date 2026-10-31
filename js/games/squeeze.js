// Stage 4 — THE FINAL STRETCH: "Squeeze Beat"
// The colon squeezes in rhythm to push everything toward the exit.
// Tap when each shrinking muscle ring lines up with the target ring!
(function () {
  const GP = window.GP, W = GP.W, H = GP.H;
  const CX = 270, CY = 470, TARGET = 92, OUTER = 330, APPROACH = 1.15;
  const PERFECT = 0.075, GOOD = 0.17;

  class SqueezeBeat {
    constructor(o) {
      this.o = o; this.rng = o.rng; this.ch = o.ch; this.skill = o.bot;
      this.sfx = (n) => { if (!o.quiet) GP.audio.sfx(n); };
      this.t = 0; this.finished = false; this.post = 0;
      this.notes = [];
      const N = 26;
      let time = 1.6;
      for (let i = 0; i < N; i++) {
        this.notes.push({ hit: time, res: null, i });
        let gap = GP.lerp(0.95, 0.5, i / (N - 1));
        // a few quick doubles to keep it spicy
        if (i > 6 && i % 5 === 0) gap *= 0.6;
        time += gap;
      }
      this.N = N;
      this.duration = time + 0.6;
      this.perfect = 0; this.good = 0; this.miss = 0;
      this.flash = 0; this.judge = null; this.squish = 0; this.scroll = 0; this.push = 0;
      this.parts = new GP.Particles();
      this.botPlan = this.notes.map((n) => {
        if (this.skill == null) return null;
        if (this.rng() < (1 - this.skill) * 0.12) return null;
        return n.hit + this.rng.normal() * (0.02 + (1 - this.skill) * 0.13);
      });
    }
    get progress() { return (this.perfect + this.good * 0.5) / this.N; }
    judgeNote(n, res) {
      n.res = res;
      if (res === 'perfect') { this.perfect++; this.sfx('perfect'); this.push = 1; this.squish = 0.35; this.parts.burst(CX, CY, 16, ['#ffd23f', '#fff', '#ff9fb4'], this.rng, { speed: 300, life: 0.5, size: 8, shape: 'star' }); }
      else if (res === 'good') { this.good++; this.sfx('good'); this.push = 0.6; this.squish = 0.22; this.parts.burst(CX, CY, 8, ['#7cf29a', '#fff'], this.rng, { speed: 220, life: 0.4, size: 7 }); }
      else { this.miss++; this.sfx('miss'); }
      this.judge = { res, t: 0.6 };
    }
    down() {
      if (this.finished) return;
      let best = null, bd = 1e9;
      for (const n of this.notes) {
        if (n.res) continue;
        const d = Math.abs(this.t - n.hit);
        if (d < bd) { bd = d; best = n; }
      }
      if (!best || bd > 0.32) return; // tapping between rings does nothing
      this.judgeNote(best, bd <= PERFECT ? 'perfect' : bd <= GOOD ? 'good' : 'miss');
    }
    update(dt) {
      if (this.finished) return;
      const prev = this.t;
      this.t += dt;
      if (this.skill != null) {
        this.botPlan.forEach((bt, i) => { if (bt != null && prev < bt && this.t >= bt && !this.notes[i].res) this.down(); });
      }
      for (const n of this.notes) if (!n.res && this.t > n.hit + GOOD + 0.05) this.judgeNote(n, 'miss');
      this.squish = Math.max(0, this.squish - dt * 1.5);
      this.push = Math.max(0, this.push - dt * 2);
      this.scroll += dt * (40 + this.push * 500);
      if (this.judge) { this.judge.t -= dt; if (this.judge.t <= 0) this.judge = null; }
      this.parts.update(dt);
      if (this.t > this.duration) this.finish();
    }
    finish() {
      this.finished = true;
      this.score = Math.round(this.progress * 100);
      this.summary = `${this.perfect} perfect · ${this.good} good · ${this.miss} miss`;
    }
    render(ctx, opts = {}) {
      const t = this.t, ch = this.ch;
      // tunnel: concentric rings zooming outward
      ctx.fillStyle = '#5a1e3c'; ctx.fillRect(0, 0, W, H);
      for (let i = 12; i >= 0; i--) {
        const z = ((i + (this.scroll / 60) % 1) / 12);
        const r = 20 + Math.pow(z, 2) * 900;
        ctx.fillStyle = i % 2 ? '#ff8fb0' : '#ff6f9a';
        GP.ell(ctx, CX, CY, r, r * 0.95); ctx.fill();
      }
      ctx.fillStyle = 'rgba(90,20,60,0.25)'; GP.ell(ctx, CX, CY, 60, 58); ctx.fill();
      // target ring
      ctx.lineWidth = 10; ctx.strokeStyle = '#ffffff';
      ctx.setLineDash([18, 10]); ctx.beginPath(); ctx.arc(CX, CY, TARGET, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      // approaching muscle rings
      for (const n of this.notes) {
        if (n.res) continue;
        const dtn = n.hit - t;
        if (dtn > APPROACH || dtn < -0.25) continue;
        const r = TARGET + (OUTER - TARGET) * (dtn / APPROACH);
        if (r < 10) continue;
        const close = Math.abs(dtn) < GOOD;
        ctx.lineWidth = 16; ctx.strokeStyle = close ? '#ffd23f' : '#c2185b';
        ctx.beginPath(); ctx.arc(CX, CY, r, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath(); ctx.arc(CX, CY, r - 4, Math.PI * 1.1, Math.PI * 1.5); ctx.stroke();
      }
      // buddy riding a snack ball through the tunnel
      const sq = this.squish;
      ctx.save(); ctx.translate(CX, CY + 10);
      ctx.scale(1 - sq * 0.5, 1 + sq * 0.3);
      ctx.fillStyle = '#c98a55'; ctx.strokeStyle = '#7a4a24'; ctx.lineWidth = 5;
      GP.ell(ctx, 0, 24, 54, 40); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; GP.ell(ctx, -20, 10, 14, 7); ctx.fill();
      ctx.restore();
      GP.drawBuddy(ctx, CX, CY - 28 - sq * 10, 30, ch, { t, mood: this.judge && this.judge.res === 'miss' ? 'worried' : this.push > 0.3 ? 'squint' : 'happy', cheer: this.push > 0.3, feet: false });
      this.parts.render(ctx);
      if (this.judge) {
        const j = this.judge;
        const txt = j.res === 'perfect' ? 'PERFECT!' : j.res === 'good' ? 'GOOD!' : 'MISS';
        const col = j.res === 'perfect' ? '#ffd23f' : j.res === 'good' ? '#7cf29a' : '#c9c9d9';
        const s = 1 + (j.t - 0.3) * 0.8;
        ctx.save(); ctx.translate(CX, CY - 160); ctx.scale(s, s);
        GP.text(ctx, txt, 0, 0, { size: 44, color: col });
        ctx.restore();
      }
      // progress tube toward the exit
      const px = 500, py0 = 160, py1 = 760;
      ctx.fillStyle = 'rgba(40,10,60,0.6)'; GP.rr(ctx, px - 16, py0, 32, py1 - py0, 16); ctx.fill();
      const fill = (py1 - py0 - 8) * this.progress;
      ctx.fillStyle = '#ffd23f'; GP.rr(ctx, px - 11, py1 - 4 - fill, 22, Math.max(10, fill), 11); ctx.fill();
      GP.text(ctx, 'EXIT', px, py0 - 18, { size: 16 });
      GP.drawBuddy(ctx, px, py1 - 4 - fill, 12, ch, { t, feet: false, arms: false });
      // result dots
      const dotsY = 830;
      ctx.fillStyle = 'rgba(40,10,60,0.6)'; GP.rr(ctx, 30, dotsY - 30, W - 60, 92, 24); ctx.fill();
      this.notes.forEach((n, i) => {
        const col = i % 13, row = Math.floor(i / 13);
        const x = 60 + col * 35, y = dotsY - 2 + row * 34;
        ctx.fillStyle = n.res === 'perfect' ? '#ffd23f' : n.res === 'good' ? '#7cf29a' : n.res === 'miss' ? '#6a5a7a' : 'rgba(255,255,255,0.18)';
        GP.ell(ctx, x, y, 13, 13); ctx.fill();
        if (n.res === 'perfect') { ctx.fillStyle = '#fff'; GP.star(ctx, x, y, 8, 3.5, 5); ctx.fill(); }
      });
      if (opts.hud !== false) {
        GP.drawHUD(ctx, 'Squeeze Beat', Math.max(0, this.duration - t), this.duration, '#ff9fb4');
        GP.text(ctx, 'TAP when the rings line up!', 270, 104, { size: 20 });
      }
      if (this.finished) {
        ctx.fillStyle = 'rgba(40,10,60,0.78)'; GP.rr(ctx, 40, 600, W - 80, 130, 30); ctx.fill();
        GP.text(ctx, `${Math.round(this.progress * 100)}% SQUEEZED!`, 270, 645, { size: 42, color: '#ffd23f' });
        GP.text(ctx, this.summary, 270, 692, { size: 20, color: '#ffe0ec' });
      }
    }
  }
  SqueezeBeat.info = {
    id: 'squeeze', stage: 'The Final Stretch', title: 'Squeeze Beat', color: '#ff8a5b', icon: 'exit',
    howto: [
      'The colon squeezes to the beat to push you toward the EXIT!',
      'Red muscle rings shrink toward the white target ring.',
      'TAP right when they line up. Gold = PERFECT!',
      'It speeds up as you get closer to the end...',
    ],
  };
  GP.GAMES = GP.GAMES || [];
  GP.GAMES[3] = SqueezeBeat;
})();
