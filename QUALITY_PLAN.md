# Chapter production goal — 2 November 2026

The first prototype was rejected for crude graphics/animation, awkward mechanics and insufficient interest. Its roughly one-minute optimal route is not the requested chapter. This rebuild must be evaluated as a game, not merely as a passing test suite.

## Direction

Cinematic stylised alpine ruins: layered stone, weathered brass, foliage, flowing water, shafts of warm light against cool mist. A properly skinned explorer with blended locomotion and committed combat animation. Distinct creature silhouettes and attack tells. Responsive camera, readable landing zones and restrained interface.

## Delivery sequence

1. Preserve the prototype in Git. Inspect the empty `toolsatZyra/last-tether` repo and the intended Vercel team.
2. Source free, redistributable assets with licence evidence and a local manifest; no paid generation or purchases.
3. Replace movement/camera/combat feedback and animate the character. Inspect a representative opening and combat arena before multiplying content.
4. Build a real chapter with varied authored sectors: storm approach, predator terraces, waterworks puzzle, canopy traversal, quarry combat, turbine gauntlet, guardian arena and flood escape. Add discoveries, meaningful routes, enemy combinations and contextual narrative.
5. Tune pacing against input-driven playthroughs and real-time browser play. Target 15–20 minutes for first-time play; report the measured route and assumptions. Never add idle gates or mandatory waits simply to inflate duration.
6. Exercise checkpoint/retry, combat, traversal, puzzle state, boss phases, completion, pause, local persistence and replay. Inspect animation poses, camera obstruction, screenshot composition and performance.
7. Push the reviewed build to the user's repository, deploy to the verified Vercel project/team, test the live URL and provide the actual shareable link.

## Acceptance gates

- Character: no primitive placeholder body, no T-pose during play, grounded foot placement, animation blends between run/jump/dodge/attack; visible anticipation, impact and recovery.
- Feel: buffered attacks/jumps, coyote time, responsive dodge, clear hit/hurt feedback, camera-relative movement and reliable grapples; no blind leaps or surprise collision traps.
- Variety: at least six distinct enemy behaviours; melee chain, ranged action, dodge, grapple, environmental interaction; traversal and puzzle beats between encounters; boss changes behaviour across phases.
- Art: authored composition, textured materials, layered landscape, detailed vegetation, atmospheric depth, coherent light/shadow, controlled post-processing. No claim of parity with best-in-class commercial games based on screenshots alone.
- Pacing: substantial authored content, minimal dead running, no repeated identical waves for padding. Record optimal and exploratory run durations separately.
- Reliability: full chapter completable; no progression softlocks; resumed checkpoints coherent; live deployment loads assets without errors; performance measured in named conditions.
- Honesty: do not mark quality or human enjoyment validated solely because automated tests pass. Preserve any remaining gaps explicitly.

## Authority and boundaries

User authorised the rebuild, GitHub repository integration and Vercel publication. Existing GitHub CLI has repository write permission; the connector is read-only for this repository. Vercel target: `Zyra's projects` (`team_pwTpdWGJnbaaUJHUGUtCMxVG`), new project `last-tether` if still absent. No unrelated service changes, paid media, new paid resources, outbound messages or unrequested Supabase migrations.

## Current gate status

The rebuilt chapter, local replay and production-preview reliability checks are implemented and tested. Art, animation readability, camera occlusion and performance have undergone several passes. The requested top-tier visual bar, human enjoyment and first-time 15–20 minute duration remain open; automated completion must not close those gates. No paid subscription or cloud project has been created.

## Visual review after the structural pass

The opening, reservoir and forest captures still show repeated paving, similar rectangular terraces and sparse scenery. The structural arcades make the route more believable, but do not resolve those larger composition problems. The forest needs a distinct canopy and ground treatment; the waterworks needs convincing channels, built machinery and spray at its falls. Lanterns currently glow without illuminating nearby surfaces. These are observed art gaps, not failed gameplay tests.

Next art work should prioritise a clearly different silhouette, surface treatment and close-range detail for each area; a coherent set of detailed props; and visible interaction between light, water, vegetation and the player. Keep combat silhouettes and landing zones readable. Inspect ordinary gameplay views, not only staged cameras. Measure performance after added detail, and preserve the chapter route and checkpoint checks.

The download pass should distinguish source bytes from network bytes: the public host serves the hero glTF with Brotli. Unused animation clips and architecture assets are candidates for removal only after preserving the source/license manifest and verifying the retained animation and geometry. No paid subscription is needed for these changes.

The normal-speed audit also found seven 0.96–1.33 second stalls during area rebuilds. Smooth transitions are now an explicit remaining performance task; the 55.8 FPS average does not close that gate.

Version 0.2.4 addresses the one-second area rebuild stalls with batched construction and material preparation behind an area title. Seven checks measured 1.89–2.39 seconds of loading, with the largest browser interval 133–182 ms. Combat and time stop during these transitions. The remaining first-render delay and total loading time are explicit limits; this improves responsiveness without claiming seamless streaming or adding loading to the chapter-duration target.

The 0.2.5 close-up pass replaces block lamps with framed lanterns and actual local lighting, adds surface wear and dampness, opens memory chests with persistent state, and clears/fades obstructing planting. The opening and interaction captures improve detail but still show sparse, repetitive terraces and a plainly shaded character. Larger composition, coherent character finish and more distinctive area shapes remain priorities; the existing art gate is not closed by this pass.

The 0.2.6 environment pass replaces the blank canyon edges with scanned solid rock masses and broader terrain profiles. It adds surface and silhouette detail while preserving crossing clearance. The supplied scan remains stretched and repeated; vegetation and character shading still differ in finish, and the route remains visibly modular. This is an incremental environment improvement, not closure of the modern-game art or first-time pacing gates.

The 0.2.7 character pass removes overlapping equipment, softens the faceted surface shading without changing skinning, coordinates clothing colors and materials, and gives the player more presence in the exploration camera. Three spear-chain pose accents and turning lean add movement detail. Close-up review confirms a cleaner result, but the face, hair and silhouette remain simple and the underlying attack clip is still reused. This pass does not close the character-art or overall quality gates.

The 0.2.8 turbine approach adds an environmental decision to a previously repeated combat beat: choose the clear alternating lanes or dodge a timed burst, cross the spill, clear two flyers and close the valve. Clear-lane and ordinary-keyboard dodge routes are verified. This improves action variety without adding an idle timer; it does not establish the first-time 15–20 minute target. The overall art/performance/enjoyment gates remain open.

The 0.2.9 performance pass preserves scenery geometry and plant fading while using native instancing, wheel batching and spatial camera queries. Four short Balanced samples now average 64–71 FPS versus 42–55 previously. This is useful measured headroom for further art work; it does not close sustained-performance, first-time pacing or top-tier-art gates. Loading remains visible (up to 3.55 seconds in the latest transition checks).

The 0.2.10 quarry pass gives one area a clearer working-yard identity: braced crane and load rigging, furnace with restrained smoke, stepped cutting faces, timber grain, rail fasteners and complete explosive-charge assemblies. The first flat floor and unsupported-foundation experiments were rejected during visual review. The retained scene passes route, resource, full-chapter and ordinary-input checks. The common platform layout, simple creature surfaces and the broader requested visual bar remain open; the crane is scenery rather than a new player action.
