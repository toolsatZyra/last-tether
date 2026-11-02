# Last Tether — working checkpoint

Resumed at the user's request on 2 November 2026. The goal is active.

Version 0.2.22 adds cut-rock supports to four small storm-road landings, a damaged framed belfry roof, and two supported stationary grapple eyes. Existing licensed assets are reused. Shared source geometry is pristine, three opening rebuilds retain stable resource counts, and both Q-key crossings land cleanly with rope/eye alignment. The larger arena arcades remain after rejecting an overly stretched all-rock treatment.

45 tests and the production build pass. The full native-Havok route completes all 32 objectives with 188 defeats, zero recoveries, valid ending/save, and no page errors in 684.9833 simulated seconds. The compiled keyboard combat/pause/save/reload check passes. Its 13.672-second opening frame sample averages 67.36 FPS; this is not a whole-chapter guarantee. Details: VERIFICATION.md and verification/storm-road-0.2.22.json.

App commit 50edba455f9641b4a8b50a78cc01d09f690091d0 is published and verified: READY deployment dpl_8Pt6BjUTCNkAy83WqNa5irYfr4D2, public bundle index-D82ou0xn.js at https://last-tether.vercel.app/. Public keyboard combat/pause/save/reload passes without errors. Its bounded opening sample averages 63.63 FPS. A documentation-only followup records the evidence. Main auto-deploys; do not create duplicate manual deployments.

The larger goal remains open: cohesive hero/creature art, environment composition, sustained performance and first-time 15–20 minute pacing. The opening still reads as rectangular platforms; this pass is an incremental detail improvement, not closure of the visual-quality gate. No human enjoyment or first-play pacing validation.

The US$5 fal character pilot remains blocked by exhausted fal credits; no retry/upload/poll until the user confirms credits. Included reference artwork is not a 3D model.

Local dev 4173, preview 4174 and the silent playwright-cli tether-release session are available. Verify listeners before restarting. Keep testing silent. Local verification processes are terminal; no generation is running.

Next useful art investigation: weatheredStone in src/expedition/surfaces.ts projects only albedo grain, so tall masonry still looks flat. An existing licensed stone-normal.jpg is available. Inspect Babylon material hooks and integrate coherent normal detail only if the rendered result improves, then test shader compilation across the affected sectors and frame cost. Bigger route composition and actor-art gaps remain; avoid treating more small props as completion.
