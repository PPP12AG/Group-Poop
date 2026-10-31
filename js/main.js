// Group Poop — setup panel + boot.
(function () {
  const GP = window.GP;
  const SKILL = { easy: 0.3, normal: 0.55, hard: 0.85 };
  const saved = (() => { try { return JSON.parse(localStorage.getItem('gp-setup') || '{}'); } catch (_) { return {}; } })();
  let humans = saved.humans || 1, diff = saved.diff || 'normal';
  const names = saved.names || GP.CHARS.map((c, i) => (i === 0 ? 'You' : `Player ${i + 1}`));

  const slots = document.getElementById('slots');
  function renderSlots() {
    slots.innerHTML = '';
    GP.CHARS.forEach((ch, i) => {
      const d = document.createElement('div');
      d.className = 'slot';
      const dot = document.createElement('div');
      dot.className = 'dot'; dot.style.background = ch.color;
      d.appendChild(dot);
      if (i < humans) {
        const inp = document.createElement('input');
        inp.maxLength = 12; inp.value = names[i]; inp.placeholder = `Player ${i + 1}`;
        inp.addEventListener('input', () => { names[i] = inp.value; });
        d.appendChild(inp);
      } else {
        const c = document.createElement('div');
        c.className = 'cpu'; c.textContent = `${ch.name} (computer)`;
        d.appendChild(c);
      }
      slots.appendChild(d);
    });
  }
  function seg(id, attr, get, set) {
    const el = document.getElementById(id);
    el.querySelectorAll('button').forEach((b) => {
      b.classList.toggle('on', b.dataset[attr] === String(get()));
      b.addEventListener('click', () => {
        set(b.dataset[attr]);
        el.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
        renderSlots();
        GP.audio.init(); GP.audio.sfx('tap');
      });
    });
  }
  seg('humans', 'n', () => humans, (v) => (humans = +v));
  seg('diff', 'd', () => diff, (v) => (diff = v));
  renderSlots();

  const mute = document.getElementById('mute');
  const setMuteLabel = () => (mute.textContent = GP.audio.muted ? 'Sound: OFF' : 'Sound: ON');
  if (saved.muted) GP.audio.setMuted(true);
  setMuteLabel();
  mute.addEventListener('click', () => { GP.audio.setMuted(!GP.audio.muted); setMuteLabel(); persist(); });
  window.addEventListener('keydown', (e) => { if (e.code === 'KeyM' && document.activeElement.tagName !== 'INPUT') { GP.audio.setMuted(!GP.audio.muted); setMuteLabel(); persist(); } });

  function persist() {
    try { localStorage.setItem('gp-setup', JSON.stringify({ humans, diff, names, muted: GP.audio.muted })); } catch (_) {}
  }

  document.getElementById('start').addEventListener('click', () => {
    GP.audio.init(); GP.audio.sfx('go');
    if (document.activeElement) document.activeElement.blur();
    persist();
    const r = Math.random;
    GP.startMatch({
      players: GP.CHARS.map((ch, i) => {
        const human = i < humans;
        const nm = human ? (names[i] || '').trim() || `Player ${i + 1}` : ch.name;
        return { name: nm, human, skill: human ? null : GP.clamp(SKILL[diff] + (r() - 0.5) * 0.2, 0.05, 1) };
      }),
    });
  });

  GP.setScene(new GP.TitleScene());
})();
