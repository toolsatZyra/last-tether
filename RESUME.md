# Last Tether — working checkpoint

The goal is active. Version 0.2.23 is a stone-surface and camera-readability pass on top of published 0.2.22.

Structural masonry and imported ruins now use the existing licensed stone normal map in the same world-space projections as the colour texture. A diagnostic neutral-normal comparison confirms subtle relief without changing arch geometry. The shader uses Babylon PBRCustomMaterial before lighting; no new asset, dependency or paid resource.

Area inspection exposed control wheels obscuring Kavi. Rings, hands and notches now fade together only when between camera and player, and restore when approached or viewed from the side. Distant control detail is culled beyond 110 units. Twelve camera cases, an actual E-key linked-wheel turn and three rebuilds pass. Waterworks resources stay at 8 groups/54 members, 692 meshes, 104 materials, 56 textures. A bounded same-view sample reduces visible control members from 54 to 6 and measures 71–74 FPS with range culling; the comparison varies and is not a sustained-performance guarantee.

45 tests and the build pass. All eight areas render without shader/page/console errors. Compiled final verification and publication are being completed; see verification/stone-surfaces-0.2.23.json and VERIFICATION.md. The latest full native chapter route remains the 0.2.22 result: 684.9833 simulated seconds, all 32 objectives, 188 defeats, zero recoveries, valid ending/save. This pass does not change collision, encounter rules or saves.

Main auto-deploys to the existing Vercel project. Do not create duplicate manual deployments. Public URL: https://last-tether.vercel.app/. Previous published app: 50edba455f9641b4a8b50a78cc01d09f690091d0, bundle index-D82ou0xn.js.

The larger goal remains open: cohesive hero/creature art, less repetitive environment composition, sustained performance and first-time 15–20 minute pacing. Next prioritize a substantive waterworks composition/machinery improvement: the current area has generic repeated terraces, simple glowing ring controls and unconvincing falling-water sheets. Preserve linked-wheel puzzle positions and the new camera visibility groups while replacing or improving those visuals. Avoid treating more tiny props as completion.

The US$5 fal character pilot remains blocked by exhausted fal credits; no retry/upload/poll until the user confirms credits. Included reference artwork is not a 3D model.

Local dev 4173, preview 4174 and the silent playwright-cli tether-release session are available. Verify listeners before restarting. Keep all testing silent. No generation is running.
