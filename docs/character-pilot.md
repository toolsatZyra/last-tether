# Kavi custom character pilot — awaiting spending approval

Purpose: replace the visibly simple hero with an original, coherent textured explorer and a reusable humanoid rig. No generation, upload or purchase has been submitted. This is a proposed experiment, not proof that generated skinning or animation will meet the game quality bar.

## Design brief
Kavi, an adult South Asian routefinder, lean athletic proportions, warm brown skin, short practical dark hair, alert expressive face. Weathered deep teal canvas field jacket over an ochre shirt, dark fitted climbing trousers with articulated knees, worn leather boots and bracers, a compact brass tether mechanism on the left forearm. Handcrafted alpine exploration clothing with believable stitching, seams, layered fabric and worn edges; restrained stylised realism with carefully modeled anatomy. No oversized head, cartoon eyes, modern military equipment, rigid cape, logos or weapons fused into the body. Weapon, backpack and short cloak remain separate game attachments.

Reference prompt: A single full-body 3D production character reference of Kavi as described above, neutral relaxed A-pose, arms separated from torso, fingers naturally extended and separated, both feet fully visible, front-facing orthographic-style view, plain warm-grey background, neutral studio illumination, no dramatic shadows, no ground props, no text. Clear readable silhouette, realistic material separation, high-end stylised adventure-game character finish.

## Proposed bounded workflow
1. Produce one reference image using the included image tool if available; no paid image fallback without including it in the approved cap.
2. Generate one textured 30,000-polygon GLB with meshy/v7.1/image-to-3d, standard model, A-pose, triangle topology, remeshing and PBR enabled. Inspect actual geometry and texture maps.
3. Only if the body is suitable, run fal-ai/meshy/rigging/multi-animation at 1.8 m, with up to ten motion IDs drawn from the official library. Initial set: 0 Idle, 16 RunFast, 158 Roll_Dodge, 466 Regular_Jump, 97 Left_Slash, 240 Thrust_Slash, 242 Charged_Slash, 178 Hit_Reaction, 8 Dead, 672 Spear_Walk_inplace. Preview motion suitability before final submission; names alone do not prove weapon contact or root motion suitability.
4. Locally combine/retarget the returned native animations, optimize geometry/textures, preserve originals and inspect knees, elbows, fingers and silhouette in game lighting. Test loading, animation continuity, attack contact timing, camera clearance and frame cost. Reject the asset if it is worse than the current hero.

## Budget proposal
Request a one-time maximum US$5 total for the pilot, not a recurring subscription. Live fal pricing on 2 November 2026 lists image-to-3D at US$0.80 per generation and multi-animation at US$0.08 per generation; configuration-dependent billing still needs checking before submission. Reserve within the cap for a single corrective retry only if justified. Do not submit a job whose upper cost cannot be established within the remaining cap. No automatic top-up or subscription purchase.

Sources: https://fal.ai/models/meshy/v7.1/image-to-3d ; https://fal.ai/models/fal-ai/meshy/rigging/multi-animation ; https://docs.meshy.ai/en/api/animation-library . Schemas obtained through connected fal tools. The account identified itself as Zyra; no balance check or account change was performed.
