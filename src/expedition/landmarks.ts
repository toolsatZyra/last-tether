import { MeshBuilder, Vector3 } from "@babylonjs/core";
import type { GameScene } from "./scene";
import { block, stoneArch } from "./structures";
import { v, type V } from "./level";

function bellTower(view: GameScene, p: V) {
  block(
    view,
    "watchtower-foundation",
    v(p.x, (p.y - 18) / 2, p.z),
    v(15, p.y + 18, 15),
  );
  for (let y = -12; y < p.y; y += 6)
    block(view, "tower-stone-course", v(p.x, y, p.z), v(15.5, 0.35, 15.5));
  block(view, "belfry-floor", v(p.x, p.y + 1, p.z), v(18, 2, 18));
  for (const side of [-1, 1]) {
    stoneArch(view, v(p.x, p.y + 13, p.z + side * 6.8), 11, 6, 2.4, 0, p.y + 2);
    stoneArch(
      view,
      v(p.x + side * 6.8, p.y + 13, p.z),
      11,
      6,
      2.4,
      Math.PI / 2,
      p.y + 2,
    );
  }
  block(view, "belfry-cornice", v(p.x, p.y + 20.7, p.z), v(19, 1.4, 19));
  const roof = MeshBuilder.CreateCylinder(
    "bell-tower-roof",
    { height: 7, diameterBottom: 27, diameterTop: 4, tessellation: 4 },
    view.scene,
  );
  roof.position.set(p.x, p.y + 24.6, p.z);
  roof.rotation.y = Math.PI / 4;
  roof.parent = view.root;
  roof.material = view.materials.metal;
  roof.metadata = { cameraSolid: true, physics: false };
  roof.receiveShadows = true;
  view.shadow.addShadowCaster(roof);
  view.cylinder("warning-bell", v(p.x, p.y + 14, p.z), 4.5, 4.6, "brass", 2.2);
  view.cylinder("bell-clapper", v(p.x, p.y + 11.3, p.z), 0.65, 1.8, "metal");
  block(view, "bell-hanger", v(p.x, p.y + 18, p.z), v(1, 1, 15));
  view.architecture(
    "Flag_Wall",
    v(p.x - 7.7, p.y - 1, p.z - 5),
    6,
    Math.PI / 2,
    false,
  );
}
function reservoir(view: GameScene, p: V) {
  block(view, "reservoir-base", v(p.x, -4, p.z), v(28, 28, 28));
  for (const side of [-1, 1]) {
    block(
      view,
      "reservoir-buttress",
      v(p.x + side * 13, 9, p.z - 11),
      v(5, 45, 6),
    );
    block(view, "reservoir-cap", v(p.x + side * 13, 32, p.z - 11), v(7, 2, 8));
  }
  block(view, "reservoir-lintel", v(p.x, 31, p.z - 11), v(26, 3, 6));
  view.architecture(
    "Arch_Gothic_RoundColumn",
    v(p.x, 16, p.z - 12),
    19,
    0,
    false,
    22,
  );
  // The spill openings face the route, with a clear channel beneath each one.
  for (const x of [-8, 0, 8])
    view.addCascade(v(p.x + x, 24, p.z - 14.2), 4.8, 31.1);
}
export function landmarks(view: GameScene) {
  const p = view.current.chapter.points[1];
  if (view.sector === 0) bellTower(view, v(p.x - 48, p.y - 8, p.z + 30));
  if (view.sector === 2) reservoir(view, v(p.x + 28, 0, p.z + 60));
  if (view.sector === 7) bellTower(view, v(p.x + 58, p.y - 2, p.z + 40));
  if (view.sector === 3)
    for (let i = 0; i < 12; i++) {
      const x = (i % 2 ? 1 : -1) * (112 + (i % 3) * 8),
        z = 15 + i * 36;
      view.assets.prop(
        i % 2 ? "BirchTree_1" : "BirchTree_2",
        view.scene,
        view.root,
        new Vector3(x, view.terrainHeight(x, z), z),
        4.5 + (i % 3) * 0.7,
      );
    }
}
