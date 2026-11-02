# Last Tether — active checkpoint

User resumed; goal remains active. Version 0.2.30 is locally validated and ready for Git-connected production deployment. Public was 0.2.29 at last verification.

## This release

Stormwing replaces the Dragon with Daniel Gruginski's CC0 Insectoids Wasp. 4,280 triangles, 44 joints, eight clips, embedded PBR body and translucent wing textures. Prepared asset 1,925,608 bytes. Native Dive/Hit/Death share the gameplay clock. Body translation is controller-owned; 708-frame sampled mesh bounds keep wings visible. Folded death has a measured foot-clearance correction, preserving volume.

Flight, tether and recoil now go through native Havok; alive zero-gravity capsule, falling scenery-only corpse, local obstacle probes and wall-impact stun. Recovery climbs smoothly rather than snapping home. Native support is confirmed near ground before corpse settlement. Details: docs/creatures/stormwing.md and ENGINEERING.md.

## Checks

62 tests, build and 94 asset hashes pass. Wall dive and recoil stop with one impact; no through-wall damage. Unforced death settles at floor + .02. Real incoming hit uses Kavi HitRecieve; keyboard R deals 48 with native Hit/recoil. Pause, interruption and pool reset pass. Final folded-pose clearance under .027 units across 11 phases. Full native route: 742.1833 simulated seconds, 188 defeats, zero recoveries, all 32 objectives, valid visible/saved ending, zero pool misses, 40 rigs created/disposed. Accelerated, route-informed; not first-time pacing.

Compiled ordinary controls/pause/save/reload pass with no debug hook/errors/failed requests. Bounded 15.64-second opening sample: 45.39 FPS, p95 30.3 ms. Consistent performance unresolved. Bundle index-CHLqMMis.js. Evidence: verification/stormwing-0.2.30.json.

## Next

Finish publishing this tested release and verify public alias/asset/ordinary input. Then address remaining hero/creature art and frame pacing/contact weaknesses. Whole goal unfinished: top-tier visual quality, human combat enjoyment and first-time 15–20 minute pacing unverified. Preserve supported thrust, directional impacts, rig pool, native fixed physics clock and bloom-only renderer.

Fal US$5 pilot remains blocked by exhausted credits: no generation/upload/retry/poll until user confirms credits. No new paid resources. No Supabase/cloud integration. No subagents. Main auto-deploys; do not create a duplicate manual deployment. Owned silent Playwright tether-release and local dev4173/preview4174 are running. Leave unrelated browser/audio/system settings alone.
