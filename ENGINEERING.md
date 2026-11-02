# Implementation and boundaries

Babylon.js 9.33.1 owns rendering, PBR materials, skeletal animation, asset import, particles, post-processing, cameras and the scene. Havok 1.3.14 and Babylon's PhysicsCharacterController own capsule sweeps, grounding, steps, slopes and sliding against solid scene meshes. No custom rendering or collision engine was built.

The application owns authored encounters, enemy decisions, combat timing, checkpoint rules and input intent. Pure simulation tests use a simplified authored floor query; browser route checks use the actual Havok world. Passing one is not evidence for the other.

Movement uses a fixed 60 Hz simulation, acceleration, jump buffering and coyote time. Edge inputs are retained when a render frame contains no simulation step. Animation uses Babylon's normal render loop and blended imported clips. Airborne posing and cloak motion add small authored offsets; this is not full-body inverse kinematics or cloth physics. The spear is attached to the wrist joint. The camera handles solid obstruction and fades foreground creatures/lamps that obscure the player; boss encounters pull it farther back.

Grapple traversal follows an assisted arc. Creature navigation uses authored bounds and steering, not a navigation mesh or dynamic rigid-body collision for every enemy. Environment columns, walls, ramps and floors provide Havok collision. Non-solid dressing is deliberately separated from that collision set.

Static meshes are batched by material, spatial cell and collision behaviour. Distance visibility, nearby shadow casters, reduced reflection refresh and cached foliage groups reduce draw work. Impacts use Babylon ParticleSystem batches instead of a separate mesh for every spark. High, Balanced and Low expose rendering tradeoffs; performance is measured, not inferred from nominal settings.

A previous frame-rate readout was invalid because rendering bypassed the engine's normal frame loop. That was corrected. Earlier constant-60 readings are discarded. Current verification records actual measured frame rates and notes shader warm-up stalls.

All game state is local. Profile readers bound and validate records before rendering them, including date strings, finite numbers, chronological ghost samples and supported sectors. Difficulty changes from camp preserve the existing checkpoint. Storage failures are reported without pretending a daily record was saved. Audio requires a user gesture and defaults off on reload.

The production bundle excludes the development hook. Vercel serves static files; it is not running a real-time game server. Static asset names use revalidation to avoid serving stale revisions. A one-time US$5 character pilot is authorized; its first generation was rejected for an empty fal balance. No paid subscription, generated output or paid backend has been added.

Sources: [Babylon capabilities](https://www.babylonjs.com/specifications/), [Babylon Havok character controller documentation](https://github.com/BabylonJS/Documentation/blob/master/content/features/featuresDeepDive/physics/v2/characterController.md). Installed package source was also inspected for the exact APIs in use.

Actor instances own and dispose their cloned skeletons and animation groups. Contact-shading textures are also explicitly disposed. Imported creature shaders are compiled during loading to reduce the first encounter hitch.

The gorge is a continuous heightfield built with Babylon ground geometry. Stone grain is projected in world space through the engine material extension so scaled arches keep a consistent texture size. Batching copies imported geometry before disposing source instances; 71 source meshes retain identical position/index fingerprints across four rebuilt sectors. Collision data is validated before Havok receives it. Rain and ambient motes use particle systems.

Version 0.2.2 maps melee and roll poses to elapsed gameplay time with Babylon AnimationGroup.goToFrame. Damage resolves near frame 24 of the 62-frame imported slash, after anticipation; dodge and incoming hurt can cancel an unfinished swing. A short melee closing step uses the existing Havok movement sweep and requires a supported floor ahead. The impact pause retains discrete input presses and advances the run clock. A single Babylon TrailMesh follows the spear tip, replacing detached per-attack arcs. Cloak folds use 117 animated vertices and an original woven/stitch texture; this remains authored deformation, not cloth simulation. Foliage pivots and terrace bounds were corrected, with 128 nearby foliage bases checked against their floors.

Version 0.2.3 adds original masonry arcades, piers, cornices and bridge sidewalls beneath the route. These use Babylon meshes and share batched materials. The walking decks retain Havok collision; inaccessible structural dressing provides camera obstruction. The bell tower and reservoir give the first and third sectors distinct silhouettes. Spillway water uses scrolling translucent ribbons, not a fluid simulation. Reflections now include the sky and major stone/metal structures. Larger bank trees distinguish the hanging forest. Bush models are partially planted into the floor because their visible alpha-cutout foliage did not match their bounding-box bottoms.

The normal-speed chapter audit installs an input callback only in Vite development mode. It follows the regular frame loop, fixed-step simulation, Havok movement, scene transitions and interface event handling. It does not grant health, teleport or accelerate time. Its policy knows the route, enemy state and puzzle solution, so its completion time is not a first-time-player estimate. The callback setter and developer object are excluded from the compiled production build.

Version 0.2.4 shares generator-based construction between synchronous developer checks and asynchronous player transitions. Mesh disposal, scenery creation, batching, Havok aggregates and material readiness yield to the browser between short batches. The title cover is painted before work begins. Simulation, input intent and the game clock stop until construction and the first render finish; an existing pause is preserved. Initial visibility and shadow distance filtering now run before the first render. Shader readiness remains Babylon-owned. The measured final render can still block for 133–182 ms behind the cover; this is a bounded improvement, not asynchronous GPU rendering or seamless world streaming.

Version 0.2.5 adds an original framed-lantern mesh, merged into one opaque frame and one luminous core per lamp. Two persistent Babylon PointLights illuminate the nearest lamps; the lights do not cast additional shadows. Paving uses the existing licensed surface maps plus world-space joints, color variation, moss and damp roughness through PBRCustomMaterial. Garden channels use bordered PBR water surfaces with environment lighting, not a new water simulation.

The existing CC0 chest asset now represents routefinder memories. Its authored top meshes rotate around a back-edge hinge, the glimmer disappears on collection, and saved secret IDs restore the open lid. Nearby planting was moved or omitted to leave the caches clear. Cached foliage bounds drive temporary foreground visibility fades, without modifying shared materials.

## Canyon scenery — 0.2.6

The route-aware landscape has area-specific height, moss and ochre profiles. Terrain remains below the sampled playable floors. Sixteen solid scanned rock masses per area are pushed outside a clearance corridor, with their bases below the river. They block the camera but are scenery, not additional walkable Havok bodies. `tools/geology-check.js` samples their conservative world bounds across all eight areas.

Boulder 01 by Rico Cilliers / Poly Haven (CC0) is processed by `node tools/prepare-geology.mjs`. glTF Transform and Meshoptimizer reduce its 66,122 triangles to 16,530 using normal/UV-aware permissive collapse. Its original 1K maps remain embedded unchanged in a 3,440,296-byte GLB. Source hashes, license and modifications are recorded in the manifest. These packages run offline during asset preparation, not in the game. The earlier open rock-face experiment is excluded from runtime assets.

## Character finish and framing — 0.2.7

`character-finish.ts` changes only selected vertex normals on private mesh geometry. Position, UV, joint-index and skin-weight arrays stay unchanged; smoothing groups require matching bind positions and skin weights and retain corners sharper than roughly 57 degrees. Hero cloth uses a bind-position material pattern, so its wear follows the animated mesh. Colors are converted to linear space and metal, skin, hair and cloth keep separate roughness. The duplicate procedural pack was removed in favour of the original modeled pack.

The existing Sword_Slash animation keeps its damage/contact timing. Small torso and right-arm offsets distinguish the second strike and the finishing wind-up; each frame restores the underlying pose before applying the next accent, including while paused. Turning lean is limited to 0.12 radians. Exploration camera distance is 7.8 m, increasing to 8.8 m for a nearby enemy and 10 m for a group. Guardian and grapple distances retain their previous values; camera collision remains active. This is presentation work; it does not replace Havok or add a new animation engine.

## Pressure-channel traversal — 0.2.8

The second turbine-gallery objective replaces a repeated mixed wave with three alternating steam banks, two flyers on the far landing, and a shutdown valve. `pressure.ts` supplies the same authored lane bounds and phase function to damage logic and rendering. Each bank follows a 3.6 s cycle with a 0.75 s warning and 1 s active burst, offset by 0.8 s between banks. One side of each crossing remains clear. The lane test includes capsule clearance and a vertical bound; dodge immunity uses the existing combat protection.

`PressureGallery` builds pipes, grates, warning stripes, gauges and signal lamps. Babylon particle systems render the steam; they are visual effects, not fluid simulation. Static machinery participates in the existing batching/collision pipeline, while gauge hands, lamps and emitter meshes remain separate. Three particle systems and three signal materials are explicitly disposed when leaving or rebuilding the area. The objective checkpoint controls shutdown, so existing v2 saves need no schema change. Generic hazard timers now reset on checkpoint completion, retry and area load.

## Rendering and exact camera queries — 0.2.9

The visible canyon retains its original 64,800 triangles, vertices, normals and UVs in one draw. A hidden, geometry-sharing query mesh groups the same triangles into 36 submeshes indexed by Babylon's native octree. Camera rays use that query mesh; it is excluded from static batching, shadows, reflections and Havok bodies. This preserves exact surface collision rather than approximating the landscape with a box. Terrain tests compare original triangle membership and positions, then check hits, misses and distances against an unpartitioned reference in all eight sectors.

Foliage explicitly enables AssetContainer instancing. Since Babylon instance visibility is source-shared, an obstructing plant temporarily hides its instances and displays lazy geometry-sharing fade clones at the same transforms. Inactive fade clones remain hidden and are disposed with their area. Rotating turbine spokes are merged per wheel while retaining the rim's separate material and the wheel parent's motion. No detail or render-resolution reduction is part of this pass.

## Quarry composition and interactive prop detail — 0.2.10

The quarry replaces repeated shrine statues, circular inlays, simple gantries and ornamental terrace arcades with stepped extraction benches, cut marks, a braced timber derrick, pulley/rope/load assembly, a furnace and rail fittings. The original walkable deck and road geometry remain; peripheral stone stacks use Havok collision. New scenery above the deck is checked against the central crossing corridor, with the furnace relocated after a brace failed that check. The crane is static scenery, not a simulated lifting mechanism. The furnace plume uses one native 64-particle system with shared texture, pauses with the scene and disposes on area exit.

Blasting charges retain the existing attack-triggered damage behaviour. Their metal fittings are merged, labels share one stencil texture, and all children remain attached to the interactive root rather than entering static scenery batches. Hiding an exploded charge hides its complete assembly; a fresh encounter restores it. Rob Tuytel's CC0 timber diffuse/normal/roughness maps are stored unchanged with source hashes and license evidence.

## Creature alignment and visibility — 0.2.11

Imported enemies are normalized from their neutral animation instead of the unposed export hierarchy. Flying neutral clips are sampled at 12 points to include the flapping envelope; ground creatures use the first idle pose. Cached per-container bounds and an instance-root offset preserve source geometry, bone weights and authored animation data. The guardian's prior visible body started roughly 3.7 metres above its gameplay origin at the measured frame; the corrected neutral envelope spans zero to the intended eight metres. This is reference-pose alignment, not foot IK or per-bone hit detection. Ground running clips can still dip 6–15 cm below the reference floor.

Camera fades use the transformed full reference envelope and opposing native Babylon rays to bound the camera-to-player sight segment. Opacity fades out faster than it returns and is independent of frame rate. Floor contact shadows are placed using the chapter surface and weakened with altitude; gaps suppress the contact plane. Fine creature colour/roughness patterns use bind-space coordinates so they follow the skeleton, with derivative fading on high-frequency detail. No new assets or engine dependencies were added. The underlying cartoon silhouettes remain an art-quality limitation.

## Textured guardian — 0.2.12

The guardian now uses Bake3D's CC BY 4.0 T. rex with source colour, normal and metallic/roughness textures. tools/prepare-guardian.mjs fetches a hash-pinned source if needed and reproduces the 53,924-triangle / 78,129-vertex / 6,591,912-byte asset (original 150,000 triangles). All 36 joints and four source clips remain. The actor is 5.6 m high with the model shifted two source units back to bring its head toward the existing charge-contact region. The camera is closer and lower for this body shape.

GuardianMotion layers authored neck/head/jaw accents after Babylon skeletal animation, restores bases before the next evaluation, uses the native Walk clip for charges, and rolls the body over during defeat. This is not a physical ragdoll or a new motion-capture library. Five UV-textured plates follow spine joints, hide during exposure, and reduce with phase. Charge facing now stays with its committed direction instead of tracking the player during movement. Source and modification attribution appear in game credits, the asset manifest and Bake3D.txt.

## Static material readiness and shadow ownership — 0.2.13

Static environment PBR materials use Babylon's native freeze() after scene preparation. Rebuilding an area unfreezes and clears the old set. Changing quality unfreezes the current set, then waits for two ready rendered frames before caching it again. Animated actor materials, WaterMaterial and StandardMaterial are excluded. Lighting and uniform updates remain active; this caches shader readiness rather than freezing the scene.

The world shadow cache contains only descendants of the current area root. The active shadow list is deduplicated and excludes disabled/disposed/empty meshes before adding current characters. Previously every rebuild carried another copy of hero meshes into the world cache. Babylon already suppresses duplicate GPU draws, so this correction bounds list growth and traversal; it is not a draw-call reduction.

## Creature motion continuity — 0.2.14

Raptors retain their captured facing through anticipation and the lunge. Flyers can track during anticipation, then retain their release direction during the dive. Guardian facing rules remain unchanged. Movement, attack range, damage and timing are unchanged.

Actor locomotion reads actual horizontal displacement between view updates, with exponential smoothing and a bounded rate. Stationary creatures use their idle clip; moving spitters now use their native Run instead of sliding in Idle. Ground gait playback scales with measured movement. Paused frames preserve the speed estimate and animation selection. This improves movement/pose correspondence but does not provide foot IK, root-motion attacks or replace the underlying character art.

## Ground-creature collision and continuous tether — 0.2.15

Raptors, spitters, brutes and bombers now use Babylon/Havok character controllers for scenery sweeps, support and gravity. Controllers are created lazily and disposed on death, retry and area rebuild. The guardian retains its bounded charge/support mechanic; flyers retain airborne steering. This is capsule collision, not crowd navigation or ragdoll physics.

Ground knockback is a decaying velocity, with momentum transferred once when support is lost. Unsupported creatures fall, can land on a lower surface and recover, or count as defeated after dropping 18 metres below their last support. Falling creatures use the imported Jump_Idle clip and are excluded from tether targeting.

Combat tethering captures a destination and pulls over 0.3 seconds, displaying the line while it travels. Ground pulls use the same Havok sweep and stop at solid geometry; they never teleport at completion. Flyers move continuously but remain outside ground-capsule collision. A living pulled creature is stunned for 0.65 seconds; a lethal tether hit cannot revive it. Existing guardian armour interaction is retained.

## Hanging forest — 0.2.16

The forest now uses Quaternius maple trees and grass, original bark/normal textures, scanned Rock_Mass foundations, authored root curves and native Babylon timber/rope geometry. Bark maps are resized to at most 1024 pixels; tools/prepare-forest.mjs reproduces the eight additions from pinned sources and records hashes. The additions total 2,229,643 bytes. Sharp is pinned as a direct development dependency.

Tree placement keeps trunks away from route centrelines and memory-cache approaches. Hidden collision meshes copy the lower imported bark triangles in world space; they do not mutate shared geometry. Planks, rope rails and posts participate in Havok collision. Root curves and the below-deck rock shells are scenery. Forest-specific materials are created once and reused across area rebuilds. Existing foreground foliage fading remains active.

A full-route regression exposed a quarry crate positioned across the arena exit. Crates and accompanying barrels now sit nearer the side-centre, keeping the diagonal departure clear. This corrects prop placement; it does not add obstacle-avoiding AI.

## Expired creature resources — 0.2.17

The scene now reconciles actor visuals against creatures with positive health or a positive death-animation timer. Expired defeat records stay in the game state, but their model instances, skeletons, animation groups, contact textures and pose callbacks are disposed. Subsequent updates do not instantiate them again. This preserves the normal 1.4-second disappearance and 2.4-second guardian collapse. The final still-visible death animation remains at the frozen ending.

The lifetime regression uses four cycles of all six creature kinds in the same area. Babylon defers Observable removal to a later task, so the check yields before counting callbacks. It requires the same baseline mesh, texture, skeleton, animation-group and callback counts after every cycle.

Performance diagnostics now enter through the real sky-route loading screen. The earlier synchronous developer-start path skipped area preparation and included first-frame setup work. tools/frame-cost-start.js and frame-cost-status.js separate render, simulation, camera-query and between-frame time; render-cost-check.js uses native Babylon SceneInstrumentation, and render-cpu-profile.js uses Chrome's profiler. These diagnostic timings are not a controlled speedup benchmark.

## Detached boot pose correction — 0.2.18

The current hero export animates Foot.L/R under Root, outside the UpperLeg/LowerLeg chains. Added leg rotations therefore stretched the skinned boots toward their old positions. FootPose captures each boot relative to its lower leg before the additional pose, uses Babylon matrix composition/decomposition to carry it afterward, and restores the original local position/quaternion before the next frame. The source hierarchy, animation tracks, vertex positions and skin weights remain intact. This is a rig-specific attachment correction, not a custom IK solver; a future character whose feet already descend from its legs must not receive this adapter. The new original Kavi reference and exact prompt are in docs/character-pilot. It is not yet a 3D asset.

## Quarry crane trap — 0.2.19

crane.ts shares the load/lever positions, 0.5-second warning, 0.64-second fall and 5.2-unit impact radius between the game state and scene. A nearby grounded E press releases it once. At impact, the damage check runs once, respects height and player invulnerability, and can trigger the charge beneath the load. Checkpoint retries rearm the unsecured first yard; later checkpoints show spent rubble. The existing save format remains unchanged.

The load, ropes, lever, warning ring and shallow rubble are excluded from static mesh batches. Their transforms derive from game time, so pause freezes the mechanism. The authored falling pose is not a new rigid-body simulation. Camera distance and target height blend with proximity to the load; yaw remains under player control. Existing native Havok movement, Babylon particle effects and licensed audio samples are retained.

## Encounter boundary presentation — 0.2.20

The apparent horizontal cyan fog band was the old 44×6 translucent route-seal box. Water/fog/sky isolation and a gate-hidden capture identified it; no water or atmospheric tuning was required. EncounterGate replaces each panel with two merged metal/brass meshes under one moving root. Bars, rails, rivets, collars and finials remain opaque, with empty space between them. Only the current closed gate is shown at rest. Clearing the encounter retracts it below the deck over 0.45 seconds; retry restores it. These meshes are excluded from static batches and disposed with the sector root.

EXIT_GATE_OFFSET and EXIT_GATE_CLEARANCE share the visual boundary and the player stop plane. The existing encounter movement clamp now stops the player 0.7 units before the bars, and releases when clear. This is an authored encounter boundary, not a newly simulated rigid gate or a replacement for Havok locomotion. Native movement checks verify stop/release and retry.
