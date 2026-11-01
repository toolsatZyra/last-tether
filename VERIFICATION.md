# Verification — 2 November 2026

## Passed locally

- TypeScript and Vite production build.
- 13 current behaviour tests: checkpoint validation; acceleration/diagonal speed/stopping; jump/landing; healing; grapple crossing; hunt-burst resource accounting; reinforcement gates; linked wheels; guardian armour/support interaction; fall recovery; full chapter completion; safe personal records; damaged settings recovery.
- Full accelerated input-driven Havok run: **592.68 seconds (9m53s), 193 defeats, zero recoveries**, all 32 objectives, all eight sectors, guardian and escape. It uses route/puzzle knowledge and advances simulated time faster than wall time. It does not teleport or grant health.
- Native keyboard run: moved from the opening to the first encounter, defeated three creatures, advanced to the watchpost, paused and froze the timer. No development steering was used for those actions.
- Settings persisted through reload. Story resume restored sector 2 / objective 2. New-game confirmation appeared. A daily run completed, wrote 575 ghost samples, retained its record through reload and loaded the ghost on a second run.
- All 14 recorded OGG files decoded in OfflineAudioContext. No audible playback was used. This validates encoding, not the audible mix.
- Compiled production preview: no development hook; ordinary keyboard combat; pause; save/reload/resume. No page errors or failed asset requests in that bounded check.
- Asset audit: 78 source/license/hash records, about 19.6 MB. Build dependency audit reported no known vulnerabilities at the time checked.

## Pacing and performance limits

An optimal policy completes faster than the intended first-time experience. A ranged-heavy policy previously measured 15m51s with one recovery. Neither is a human first play. A 15–20 minute chapter for an unfamiliar player remains unverified.

Latest short scene samples in desktop Chrome/WebGL2 on AMD Radeon integrated graphics were approximately 33–58 FPS at the test viewport, with cold shader compilation stalls. A later warm opening sample was about 51 FPS. They are bounded measurements, not a sustained 60 FPS claim or a guarantee on other hardware. Earlier constant-60 readings were invalid and must not be cited.

## Reproduction

Run `npm test` and `npm run build`. Browser checks use Playwright CLI with the files under `tools/`: `browser-route.js`, `keyboard-check.js`, `experience-check.js`, `production-check.js`, `scene-gallery.js` and `profile-render.js`. Start the dev server for developer-hook checks; serve the compiled build on port 4174 for the production check. Development artwork captures sometimes position a protected player for inspection; those captures are not proof of completing gameplay.

## Not established

Human enjoyment, first-time pacing, parity with top commercial game art, audible quality, sustained performance across the entire chapter, controller/touch support, cross-browser/device coverage, live cloud saves, public rankings and multiplayer. The Supabase prototype proposal was not deployed. Live deployment verification is recorded separately after publication.

## Final reliability pass

The full story test that also processes interface events reached the ending and saved a finished version-2 checkpoint in 599.03 simulated seconds, with 193 defeats and one recovery. The earlier route-only test measured 592.68 seconds with zero recoveries. These are different automated policies.

A long-run resource leak was found and fixed: actors now dispose their instantiated skeletons, animation groups and contact textures. Creating and disposing 100 creatures leaves the scene at exactly 2 skeletons, 47 textures and 48 animation groups before and after. Creature shaders are prepared under the loading screen before play. Camp difficulty changes were also checked to preserve a saved sector-2 checkpoint.
