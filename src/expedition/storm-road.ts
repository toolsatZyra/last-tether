import { weatheredStone } from "./surfaces";
import {
  TransformNode,
  Mesh,
  MeshBuilder,
  Vector3,
  PBRMaterial,
  Texture,
  Color3,
  VertexData,
} from "@babylonjs/core";
import type { GameScene } from "./scene";
import { v, type Point, type V } from "./level";
import { block } from "./structures";

/** A scanned, rotated outcrop contained below the existing walking deck. */
export function stormSpur(view: GameScene, p: Point, index: number) {
  if (!view.materials.stormRock)
    view.materials.stormRock = weatheredStone(
      "storm-spur-stone",
      view.scene,
      (view.materials.stone as PBRMaterial).albedoTexture as Texture,
      "#aaa599",
      0.22,
      new Vector3(0.25, 0.12, 0),
    );
  const foundation = new TransformNode("storm-rock-spur", view.scene);
  foundation.parent = view.root;
  foundation.position.set(p.x, -29, p.z);
  const rock = view.assets.building(
    "Rock_Mass",
    view.scene,
    foundation,
    Vector3.Zero(),
    (p.y + 25.8) * 2.8,
    0.47 + index * 1.37,
    false,
    view.shadow,
  );
  const b = rock.getHierarchyBoundingVectors(true);
  foundation.scaling.x = 24.5 / (b.max.x - b.min.x);
  foundation.scaling.z = 26.5 / (b.max.z - b.min.z);
  for (const mesh of rock.getChildMeshes()) {
    if (!(mesh instanceof Mesh) || !mesh.getTotalVertices()) continue;
    // Cut the upper half of the scan into a broad foundation below the deck.
    // Copy geometry before editing so the bank rocks and other sectors retain their source mesh.
    mesh.makeGeometryUnique();
    const matrix = mesh.computeWorldMatrix(true),
      inverse = matrix.clone().invert();
    const positions = mesh.getVerticesData("position"),
      indices = mesh.getIndices();
    if (positions && indices) {
      for (let i = 0; i < positions.length; i += 3) {
        const world = Vector3.TransformCoordinates(
          Vector3.FromArray(positions, i),
          matrix,
        );
        world.y = Math.min(world.y, p.y - 3.2);
        world.x = Math.max(
          p.x - 12.25,
          Math.min(
            p.x + 12.25,
            world.x + 0.45 * Math.sin(world.y * 0.8 + world.z * 0.25 + index),
          ),
        );
        world.z = Math.max(
          p.z - 13.25,
          Math.min(
            p.z + 13.25,
            world.z + 0.35 * Math.sin(world.y * 0.6 + world.x * 0.23),
          ),
        );
        const local = Vector3.TransformCoordinates(world, inverse);
        positions[i] = local.x;
        positions[i + 1] = local.y;
        positions[i + 2] = local.z;
      }
      const normals: number[] = [];
      VertexData.ComputeNormals(positions, indices, normals);
      mesh.setVerticesData("position", positions);
      mesh.setVerticesData("normal", normals);
      mesh.refreshBoundingInfo();
    }
    mesh.material = view.materials.stormRock;
    mesh.isPickable = true;
    mesh.metadata = { cameraSolid: true, physics: false, stormSpur: true };
  }
  // Retaining masonry meets the rock; small offsets avoid a uniform slab outline.
  const hx = 13,
    hz = 14;
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      const at = v(p.x + side * (hx - 1.8), p.y - 4.6, p.z + end * (hz - 3.2));
      block(view, "spur-retaining-buttress", at, v(2.2, 4.8, 3.8));
      block(
        view,
        "spur-buttress-cap",
        v(at.x, p.y - 2.35, at.z),
        v(2.8, 0.45, 4.2),
      );
    }
  }
}

function timber(view: GameScene) {
  if (view.materials.stormTimber) return;
  const mat = new PBRMaterial("storm-tower-timber", view.scene);
  mat.albedoTexture = new Texture(
    "/assets/materials/quarry-wood-diff.jpg",
    view.scene,
  );
  mat.bumpTexture = new Texture(
    "/assets/materials/quarry-wood-normal.jpg",
    view.scene,
  );
  mat.bumpTexture.level = 0.55;
  mat.albedoColor = Color3.FromHexString("#9b8b77").toLinearSpace();
  mat.roughness = 0.93;
  mat.metallic = 0;
  view.materials.stormTimber = mat;
}

/** A storm-damaged pitched roof exposes its frame and preserves the bell's silhouette. */
export function stormBelfryRoof(view: GameScene, p: V) {
  timber(view);
  const base = p.y + 21.5,
    rise = 6,
    half = 10.5;
  const mesh = (name: string, pos: V, size: V, material: string) => {
    const m = view.box(name, pos, size, material, false);
    m.isPickable = true;
    m.metadata = { cameraSolid: true, physics: false, stormTower: true };
    return m;
  };
  mesh(
    "belfry-ridge-beam",
    v(p.x, base + rise - 0.1, p.z),
    v(0.45, 0.5, 24),
    "stormTimber",
  );
  for (const side of [-1, 1]) {
    mesh(
      "belfry-eave-beam",
      v(p.x + side * half, base - 0.25, p.z),
      v(0.45, 0.5, 23),
      "stormTimber",
    );
    for (let row = 0; row < 7; row++) {
      const z = p.z - 10.5 + row * 3.5;
      const rafter = mesh(
        "belfry-roof-rafter",
        v(p.x + (side * half) / 2, base + rise / 2 - 0.25, z),
        v(0.28, Math.hypot(half, rise), 0.3),
        "stormTimber",
      );
      rafter.rotation.z = side * Math.atan2(half, rise);
    }
    for (let row = 0; row < 6; row++)
      for (let col = 0; col < 4; col++) {
        // The missing front-right corner reveals the timber and bell rather than a flat roof cap.
        if (side === 1 && ((row < 2 && col > 1) || (row === 2 && col === 3)))
          continue;
        const x = ((col + 0.5) * half) / 4,
          z = p.z - 8.75 + row * 3.5;
        const panel = mesh(
          "belfry-copper-roof-panel",
          v(p.x + side * x, base + rise * (1 - x / half), z),
          v(Math.hypot(half / 4, rise / 4) - 0.035, 0.09, 3.44),
          "metal",
        );
        panel.rotation.z = -side * Math.atan2(rise, half);
        const seam = mesh(
          "belfry-roof-standing-seam",
          v(
            p.x + side * ((col * half) / 4),
            base + rise * (1 - col / 4) + 0.08,
            z,
          ),
          v(0.065, 0.14, 3.46),
          "metal",
        );
        seam.rotation.z = panel.rotation.z;
      }
  }
  // An asymmetric survivor and a broken offcut make damage legible at a distance.
  const loose = mesh(
    "belfry-loose-roof-sheet",
    v(p.x + 8.7, base + 1.2, p.z - 5.2),
    v(2.8, 0.09, 3.3),
    "metal",
  );
  loose.rotation.set(0.18, -0.12, -0.9);
  mesh(
    "belfry-ridge-finial",
    v(p.x, base + rise + 1, p.z + 9),
    v(0.18, 2.2, 0.18),
    "brass",
  );
}

/** Physical-looking anchor hardware; the existing assisted crossing and HUD remain unchanged. */
export function stormGrapple(view: GameScene, p: Point) {
  timber(view);
  const z = p.z - 6;
  const part = (
    name: string,
    at: V,
    size: V,
    material: string,
    solid = false,
  ) => {
    const m = view.box(name, at, size, material, solid);
    m.isPickable = true;
    m.metadata = { physics: solid, cameraSolid: true, stormGrapple: true };
    return m;
  };
  for (const side of [-1, 1]) {
    const x = p.x + side * 3.4;
    part(
      "tether-gantry-post",
      v(x, p.y + 3.45, z),
      v(0.44, 6.9, 0.44),
      "stormTimber",
      true,
    );
    part(
      "tether-gantry-shoe",
      v(x, p.y + 0.3, z),
      v(0.72, 0.6, 0.72),
      "metal",
      true,
    );
    for (const y of [1.2, 5.8, 6.75])
      part(
        "tether-post-iron-band",
        v(x, p.y + y, z),
        v(0.5, 0.16, 0.5),
        "metal",
      );
    const brace = part(
      "tether-gantry-knee-brace",
      v(p.x + side * 2.85, p.y + 6.1, z),
      v(0.24, 1.8, 0.24),
      "stormTimber",
    );
    brace.rotation.z = (side * Math.PI) / 4;
    for (const y of [5.8, 6.75])
      for (const front of [-1, 1]) {
        const bolt = MeshBuilder.CreateSphere(
          "tether-gantry-rivet",
          { diameter: 0.1, segments: 6 },
          view.scene,
        );
        bolt.position.set(x, p.y + y, z + front * 0.27);
        bolt.parent = view.root;
        bolt.material = view.materials.brass;
        bolt.isPickable = false;
      }
  }
  part(
    "tether-gantry-crossbeam",
    v(p.x, p.y + 7, z),
    v(7.8, 0.5, 0.5),
    "stormTimber",
  );
  part("tether-eye-mount", v(p.x, p.y + 6.72, z), v(0.22, 0.7, 0.26), "metal");
  const ring = MeshBuilder.CreateTorus(
    "grapple-eye",
    { diameter: 0.9, thickness: 0.13, tessellation: 32 },
    view.scene,
  );
  ring.position.set(p.x, p.y + 6, z);
  ring.rotation.x = Math.PI / 2;
  ring.material = view.materials.brass;
  ring.parent = view.root;
  ring.isPickable = false;
  ring.receiveShadows = true;
  ring.metadata = { fixedAnchor: true };
  view.shadow.addShadowCaster(ring);
  const lining = MeshBuilder.CreateTorus(
    "grapple-eye-lining",
    { diameter: 0.72, thickness: 0.035, tessellation: 32 },
    view.scene,
  );
  lining.position.copyFrom(ring.position);
  lining.position.z -= 0.045;
  lining.rotation.x = Math.PI / 2;
  lining.material = view.materials.glow;
  lining.parent = view.root;
  lining.isPickable = false;
  return ring;
}
