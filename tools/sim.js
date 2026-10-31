// Headless balance check: runs every mini-game with bots of different skill.
globalThis.window = globalThis;
const path = require('path');
const root = path.join(__dirname, '..');
require(root + '/js/core.js');
require(root + '/js/art.js');
for (const g of ['stack', 'paint', 'germs', 'squeeze']) { try { require(root + '/js/games/' + g + '.js'); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; } }
const only = process.argv[2];
GP.GAMES.forEach((G, gi) => {
  if (!G || (only && G.info.id !== only)) return;
  for (const skill of [0.2, 0.5, 0.8, 1.0]) {
    const scores = []; let ms = 0;
    for (let s = 1; s <= 8; s++) {
      const t0 = Date.now();
      const g = new G({ rng: GP.makeRng(s * 977 + gi), ch: GP.CHARS[0], bot: skill, quiet: true });
      let n = 0; while (!g.finished && n < 5000) { g.update(1 / 60); n++; }
      ms += Date.now() - t0;
      scores.push(g.score);
      if (s === 1 && skill === 0.8) console.log('   sample:', g.summary);
    }
    console.log(G.info.id, 'skill', skill, 'scores', scores.join(','), 'avg', (scores.reduce((a, b) => a + b) / scores.length).toFixed(1), 'ms/run', (ms / 8).toFixed(0));
  }
});
