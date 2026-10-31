// Group Poop — procedural cartoon art: buddies, hosts, body map, bathroom, poop.
(function () {
  const GP = window.GP;
  const TAU = Math.PI * 2;

  GP.CHARS = [
    { name: 'Sprout', color: '#62d26f', dark: '#2f8f45', light: '#c4f7c9', hat: 'leaf', skin: '#f6c9a8', hair: '#5b3a29', shirt: '#62d26f', pants: '#3b5bdb', shoe: '#ffffff' },
    { name: 'Bubbles', color: '#4fb3ff', dark: '#1f6fb8', light: '#cfeaff', hat: 'antenna', skin: '#c98d63', hair: '#22160f', shirt: '#4fb3ff', pants: '#444b6e', shoe: '#ff5d5d' },
    { name: 'Peaches', color: '#ff7fb0', dark: '#c2457a', light: '#ffd6e6', hat: 'bow', skin: '#ffdcc2', hair: '#e0a43a', shirt: '#ff7fb0', pants: '#7a4fd6', shoe: '#ffd23f' },
    { name: 'Nugget', color: '#ffc23a', dark: '#c78a10', light: '#fff0b8', hat: 'cap', skin: '#8d5a3b', hair: '#1a1a1a', shirt: '#ffc23a', pants: '#2d8a6e', shoe: '#5b6bff' },
  ];

  function ell(ctx, x, y, rx, ry, rot = 0) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU);
  }
  GP.ell = ell;

  // ---------- the player's little gut buddy ----------
  GP.drawBuddy = function (ctx, x, y, r, ch, o = {}) {
    const t = o.t || 0;
    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    const sq = o.squash || 0;
    ctx.scale(1 + sq, 1 - sq);
    const lw = Math.max(1.5, r * 0.12);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    // arms
    if (o.arms !== false) {
      const wave = o.wave ? Math.sin(t * 12) * 0.6 : 0;
      ctx.strokeStyle = ch.dark; ctx.lineWidth = r * 0.22;
      ctx.beginPath(); ctx.moveTo(-r * 0.8, r * 0.1); ctx.lineTo(-r * 1.25, -r * 0.2 - (o.cheer ? r * 0.6 : 0) + wave * r * 0.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r * 0.8, r * 0.1); ctx.lineTo(r * 1.25, -r * 0.2 - (o.cheer ? r * 0.6 : 0) - wave * r * 0.3); ctx.stroke();
      ctx.strokeStyle = ch.color; ctx.lineWidth = r * 0.12;
      ctx.beginPath(); ctx.moveTo(-r * 0.8, r * 0.1); ctx.lineTo(-r * 1.25, -r * 0.2 - (o.cheer ? r * 0.6 : 0) + wave * r * 0.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r * 0.8, r * 0.1); ctx.lineTo(r * 1.25, -r * 0.2 - (o.cheer ? r * 0.6 : 0) - wave * r * 0.3); ctx.stroke();
    }
    // feet
    if (o.feet !== false) {
      ctx.fillStyle = ch.dark;
      ell(ctx, -r * 0.4, r * 1.02, r * 0.32, r * 0.18); ctx.fill();
      ell(ctx, r * 0.4, r * 1.02, r * 0.32, r * 0.18); ctx.fill();
    }
    // hat (behind for leaf / antenna)
    drawHat(ctx, r, ch, t, 'back');
    // body
    ctx.fillStyle = ch.color; ctx.strokeStyle = ch.dark; ctx.lineWidth = lw;
    ell(ctx, 0, 0, r * 0.95, r * 1.05); ctx.fill(); ctx.stroke();
    ctx.fillStyle = ch.light;
    ell(ctx, 0, r * 0.4, r * 0.55, r * 0.48); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ell(ctx, -r * 0.45, -r * 0.6, r * 0.22, r * 0.14, -0.6); ctx.fill();
    drawHat(ctx, r, ch, t, 'front');
    drawFace(ctx, r, ch, o);
    ctx.restore();
  };

  function drawFace(ctx, r, ch, o) {
    const mood = o.mood || 'happy';
    const lx = (o.look && o.look.x) || 0, ly = (o.look && o.look.y) || 0;
    const blink = o.t ? (Math.sin(o.t * 1.3 + (o.seed || 0)) > 0.985 ? 0.15 : 1) : 1;
    // eyes
    for (const s of [-1, 1]) {
      const ex = s * r * 0.34, ey = -r * 0.2;
      if (mood === 'squint') {
        ctx.strokeStyle = '#2b1a33'; ctx.lineWidth = r * 0.1;
        ctx.beginPath(); ctx.moveTo(ex - r * 0.16, ey - r * 0.1 * s * -1); ctx.lineTo(ex + r * 0.12 * s, ey); ctx.lineTo(ex - r * 0.16, ey + r * 0.1 * s * -1); ctx.stroke();
        continue;
      }
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#2b1a33'; ctx.lineWidth = r * 0.06;
      ell(ctx, ex, ey, r * 0.26, r * 0.3 * blink); ctx.fill(); ctx.stroke();
      if (blink > 0.5) {
        ctx.fillStyle = '#2b1a33';
        const pr = mood === 'wow' ? r * 0.1 : r * 0.14;
        ell(ctx, ex + lx * r * 0.08, ey + ly * r * 0.08 + r * 0.03, pr, pr); ctx.fill();
        ctx.fillStyle = '#fff';
        ell(ctx, ex + lx * r * 0.08 - pr * 0.35, ey + ly * r * 0.08 - pr * 0.2, pr * 0.35, pr * 0.35); ctx.fill();
      }
    }
    // cheeks
    ctx.fillStyle = 'rgba(255,90,120,0.35)';
    ell(ctx, -r * 0.62, r * 0.12, r * 0.15, r * 0.09); ctx.fill();
    ell(ctx, r * 0.62, r * 0.12, r * 0.15, r * 0.09); ctx.fill();
    // mouth
    ctx.strokeStyle = '#2b1a33'; ctx.lineWidth = r * 0.09; ctx.fillStyle = '#7a2140';
    ctx.beginPath();
    if (mood === 'wow') { ell(ctx, 0, r * 0.25, r * 0.13, r * 0.17); ctx.fill(); ctx.stroke(); }
    else if (mood === 'sad') { ctx.arc(0, r * 0.4, r * 0.2, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
    else if (mood === 'worried') { ctx.moveTo(-r * 0.2, r * 0.3); ctx.quadraticCurveTo(-r * 0.1, r * 0.2, 0, r * 0.3); ctx.quadraticCurveTo(r * 0.1, r * 0.4, r * 0.2, r * 0.3); ctx.stroke(); }
    else if (mood === 'squint') { ctx.arc(0, r * 0.18, r * 0.2, 0.1, Math.PI - 0.1); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else { ctx.arc(0, r * 0.15, r * 0.24, 0.25, Math.PI - 0.25); ctx.stroke(); }
  }

  function drawHat(ctx, r, ch, t, layer) {
    ctx.lineCap = 'round';
    if (ch.hat === 'leaf' && layer === 'back') {
      ctx.strokeStyle = '#2f8f45'; ctx.lineWidth = r * 0.1;
      ctx.beginPath(); ctx.moveTo(0, -r * 0.95); ctx.lineTo(0, -r * 1.35); ctx.stroke();
      ctx.fillStyle = '#8be36b'; ctx.strokeStyle = '#2f8f45'; ctx.lineWidth = r * 0.07;
      const sw = Math.sin(t * 3) * 0.15;
      ell(ctx, -r * 0.22, -r * 1.38, r * 0.25, r * 0.11, -0.5 + sw); ctx.fill(); ctx.stroke();
      ell(ctx, r * 0.22, -r * 1.42, r * 0.25, r * 0.11, 0.5 + sw); ctx.fill(); ctx.stroke();
    } else if (ch.hat === 'antenna' && layer === 'back') {
      ctx.strokeStyle = ch.dark; ctx.lineWidth = r * 0.08;
      const sw = Math.sin(t * 4) * r * 0.1;
      ctx.beginPath(); ctx.moveTo(r * 0.1, -r * 0.95); ctx.quadraticCurveTo(r * 0.3, -r * 1.3, r * 0.25 + sw, -r * 1.55); ctx.stroke();
      ctx.fillStyle = '#ffe14f';
      ell(ctx, r * 0.25 + sw, -r * 1.55, r * 0.15, r * 0.15); ctx.fill(); ctx.stroke();
    } else if (ch.hat === 'bow' && layer === 'front') {
      ctx.fillStyle = '#ff3d7f'; ctx.strokeStyle = '#a3164a'; ctx.lineWidth = r * 0.06;
      ctx.save(); ctx.translate(r * 0.42, -r * 0.82); ctx.rotate(0.3);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-r * 0.35, -r * 0.2); ctx.lineTo(-r * 0.35, r * 0.2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * 0.35, -r * 0.2); ctx.lineTo(r * 0.35, r * 0.2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ell(ctx, 0, 0, r * 0.1, r * 0.1); ctx.fill(); ctx.stroke();
      ctx.restore();
    } else if (ch.hat === 'cap' && layer === 'front') {
      ctx.fillStyle = '#ff5d5d'; ctx.strokeStyle = '#a32626'; ctx.lineWidth = r * 0.07;
      ctx.beginPath(); ctx.ellipse(0, -r * 0.68, r * 0.7, r * 0.45, 0, Math.PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke();
      ell(ctx, r * 0.55, -r * 0.68, r * 0.45, r * 0.1); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ell(ctx, 0, -r * 0.95, r * 0.12, r * 0.12); ctx.fill();
    }
  }

  // ---------- host humans (the people on the toilets) ----------
  // feet at (x,y). walk phase p. facing dir (1 right)
  GP.drawHost = function (ctx, x, y, s, ch, o = {}) {
    const p = o.phase || 0, dir = o.dir || 1;
    ctx.save();
    ctx.translate(x, y); ctx.scale(s * dir, s);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const legA = Math.sin(p) * 0.5, legB = -legA;
    const bob = Math.abs(Math.sin(p)) * 4;
    ctx.translate(0, -bob);
    // legs
    for (const a of [legA, legB]) {
      ctx.save(); ctx.translate(0, -95); ctx.rotate(a);
      ctx.fillStyle = ch.pants; ctx.strokeStyle = '#2b1a33'; ctx.lineWidth = 4;
      GP.rr(ctx, -12, 0, 24, 90, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ch.shoe; GP.rr(ctx, -14, 82, 36, 16, 8); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    // back arm
    ctx.save(); ctx.translate(0, -175); ctx.rotate(-legA * 0.8);
    ctx.fillStyle = ch.skin; ctx.strokeStyle = '#2b1a33'; ctx.lineWidth = 4;
    GP.rr(ctx, -9, 0, 18, 70, 9); ctx.fill(); ctx.stroke(); ctx.restore();
    // torso
    ctx.fillStyle = ch.shirt; ctx.strokeStyle = '#2b1a33'; ctx.lineWidth = 4;
    GP.rr(ctx, -32, -190, 64, 105, 26); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; GP.rr(ctx, -20, -180, 18, 60, 9); ctx.fill();
    // front arm
    ctx.save(); ctx.translate(0, -175); ctx.rotate(legA * 0.8);
    ctx.fillStyle = ch.shirt; GP.rr(ctx, -10, 0, 20, 40, 9); ctx.fill(); ctx.stroke();
    ctx.fillStyle = ch.skin; GP.rr(ctx, -9, 34, 18, 36, 9); ctx.fill(); ctx.stroke(); ctx.restore();
    // head
    ctx.fillStyle = ch.skin;
    ell(ctx, 4, -228, 36, 38); ctx.fill(); ctx.stroke();
    ctx.fillStyle = ch.hair;
    ctx.beginPath(); ctx.ellipse(0, -240, 38, 28, 0, Math.PI * 1.05, Math.PI * 2.05); ctx.fill();
    // face
    ctx.fillStyle = '#2b1a33';
    ell(ctx, 22, -230, 4, 5); ctx.fill();
    ctx.strokeStyle = '#2b1a33'; ctx.lineWidth = 3;
    ctx.beginPath();
    if (o.urgent) { ctx.moveTo(18, -210); ctx.lineTo(32, -212); }
    else ctx.arc(24, -214, 8, 0.3, Math.PI - 0.6);
    ctx.stroke();
    if (o.urgent) { // sweat drop
      ctx.fillStyle = '#7fd3ff';
      ctx.beginPath(); ctx.moveTo(-20, -262); ctx.quadraticCurveTo(-28, -248, -20, -244); ctx.quadraticCurveTo(-12, -248, -20, -262); ctx.fill();
    }
    ctx.restore();
  };

  // feet + bunched pants peeking under a stall door (seated)
  GP.drawSeatedFeet = function (ctx, x, y, ch, t, idx) {
    ctx.save(); ctx.translate(x, y);
    ctx.lineCap = 'round';
    const sw = Math.sin(t * 3 + idx) * 4;
    ctx.strokeStyle = '#2b1a33'; ctx.lineWidth = 3;
    // shins
    ctx.fillStyle = ch.skin;
    GP.rr(ctx, -26 + sw * 0.3, -48, 16, 40, 7); ctx.fill(); ctx.stroke();
    GP.rr(ctx, 10 - sw * 0.3, -48, 16, 40, 7); ctx.fill(); ctx.stroke();
    // bunched pants around ankles
    ctx.fillStyle = ch.pants;
    ell(ctx, 0, -12, 40, 13); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 12, -22); ctx.lineTo(i * 12 + 4, -3); ctx.stroke(); }
    // shoes
    ctx.strokeStyle = '#2b1a33'; ctx.lineWidth = 3;
    ctx.fillStyle = ch.shoe;
    GP.rr(ctx, -34 + sw, -4, 30, 13, 6); ctx.fill(); ctx.stroke();
    GP.rr(ctx, 6 - sw, -4, 30, 13, 6); ctx.fill(); ctx.stroke();
    ctx.restore();
  };

  // ---------- public restroom ----------
  GP.STALLS = [0, 1, 2, 3].map((i) => ({ x: 30 + i * 120, w: 120, top: 300, doorBottom: 690, floor: 760 }));
  GP.drawBathroom = function (ctx, t) {
    const W = GP.W, H = GP.H;
    // wall tiles
    ctx.fillStyle = '#bfeee6'; ctx.fillRect(0, 0, W, 760);
    ctx.strokeStyle = 'rgba(60,140,140,0.25)'; ctx.lineWidth = 2;
    for (let y = 0; y < 760; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let y = 0; y < 760; y += 40) for (let x = (y / 40) % 2 ? 0 : 20; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 40); ctx.stroke(); }
    // stripe
    ctx.fillStyle = '#ff9fc4'; ctx.fillRect(0, 250, W, 18);
    // sign
    ctx.fillStyle = '#3a1d4d'; GP.rr(ctx, 170, 60, 200, 110, 18); ctx.fill();
    ctx.fillStyle = '#fff'; GP.rr(ctx, 178, 68, 184, 94, 14); ctx.fill();
    GP.text(ctx, 'RESTROOM', 270, 95, { size: 26, color: '#3a1d4d', stroke: false });
    // little stick people icons
    ctx.fillStyle = '#3a1d4d';
    for (const [ix, sk] of [[240, 0], [300, 1]]) {
      ell(ctx, ix, 120, 7, 7); ctx.fill();
      ctx.beginPath();
      if (sk) { ctx.moveTo(ix - 10, 150); ctx.lineTo(ix, 128); ctx.lineTo(ix + 10, 150); } else ctx.rect(ix - 7, 129, 14, 22);
      ctx.fill();
    }
    // lights
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = 'rgba(255,255,220,0.5)';
      ell(ctx, 90 + i * 180, 22, 50, 10); ctx.fill();
    }
    // floor
    const fy = 760;
    ctx.fillStyle = '#f5f0ff'; ctx.fillRect(0, fy, W, H - fy);
    for (let y = fy, r = 0; y < H; y += 50, r++) for (let x = r % 2 ? 0 : 50; x < W; x += 100) { ctx.fillStyle = '#d7c8f5'; ctx.fillRect(x, y, 50, 50); }
    ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(0, fy, W, 8);
  };

  // stall interior and frame. open in [0,1]
  GP.drawStallBack = function (ctx, s) {
    ctx.fillStyle = '#e8f7f5'; ctx.fillRect(s.x, s.top, s.w, s.floor - s.top);
    // toilet
    const cx = s.x + s.w / 2;
    ctx.strokeStyle = '#2b1a33'; ctx.lineWidth = 3; ctx.fillStyle = '#fff';
    GP.rr(ctx, cx - 26, 560, 52, 70, 10); ctx.fill(); ctx.stroke(); // tank
    ell(ctx, cx, 668, 40, 16); ctx.fill(); ctx.stroke();
    GP.rr(ctx, cx - 22, 668, 44, 82, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d0d6ff'; GP.rr(ctx, cx + 10, 575, 12, 8, 3); ctx.fill();
  };
  GP.drawStallFront = function (ctx, s, open, occupied, i) {
    // partitions
    ctx.fillStyle = '#6c5ce7'; ctx.strokeStyle = '#3a1d4d'; ctx.lineWidth = 4;
    ctx.fillRect(s.x - 6, s.top - 10, 12, s.doorBottom - s.top + 10);
    ctx.fillRect(s.x + s.w - 6, s.top - 10, 12, s.doorBottom - s.top + 10);
    ctx.fillRect(s.x - 6, s.top - 14, s.w + 12, 12);
    // door hinged on the left, opening toward viewer
    const dw = (s.w - 14) * (1 - open * 0.85);
    const dx = s.x + 7;
    ctx.fillStyle = ['#8ee0a3', '#8ec9ff', '#ffb3d1', '#ffd98e'][i % 4];
    ctx.fillRect(dx, s.top, dw, s.doorBottom - s.top);
    ctx.strokeRect(dx, s.top, dw, s.doorBottom - s.top);
    if (open < 0.5) {
      // number + lock indicator
      GP.text(ctx, String(i + 1), dx + dw / 2, s.top + 60, { size: 34, color: '#fff' });
      ctx.fillStyle = occupied ? '#ff4d4d' : '#4dd17a';
      GP.rr(ctx, dx + dw - 34, 480, 24, 14, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c9b8ff'; ell(ctx, dx + dw - 22, 510, 5, 5); ctx.fill();
    }
  };

  // ---------- x-ray body map ----------
  // local coords: body ~ 200 wide x 400 tall, centered on torso (0,0)
  GP.ORGAN_POS = [
    { x: 22, y: -42 }, // stomach
    { x: 0, y: 45 },   // small intestine
    { x: -58, y: 40 }, // large intestine
    { x: 0, y: 128 },  // the exit
  ];
  GP.drawBodyMap = function (ctx, cx, cy, s, ch, o = {}) {
    const t = o.t || 0, hl = o.stage == null ? -1 : o.stage;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // head
    ctx.fillStyle = ch.skin; ctx.strokeStyle = '#2b1a33'; ctx.lineWidth = 4;
    ell(ctx, 0, -200, 46, 48); ctx.fill(); ctx.stroke();
    ctx.fillStyle = ch.hair; ctx.beginPath(); ctx.ellipse(0, -215, 47, 34, 0, Math.PI, TAU); ctx.fill();
    // straining face :)
    ctx.strokeStyle = '#2b1a33'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-22, -200); ctx.lineTo(-10, -194); ctx.lineTo(-22, -188); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(22, -200); ctx.lineTo(10, -194); ctx.lineTo(22, -188); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-12, -172); ctx.quadraticCurveTo(0, -165 + Math.sin(t * 6) * 3, 12, -172); ctx.stroke();
    ctx.fillStyle = 'rgba(255,80,110,0.4)'; ell(ctx, -30, -180, 8, 5); ctx.fill(); ell(ctx, 30, -180, 8, 5); ctx.fill();
    // torso (x-ray glass)
    ctx.fillStyle = ch.shirt; ctx.strokeStyle = '#2b1a33'; ctx.lineWidth = 4;
    GP.rr(ctx, -100, -150, 200, 310, 70); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,240,235,0.88)';
    GP.rr(ctx, -84, -136, 168, 282, 58); ctx.fill();
    const glow = (i) => {
      if (i === hl) { ctx.shadowColor = '#fff36b'; ctx.shadowBlur = 18 + Math.sin(t * 6) * 8; }
      else ctx.shadowBlur = 0;
    };
    const dim = (i, c) => (hl >= 0 && i !== hl ? c + '99' : c);
    // esophagus
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ff9aa8'; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(0, -158); ctx.quadraticCurveTo(-4, -100, 12, -68); ctx.stroke();
    // large intestine (frame)
    glow(2);
    ctx.strokeStyle = dim(2, '#c98be0'); ctx.lineWidth = 24;
    ctx.beginPath(); ctx.moveTo(-58, 105); ctx.lineTo(-62, 0); ctx.quadraticCurveTo(-60, -12, -40, -12); ctx.lineTo(40, -12); ctx.quadraticCurveTo(62, -12, 62, 6); ctx.lineTo(60, 100); ctx.quadraticCurveTo(50, 118, 20, 110); ctx.stroke();
    // colon / exit
    glow(3);
    ctx.strokeStyle = dim(3, '#ff8a5b'); ctx.lineWidth = 20;
    ctx.beginPath(); ctx.moveTo(20, 110); ctx.quadraticCurveTo(0, 112, 0, 140); ctx.stroke();
    // small intestine squiggle
    glow(1);
    ctx.strokeStyle = dim(1, '#ffb347'); ctx.lineWidth = 13;
    ctx.beginPath(); ctx.moveTo(-30, 8);
    for (let i = 0; i < 5; i++) {
      const yy = 12 + i * 17;
      ctx.bezierCurveTo(-40, yy + 6, 42, yy + 2, 36, yy + 10);
      ctx.bezierCurveTo(30, yy + 16, -40, yy + 12, -36, yy + 18);
    }
    ctx.stroke();
    // stomach bean
    glow(0);
    ctx.fillStyle = dim(0, '#ff6f91'); ctx.strokeStyle = '#c2405f'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(10, -72); ctx.bezierCurveTo(70, -88, 75, -20, 40, -14);
    ctx.bezierCurveTo(10, -10, -20, -30, -10, -42); ctx.bezierCurveTo(0, -52, 8, -50, 10, -72);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    // buddy
    if (o.buddy) {
      const b = o.buddy;
      GP.drawBuddy(ctx, b.x, b.y, b.r || 14, ch, { t, mood: b.mood || 'happy', arms: b.r > 10, feet: false, cheer: b.cheer, squash: b.squash || 0 });
    }
    ctx.restore();
  };

  // ---------- the cartoon trophy poop (soft-serve swirl) ----------
  GP.poopShape = function (points) {
    // grows faster than linear so bigger scores look MUCH bigger
    const k = Math.pow(GP.clamp(points, 0, 400) / 400, 1.5);
    const w = 42 + k * 88;
    const tiers = 1.2 + k * 8.8;
    return { w, tiers, h: w * 0.34 * tiers + w * 0.45 };
  };
  GP.drawPoop = function (ctx, x, baseY, points, ch, o = {}) {
    const t = o.t || 0;
    const { w, tiers } = GP.poopShape(points);
    const n = Math.max(1, Math.ceil(tiers));
    const step = w * 0.34;
    ctx.save(); ctx.translate(x, baseY);
    const wob = Math.sin(t * 4) * 0.02;
    ctx.scale(1 + wob, 1 - wob);
    ctx.lineWidth = Math.max(3, w * 0.05); ctx.strokeStyle = '#5a3015';
    let topY = 0, topW = w;
    const tierList = [];
    for (let i = 0; i < n; i++) {
      const frac = i < n - 1 ? 1 : tiers - (n - 1);
      const tw = w * (1 - (i / Math.max(n, 3)) * 0.55) * (0.6 + 0.4 * frac);
      const th = step * 1.05 * (0.55 + 0.45 * frac);
      const ty = -i * step * 0.85 - th * 0.5;
      tierList.push({ tw, th, ty });
      topY = ty - th * 0.5; topW = tw;
    }
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ell(ctx, 0, 4, w * 0.62, w * 0.12); ctx.fill();
    tierList.forEach((tr, i) => {
      const g = ctx.createLinearGradient(0, tr.ty - tr.th / 2, 0, tr.ty + tr.th / 2);
      g.addColorStop(0, '#b97a45'); g.addColorStop(1, '#7d4a24');
      ctx.fillStyle = g;
      GP.rr(ctx, -tr.tw / 2, tr.ty - tr.th / 2, tr.tw, tr.th, tr.th / 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,230,190,0.45)';
      GP.rr(ctx, -tr.tw * 0.38, tr.ty - tr.th * 0.36, tr.tw * 0.35, tr.th * 0.2, tr.th * 0.1); ctx.fill();
    });
    // swirl tip
    const tipH = topW * 0.45;
    const g2 = ctx.createLinearGradient(0, topY - tipH, 0, topY);
    g2.addColorStop(0, '#c58750'); g2.addColorStop(1, '#8a5229');
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.moveTo(-topW * 0.3, topY + 4);
    ctx.quadraticCurveTo(-topW * 0.2, topY - tipH * 0.7, topW * 0.12, topY - tipH);
    ctx.quadraticCurveTo(topW * 0.02, topY - tipH * 0.4, topW * 0.3, topY + 4);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // sparkles (it's a trophy!)
    ctx.fillStyle = '#fff7b0';
    for (let i = 0; i < 3; i++) {
      const a = t * 2 + i * 2.1;
      const sx = Math.cos(a) * w * 0.55, sy = topY * (0.3 + 0.3 * i) + Math.sin(a * 1.3) * 8;
      const sz = (Math.sin(t * 5 + i) * 0.5 + 0.5) * w * 0.07 + 2;
      GP.star(ctx, sx, sy, sz, sz * 0.4, 4); ctx.fill();
    }
    // embedded buddy peeking out of the middle
    if (ch) {
      const mid = tierList[Math.min(tierList.length - 1, Math.floor((tierList.length - 1) / 2))];
      const br = Math.min(w * 0.22, 30);
      ctx.save();
      // clip the buddy so only the upper part pokes out of the tier
      ctx.beginPath(); ctx.rect(-w, mid.ty - br * 3, w * 2, br * 3 + mid.th * 0.15); ctx.clip();
      GP.drawBuddy(ctx, 0, mid.ty - br * 0.2, br, ch, { t, mood: o.mood || 'happy', cheer: o.cheer, wave: o.cheer, feet: false });
      ctx.restore();
      ctx.lineWidth = Math.max(2, w * 0.03);
      ctx.strokeStyle = '#5a3015'; ctx.fillStyle = '#9b6234';
      ctx.beginPath(); ctx.ellipse(0, mid.ty + mid.th * 0.12, br * 1.15, br * 0.28, 0, 0, Math.PI); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
    return { top: baseY + topY - tipH };
  };

  // ---------- inside-the-body backgrounds ----------
  GP.drawInsideBG = function (ctx, c1, c2, t, seed = 1) {
    const g = ctx.createLinearGradient(0, 0, 0, GP.H);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, GP.W, GP.H);
    const r = GP.makeRng(seed);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let i = 0; i < 18; i++) {
      const x = r() * GP.W, y = ((r() * GP.H - t * (10 + r() * 20)) % GP.H + GP.H) % GP.H, rad = 6 + r() * 30;
      ell(ctx, x, y, rad, rad); ctx.fill();
    }
  };

  GP.drawHUD = function (ctx, title, timeLeft, total, color) {
    ctx.fillStyle = 'rgba(40,10,60,0.55)';
    GP.rr(ctx, 12, 12, GP.W - 24, 66, 22); ctx.fill();
    GP.text(ctx, title, 34, 45, { size: 26, align: 'left', color: '#fff' });
    if (timeLeft != null) {
      const frac = GP.clamp(timeLeft / total, 0, 1);
      ctx.fillStyle = '#3a1d4d'; GP.rr(ctx, 330, 32, 180, 26, 13); ctx.fill();
      ctx.fillStyle = frac < 0.2 ? '#ff5d5d' : color || '#7cf29a';
      GP.rr(ctx, 333, 35, Math.max(14, 174 * frac), 20, 10); ctx.fill();
      GP.text(ctx, Math.ceil(timeLeft) + 's', 420, 46, { size: 18, color: '#fff' });
    }
  };
})();
