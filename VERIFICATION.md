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

Version 0.2.1 sampled the opening, hanging forest and guardian in desktop Chrome/WebGL2 on AMD Radeon integrated graphics at Balanced settings, rendering at 1036 × 703. After two seconds of settling, four-second samples reported engine FPS of 50.6, 69.4 and 71.6. Median frame intervals were 18.1, 18.1 and 12.2 ms; 95th percentiles were 24.2, 18.5 and 18.3 ms. These use a stationary invulnerable player and active encounters, so they are bounded samples rather than complete-playthrough or other-hardware guarantees. Shader preparation now runs under the loading screen. Earlier constant-60 readings were invalid and must not be cited.

## Reproduction

Run `npm test` and `npm run build`. Browser checks use Playwright CLI with the files under `tools/`: `browser-route.js`, `keyboard-check.js`, `experience-check.js`, `production-check.js`, `scene-gallery.js` and `profile-render.js`. Start the dev server for developer-hook checks; serve the compiled build on port 4174 for the production check. Development artwork captures sometimes position a protected player for inspection; those captures are not proof of completing gameplay.

## Not established

Human enjoyment, first-time pacing, parity with top commercial game art, audible quality, sustained performance across the entire chapter, controller/touch support, cross-browser/device coverage, live cloud saves, public rankings and multiplayer. The Supabase prototype proposal was not deployed. Live deployment verification is recorded separately after publication.

## Final reliability pass

The full story test that also processes interface events reached the ending and saved a finished version-2 checkpoint in 599.03 simulated seconds, with 193 defeats and one recovery. The earlier route-only test measured 592.68 seconds with zero recoveries. These are different automated policies.

A long-run resource leak was found and fixed: actors now dispose their instantiated skeletons, animation groups and contact textures. Creating and disposing 100 creatures leaves the scene at exactly 2 skeletons, 47 textures and 48 animation groups before and after. Creature shaders are prepared under the loading screen before play. Camp difficulty changes were also checked to preserve a saved sector-2 checkpoint.

## Public deployment verified

Production URL: https://last-tether.vercel.app/

Vercel built Git commit 8b3aeb24903e2eb5139f05414660fb80bc9cefcb as deployment dpl_7zqe9gYXkkBR4Kg7eELjxKe6s7GD. An unauthenticated browser opened the public game, defeated the first three creatures with ordinary keyboard controls, advanced to the watchpost, paused, saved, reloaded and resumed the same objective. The development hook was absent. The bounded check recorded no page errors and no failed asset responses. This verifies the live opening and persistence; full-chapter traversal was checked locally against the same application source.

## Gorge and geometry update

The updated chapter completed the story/interface policy in 597.95 simulated seconds, with 193 defeats and one recovery. The completed scene retained only 2 skeletons, 41 textures and 48 animation groups. A separate check rebuilt four sectors and confirmed that all 71 imported source meshes retained identical position/index fingerprints. This guards against the shared-index corruption found during the art pass.

The 0.2.1 compiled preview also passed the ordinary-keyboard opening, three defeats, watchpost progression, pause and save/reload/resume check with no page errors or failed requests. `npm run verify:assets` checked all 78 downloaded files against their recorded sizes and SHA-256 hashes.

Public 0.2.1 verification: deployment `dpl_EVLdipSPTZng4pZ42RAMTGNXc965`, application commit `4d07729aebef9a42845c5ce104a7373c159ee70a`, reached READY and served the public alias. The ordinary-keyboard opening check again passed with three defeats, zero recoveries, watchpost progression, pause and save/reload/resume. No page errors or failed requests were recorded, and the development hook was absent.

## Combat timing and grounded detail — 0.2.2

Seventeen behaviour tests pass, including delayed melee contact, single damage per swing, dodge cancellation, retained inputs through impact pause, queued attacks, melee/throw priority and collision-respecting approach. A native-input browser trace recorded first damage at slash frame 23.62, 34 damage total, the completed recovery and a visible spear-following trail. Staged pose images inspect geometry and animation; they are not playthrough evidence.

The final accelerated Havok story/interface route completed all eight sectors and 32 objectives in **675.35 simulated seconds (11m15s), 193 defeats and one recovery**, displayed the ending and saved a finished checkpoint. It retained 2 skeletons, 43 textures (including two new persistent cloak textures) and 48 animation groups. A separate check validated floor contact for 128 nearby foliage bases in three sectors.

The ordinary-keyboard production check initially exposed repeated short swings against creatures outside spear reach. A small collision-tested approach step resolved that case; the opening then passed with three defeats, zero recoveries, watchpost progression, pause and save/resume. The check now waits for the visible defeat count within a bounded deadline instead of assuming combat always takes 6.5 seconds.

Final short Balanced frame samples at 1036 × 703 reported 63.9, 56.1 and 60.7 engine FPS in sectors 0, 3 and 6; p95 frame intervals were 18.4, 18.3 and 18.4 ms. These are four-second stationary-player samples, not sustained whole-chapter performance. Human enjoyment, first-time pacing and the requested top-tier visual quality remain open.

Public 0.2.2 verification: application commit `d29d6ceaea5400639b5af2ebe0816a08d5cc4185`, Vercel deployment `dpl_ATq1DyhhfKLRBqYSQRpHvM3j7jg8`, reached READY. The public ordinary-keyboard opening passed with three defeats, zero recoveries, watchpost progression, pause and save/reload/resume, no development hook, no page errors and no failed asset responses.

## Structure and landmark pass — 0.2.3

Eighteen behaviour and geometry tests and the TypeScript/Vite build pass. The geometry test checks outward normals and non-degenerate faces for 57 arch-stone variants. All 71 imported source meshes retain unchanged geometry across four sector rebuilds. The updated vegetation check covers 128 plants, allowing deliberate partial burial of bush bounds; rendered opening and sector views were also inspected.

The full input-driven Havok story run reached the ending in **683.77 simulated seconds (11m24s), 193 defeats and zero recoveries**. The observer timed out while awaiting the result. The original CLI process was then confirmed absent, and the existing browser was inspected: sector 7 / objective 3 was finished, the ending was visible, and the finished checkpoint was saved. The chapter was not restarted to recover this evidence. The completed scene retained 2 skeletons, 45 textures (two new persistent surface/water textures) and 48 animation groups.

The compiled ordinary-keyboard opening passed three defeats, watchpost progression, pause and save/reload/resume with no page errors, failed requests or development hook. Final four-second Balanced samples at 1036 × 703 reported 50.3, 46.5 and 62.5 engine FPS in sectors 0, 3 and 6, with p95 frame intervals 24.3, 24.4 and 24.3 ms. Separate early screenshot captures reported approximately 26–33 FPS; these warm short samples do not establish cold-load or sustained whole-chapter performance.

The requested top-tier visual bar, human enjoyment and first-time 15–20-minute duration remain unverified. The new landmarks and structural detail are an incremental art pass, not evidence of parity with leading commercial games.

### Normal-speed full chapter audit

The unaccelerated application loop completed the chapter in **677.36 seconds wall time (11m17s)** and 667.88 game seconds (11m08s), with **193 defeats and one recovery**. All 32 objectives, the visible ending and a finished checkpoint were recorded. The browser remained visible throughout. The scene ended at 2 skeletons, 45 textures and 48 animation groups. Source SHA-256 values were unchanged throughout the run and are included in `verification/structures-0.2.3.json`.

Across 37,766 frames, the run averaged **55.76 FPS**, with median **17.2 ms**, p95 **23.3 ms** and **50 frames over 50 ms**. Each of the seven area rebuilds caused a long frame, ranging from **0.96 to 1.33 seconds**. These transition stalls are unresolved; the average must not be presented as uniformly smooth play. Conditions: desktop Chrome/WebGL2, AMD Radeon integrated graphics, Balanced, 1036 × 703, Explorer difficulty. Loading before the input driver started is excluded.

The development-only policy uses normal input intent with actual Havok movement and the ordinary rendering/interface loop. It knows enemy state, the route and puzzle solutions. It does not teleport, grant health or speed up simulation. This is stronger mechanical and performance evidence than accelerated traversal, but is still not a first-time human playtest.

Public 0.2.3 verification: application commit `8e46dcc5dc2ae53a105443ec2cb97d8710b49dfa`, Vercel deployment `dpl_CKmNfqgQU6qky2o91EgD1fZih16w`, reached READY. The public ordinary-keyboard opening passed three defeats, zero recoveries, watchpost progression, pause and save/reload/resume. The development hook was absent, with no page errors or failed asset responses in this bounded check.

## Responsive area transitions — 0.2.4

Eighteen unit/geometry checks and the TypeScript/Vite build pass. All seven area changes were exercised through the asynchronous application path. Each kept position, health and game time fixed during loading; pausing during a transition remained in effect after loading. Each rebuilt 52–78 Havok bodies as appropriate and retained 2 skeletons and 48 animation groups. Transition wall times were **1.89–2.39 seconds**, with **133–182 ms maximum animation-frame intervals** and p95 intervals of 18.3–30.3 ms. These staged transitions are not a second full normal-speed chapter run. The earlier 0.2.3 audit remains separate.

The accelerated input-driven Havok chapter reached its ending and saved a finished checkpoint in **683.77 simulated seconds**, with **193 defeats and zero recoveries**. Its observer timed out; the original CLI process was confirmed absent and the existing completed browser/checkpoint was recovered, without starting another run. The scene ended with 2 skeletons, 45 textures and 48 animation groups. All 71 imported source meshes retained their geometry over four rebuilds.

The compiled opening passed ordinary keyboard movement/combat, three defeats, watchpost progression, pause and save/reload/resume. Both new-game and resume transitions completed. No development hook, page errors or failed asset responses were recorded. The transition screen was visually inspected. Full human pacing, enjoyment and the requested visual quality remain open.

Public 0.2.4 verification: application commit `18ffba1bcfa4d05123cb2ad9ab799253bd3d156b`, deployment `dpl_GE1Aw4iKxBP8ZYNGPoA1pSuLAdqe`, reached READY. The public game passed new-game and resume transitions, ordinary keyboard opening combat, three defeats, watchpost progression, pause and save/reload/resume. No development hook, page errors or failed asset responses were recorded.

## Surface and interaction detail — 0.2.5

Eighteen unit/geometry checks and the TypeScript/Vite build pass. The full accelerated Havok story/interface route completed **683.77 simulated seconds**, **193 defeats**, **zero recoveries**, all 32 objectives, a visible ending and a finished checkpoint. The scene retained 2 skeletons, 45 textures and 48 animation groups. All 71 imported meshes retained their geometry over four rebuilds. The planting check passed for 125 nearby plants; three overlapping bushes were deliberately removed from cache clearances.

A staged cache check used ordinary E input to collect a memory: the flask count changed from 1 to 2, the lid opened to approximately 1.15 radians, the glimmer disappeared, and save/resume restored the open state. Both authored lid meshes remain attached to the hinge. A camera-inside-foliage check verified fade and restoration. The opening, closed/open chest and three area views were visually inspected. A shader variable error found during development was corrected before these browser checks; TypeScript compilation alone would not have caught it.

Four-second Balanced samples during the art pass, at 1036 × 703, reported 49.2, 56.8 and 66.8 engine FPS in sectors 0, 3 and 6; p95 frame intervals were 24.4, 24.3 and 24.2 ms. These precede the final lower lamp intensity and garden-channel cosmetic adjustment and do not establish sustained chapter performance.

The final compiled opening passed ordinary movement/combat, three defeats, watchpost progression, pause and save/reload/resume. No development hook, page errors or failed responses were recorded. The requested modern-game visual bar, human enjoyment and first-time duration remain open.

Public 0.2.5 verification: application commit `5024ba75c5c725de25063079b38f0e338feb7067`, Vercel deployment `dpl_4Pup6a9JdoF421pQm8CpWFb2rDz3`, reached READY. The public ordinary-keyboard opening passed three defeats, watchpost progression, pause, new-game/resume transitions and save/reload/resume, with no development hook, page errors or failed responses.

## Canyon environment — 0.2.6

19 unit checks, 79 asset hashes/lengths and the production build pass. The accelerated input-driven route completes all 32 objectives in 683.77 simulated seconds, with 193 defeats, zero recoveries, visible ending and finished save. It retains 2 skeletons and 48 animation groups. Four rebuilds leave all 72 source meshes unchanged; 125 nearby plants remain grounded.

All eight areas pass conservative scanned-rock clearance checks (16 rocks and 15,648 sampled positions per area; minimum sampled horizontal route distance 5.43 m). Terrain tests keep sampled walkable floors and crossings clear. Seven area transitions preserve the held clock/input and pause state, with 2.05–2.32 s total loads, largest frame interval 133.5–157.7 ms, and no browser errors.

Three short stationary Balanced samples at 1036×703 measured engine FPS readings of 48.7, 49.1 and 52.5; 95th-percentile frame intervals were 24.3–24.4 ms. These are local samples, not a sustained 60 FPS or combat benchmark. Ordinary production keyboard input passes three defeats, watchpost progression, pause and save/reload/resume, with no debug hook, browser errors or failed responses. Visuals were inspected at the storm road, reservoir and hanging forest. Evidence: `verification/geology-0.2.6.json`.

Public 0.2.6 verification: application commit `2a33db1c92f02a09f554ba3099f2bf1f0293ddce`, Vercel deployment `dpl_D69D9RYYzyb9ZBFdF9PbAqsXe1so`, reached READY and was aliased to last-tether.vercel.app. Public keyboard combat, watchpost progression, pause and save/reload/resume passed with no development hook, browser errors or failed responses.

## Character presentation — 0.2.7

19 unit checks and the production build pass. Browser inspection verifies 15 imported hero meshes retain their source positions, UVs, joint indices and skin weights, with finite unit normals. Native held attack input samples all three combo poses and returns cleanly to idle; the overlapping box pack is absent. Staged camera checks measure 7.8 m during exploration and 10 m with three nearby enemies. No page or console errors were captured. Front/back close-ups and three frozen contact poses were visually inspected.

Four area rebuilds leave the positions, indices, normals and weights of all 72 source meshes unchanged. Seven transitions preserve held game time and pause state, taking 2.01–3.20 s with maximum frame intervals of 133–188 ms and no browser errors. Three short Balanced stationary samples at 1036×703 report end-window engine FPS readings of 46.9, 41.7 and 43.0, with 95th-percentile frame intervals of 24.3–30.3 ms; these samples do not establish sustained 60 FPS. Ordinary production keyboard input passes the first three defeats, watchpost progression, pause and save/reload/resume with no debug hook or failed responses. Evidence: `verification/character-0.2.7.json`. The 0.2.6 full rendered route remains the latest full-chapter browser timing evidence; gameplay rules were not changed in this pass.

Public 0.2.7 verification: application commit `34a01f97d08939b267a20deb939bb46f4442a1b7`, Vercel deployment `dpl_5je2Pz1wgN2wdXdqM7AejZNjLCFV`, reached READY. Public keyboard combat, watchpost progression, pause and save/reload/resume passed with no debug hook, browser errors or failed responses.

## Pressure-channel sequence — 0.2.8

23 unit checks and the production build pass. New checks cover warning/active timing, clear lane floor coverage, active-lane damage, dodge immunity, valve-save persistence, and damage-free clear-lane traversal from four starting phases. A normal-speed Havok run from the staged turbine checkpoint crossed the banks at 10.88 game seconds and closed the valve at 15.08 game seconds / 17.47 wall seconds (including loading), with 100 health, two defeats and zero recoveries. This run used Hunter difficulty and a route-aware input policy.

A separate production build test starts from a prepared checkpoint, then uses ordinary mouse/keyboard controls to run and dodge the lanes, grapple the spill, defeat the two flyers with returning spears, and turn the valve. It reaches Release the crown lock with zero recoveries, no development hook, no browser errors and no failed responses. Rebuild checks confirm three steam systems/materials in the turbine area and zero after leaving; pause freezes particle updates and a restored secured checkpoint keeps all banks off.

The accelerated full rendered chapter run completes all 32 objectives, the guardian and escape in 688.62 simulated seconds, with 188 defeats, two recoveries in the quarry, a visible ending and a finished save. It retains 2 skeletons, 45 textures and 48 animation groups at the end. A six-second stationary Balanced sample viewing the active pressure scene at 1036×703 averaged 44.3 browser frames/s, with 30.3 ms at the 95th percentile and a 36.4 ms maximum. This does not establish sustained combat performance. Evidence: `verification/pressure-0.2.8.json`.
