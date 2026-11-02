# Last Tether — active checkpoint

User resumed work. Goal active. **0.2.29 is published and verified** at https://last-tether.vercel.app/. App commit 89e0f987e4befad1a85ad90e07adf8bcc16d8282; READY deployment dpl_C1vRr8eQGDpozNcEmxPmVGdV1KR1; alias bundle index-DNfABdAl.js. A documentation-only follow-up records live evidence.

## Silkspitter release

The spitter now uses Daniel Gruginski's CC0 Spider from Insectoids, pinned commit 3f9939fd57c977934b9a5e0dc5a954ad765cf15f. 5,012 triangles, 58 joints, ten source clips, 2,727,320-byte prepared GLB. Source licence retained; manifest verifies 93 files. tools/prepare-silkspitter.mjs checks source hashes, embeds colour and converts smoothness alpha into glTF roughness. Details and AI-production disclosure: docs/creatures/silkspitter.md. No paid generation or new dependency.

Native Walk, Hit, WebSpit and Death replace generic frog clips; curled death retains model volume. Generic palette shader bypassed. Neutral height/body collider 1.45; release socket .62 forward/2.345 up; impact height .95. Native WebSpit source contact .67 seconds aligns with .85 gameplay wind-up; recovery 1.6. UI names SILKSPITTER and credits creator. Existing encounter kind/save identity retained. Preserve existing recoil, rig pooling, native physics clock and supported spear thrust.

## Verification

58 tests, build and 93 asset hashes pass. Four-facing native release: three shots after 51 steps, socket error below .00066 units, zero pause drift, native Hit/Death, body height 1.45. Real F-key controlled-spider combo reaches 852 from 1,000 health at 1.3167 seconds, thrust phase .545977. Native interruption cancels volley; pooled rig stops, parks and reuses cleanly with native Idle, reset reaction/scale and retained textures.

Full native route: 729.3167 simulated seconds, 188 defeats, zero recoveries, all 32 objectives, valid saved/visible ending, zero pool misses, forty rigs created/disposed, no page errors. Accelerated and route-informed; not first-time pacing.

Final 1.45-scale visual gallery rerun after resume: output/spider-native-final.txt, six spider-game screenshots. Idle, warning/release and curled death inspected in gameplay view. Initial output/spider-native.txt is the older 1.1-scale probe; do not confuse it with final results. Compiled ordinary keyboard/pause/save/reload passes with no debug hook/errors/failed responses. Bounded 15.44-second sample: 75.05 FPS average, p95 18.3 ms.

Pre-pause normal-speed 35.0576-second combat profile reached the watchpost with spitter present, four kills, mean frame 29.07 ms, p95 59.2, maximum 447.9. Do not claim smoothness or attribute varied whole-game timing to the new asset. All evidence: verification/silkspitter-0.2.29.json.

## Next

Continue cohesive hero/creature art and remaining contact/frame-pacing weaknesses. Wasp from same pack is research-only because some preview poses disappeared; inspect animated bounds/pose before integration. Research files: research/creature-assets/fantasy-creatures. Do not rerun broad completed checks without relevant changes.

Overall goal unfinished: hero and other creatures still mixed/low-detail, occasional hitches, human enjoyment and first-time 15–20 minute pacing unverified. Fal approved US$5 pilot remains blocked by exhausted credits: do not generate/upload/retry/poll until user confirms credits. No Supabase/cloud integration. No subagents. Main auto-deploys; no duplicate manual deployment.

At resume, local servers/browser were absent and were restarted: dev4173, preview4174, owned tether-release Chrome using research/qa-release.config.json (--mute-audio). Leave unrelated browser/audio/GPU settings alone.

Public keyboard combat/pause/save/reload passes with correct 0.2.29 footer, no debug hook/errors/failed responses. Public model byte-equals tested local model. Bounded 69.95 FPS average / p95 18.3 ms over 17.91 seconds; not a whole-chapter claim. All final visual/compiled/public checks are terminal. Owned silent browser is paused on the public game.
