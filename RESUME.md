# Last Tether — working checkpoint

Goal active. Published app remains 0.2.23 pending this release. Local 0.2.25 includes the complete 0.2.24 waterworks machinery pass plus the user's requested combat-impact revision. Waterworks commit aba5201 is local and not separately published.

Combat: directional player recoil, weight-sensitive ground enemy recoil through Havok, retained lethal momentum, immediate native hit reactions, 55/65/85 ms contact pauses, pooled contact flashes, direct directional camera impulse and differentiated opt-in sound. Buffered dodge escapes after 120 ms of recoil commitment. Static Havok queries block melee/lunge/projectile contacts through scenery. A reproduced waterworks prop stall is fixed with local ground-enemy sidesteps. See ENGINEERING.md for scope: capsule collision and authored animations, not articulated ragdolls or exact weapon-mesh sweeps.

53 tests/build pass. Native wall/recoil/ledge/projectile/lifecycle checks pass. Real incoming enemy hit plus ordinary keyboard dodge passes. Full native chapter: 722.1333 simulated seconds, all 32 objectives, 188 defeats, zero recoveries, valid ending/save, no page errors. A 90-second opening driver sample exercises 65 hit/6 hurt events and 20 defeats; average 55.46 FPS with p95 33.4 ms. It predates the final buffer/avoidance refinement. Performance remains variable and the first-time pacing/art/player-approved feel gates remain open.

Compiled keyboard combat/pause/save/resume passes with no debug hook, page errors or failed requests. The camp footer now derives its version from package.json. Final version-label build passes; bundle index-BELsr166.js. Main auto-deploys to https://last-tether.vercel.app/. Do not manually duplicate deployment. After push verify READY with matching commit/bundle, run the public keyboard check and save evidence.

Fal US$5 pilot remains blocked by exhausted credits: no retry until user confirms credits. No generation running. Keep all testing silent. The next priority after this verified release is frame pacing in active combat and the still-inconsistent hero/creature art; the user should be able to review the revised opening feel on the live build.
