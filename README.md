# Group Poop 💩

A silly, cartoony party game for 1–4 players. Four friends walk into a public restroom,
sit down... and then the camera zooms *inside*. Your little Gut Buddy drops into your
stomach and races through the digestive system in four quick mini-games.

Everyone's results stay **secret** until the end. Then comes **The Big Reveal**: each
player's final screen flashes up, split-screen, stage by stage. Every point you earned
makes your poop bigger, and you're embedded right in it. **Biggest poop wins!**

## The stages

| # | Body part | Mini-game | How you score |
|---|-----------|-----------|---------------|
| 1 | The Stomach | **Snack Stack**: tap to drop swinging snacks into the stomach | Snacks packed below the FULL LINE (gurgles bounce food out!) |
| 2 | The Small Intestine | **Nutrient Painter**: drag to paint the wiggly villi | % of the gut still glowing after the enzyme washes |
| 3 | The Large Intestine | **Germ Patrol**: tap grumpy germs before they make your friendly bacteria sick | Friendly bacteria saved |
| 4 | The Final Stretch | **Squeeze Beat**: tap when the muscle rings line up | Perfect / good squeezes |

## How to play

It's a web game that works on **iPhone, Android, tablets and PC**. Nothing to install.

- **Phone:** open the game link in Safari or Chrome. On iPhone, tap **Share → Add to Home Screen**
  to get an app icon and play full-screen.
- **PC:** open it in any browser. Click/tap to play; Space works as a tap, and **M** mutes.
- **Multiplayer:** choose how many humans are playing (1–4). The rest are computer players
  (Easy / Normal / Hard). Pass the phone between turns, and no peeking!

> iPhone tip: if there's no sound, check the silent switch on the side of the phone.

## Running it locally

No build step. Serve the folder with any static web server:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Add `?speed=4` to the URL to fast-forward everything (handy for testing).

## Putting it online (free) with GitHub Pages

1. On GitHub, go to the repo's **Settings → Pages**.
2. Under "Build and deployment", choose **Deploy from a branch**, pick the branch and `/ (root)`, and save.
3. After a minute your game is live at `https://<your-username>.github.io/<repo-name>/`.
   Send that link to friends.

## Project layout

```
index.html            page + setup panel
style.css
js/core.js            canvas scaling, input, scene manager, RNG, particles, synthesized audio
js/art.js             all the cartoon art (buddies, restroom, body map, trophy poop)
js/games/stack.js     Stage 1: Snack Stack
js/games/paint.js     Stage 2: Nutrient Painter
js/games/germs.js     Stage 3: Germ Patrol
js/games/squeeze.js   Stage 4: Squeeze Beat
js/scenes.js          intro cinematic, turns, big reveal, poop-off, leaderboard
js/main.js            setup panel + boot
tools/sim.js          headless balance checker: `node tools/sim.js [stack|paint|germs|squeeze]`
```

All graphics are drawn in code and all sounds are synthesized, so there are no asset files to manage.
