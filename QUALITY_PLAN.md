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

The 0.2.11 creature pass corrects size/origin errors and close-camera visibility, grounds airborne contact shadows, and differentiates surface finishes. Close-up review still finds the cartoon creature silhouettes below the requested visual standard. Texture detail alone does not resolve that. Free licensed replacement candidates were researched (Gobkit and Bake3D); none was integrated or purchased. A replacement must provide useful combat animation, consistent proportions, suitable texture quality and a measured rendering cost. Full-chapter first-time pacing and sustained performance remain open.

0.2.12 replaces the floating cartoon guardian with a textured, grounded creature and authored combat accents. Source maps, more convincing anatomy and phase-linked armour improve the encounter substantially. The hero and remaining creature set are now visibly simpler and still need a coherent art pass. Sustained performance and first-time timing remain open.

0.2.13 bounds shadow-list growth and caches static PBR readiness without changing the fixed-scene pixel result. The normal-speed full route finishes with no recoveries/errors, averaging 51.4 FPS at Balanced 1036×703. Expert active play is 10:57; first-time 15–20 minute pacing remains unverified. Sustained 60 FPS, cohesive hero/creature art and top-tier presentation remain open. The final escape view still shows repeated large platform/arch forms and a simpler hero than its environment.

0.2.14 fixes visibly misleading attack facing and running-in-place. Model replacement research rejected the friendly fox and retained the existing roster. A custom-hero pilot has been prepared with a proposed one-time US$5 cap; approval is pending and no paid jobs were submitted. The character-art and broader top-tier quality gates remain open.

A further edge audit found unsupported raptor positions in 11 of 16 controlled attack directions near an arena boundary, up to 1.35 seconds outside floorAt coverage. The current ground-enemy steering falls back to spawn height instead of handling the edge. tools/enemy-edge-audit.mjs reproduces this; it is an open movement defect, not fixed by 0.2.14. Next investigate native navigation/physics support and validate edge attacks, obstacle avoidance, frame cost and chapter completion together.

0.2.15 addresses the reproduced ground-enemy edge defect with native Havok support, swept locomotion/knockback/tether pulls, falling and lower-surface recovery. Obstacle and lifetime checks pass. This does not add pathfinding around scenery, ragdolls, or new character art. A normal-speed pre-tether baseline reached all 32 objectives without recoveries but included unexplained repeated one-second frame gaps in the guardian area; performance remains open. The final continuous-tether build completes the accelerated full route. The user approved the US$5 hero pilot; fal rejected the first submission because the Zyra balance is exhausted. No generated output exists yet.

0.2.16 gives the forest a distinct material and vegetation treatment: maple canopies, textured bark, moss ground, rock foundations, roots and timber/rope crossings. Collision, collectible access, obstruction fading, rebuild stability and full-route completion pass. A quarry crate obstructing the automated exit route was moved. The suspended modular decks and simple hero remain visible art limitations. Two forest timing runs differ materially (57.4 and 44.4 average FPS); the final run has unresolved long stalls. The art, sustained-performance and first-time pacing gates remain open. The approved US$5 character pilot remains waiting for fal credits; no generation retry or paid asset purchase was made.

0.2.17 removes expired enemy scene resources while retaining visible death animations. Four same-area cycles across all six kinds return to baseline. A normal-loading forest profile completes at about 61.5 average FPS, but system memory availability changed substantially during diagnosis (0.46 GiB to 2.65 GiB), and an earlier diagnostic bypassed loading preparation. Do not attribute the difference entirely to this cleanup or close the sustained-performance gate. Hero/creature art, first-time pacing and human enjoyment remain open.

0.2.18 corrects stretched boots during added jumping/landing poses and saves the original Kavi reference artwork; that reference is not yet a 3D asset.

0.2.19 turns the quarry crane into a readable combat option rather than scenery. A lever releases the load after a warning; the impact can chain into the charge below. Native collision checks, scene lifetime checks, a normal-speed encounter and the full 32-objective route pass. The input policy took 20.03 seconds of game time for the first yard, with two impact/charge defeats and no recovery. This adds variety without adding waves or claiming more chapter duration. The short sample averaged 53.76 FPS; sustained performance remains open. Hero/creature art and first-time pacing/enjoyment remain open, and the paid character conversion still awaits fal credits.

0.2.20 removes the broad cyan wall that had looked like a fog-rendering seam in gameplay views. Retracting opaque metalwork makes the blocked exit readable while preserving the valley behind it. Staged camera review covers the storm road, gardens, forest, quarry and guardian approach; the new framing exposes rather than hides the remaining modular terrace layout. Native stop/release clearance and warmed scene resource checks pass. A short paused rendering sample is not proof of sustained gameplay performance. Character art, cohesive creature silhouettes, first-time pacing and human enjoyment remain open.

0.2.21 adds a native animated close-range kick to the middle combo hit, with separate contact timing, reach and pushback. It also fixes a measured collision-clock mismatch: native Havok bodies now commit every active gameplay step instead of waiting for a render. Direct native-position checks pass at different render frequencies and while paused. The input-driven route was corrected to join narrow bridge centrelines after reproducing a quarry corner-cutting fall; geometry and player collisions were retained. Short forest samples averaged 28.9 FPS initially,51.9 with the legacy clock and 52.5 on a fixed-clock repeat. Their differing render costs leave the first slow sample unexplained; native world updates are a small measured cost, and sustained 60 FPS remains open. Hero/creature art, environment composition, first-time 15–20 minute pacing and human enjoyment still do not meet the completion gate.

## Storm-road composition pass, 0.2.22

The retained treatment alternates rock-supported small landings and masonry arena arcades, replaces the opening tower cap with a damaged framed roof, and replaces the two floating storm-road hoops with timber-and-metal anchor gantries. Initial all-rock foundations looked excessively stretched and repetitive, so the arena arcades were retained. Four staged normal-camera views and native landing views were inspected. These are incremental construction/detail improvements: the road still reads as repeated rectangular platforms, character/creature art remains uneven, and the overall visual acceptance gate stays open.

## Masonry surface pass, 0.2.23

Structural stone and imported ruins now respond to light through aligned normal detail. A diagnostic close-up compares the actual map with an exactly neutral normal while retaining the same colour, lighting and camera; the former gives cracks and uneven stone subtle relief. Ordinary gameplay-camera captures still show the larger layout and silhouette limitations. Retain the detail as a surface improvement, not as evidence that the broader visual bar is met.

The waterworks inspection revealed a separate readability issue: the foreground valve could hide Kavi. Complete control wheels now fade when they lie between the camera and player, restoring the view while keeping the wheel position visible. This repair applies to ordinary and linked controls throughout the chapter; it does not replace the still-needed waterworks machinery/art pass.

## Waterworks pass, 0.2.24

The area now communicates machinery and progress through physical handwheel assemblies, raised sluice gates, widening spills and changing channel levels. Camera views exposed rock intrusion into the third spillway; its full face and falling-water volume now remain clear. Native input checks cover collision, continuous turns, pause and saved state. Water is still stylized shader work, and the route still contains repeated masonry decks. This pass improves one area; it does not close the hero/creature art, overall composition, sustained-performance or first-time pacing gates.

Two bounded normal-speed waterworks samples measured 59.45 and 53.81 FPS on integrated AMD graphics, with maximum frame intervals of 284 and 267 ms. The latter uses natural render frames for warm-up instead of synchronous render calls. Do not select the faster result as a sustained-performance claim or attribute the hitch solely to test setup.

## Player feedback: combat weight, 0.2.25

User play of the first three waves on 0.2.23 found no felt impact in either direction. This is a failed feel gate, regardless of prior automated completion. Prioritize visible contact and recovery, force through real collision, weight differences and usable dodge timing. The revision addresses missing player recoil, cancelled lethal momentum, slow hit blending, softened camera impulse and through-wall attacks. A reproduced prop obstruction also led to local enemy avoidance instead of repeated blocked attacks.

Review the opening through ordinary play again after publication. Automated native tests demonstrate mechanics and bounded timing; they cannot certify satisfaction or modern commercial-game feel. Mixed creature/hero art and variable frame pacing remain major limits.

## Combat allocation pass, 0.2.26

Creature model/rig creation now occurs during area preparation and rigs are reused during waves. Native lifecycle and full-route checks establish clean reuse, bounded retained resources and zero reserve shortages in the authored chapter. The normal-speed profile confirms no model construction in active opening combat. It still includes a 371 ms frame, so smoothness is not closed; rendering and system scheduling remain material. This implementation supports the preceding impact revision without establishing player-approved combat feel, visual quality or pacing.

## Spear motion and contact pass, 0.2.27

The new third strike is a two-handed thrust with a visible wind-up, forward extension and guarded recovery. The first prototype's empty-hand recovery flipped the spear; it was rejected and replaced by a derived clip with the spear guard. Native model-space arm IK keeps both palms attached at the contact pose without stretching bones. Damage now uses the animation's attack clock, removing an input-frame lead from the former independent countdown. Weapon reach and the thrust corridor are tighter. These changes address animation/contact coherence, not the unresolved low-detail hero or mixed creature art.

Rendered phase checks and real F-key combat demonstrate the intended contact and recovery. They cannot certify enjoyment. The requested top-tier art, sustained whole-chapter performance and human first-time pacing remain open.

## Rendering and ground contact, 0.2.28

A duplicate glow layer was washing out the contact shadows beneath actors and adding 128 draw calls in the controlled opening view. Removing it retains scene bloom and restores darker grounding. The canvas buffer comparison preserved the rendered detail but did not establish a meaningful speed gain. This pass removes measured redundant work; it does not close the overall art, combat-feel, sustained-performance or first-time pacing gates.
