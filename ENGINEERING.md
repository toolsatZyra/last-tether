# Implementation and boundaries

Babylon.js 9.33.1 owns rendering, PBR materials, skeletal animation, asset import, particles, post-processing, cameras and the scene. Havok 1.3.14 and Babylon's PhysicsCharacterController own capsule sweeps, grounding, steps, slopes and sliding against solid scene meshes. No custom rendering or collision engine was built.

The application owns authored encounters, enemy decisions, combat timing, checkpoint rules and input intent. Pure simulation tests use a simplified authored floor query; browser route checks use the actual Havok world. Passing one is not evidence for the other.

Movement uses a fixed 60 Hz simulation, acceleration, jump buffering and coyote time. Edge inputs are retained when a render frame contains no simulation step. Animation uses Babylon's normal render loop and blended imported clips. Airborne posing and cloak motion add small authored offsets; this is not full-body inverse kinematics or cloth physics. The spear is attached to the wrist joint. The camera handles solid obstruction and fades foreground creatures/lamps that obscure the player; boss encounters pull it farther back.

Grapple traversal follows an assisted arc. Creature navigation uses authored bounds and steering, not a navigation mesh or dynamic rigid-body collision for every enemy. Environment columns, walls, ramps and floors provide Havok collision. Non-solid dressing is deliberately separated from that collision set.

Static meshes are batched by material, spatial cell and collision behaviour. Distance visibility, nearby shadow casters, reduced reflection refresh and cached foliage groups reduce draw work. Impacts use Babylon ParticleSystem batches instead of a separate mesh for every spark. High, Balanced and Low expose rendering tradeoffs; performance is measured, not inferred from nominal settings.

A previous frame-rate readout was invalid because rendering bypassed the engine's normal frame loop. That was corrected. Earlier constant-60 readings are discarded. Current verification records actual measured frame rates and notes shader warm-up stalls.

All game state is local. Profile readers bound and validate records before rendering them, including date strings, finite numbers, chronological ghost samples and supported sectors. Difficulty changes from camp preserve the existing checkpoint. Storage failures are reported without pretending a daily record was saved. Audio requires a user gesture and defaults off on reload.

The production bundle excludes the development hook. Vercel serves static files; it is not running a real-time game server. Static asset names use revalidation to avoid serving stale revisions. No paid subscription, generated media, purchase or paid backend was authorized or used.

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
