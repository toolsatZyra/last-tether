# Last Tether — The Broken Spillway

[Play the deployed chapter](https://last-tether.vercel.app/) · [GitHub source](https://github.com/toolsatZyra/last-tether)

An original solo browser adventure about Kavi, a routefinder who learns to hunt while trying to save the valley below a failing spillway.

Version 0.2.14 replaces the original procedural prototype with a Babylon.js / Havok chapter, licensed animated characters, authored ruins, textured surfaces, combat effects and recorded foley. Framed lanterns light nearby surfaces, weathered paving varies by area, foreground plants fade when they obscure the view, and memory chests visibly open and retain their state. The hero has smoother surface shading, a unified outfit palette, and restrained combo/turning accents; the exploration camera moves closer and widens for groups of enemies. The turbine approach adds alternating steam lanes and a shutdown valve. The quarry has a timber lifting crane, stepped cutting faces, a working furnace silhouette, rail fittings and detailed blasting charges. The canyon now uses optimized scanned rock masses and terrain shaped around the route. Native plant instancing, batched turbine spokes and spatially indexed camera queries reduce frame work while retaining the surface geometry and obstruction fading. Creature scale is measured from animated poses, airborne shadows remain on the floor, and full-body camera fading keeps close enemies from hiding the player. Each creature uses a distinct surface finish. Locomotion responds to actual movement, and lunging creatures keep their facing aligned with the committed attack path. The guardian has a detailed textured body, spine armour that changes with its phases, committed charge facing and an authored collapse. Static environment materials cache their shader readiness, and shadow lists remain bounded across area changes. Eight connected sectors contain 32 objectives, six creature behaviours, linked-wheel puzzles, a three-phase guardian and a timed escape. This is a substantial playable build; parity with leading commercial games and first-time human enjoyment are **not established**.

## Run and verify

Use Node 24 and npm:

```sh
npm ci
npm run dev
npm test
npm run verify:assets
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
- `actors.ts`, `scene.ts`, `water.ts`: models, animation, lighting, materials, camera, scenery, particles and water. `structures.ts` and `landmarks.ts` build bridge arcades, the bell tower and reservoir.
- `app.ts`, `profile.ts`, `markup.ts`, `style.css`: controls, local storage, settings and interface.
- `audio.ts`: opt-in recorded effects and a quiet synthesized bed.
- `tests/`: 28 behaviour and geometry checks, including a full input-driven route. `tools/`: reproducible browser and pacing checks.
- `public/assets/manifest.json`: 82 source/license/hash records covering approximately 23.8 MB of uncompressed source assets (not the compressed network transfer size).

The rejected prototype remains recoverable at Git commit `e8ef61d`. Its unused source and tests were removed from the current build so old checks cannot be mistaken for v2 validation.

## Credits and evidence

Models, rigs, creatures, vegetation and modular ruins: [Quaternius](https://quaternius.com/), CC0. Stone and timber surfaces: Rob Tuytel and Amal Kumar; rock scan: Rico Cilliers; HDR sky: Greg Zaal and Jarod Guest, [Poly Haven](https://polyhaven.com/), CC0. Recorded effects: [Kenney RPG Audio](https://kenney.nl/assets/rpg-audio) and [Impact Sounds](https://kenney.nl/assets/impact-sounds), CC0. Exact sources and local modifications are in the asset manifest; license files accompany the assets. Typography uses Barlow Condensed and DM Sans through Google Fonts. Engine/package licenses remain with their dependencies.

Read [WALKTHROUGH.md](WALKTHROUGH.md) for chapter actions, [ENGINEERING.md](ENGINEERING.md) for implementation boundaries, [VERIFICATION.md](VERIFICATION.md) for test evidence and [QUALITY_PLAN.md](QUALITY_PLAN.md) for the still-open quality gates.

## Current limits

The 0.2.3 normal-speed, input-driven chapter run reached the ending in 11m17s wall time (11m08s on the game clock), with 193 defeats and one recovery. It uses route and puzzle knowledge, not first-time human play. A separate accelerated route completed in 11m24s of simulated time without recoveries. A 15–20 minute first play remains a target; timing evidence is retained in VERIFICATION.md.

Rendering is stylized and uses mixed free assets; it does not yet establish the requested top-tier modern-game visual quality. The 0.2.3 full normal-speed run on integrated AMD graphics averaged 55.8 FPS at Balanced settings (1036 × 703 rendering), with a 23.3 ms 95th-percentile frame interval. Version 0.2.4 replaces those 0.96–1.33 second rebuild stalls with batched loading behind area titles. Seven transition checks measured 1.89–2.39 seconds total loading and a largest browser-frame interval of 133–182 ms; combat and the game clock remain held until ready. This is not seamless streaming. Shader preparation now runs under the loading screen. Version 0.2.9 improved four short stationary Balanced samples from 42–55 FPS to 64–71 FPS, including the turbine scene at 64.2 FPS versus 42.5 FPS before. These samples do not establish sustained 60 FPS throughout play. Current transition checks measured 1.93–3.55 seconds behind the loading screen and up to 230.5 ms between browser frames. Audio files were decoded silently; audible mix quality and human enjoyment remain unvalidated. Mobile/controller input and other hardware/browser combinations have not been verified.
