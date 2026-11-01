# Last Tether — Chapter 01: The Broken Spillway

A playable, original third-person browser adventure. Kavi crosses a failing spillway, learns to hunt its predators, defeats the Slateback and opens a floodgate before escaping the surge.

**Status:** complete local chapter prototype. Procedural art, compact encounters, local checkpoints, a dated time trial and personal ghost replay. Optional Supabase cloud-transfer code is implemented but **no live backend is configured or verified**. There is no public leaderboard, live multiplayer or second chapter.

## Run

Use Node 24+ and npm. From this folder:

```powershell
npm ci
npm run dev
```

Open http://127.0.0.1:4173 in a current desktop browser with WebGL2/graphics acceleration. The game is designed for keyboard/mouse; controller mappings are implemented but have not been verified on physical hardware. Touch controls are not implemented. Audio starts off and only becomes audible if you enable it in Settings.

Production build:

```powershell
npm run build
npm run preview -- --port 4174
```

Open http://127.0.0.1:4174. This serves the compiled artifact, without the development test hooks. The included `vercel.json` uses `npm run build` and `dist`; no game server or websocket connection is required for the solo chapter.

## Play

| Control | Action |
|---|---|
| WASD / arrows | Move relative to camera |
| Space | Jump; release an attached tether |
| Q | Attach to highlighted target; detach |
| Hold R | Reel toward a fixed anchor; pull a loose mechanism |
| F / left click | Spear strike |
| Shift | Dodge |
| E | Interact with a cache, shortcut or floodgate |
| Right mouse drag | Turn camera |
| C | Recenter behind Kavi |
| J | Field journal |
| Escape | Pause |

The game saves completed encounter checkpoints, not arbitrary airborne positions. Falls reset the unfinished encounter. Finished encounters and discoveries persist. Starting a new expedition requires an explicit confirmation. Browser storage is per origin: the development and preview ports have different local saves.

In the boss arena, line up a striped support between Kavi and the Slateback. Its charge commits to a straight line. After impact, approach, attach to the loose armour and hold R; attack during the exposed window. The last climb requires jumping onto raised steps.

See [WALKTHROUGH.md](WALKTHROUGH.md) for the character/world proposal and exact chapter actions, [DESIGN.md](DESIGN.md) for the implementation sequence, and [VERIFICATION.md](VERIFICATION.md) for bounded test evidence.

## Replay and persistence

- Story checkpoints and five discoverable journal entries are stored locally.
- Daily Route reuses the fork, counterweight and exposed span. Its UTC date changes the reefwing's starting rhythm; it does not generate a new world.
- Successful daily runs save time, falls and sampled movement. A second run shows the personal-best ghost. Retention is five runs per day across the four most recent recorded dates.
- Records are personal and client-controlled. They are not competitive or cheat-resistant scores.
- Cloud checkpoint transfers are explicit uploads/downloads with overwrite confirmation. Local saving remains automatic. Setup and remaining live checks are in [supabase/SETUP.md](supabase/SETUP.md).

## Implementation

- `src/simulation.ts`: fixed-step movement, platform collision, tether, enemies, encounters, checkpoints and validation. Independent of rendering.
- `src/world.ts`: Babylon.js procedural scene, characters, creatures, lighting, animation, camera collision and ghost rendering.
- `src/main.ts`: interface, keyboard/controller inputs, pause, journal, settings and cloud-transfer flow.
- `src/storage.ts`: local checkpoints and bounded daily records.
- `src/cloud.ts`: optional Supabase Auth and account-scoped checkpoint adapter.
- `src/audio.ts`: optional synthesised cues; no external audio files.
- `tests/`: behavior tests and repeatable Playwright CLI checks. Input-driven integration never teleports, changes health, or changes progression.
- `output/`: build/test/browser evidence. Screenshots in `output/playwright/` include earlier bug captures; the final chapter captures are `chapter-stage-*.png`.

No external character or environment assets, generated media, fonts, analytics or paid services are used. Geometry, colour, interface and synth cues were authored for this prototype. Babylon.js and Supabase JS retain their respective package licences. Reference-game research is in the sibling `adventure-game-research` folder; no reference game's art, names, maps or code were copied.

## Current limitations

This is a small playable chapter, not a finished commercial adventure. The optimal automated route is around one minute; that is evidence of reachability, not a claim about first-play duration. A 15–20 minute chapter and a satisfying difficulty curve have not been achieved or validated. The creatures and Kavi use simple procedural geometry and animation. Some decorative scenery is not collidable; enemy navigation is authored for these arenas. The opening bridge is already broken rather than collapsing dynamically. The counterweight appears when released rather than having a full machinery animation.

Human enjoyment, accessibility with diverse players, physical gamepads, mobile input, weak-device performance, live account/cloud security checks and public deployment remain unverified. Public leaderboard validation and live multiplayer are later work. No paid resources were created.
