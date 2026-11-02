import { stormBelfryRoof } from "./storm-road";
import { MeshBuilder, Vector3 } from "@babylonjs/core";
import type { GameScene } from "./scene";
import { block, stoneArch } from "./structures";
import { v, type V } from "./level";
import { routeClearance } from "./landscape";

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
  if (view.sector === 0) stormBelfryRoof(view, p);
  else {
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
  }
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
function rockBanks(view: GameScene) {
  for (let i = 0; i < 8; i++) {
    const p = view.current.chapter.points[i];
    for (const side of [-1, 1]) {
      const rock = view.architecture(
        "Rock_Mass",
        v(p.x + side * ((p.arena ? 23 : 13) + 40), -24, p.z + (i % 2 ? 8 : -7)),
        p.y + 52 + (i % 3) * 8,
        (side * Math.PI) / 2 + (i % 2) * 0.25,
        false,
        65 + (i % 2) * 8,
      );
      if (
        view.sector === 4 &&
        ((i === 1 && side === 1) || (i === 5 && side === -1))
      )
        rock.position.x += side * 35;
      // Compress depth so the scanned masses remain well outside the traversable deck.
      rock.scaling.z *= 42 / ((p.y + 52 + (i % 3) * 8) * 1.823);
      const spill = view.waterworks?.spillwayBounds;
      if (spill) {
        const b = rock.getHierarchyBoundingVectors(true);
        if (
          b.max.x > spill.min.x &&
          b.min.x < spill.max.x &&
          b.max.y > spill.min.y &&
          b.min.y < spill.max.y &&
          b.max.z > spill.min.z &&
          b.min.z < spill.max.z
        )
          rock.position.x +=
            side > 0 ? spill.max.x + 1 - b.min.x : spill.min.x - 1 - b.max.x;
      }
      for (let attempt = 0; attempt < 16; attempt++) {
        const bounds = rock.getHierarchyBoundingVectors(true);
        let close = false;
        for (let x = bounds.min.x; x <= bounds.max.x; x += 3)
          for (let z = bounds.min.z; z <= bounds.max.z; z += 3)
            if (routeClearance(view.current.chapter, x, z) < 6) close = true;
        if (!close) break;
        rock.position.x += side * 8;
      }
      for (const mesh of rock.getChildMeshes()) {
        mesh.metadata = { geology: true, cameraSolid: true, physics: false };
        mesh.isPickable = true;
      }
    }
  }
}
export function landmarks(view: GameScene) {
  rockBanks(view);
  const p = view.current.chapter.points[1];
  if (view.sector === 0) {
    bellTower(view, v(p.x - 48, p.y - 8, p.z + 30));
    for (const index of [0, 2, 4]) {
      const q = view.current.chapter.points[index];
      view.architecture(
        "Window_Bars_Overgrown",
        v(q.x - 11.2, q.y, q.z - 3),
        5.8,
        Math.PI / 2,
        true,
        5.2,
      );
      view.architecture(
        "Wall_Broken",
        v(q.x - 10.5, q.y, q.z + 5),
        2.9,
        Math.PI / 2,
        true,
      );
      view.architecture(
        "Pot1_Broken",
        v(q.x - 8.6, q.y, q.z + 1),
        0.75,
        0.3,
        false,
      );
    }
  }
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
