# Last Tether — working checkpoint

Goal active. 0.2.28 is locally verified and being published through the GitHub-connected Vercel pipeline. Previous public 0.2.27 app commit c071b33dba6028280676bc8b61652a80a44e5b29; evidence commit 1cfb1c9. Verify new deployment SHA and public keyboard smoke check before calling this release published.

0.2.28 removes the duplicate GlowLayer and unnecessary canvas retained buffer/MSAA. Main pipeline bloom and FXAA remain; High retains pipeline MSAA4 and SSAO. No geometry, texture, shadow resolution or material reductions. Fixed opening ABBA: 406 versus 278 draw calls; GPU means both/pipeline/pipeline/both 18.46/13.14/14.14/16.49 ms. Contact-shadow materials were also feeding white emission to the extra glow, lightening the ground under actors; removal restores grounding. Canvas ABBA has matching visible detail but no meaningful speed difference.

58 tests/build pass; bundle index-Cu6lX-fk.js. All eight areas pass all three qualities (24 cases), AO/bloom/MSAA/context assertions, resizing and browser-error checks. Balanced/Low/High galleries inspected. The first sweep was interrupted by a package-version Vite reload; the clean repeat passed.

Normal-speed opening combat sample: 35.0035 seconds, seven defeats, mean frame 11.93 ms, p95 14.8, max 514.1. Zero active model creation. Compiled keyboard combat/pause/save/reload: three defeats, zero recoveries, no debug hook/errors/failed responses; bounded 78.56 FPS average, p95 18.3 ms. Host load varies; do not claim whole-game FPS improvement or smoothness from these samples.

Evidence: verification/render-passes-0.2.28.json. Reproduction: tools/render-quality-check.js, drawing-buffer-check.js, combat-frame-profile-start/status, thrust-production.js and combat-live-check.js. render-pass-ablation.js is explicitly historical and runs on c071b33 where gold-bloom exists. Screenshots/logs under ignored output/.

Preserve 0.2.25 directional Havok recoil, mass differences, lethal momentum, native contact reactions, contact flashes/camera impulse, scenery blocking and local pursuit avoidance. Preserve independently stepped Havok clock from 0.2.21, area-bounded actor pooling from 0.2.26, and supported two-handed thrust/shared contact clock from 0.2.27. Full native route last verified at 0.2.27: 749.1 simulated seconds, 188 defeats, zero recoveries, all 32 objectives, valid ending/save, zero pool misses. It is accelerated/route-informed, not human first-time pacing.

Quality goal remains open: mixed/low-detail hero and creature art, occasional frame hitches, human enjoyment and first-time 15–20 minute pacing are unverified. Next prioritize cohesive hero/creature art and remaining real contact/animation weaknesses. Do not keep repeating broad route tests without relevant changes.

Fal US$5 pilot remains blocked by exhausted credits: no generation/upload/retry/poll until user confirms credits. All tests are silent. No Supabase/cloud integration. No subagents. Main auto-deploys; no duplicate manual deployment. Owned Chrome session tether-release uses research/qa-release.config.json. Do not change unrelated user browser/audio/system GPU preferences.
