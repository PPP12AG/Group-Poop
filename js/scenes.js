// Group Poop — scenes & match flow.
(function () {
  const GP = window.GP, W = GP.W, H = GP.H;
  const A = GP.audio;
  const M = (GP.match = { players: [], stage: 0, humans: 0 });

  // ---------------------------------------------------------------- flow
  GP.startMatch = function (cfg) {
    const seedBase = (Date.now() & 0xffffff) ^ 0x5eed;
    M.players = cfg.players.map((p, i) => ({
      name: p.name, ch: GP.CHARS[i], human: p.human, skill: p.skill, idx: i,
      seed: seedBase + i * 7919, results: [],
    }));
    M.humans = M.players.filter((p) => p.human).length;
    M.stage = 0;
    document.getElementById('setup').classList.add('hidden');
    GP.setScene(new IntroScene());
  };
  GP.replay = function () {
    const seedBase = (Date.now() & 0xffffff) ^ 0xbeef;
    M.players.forEach((p, i) => { p.results = []; p.seed = seedBase + i * 7919; });
    M.stage = 0;
    GP.setScene(new IntroScene());
  };
  function beginStage(s) { M.stage = s; GP.setScene(new StageCard(s)); }
  function nextTurn() {
    const s = M.stage;
    const p = M.players.find((q) => q.human && !q.results[s]);
    if (p) GP.setScene(new TurnIntro(p, s));
    else if (s < GP.GAMES.length - 1) beginStage(s + 1);
    else GP.setScene(new RevealScene());
  }
  function makeGame(p, s, bot) {
    const G = GP.GAMES[s];
    return new G({ rng: GP.makeRng(p.seed + s * 101), ch: p.ch, bot, quiet: bot != null });
  }
  GP.snapshot = function (game) {
    const c = document.createElement('canvas');
    c.width = 405; c.height = 720;
    const x = c.getContext('2d');
    x.scale(c.width / W, c.height / H);
    x.save(); x.beginPath(); x.rect(0, 0, W, H); x.clip();
    game.render(x, { hud: false });
    x.restore();
    return c;
  };
  function simulateBots(s) {
    for (const p of M.players) {
      if (p.human || p.results[s]) continue;
      const g = makeGame(p, s, p.skill);
      let n = 0;
      while (!g.finished && n < 6000) { g.update(1 / 60); n++; }
      p.results[s] = { score: g.score, summary: g.summary, snap: GP.snapshot(g) };
    }
  }
  const total = (p) => p.results.reduce((a, r) => a + (r ? r.score : 0), 0);
  GP.totalScore = total;

  // ---------------------------------------------------------------- shared bits
  function card(ctx, x, y, w, h, fill = '#fff8ee') {
    ctx.fillStyle = 'rgba(40,10,60,0.35)'; GP.rr(ctx, x, y + 8, w, h, 30); ctx.fill();
    ctx.fillStyle = fill; GP.rr(ctx, x, y, w, h, 30); ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = '#3a1d4d'; ctx.stroke();
  }
  function confettiBurst(parts, n, x, y) {
    const cols = ['#ff7fb0', '#ffd23f', '#62d26f', '#4fb3ff', '#ffffff', '#ff8a5b'];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, s = 300 + Math.random() * 500;
      parts.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 2 + Math.random(), size: 10 + Math.random() * 8, color: cols[i % cols.length], grav: 700, shape: 'rect', vr: (Math.random() - 0.5) * 14, drag: 0.985 });
    }
  }
  function drawLogo(ctx, x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const letters1 = 'GROUP', letters2 = 'POOP';
    const cols = ['#ff7fb0', '#ffd23f', '#62d26f', '#4fb3ff', '#ff8a5b'];
    [...letters1].forEach((ch, i) => {
      const lx = (i - 2) * 62, ly = -50 + Math.sin(t * 3 + i * 0.7) * 6;
      ctx.save(); ctx.translate(lx, ly); ctx.rotate(Math.sin(t * 2 + i) * 0.06);
      GP.text(ctx, ch, 0, 0, { size: 84, color: cols[i % 5], lw: 16, weight: 900 });
      ctx.restore();
    });
    [...letters2].forEach((ch, i) => {
      const lx = (i - 1.5) * 70, ly = 45 + Math.sin(t * 3 + i * 0.7 + 2) * 6;
      ctx.save(); ctx.translate(lx, ly); ctx.rotate(Math.sin(t * 2 + i + 3) * 0.06);
      GP.text(ctx, ch, 0, 0, { size: 96, color: '#c98a55', stroke: '#5a3015', lw: 18, weight: 900 });
      ctx.restore();
    });
    ctx.restore();
  }

  // ---------------------------------------------------------------- title (setup panel is DOM)
  class TitleScene {
    constructor() { this.t = 0; }
    enter() { document.getElementById('setup').classList.remove('hidden'); }
    update(dt) { this.t += dt; }
    render(ctx) {
      const t = this.t;
      GP.drawInsideBG(ctx, '#ffb3d1', '#8e5bd6', t, 3);
      // spinning rays
      ctx.save(); ctx.translate(W / 2, 200); ctx.rotate(t * 0.2);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 700, (i / 12) * Math.PI * 2, (i / 12) * Math.PI * 2 + 0.25); ctx.fill(); }
      ctx.restore();
      drawLogo(ctx, W / 2, 170, 1, t);
      GP.drawPoop(ctx, W / 2, 400 + Math.sin(t * 2) * 4, 110, null, { t });
      GP.CHARS.forEach((ch, i) => {
        const x = 75 + i * 130, y = 330 + Math.abs(Math.sin(t * 4 + i)) * -18;
        if (i === 1 || i === 2) return;
        GP.drawBuddy(ctx, x, y, 30, ch, { t: t + i, wave: true, mood: 'happy' });
      });
    }
  }
  GP.TitleScene = TitleScene;

  // ---------------------------------------------------------------- intro cinematic
  class IntroScene {
    constructor() {
      this.t = 0; this.parts = new GP.Particles(); this.flags = {};
      this.hosts = M.players.map((p, i) => {
        const s = GP.STALLS[i];
        const sx = s.x + s.w / 2;
        const delay = i * 0.6;
        const walkD = (sx + 70) / 240;
        return { p, i, s, sx, delay, arrive: delay + walkD };
      });
      this.seatedAll = Math.max(...this.hosts.map((h) => h.arrive)) + 1.2;
      this.zoomAt = this.seatedAll + 1.6;
      this.splitAt = this.zoomAt + 0.9;
      this.endAt = this.splitAt + 3.2;
    }
    once(k, f) { if (!this.flags[k]) { this.flags[k] = true; f(); } }
    down() {
      if (this.t < this.splitAt) this.t = this.splitAt;
      else if (this.t > this.splitAt + 1.2) beginStage(0);
    }
    update(dt) {
      this.t += dt;
      const t = this.t;
      for (const h of this.hosts) {
        if (t > h.arrive) this.once('door' + h.i, () => A.sfx('door'));
        if (t > h.arrive + 1.0) this.once('slam' + h.i, () => A.sfx('slam'));
      }
      if (t > this.zoomAt) this.once('whoosh', () => A.sfx('whoosh'));
      if (t > this.splitAt + 1.6) this.once('splash', () => { A.sfx('splash'); A.sfx('plop'); });
      this.parts.update(dt);
    }
    hostState(h, t) {
      const lt = t - h.delay;
      if (lt < 0) return null;
      const a = h.arrive - h.delay;
      if (lt < a) return { mode: 'walk', x: -70 + (h.sx + 70) * (lt / a), y: 835, phase: lt * 11, open: 0 };
      const e = lt - a;
      if (e < 0.3) return { mode: 'walk', x: h.sx, y: 835, phase: 0, open: e / 0.3 };
      if (e < 0.7) { const k = (e - 0.3) / 0.4; return { mode: 'enter', x: h.sx, y: GP.lerp(835, 752, k), sc: GP.lerp(0.85, 0.72, k), phase: k * 6, open: 1 }; }
      if (e < 1.0) return { mode: 'inside', open: 1 - (e - 0.7) / 0.3 };
      return { mode: 'seated', open: 0 };
    }
    render(ctx) {
      const t = this.t;
      if (t < this.splitAt) {
        // ---- restroom
        ctx.save();
        if (t > this.zoomAt) {
          const k = GP.ease.inCubic(GP.clamp((t - this.zoomAt) / 0.9, 0, 1));
          const z = 1 + k * 4;
          ctx.translate(W / 2, 560); ctx.scale(z, z); ctx.translate(-W / 2, -560);
        }
        GP.drawBathroom(ctx, t);
        const states = this.hosts.map((h) => this.hostState(h, t));
        GP.STALLS.forEach((s) => GP.drawStallBack(ctx, s));
        this.hosts.forEach((h, i) => {
          const st = states[i];
          if (st && (st.mode === 'enter')) GP.drawHost(ctx, st.x, st.y, st.sc, h.p.ch, { phase: st.phase, dir: -1 });
        });
        this.hosts.forEach((h, i) => {
          const st = states[i];
          GP.drawStallFront(ctx, h.s, st ? st.open : 0, st && (st.mode === 'seated' || st.mode === 'inside'), i);
          if (st && st.mode === 'seated') {
            GP.drawSeatedFeet(ctx, h.sx, 748, h.p.ch, t, i);
            // floating music notes = happy humming
            const k = ((t * 0.6 + i * 0.3) % 1);
            ctx.globalAlpha = 1 - k;
            GP.text(ctx, '♪', h.sx + Math.sin(t * 3 + i) * 12, h.s.top - 20 - k * 60, { size: 30, color: h.p.ch.color });
            ctx.globalAlpha = 1;
            GP.text(ctx, h.p.name, h.sx, h.s.top - 70, { size: 18, color: '#fff', lw: 5 });
          }
        });
        // also show a little "OCCUPIED" sign wobble
        this.hosts.forEach((h, i) => {
          const st = states[i];
          if (st && st.mode === 'walk') GP.drawHost(ctx, st.x, st.y, 0.85, h.p.ch, { phase: st.phase, urgent: true });
        });
        ctx.restore();
        // captions
        if (t < this.seatedAll) {
          ctx.fillStyle = 'rgba(40,10,60,0.7)'; GP.rr(ctx, 40, 186, W - 80, 54, 27); ctx.fill();
          GP.text(ctx, 'Meanwhile, at the public restroom...', W / 2, 213, { size: 22 });
        } else if (t < this.zoomAt) {
          ctx.fillStyle = 'rgba(40,10,60,0.7)'; GP.rr(ctx, 90, 186, W - 180, 54, 27); ctx.fill();
          GP.text(ctx, 'Nature calls!', W / 2, 213, { size: 28, color: '#ffd23f' });
        }
        if (t > this.zoomAt + 0.6) {
          ctx.fillStyle = `rgba(255,255,255,${GP.clamp((t - this.zoomAt - 0.6) / 0.3, 0, 1)})`;
          ctx.fillRect(0, 0, W, H);
        }
        GP.text(ctx, 'tap to skip', W - 70, H - 26, { size: 16, color: 'rgba(255,255,255,0.8)', lw: 4 });
      } else {
        // ---- 4-way split: each buddy drops into their human's stomach
        const st = t - this.splitAt;
        M.players.forEach((p, i) => {
          const qx = (i % 2) * 270, qy = Math.floor(i / 2) * 480;
          ctx.save();
          ctx.beginPath(); ctx.rect(qx, qy, 270, 480); ctx.clip();
          ctx.translate(qx, qy);
          const g = ctx.createRadialGradient(135, 240, 20, 135, 240, 300);
          g.addColorStop(0, '#fff2fb'); g.addColorStop(1, p.ch.light);
          ctx.fillStyle = g; ctx.fillRect(0, 0, 270, 480);
          // falling path
          const k = GP.clamp((st - 0.3) / 1.3, 0, 1);
          let bx, by;
          const path = [[0, -175], [-3, -110], [10, -70], [22, -42]];
          const seg = Math.min(2, Math.floor(k * 3)), u = k * 3 - seg;
          bx = GP.lerp(path[seg][0], path[seg + 1][0], u); by = GP.lerp(path[seg][1], path[seg + 1][1], u);
          const landed = st > 1.6;
          const bounce = landed ? Math.abs(Math.sin((st - 1.6) * 8)) * Math.max(0, 1 - (st - 1.6)) * -10 : 0;
          const zoom = GP.lerp(1.1, 0.95, GP.ease.outCubic(GP.clamp(st / 0.8, 0, 1)));
          GP.drawBodyMap(ctx, 135, i < 2 ? 290 : 250, zoom * 0.95, p.ch, { t, stage: 0, buddy: { x: bx, y: by + bounce, r: 15, mood: landed ? 'happy' : 'wow', cheer: landed } });
          if (landed && st < 2.4) {
            ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3;
            const rr = (st - 1.6) * 60;
            ctx.beginPath(); ctx.ellipse(135 + 22 * 0.9, (i < 2 ? 290 : 250) - 34 * 0.9, rr, rr * 0.4, 0, 0, Math.PI * 2); ctx.stroke();
          }
          const ty = i < 2 ? 10 : 426;
          ctx.fillStyle = p.ch.color; GP.rr(ctx, 10, ty, 250, 44, 22); ctx.fill();
          ctx.lineWidth = 4; ctx.strokeStyle = '#3a1d4d'; ctx.stroke();
          GP.text(ctx, p.name, 135, ty + 23, { size: 22, color: '#fff' });
          ctx.restore();
        });
        ctx.strokeStyle = '#3a1d4d'; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(270, 0); ctx.lineTo(270, H); ctx.moveTo(0, 480); ctx.lineTo(W, 480); ctx.stroke();
        if (st < 0.3) { ctx.fillStyle = `rgba(255,255,255,${1 - st / 0.3})`; ctx.fillRect(0, 0, W, H); }
        const label = st < 1.6 ? 'DROPPING IN!' : 'LET THE DIGESTION BEGIN!';
        ctx.save(); ctx.translate(W / 2, 480);
        const s = 1 + Math.sin(t * 8) * 0.04; ctx.scale(s, s);
        ctx.fillStyle = '#ffd23f'; GP.rr(ctx, -230, -34, 460, 68, 34); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#3a1d4d'; ctx.stroke();
        GP.text(ctx, label, 0, 2, { size: st < 1.6 ? 34 : 28, color: '#3a1d4d', stroke: false });
        ctx.restore();
        if (st > 1.2) GP.text(ctx, 'tap to continue', W / 2, 532, { size: 18, color: '#fff', lw: 5 });
        if (st > this.endAt - this.splitAt + 2) beginStage(0);
      }
    }
  }

  // ---------------------------------------------------------------- stage title card
  class StageCard {
    constructor(s) {
      this.s = s; this.t = 0; this.G = GP.GAMES[s]; this.simDone = false; this.frames = 0;
    }
    enter() { A.sfx('whoosh'); }
    down() { if (this.simDone && this.t > 0.8) nextTurn(); }
    update(dt) {
      this.t += dt; this.frames++;
      if (!this.simDone && this.frames > 2) { simulateBots(this.s); this.simDone = true; }
      if (this.simDone && this.t > 3.2) nextTurn();
    }
    render(ctx) {
      const t = this.t, info = this.G.info;
      GP.drawInsideBG(ctx, info.color, '#3a1d4d', t, 40 + this.s);
      const k = GP.ease.outBack(GP.clamp(t / 0.6, 0, 1));
      ctx.save(); ctx.translate(W / 2, 150); ctx.scale(k, k);
      GP.text(ctx, `STAGE ${this.s + 1} OF ${GP.GAMES.length}`, 0, 0, { size: 30, color: '#fff' });
      GP.text(ctx, info.stage.toUpperCase(), 0, 58, { size: 46, color: '#ffd23f', lw: 12 });
      ctx.restore();
      const body = { skin: '#ffd9c7', hair: '#8b5e3c', shirt: '#ffffff', color: '#fff', light: '#fff', dark: '#999' };
      const pos = GP.ORGAN_POS[this.s];
      GP.drawBodyMap(ctx, W / 2, 520, 1.15, body, { t, stage: this.s });
      // all four buddies huddled at the organ (no scores shown — it's a mystery!)
      M.players.forEach((p, i) => {
        const a = (i / M.players.length) * Math.PI * 2 + t;
        GP.drawBuddy(ctx, W / 2 + (pos.x + Math.cos(a) * 18) * 1.15, 520 + (pos.y + Math.sin(a) * 10) * 1.15, 11, p.ch, { t: t + i, feet: false, arms: false });
      });
      ctx.save(); ctx.translate(W / 2, 830);
      ctx.fillStyle = '#fff'; GP.rr(ctx, -200, -40, 400, 80, 40); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#3a1d4d'; ctx.stroke();
      GP.text(ctx, info.title, 0, 2, { size: 38, color: '#3a1d4d', stroke: false });
      ctx.restore();
      if (!this.simDone) GP.text(ctx, 'digesting...', W / 2, 910, { size: 18 });
    }
  }

  // ---------------------------------------------------------------- pass device + how to play
  class TurnIntro {
    constructor(p, s) {
      this.p = p; this.s = s; this.t = 0; this.G = GP.GAMES[s];
      this.btn = { x: 120, y: 820, w: 300, h: 84, label: "I'M READY!", color: '#7cf29a', pulse: true, size: 34 };
    }
    down(x, y) { if (this.t > 0.6 && GP.hit(this.btn, x, y)) { A.sfx('tap'); GP.setScene(new PlayScene(this.p, this.s)); } }
    key() { if (this.t > 0.6) { A.sfx('tap'); GP.setScene(new PlayScene(this.p, this.s)); } }
    update(dt) { this.t += dt; }
    render(ctx) {
      const t = this.t, p = this.p, info = this.G.info;
      GP.drawInsideBG(ctx, p.ch.light, p.ch.color, t, 7);
      if (M.humans > 1) {
        GP.text(ctx, 'PASS THE PHONE TO', W / 2, 70, { size: 26 });
        GP.text(ctx, p.name.toUpperCase(), W / 2, 125, { size: 54, color: '#ffd23f', lw: 12 });
        GP.text(ctx, 'Everyone else — no peeking!', W / 2, 175, { size: 20, color: '#fff' });
      } else {
        GP.text(ctx, 'YOUR TURN,', W / 2, 75, { size: 28 });
        GP.text(ctx, p.name.toUpperCase(), W / 2, 130, { size: 54, color: '#ffd23f', lw: 12 });
      }
      GP.drawBuddy(ctx, W / 2, 255 + Math.sin(t * 3) * 6, 48, p.ch, { t, wave: true, mood: 'happy' });
      card(ctx, 30, 340, W - 60, 440);
      GP.text(ctx, info.title, W / 2, 385, { size: 38, color: info.color, stroke: '#3a1d4d', lw: 8 });
      GP.text(ctx, info.stage, W / 2, 425, { size: 20, color: '#8a6aa0', stroke: false });
      let y = 470;
      info.howto.forEach((line, i) => {
        ctx.fillStyle = info.color; GP.ell(ctx, 70, y + 12, 15, 15); ctx.fill();
        GP.text(ctx, String(i + 1), 70, y + 13, { size: 18, color: '#fff', stroke: false });
        y += GP.wrap(ctx, line, 98, y + 12, W - 160, 30, { size: 22, color: '#3a1d4d', stroke: false, align: 'left' }) + 14;
      });
      GP.button(ctx, this.btn, t);
    }
  }

  // ---------------------------------------------------------------- play a mini-game
  class PlayScene {
    constructor(p, s) {
      this.p = p; this.s = s; this.t = 0; this.cd = 2.4; this.game = makeGame(p, s, null);
      this.doneT = 0; this.stored = false; this.lastCount = 4;
    }
    down(x, y) {
      if (this.cd > 0) return;
      if (this.game.finished) { if (this.doneT > 1.2) this.leave(); return; }
      this.game.down && this.game.down(x, y);
    }
    move(x, y) { if (this.cd <= 0 && !this.game.finished && this.game.move) this.game.move(x, y); }
    up(x, y) { if (this.game.up) this.game.up(x, y); }
    leave() { A.sfx('tap'); nextTurn(); }
    update(dt) {
      this.t += dt;
      if (this.cd > 0) {
        this.cd -= dt;
        const c = Math.ceil(this.cd / 0.8);
        if (c !== this.lastCount) { this.lastCount = c; A.sfx(c > 0 ? 'count' : 'go'); }
        return;
      }
      this.game.update(dt);
      if (this.game.finished) {
        if (!this.stored) {
          this.stored = true;
          this.p.results[this.s] = { score: this.game.score, summary: this.game.summary, snap: GP.snapshot(this.game) };
          A.sfx('fanfare');
        }
        this.doneT += dt;
      }
    }
    render(ctx) {
      this.game.render(ctx);
      if (this.cd > 0) {
        ctx.fillStyle = 'rgba(40,10,60,0.45)'; ctx.fillRect(0, 0, W, H);
        const c = Math.ceil(this.cd / 0.8);
        const k = 1 - ((this.cd % 0.8) / 0.8);
        ctx.save(); ctx.translate(W / 2, H / 2); const s = 1.6 - GP.ease.outBack(Math.min(1, k * 2)) * 0.6; ctx.scale(s, s);
        GP.text(ctx, c > 0 ? String(c) : 'GO!', 0, 0, { size: 140, color: '#ffd23f', lw: 22 });
        ctx.restore();
      }
      if (this.game.finished && this.doneT > 1.2) {
        ctx.fillStyle = 'rgba(40,10,60,0.6)'; ctx.fillRect(0, 0, W, H);
        card(ctx, 50, 330, W - 100, 300);
        GP.text(ctx, 'STAGE CLEAR!', W / 2, 385, { size: 44, color: '#ffd23f', lw: 10 });
        GP.text(ctx, `${this.game.score} poop points`, W / 2, 450, { size: 36, color: '#3a1d4d', stroke: false });
        GP.wrap(ctx, this.game.summary, W / 2, 500, W - 160, 28, { size: 20, color: '#8a6aa0', stroke: false });
        GP.text(ctx, M.humans > 1 ? 'Shh! Keep it secret. Tap to hide.' : 'Tap to continue', W / 2, 590, { size: 20, color: '#3a1d4d', stroke: false });
      }
    }
  }

  // ---------------------------------------------------------------- the big reveal (split screens)
  class RevealScene {
    constructor() {
      this.s = 0; this.t = 0; this.parts = new GP.Particles(); this.setup();
    }
    setup() {
      const s = this.s;
      this.order = M.players.map((p, i) => i).sort((a, b) => M.players[a].results[s].score - M.players[b].results[s].score);
      this.revealed = []; this.t = 0; this.flash = {}; this.nextAt = 1.6; this.best = this.order[this.order.length - 1];
      this.crowned = false;
    }
    enter() { A.sfx('drum'); }
    down() {
      if (this.revealed.length < this.order.length) { this.nextAt = Math.min(this.nextAt, this.t); return; }
      if (this.t < this.allAt + 0.6) return;
      A.sfx('whoosh');
      this.s++;
      if (this.s >= GP.GAMES.length) GP.setScene(new PoopOffScene());
      else this.setup();
    }
    update(dt) {
      this.t += dt;
      if (this.revealed.length < this.order.length && this.t >= this.nextAt) {
        const i = this.order[this.revealed.length];
        this.revealed.push(i); this.flash[i] = this.t;
        A.sfx('stamp');
        this.nextAt = this.t + 1.0;
        if (this.revealed.length === this.order.length) this.allAt = this.t;
      }
      if (this.allAt != null && !this.crowned && this.t > this.allAt + 0.7) {
        this.crowned = true; A.sfx('good');
        const qx = (this.best % 2) * 270 + 135, qy = 86 + Math.floor(this.best / 2) * 437 + 218;
        this.parts.burst(qx, qy, 30, ['#ffd23f', '#fff', '#ff7fb0'], null, { speed: 400, life: 1, size: 10, shape: 'star' });
      }
      this.parts.update(dt);
    }
    render(ctx) {
      const t = this.t, s = this.s, info = GP.GAMES[s].info;
      const TOP = 86, QW = 270, QH = (H - TOP) / 2, SW = QH * (W / H);
      ctx.fillStyle = '#2a1440'; ctx.fillRect(0, 0, W, H);
      M.players.forEach((p, i) => {
        const qx = (i % 2) * QW, qy = TOP + Math.floor(i / 2) * QH;
        const r = p.results[s];
        const shown = this.revealed.includes(i);
        ctx.save(); ctx.beginPath(); ctx.rect(qx, qy, QW, QH); ctx.clip();
        ctx.fillStyle = p.ch.dark; ctx.fillRect(qx, qy, QW, QH);
        if (shown) {
          ctx.drawImage(r.snap, qx + (QW - SW) / 2, qy, SW, QH);
        } else {
          // covered with a cheeky "?" curtain
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          for (let k = 0; k < 9; k++) ctx.fillRect(qx + k * 32, qy, 16, QH);
          const wob = Math.sin(t * 5 + i) * 0.1;
          ctx.save(); ctx.translate(qx + QW / 2, qy + QH / 2 + 10); ctx.rotate(wob);
          GP.text(ctx, '?', 0, 0, { size: 140, color: p.ch.color, lw: 16 });
          ctx.restore();
        }
        if (this.flash[i] != null) {
          const f = t - this.flash[i];
          // flash a few times to really show it off
          const a = f < 0.6 ? (Math.sin(f * 30) * 0.5 + 0.5) * (1 - f / 0.6) : 0;
          if (a > 0) { ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(qx, qy, QW, QH); }
        }
        // name tag
        ctx.fillStyle = p.ch.color; GP.rr(ctx, qx + 8, qy + 8, QW - 16, 38, 19); ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = '#3a1d4d'; ctx.stroke();
        GP.text(ctx, p.name, qx + QW / 2, qy + 28, { size: 20, color: '#fff', lw: 5 });
        if (shown) {
          const f = t - this.flash[i];
          const k = GP.ease.outBack(GP.clamp(f / 0.35, 0, 1));
          ctx.save(); ctx.translate(qx + 208, qy + QH - 62); ctx.rotate(-0.2); ctx.scale(k, k);
          ctx.fillStyle = '#ffd23f'; GP.star(ctx, 0, 0, 58, 45, 12); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#3a1d4d'; ctx.stroke();
          GP.text(ctx, String(r.score), 0, -6, { size: 38, color: '#3a1d4d', stroke: false });
          GP.text(ctx, 'pts', 0, 22, { size: 15, color: '#3a1d4d', stroke: false });
          ctx.restore();
        }
        if (this.crowned && i === this.best) {
          ctx.lineWidth = 10; ctx.strokeStyle = '#ffd23f';
          ctx.strokeRect(qx + 5, qy + 5, QW - 10, QH - 10);
          ctx.save(); ctx.translate(qx + 48, qy + 80); ctx.rotate(-0.25);
          drawCrown(ctx, 0, 0, 30);
          ctx.restore();
          GP.text(ctx, 'STAGE WINNER!', qx + QW / 2 + 20, qy + 72, { size: 20, color: '#ffd23f', lw: 6 });
        }
        ctx.restore();
      });
      ctx.strokeStyle = '#3a1d4d'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(QW, TOP); ctx.lineTo(QW, H); ctx.moveTo(0, TOP + QH); ctx.lineTo(W, TOP + QH); ctx.stroke();
      // header
      ctx.fillStyle = info.color; ctx.fillRect(0, 0, W, TOP);
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0, TOP - 6, W, 6);
      const k = GP.ease.outBack(GP.clamp(t / 0.5, 0, 1));
      ctx.save(); ctx.translate(W / 2, TOP / 2); ctx.scale(k, k);
      GP.text(ctx, s === 0 && t < 1.6 ? 'THE BIG REVEAL!' : `STAGE ${s + 1}: ${info.title.toUpperCase()}`, 0, -12, { size: 30, color: '#fff', lw: 8 });
      GP.text(ctx, this.allAt != null && t > this.allAt + 0.6 ? 'tap to continue' : info.stage, 0, 24, { size: 18, color: '#fff', lw: 5 });
      ctx.restore();
      this.parts.render(ctx);
    }
  }

  function drawCrown(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#8a5a00'; ctx.lineWidth = s * 0.1; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-s, s * 0.5); ctx.lineTo(-s, -s * 0.3); ctx.lineTo(-s * 0.5, s * 0.1); ctx.lineTo(0, -s * 0.6); ctx.lineTo(s * 0.5, s * 0.1); ctx.lineTo(s, -s * 0.3); ctx.lineTo(s, s * 0.5);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff4d6a'; GP.ell(ctx, 0, s * 0.2, s * 0.15, s * 0.15); ctx.fill();
    ctx.fillStyle = '#4fb3ff'; GP.ell(ctx, -s * 0.6, s * 0.25, s * 0.1, s * 0.1); ctx.fill(); GP.ell(ctx, s * 0.6, s * 0.25, s * 0.1, s * 0.1); ctx.fill();
    ctx.restore();
  }
  GP.drawCrown = drawCrown;

  // ---------------------------------------------------------------- poop-off: whose is biggest?
  class PoopOffScene {
    constructor() {
      this.t = 0; this.parts = new GP.Particles();
      this.totals = M.players.map(total);
      this.max = Math.max(1, ...this.totals);
      this.growStart = 2.2; this.growDur = 5;
      const sorted = M.players.map((p, i) => i).sort((a, b) => this.totals[b] - this.totals[a]);
      this.rank = []; sorted.forEach((pi, r) => (this.rank[pi] = r));
      this.winner = sorted[0];
      this.done = false; this.tickT = 0; this.flags = {};
    }
    enter() { A.sfx('flush'); }
    down() { if (this.done && this.t > this.doneAt + 1) GP.setScene(new LeaderboardScene(this.totals, this.rank)); else if (this.t < this.growStart) this.t = this.growStart; }
    update(dt) {
      this.t += dt;
      const g = this.t - this.growStart;
      if (g > 0 && g < this.growDur) {
        this.tickT -= dt;
        if (this.tickT <= 0) { A.tone(200 + (g / this.growDur) * 600, 0.06, 'triangle', 0.12); this.tickT = 0.08; }
      }
      if (g >= this.growDur && !this.done) {
        this.done = true; this.doneAt = this.t;
        A.sfx('fanfare');
        const x = 67.5 + this.winner * 135;
        confettiBurst(this.parts, 80, x, 500);
        confettiBurst(this.parts, 40, 60, 900);
        confettiBurst(this.parts, 40, W - 60, 900);
      }
      if (this.done && Math.floor(this.t * 1.2) !== this.lastConf) {
        this.lastConf = Math.floor(this.t * 1.2);
        confettiBurst(this.parts, 12, Math.random() * W, 980);
      }
      this.parts.update(dt);
    }
    shown(i) {
      const g = GP.clamp((this.t - this.growStart) / this.growDur, 0, 1);
      return Math.min(this.totals[i], GP.ease.outCubic(g) * this.max);
    }
    render(ctx) {
      const t = this.t;
      GP.drawBathroom(ctx, t);
      ctx.fillStyle = 'rgba(42,20,64,0.55)'; ctx.fillRect(0, 0, W, H);
      // spotlights
      M.players.forEach((p, i) => {
        const x = 67.5 + i * 135;
        const g = ctx.createLinearGradient(0, 0, 0, 800);
        g.addColorStop(0, 'rgba(255,255,220,0)'); g.addColorStop(1, 'rgba(255,255,220,0.22)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(x - 20, 0); ctx.lineTo(x + 20, 0); ctx.lineTo(x + 75, 800); ctx.lineTo(x - 75, 800); ctx.closePath(); ctx.fill();
      });
      const k = GP.ease.outBack(GP.clamp(t / 0.6, 0, 1));
      ctx.save(); ctx.translate(W / 2, 90); ctx.scale(k, k);
      GP.text(ctx, 'WHO MADE THE', 0, -24, { size: 34, color: '#fff' });
      GP.text(ctx, 'BIGGEST POOP?', 0, 26, { size: 48, color: '#ffd23f', lw: 12 });
      ctx.restore();
      M.players.forEach((p, i) => {
        const x = 67.5 + i * 135, base = 790;
        // golden plunger podium
        ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#8a5a00'; ctx.lineWidth = 4;
        GP.rr(ctx, x - 60, base, 120, 26, 10); ctx.fill(); ctx.stroke();
        GP.rr(ctx, x - 44, base + 26, 88, 70, 10); ctx.fill(); ctx.stroke();
        GP.text(ctx, p.name, x, base + 120, { size: 18, color: '#fff', lw: 5 });
        const v = this.shown(i);
        if (t > this.growStart) {
          const res = GP.drawPoop(ctx, x, base + 4, v, p.ch, { t: t + i, cheer: this.done && i === this.winner, mood: this.done ? (this.rank[i] === M.players.length - 1 ? 'worried' : 'happy') : 'squint' });
          GP.text(ctx, String(Math.round(v)), x, res.top - 22, { size: 30, color: '#fff' });
          if (this.done) {
            GP.text(ctx, '#' + (this.rank[i] + 1), x, base + 60, { size: 34, color: '#3a1d4d', stroke: false });
            if (i === this.winner) {
              drawCrown(ctx, x, res.top - 68 + Math.sin(t * 4) * 4, 30);
            }
          }
        } else {
          GP.text(ctx, '?', x, base - 40, { size: 60, color: p.ch.color });
        }
      });
      if (this.done) {
        const w = M.players[this.winner];
        ctx.save(); ctx.translate(W / 2, 190); const s = 1 + Math.sin(t * 6) * 0.04; ctx.scale(s, s);
        ctx.fillStyle = w.ch.color; GP.rr(ctx, -220, -32, 440, 64, 32); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#3a1d4d'; ctx.stroke();
        GP.text(ctx, `${w.name.toUpperCase()} WINS!`, 0, 2, { size: 32, color: '#fff' });
        ctx.restore();
        if (t > this.doneAt + 1) GP.text(ctx, 'tap for the leaderboard', W / 2, 240, { size: 18, color: '#fff', lw: 5 });
      }
      this.parts.render(ctx);
    }
  }

  // ---------------------------------------------------------------- final leaderboard
  class LeaderboardScene {
    constructor(totals, rank) {
      this.t = 0; this.totals = totals; this.rank = rank; this.parts = new GP.Particles();
      this.order = M.players.map((p, i) => i).sort((a, b) => rank[a] - rank[b]);
      this.again = { x: 40, y: 840, w: 220, h: 76, label: 'PLAY AGAIN', color: '#7cf29a', size: 26, pulse: true };
      this.menu = { x: 280, y: 840, w: 220, h: 76, label: 'NEW PLAYERS', color: '#4fb3ff', size: 26 };
    }
    down(x, y) {
      if (this.t < 0.6) return;
      if (GP.hit(this.again, x, y)) { A.sfx('tap'); GP.replay(); }
      else if (GP.hit(this.menu, x, y)) { A.sfx('tap'); GP.setScene(new TitleScene()); }
    }
    key() { if (this.t > 0.6) GP.replay(); }
    update(dt) { this.t += dt; this.parts.update(dt); }
    render(ctx) {
      const t = this.t;
      GP.drawInsideBG(ctx, '#ffb3d1', '#8e5bd6', t, 3);
      GP.text(ctx, 'LEADERBOARD', W / 2, 70, { size: 52, color: '#ffd23f', lw: 12 });
      GP.text(ctx, 'Biggest poop wins!', W / 2, 118, { size: 22 });
      this.order.forEach((pi, r) => {
        const p = M.players[pi];
        const k = GP.ease.outBack(GP.clamp((t - r * 0.15) / 0.5, 0, 1));
        const y = 160 + r * 165;
        ctx.save(); ctx.translate(W / 2, y + 75); ctx.scale(k, k); ctx.translate(-W / 2, -(y + 75));
        card(ctx, 24, y, W - 48, 150, r === 0 ? '#fff4c2' : '#fff8ee');
        GP.text(ctx, '#' + (r + 1), 62, y + 75, { size: 40, color: r === 0 ? '#e0a400' : '#8a6aa0', stroke: '#3a1d4d', lw: 6 });
        // mini poop with buddy
        const pts = this.totals[pi];
        ctx.save(); ctx.translate(150, y + 135);
        const ps = GP.poopShape(pts);
        const sc = Math.min(1, 120 / ps.h, 110 / ps.w);
        ctx.scale(sc, sc);
        GP.drawPoop(ctx, 0, 0, pts, p.ch, { t: t + r });
        ctx.restore();
        if (r === 0) drawCrown(ctx, 150, y + 20, 18);
        GP.text(ctx, p.name, 230, y + 40, { size: 28, color: '#3a1d4d', stroke: false, align: 'left' });
        GP.text(ctx, p.human ? '' : 'CPU', 230 + Math.min(220, p.name.length * 16) + 16, y + 42, { size: 14, color: '#8a6aa0', stroke: false, align: 'left' });
        GP.text(ctx, `${pts} poop points`, 230, y + 78, { size: 24, color: p.ch.dark, stroke: false, align: 'left' });
        // per-stage mini bars
        p.results.forEach((res, si) => {
          const bx = 230 + si * 66, by = y + 104;
          ctx.fillStyle = '#e8dcf0'; GP.rr(ctx, bx, by, 58, 30, 8); ctx.fill();
          ctx.fillStyle = GP.GAMES[si].info.color; GP.rr(ctx, bx, by, Math.max(10, 58 * res.score / 100), 30, 8); ctx.fill();
          GP.text(ctx, String(res.score), bx + 29, by + 16, { size: 16, color: '#3a1d4d', stroke: false });
        });
        ctx.restore();
      });
      GP.button(ctx, this.again, t);
      GP.button(ctx, this.menu, t);
    }
  }
})();
