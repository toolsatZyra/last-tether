# Last Tether — The Broken Spillway

[Play the deployed chapter](https://last-tether.vercel.app/) · [GitHub source](https://github.com/toolsatZyra/last-tether)

An original solo browser adventure about Kavi, a routefinder who learns to hunt while trying to save the valley below a failing spillway.

Version 0.2 replaces the original procedural prototype with a Babylon.js / Havok chapter, licensed animated characters, authored ruins, textured surfaces, combat effects and recorded foley. Eight connected sectors contain 32 objectives, six creature behaviours, linked-wheel puzzles, a three-phase guardian and a timed escape. This is a substantial playable build; parity with leading commercial games and first-time human enjoyment are **not established**.

## Run and verify

Use Node 24 and npm:

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview -- --port 4174
```

Development: http://127.0.0.1:4173. Production preview: http://127.0.0.1:4174. Desktop keyboard/mouse and hardware-accelerated WebGL2 are required. The production build contains no development simulation hook. Audio is off until enabled in Settings.

## Controls

| Input | Action |
|---|---|
| WASD / arrows | Move relative to the camera |
| F / left click, held | Three-part spear chain; aerial strike when jumping |
| R | Returning spear, unlocked during the storm road |
| Q | Cross a marked gap, pull a creature, or tear stunned guardian armour |
| Shift | Dodge |
| Space | Jump / release a grapple |
| X | Spend a full hunt meter, unlocked in the hanging forest |
| H | Healing flask |
| E | Interact / turn a wheel / collect a memory |
| Right drag / C | Look / recenter |
| Escape / J | Pause / journal |

Checkpoints record secured objectives. Retrying restores that encounter with full health and flasks. New expedition asks before replacing a local story save. Optional memories restore a flask. Browser saves belong to the current origin: localhost, preview and the public deployment have separate storage.

## Replay and online features

The hanging-forest trial records personal times and a sampled movement ghost, retaining five runs on each of the four most recent dates. It is the same authored course each day. These records are local and client-controlled, not competitive scores.

Cloud transfer, public leaderboards and multiplayer are not connected. No suitable dedicated Last Tether Supabase project was present; unrelated databases were left alone. The old Supabase proposal is explicitly archived in its setup notes and must not be applied as a v2 integration.

## Source layout

- `src/expedition/engine.ts`: chapter state, combat, enemy decisions, puzzles and checkpoint validation.
- `level.ts`: authored route and encounters; `physics.ts`: Havok capsule movement against scene geometry.
- `actors.ts`, `scene.ts`, `water.ts`: models, animation, lighting, materials, camera, scenery, particles and water.
- `app.ts`, `profile.ts`, `markup.ts`, `style.css`: controls, local storage, settings and interface.
- `audio.ts`: opt-in recorded effects and a quiet synthesized bed.
- `tests/`: 13 behaviour checks, including a full input-driven route. `tools/`: reproducible browser and pacing checks.
- `public/assets/manifest.json`: 78 source/license/hash records covering approximately 19.6 MB of licensed assets.

The rejected prototype remains recoverable at Git commit `e8ef61d`. Its unused source and tests were removed from the current build so old checks cannot be mistaken for v2 validation.

## Credits and evidence

Models, rigs, creatures, vegetation and modular ruins: [Quaternius](https://quaternius.com/), CC0. Stone surfaces: Rob Tuytel and Amal Kumar; HDR sky: Greg Zaal and Jarod Guest, [Poly Haven](https://polyhaven.com/), CC0. Recorded effects: [Kenney RPG Audio](https://kenney.nl/assets/rpg-audio) and [Impact Sounds](https://kenney.nl/assets/impact-sounds), CC0. Exact sources and local modifications are in the asset manifest; license files accompany the assets. Typography uses Barlow Condensed and DM Sans through Google Fonts. Engine/package licenses remain with their dependencies.

Read [WALKTHROUGH.md](WALKTHROUGH.md) for chapter actions, [ENGINEERING.md](ENGINEERING.md) for implementation boundaries, [VERIFICATION.md](VERIFICATION.md) for test evidence and [QUALITY_PLAN.md](QUALITY_PLAN.md) for the still-open quality gates.

## Current limits

The accelerated route-only Havok test completed in 9m53s without deaths; a full story/interface policy took 9m59s with one recovery, and a ranged-heavy policy took 15m51s. Those are automated policies with route and puzzle knowledge, not first-time human playtests. A 15–20 minute first play remains a target.

Rendering is stylized and uses mixed free assets; it does not yet establish the requested top-tier modern-game visual quality. Short desktop Chrome samples on integrated AMD graphics varied roughly 33–58 FPS in the latest art pass, with additional cold shader compilation stalls. A sustained 60 FPS claim would be incorrect. Audio files were decoded silently; audible mix quality and human enjoyment remain unvalidated. Mobile/controller input and other hardware/browser combinations have not been verified.
