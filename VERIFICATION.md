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

Public 0.2.8 verification: application commit `5c811d5bfbc45ab42a95658b590d3196b6c54e7d`, Vercel deployment `dpl_uSnZUxxaJ4Y6qpyWhBdTuwEPGeKW`, reached READY. The public prepared-checkpoint test completed the new sequence using ordinary mouse and keyboard input, recorded two defeats and zero recoveries, then saved/reloaded/resumed at Release the crown lock. No development hook, browser errors or failed responses were present.

## Rendering performance and preserved geometry — 0.2.9

Paired four-second stationary checkpoint samples on the same desktop Chrome/AMD integrated GPU at Balanced 1036×703 improved as follows: opening 51.7→69.7 FPS, forest 52.3→70.7 FPS, pressure approach 42.5→64.2 FPS, guardian 55.4→71.0 FPS. The pressure scene's draw calls fell from about 518 to 421. A separate same-scene camera-query comparison alternated unpartitioned and tiled terrain twice: 4.225/4.301 ms per query versus 0.821/0.704 ms. These are bounded measurements, not a whole-chapter or High-quality frame-rate guarantee. Raw results and methodology are retained in verification/rendering-0.2.9.json.

Across eight sectors, 1,920 reference camera rays (including misses) matched exactly; terrain positions and triangle membership remained unchanged and the visible terrain remained one draw. Four sector builds checked 764 instance/fade transforms with zero matrix error, shared geometry/materials and no mesh-count growth after returning to the opening. Every decorative turbine wheel now has two meshes instead of thirteen. All 72 imported source meshes retained their position/index/normal/skinning fingerprints across four rebuilds. The native chest/open/save/restore and plant fade/restore check passed. Rendered gardens, forest, quarry, turbines and guardian views were inspected.

All 23 behaviour tests and the compiled build pass. Seven async area-transition checks retain a frozen game clock, preserve pause state and report no browser errors; loading takes 1.93–3.55 seconds with a largest frame interval of 230.5 ms, so seamless transitions are not claimed. The compiled pressure sequence passed ordinary mouse/keyboard traversal, two defeats, valve completion, pause/save/reload/resume, with no developer hook, page errors or failed responses. Human pacing, enjoyment and top-tier art remain open.

Public 0.2.9 verification: application commit `ebfa632d888a9cdc533e84d261134e1cb6792650`, Vercel deployment `dpl_4z1VZZwBihAWRT9ytd2ffdwpcikH`, reached READY and served the public alias. The ordinary mouse/keyboard prepared-checkpoint test completed the pressure sequence with two defeats and zero recoveries, then saved/reloaded/resumed at Release the crown lock. No development hook, browser errors or failed responses were present.

## Quarry identity and close-up props — 0.2.10

All 23 behaviour tests, all 82 asset hashes and the production build pass. A browser check samples 1,515 crossing positions against 123 camera-solid quarry bounds; zero scenery obstructions remain after relocating a furnace brace. Charge fittings and labels disappear with an exploded root and return for the next encounter. Cycling quarry → opening → quarry → gardens → quarry retains 529 meshes, 49 textures, 106 materials, one stencil texture and one furnace plume. The plume stops advancing while paused. All 72 imported source meshes retain their geometry fingerprints.

The full accelerated rendered chapter completes all 32 objectives, guardian and escape in 681.72 simulated seconds, with 188 defeats, one quarry recovery, visible ending and finished save. It retains 2 skeletons, 49 textures and 48 animation groups. This route knows the encounters and is not first-time human pacing evidence. The compiled ordinary-input blasting-yard check records nine defeats, zero recoveries and advancement to Survive the furnace approach; pause/save/reload/resume succeeds with no developer hook, browser errors or failed responses.

Final close-combat Balanced samples at 1036×703 average 50.1, 51.5 and 52.5 FPS for the first three quarry encounters. The same harness against the published 0.2.9 source measured 48.0, 50.7 and 48.1 FPS. Earlier development samples varied from 55–58 FPS; no sustained 60 FPS claim follows from these short measurements. The final approach, blasting yard, furnace and ambush captures were inspected. Evidence: verification/quarry-0.2.10.json.

Public 0.2.10 verification: application commit `f475985d22c4c16fcbd03ab4fc56a5b106df2d29`, Vercel deployment `dpl_D62wv2CdMaFgMJAPcf2CD7LeLXFn`, reached READY and served the public alias. The ordinary-input prepared-checkpoint blasting-yard test recorded nine defeats, zero recoveries and advancement to Survive the furnace approach, then saved/reloaded/resumed that objective. No development hook, browser errors or failed responses were present.

## Creature pass — 0.2.11

- 25 behaviour/geometry tests pass, including finite camera sight lines, wide wings, camera overlap, objects behind the camera/player, and frame-rate-independent opacity.
- All six animated reference envelopes start at zero and reach their intended heights within 0.001 m. Twelve create/dispose checks keep 629 meshes, 2 skeletons, 48 animation groups, 44 textures and 103 materials unchanged. Flying contact shadow measured on floor 8 at y=8.045 with reduced opacity 0.310.
- 72 imported source geometry fingerprints unchanged through four area rebuilds.
- Accelerated rendered chapter: all 32 objectives, 188 defeats, one quarry recovery, finished checkpoint and ending visible; 681.72 simulated seconds. This is a knowledgeable policy run, not a first-time 15–20 minute result.
- Bounded four-second Balanced samples at 1036×703 after two seconds settling: opening 49.5 FPS / p95 30.3 ms; forest 49.2 / 24.4 ms; guardian 49.2 / 24.3 ms. These samples do not establish stable 60 FPS or sustained play.
- Close-up and normal gameplay camera images inspected. Creature silhouettes remain a material art limitation.
- Detailed evidence: verification/creatures-0.2.11.json. Production/public ordinary-input checks are recorded below when complete.

Production preview ordinary keyboard/mouse quarry check: nine defeats, zero recoveries, advanced to the furnace approach and restored that checkpoint after reload. No development hook, page errors or failed asset requests.

Public 0.2.11 deployment dpl_2utkhGutBWQL8Pr4FxbfHWkfd2xy is READY at last-tether.vercel.app (application commit f638408). The same ordinary-input quarry check passed live: nine defeats, zero recoveries, furnace approach checkpoint restored after reload, no development hook, no page errors or failed asset requests.

## Guardian replacement — 0.2.12

26 tests, 83 asset hashes and production build pass. Native PBR maps are present; wind-up changes the neck pose; exposed armour hides; phase three retains three plates. Three repeated create/dispose runs retain 629 meshes, 102 materials, 48 animation groups and two skeletons. A one-time EffectLayerMainRTT_prePassRTT allocation raises textures from 44 to 45; later iterations stay at 45. The sampled collapse body minimum is 0.021 m below the floor.

The accelerated rendered full route completes all 32 objectives, 188 defeats, one quarry recovery, the guardian and escape in 681.72 simulated seconds. Ordinary production keyboard controls traverse the approach and dodge a guardian charge with zero recoveries; the new model loads successfully and no page/asset errors occur. This is a bounded encounter check, not a native-input full boss victory.

Four-second Balanced samples at 1036×703 after two seconds settling: opening 42.1 FPS, forest 45.6, guardian 46.7; p95 30.5/36.1/30.3 ms. Performance remains below the target. Evidence: verification/guardian-0.2.12.json.

Public 0.2.12 deployment dpl_CnJ5J6BvTDtPQ8XHDRMkA3wL4Kwk is READY (application commit f81d561). Ordinary keyboard controls reached the guardian and exercised its charge with zero recoveries; the new GLB returned 200, no development hook was exposed, and no page or failed asset requests were observed. This remains a bounded encounter check.

## Static rendering cache — 0.2.13

26 tests, 83 asset hashes and production build pass. Nine repeated area rebuilds retain stable unique shadow lists; no character meshes enter the world cache. Nine area/quality combinations finish ready with cached PBR materials. Chest state, foliage fading and seven transitions pass. The fixed forest image has zero changed bytes across 2,913,232 pixel bytes with caching on/off; time-varying water and animation are excluded. Alternating short material-cache samples reduce measured render CPU work by roughly one millisecond, with variable overall FPS.

A normal-speed full rendered route at Balanced 1036×703 completed all 32 objectives, 188 defeats, zero recoveries, guardian and escape, visible ending and finished local checkpoint. Active play: 656.97 seconds; wall: 677.60 seconds. Average frame rate including loading: 51.40 FPS; median 18.4 ms, p95 24.2 ms. The seven largest intervals (2.27–3.01 seconds) are scene-render gaps across title/loading transitions, where game time is held. A 537 ms escape interval coincides with screenshot capture and remains in the totals. There were no browser errors or visibility changes. Final resources: two skeletons, 49 textures and 48 animation groups.

This uses an expert input policy at Explorer difficulty through the ordinary fixed-step/render loop, without health grants or teleportation. It is not first-time human pacing, a native-keyboard full playthrough, or sustained 60 FPS evidence. A separate compiled native keyboard/mouse check reached the guardian and exercised a charge with zero recoveries, asset HTTP 200 and no development hook/errors. Evidence: verification/render-cache-0.2.13.json and verification/render-cache-0.2.13-realtime.json.

Public 0.2.13 deployment dpl_7HN4gSjrrdPd6qGaChbTgk3WKzZo is READY (application commit ad2936c). The public alias serves the same index-DMA5fanh.js bundle as the verified local build. Ordinary keyboard/mouse guardian approach and charge check passed with zero recoveries, asset HTTP 200, no development hook, no browser errors and no failed responses.

## Creature motion continuity — 0.2.14

28 tests pass, including sideways player movement during a raptor tell/lunge and a flyer dive. A Babylon check covers all five smaller creature types moving, stopping and pausing: Idle → Run (or Flying_Idle → Fast_Flying) → Idle, with pause preserving motion selection. A staged raptor encounter runs through the native game/render loop: 105 sampled input frames, 29 lunge frames, zero direction or rendered-facing error, 100 remaining health after a sideways dodge, no browser errors.

The compiled opening uses ordinary keyboard controls to defeat three creatures, reach Take back the watchpost, pause, reload and resume the same checkpoint, with zero recoveries and no browser/asset errors or development hook. The 0.2.13 normal-speed full chapter remains the latest full rendered timing result; this change does not alter movement paths, damage or attack timing. Evidence: verification/creature-motion-0.2.14.json.

Public 0.2.14 deployment dpl_6JetN6xMyDaTvWri4LSdzCGvvA8Z is READY, serving the verified index-BTxe-3un.js bundle (application commit 1efd1d2). Native opening combat recorded three defeats, zero recoveries, correct watchpost advancement and pause/save/reload/resume, with no exposed development hook, browser errors or failed responses.

## Ground-creature physics and continuous tether — 0.2.15

34 tests pass. Native Havok checks cover movement, knockback and tether pulls against a solid wall for raptor/spitter/brute/bomber. Sixteen edge-lunge directions exercise eleven actual falls/deaths and five supported outcomes; clearing the roster leaves zero enemy controllers. Five area/retry cycles retain controller counts 0 → 1 → 0. A staged normal-loop ledge dodge leaves the hero at 100 health, the creature falling and target=null. The capture initially exceeded its 10-second observation timeout during slow frame scheduling; its existing run subsequently finished and was captured without restarting.

The final accelerated rendered route completes all 32 objectives, 188 defeats, zero recoveries, guardian, escape, visible ending and finished local save in 672.78 simulated seconds; no browser errors. Final resources are two skeletons, 49 textures and 48 animation groups.

Before the final continuous-tether/momentum correction, a normal-speed full route completed in 680.35 active seconds / 749.84 wall seconds with 188 defeats, zero recoveries and no page errors or visibility changes. Balanced rendering at 1036×703 averaged 45.43 FPS including loading and an unexplained sequence of approximately one-second frame gaps in area 6; median 19.6 ms, p95 27 ms. The seven area loading gaps were 2.11–3.60 seconds. That run is retained as a baseline, not a clean performance pass or timing proof for the final tether correction.

An alternating same-scene eight-creature test measured 0.50–0.55 ms per enemy-update call with native controllers versus 0.023–0.024 ms without. Native FPS was 36.1/37.2 versus 37.3/39.3 without; these stationary short samples do not explain the one-second stalls or establish sustained performance. See verification/ground-creatures-0.2.15.json and the realtime-baseline JSON. First-time 15–20 minute pacing, modern-game art parity and sustained 60 FPS remain unverified.

The initial headed production check timed out behind the loading cover. A separate page-level probe measured browser requestAnimationFrame at approximately one callback per second while document.visibilityState remained visible. The game was then tested in a fresh isolated headless Chrome session: ordinary movement, Q/F combat, three defeats, zero recoveries, watchpost advancement, pause, reload and same-checkpoint resume passed, with no development hook or browser/asset errors. This supports release behavior but does not explain the older session’s throttling or close sustained-performance validation.

Public 0.2.15 deployment dpl_8QaEw5Bv4bPZpsC74dh1GaZ8E6JU is READY (application commit 707de8b), and the public alias serves index-BNsvBG4r.js. Fresh isolated headless Chrome used ordinary keyboard movement, Q and F combat: three defeats, zero recoveries, watchpost advancement, pause, save/reload/resume, no exposed development hook, no page errors or failed responses. The controlled tether capture also verifies a visible line during intermediate motion and removal after release; its camera is staged for inspection.

## Hanging forest — 0.2.16

- 34 behaviour/geometry tests, 91 asset hashes and the TypeScript/Vite build pass. Asset manifest totals 32,614,861 bytes; previous README asset-size estimates understated the current total. Eight forest additions account for 2,229,643 bytes.
- Native Havok sweeps cross all three timber bridges, with maximum floor deviation 0.319 m. Rope handrails stop lateral movement at approximately 4.835 m from the centreline. There are 24 lower-trunk colliders; the tested trunk stops an approaching player.
- All three memory-cache approaches are traversable, interactions open the lid, stop the glimmer and restore a flask. All 247 foliage groups pass the obstruction-fade check. Alternating forest/opening rebuilds repeat the same mesh, texture, material and skeleton counts.
- Full accelerated input-driven route: **677.40 simulated seconds, 188 defeats, zero recoveries**, all 32 objectives, ending visible and finished checkpoint saved, no page errors. The first attempt stopped at a quarry crate across the departure line; the prop placement was corrected before this passing result.
- Final normal-speed forest trial: **78.30 game seconds / 88.60 wall seconds**, 25 defeats, zero recoveries, four objectives, no page errors, 656 saved ghost samples. Reload loads the existing faster 629-sample personal-best ghost.
- Final trial at Balanced 1036 × 703 in headless desktop Chrome: **44.45 average FPS**, median frame 18.6 ms, p95 28.8 ms, maximum 1,807.7 ms. Long stalls cluster near game second 62 with no recorded visibility change; cause remains unresolved. An earlier revision before removing decorative inlays measured 57.43 FPS and a 198.5 ms maximum. These are bounded automated runs, not sustained-performance guarantees.

Reproduction: tools/forest-physics-check.js, forest-detail-check.js, forest-realtime-start.js with realtime-status.js, forest-ghost-check.js, and story-ui-route.js. Captures forest-after.png and forest-crossing.png stage the player for art inspection. Machine-readable results: verification/forest-0.2.16.json.

Compiled preview checks passed with ordinary keyboard input: forest first encounter (two defeats, next objective and pause), plus story opening (three defeats, watchpost, pause/save/reload/resume). Neither exposed a development hook, page error or failed asset response.

Published commit b30fa662a3f447406de1ab89f8aebfe9d8e2b986 is READY as dpl_En7GczCckqMhLjxir2V58vndWwSd. The public alias serves index-CkUKeOEx.js. Live ordinary-keyboard forest entry, tether/combat (two defeats), next objective and pause pass without page errors, failed asset responses or a development hook. tools/forest-live-check.js reproduces that bounded check.
