import {
  Curve3,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  Texture,
  Vector3,
  Color3,
  VertexData,
} from "@babylonjs/core";
import { PBRCustomMaterial } from "@babylonjs/materials/custom/pbrCustomMaterial";
import type { GameScene } from "./scene";
import { v, floorAt, type Point } from "./level";

export function forestMaterials(view: GameScene) {
  if (view.materials.forestFloor) return;
  const floor = new PBRCustomMaterial("forest-floor", view.scene);
  floor.albedoTexture = new Texture("/assets/materials/stone.jpg", view.scene);
  floor.bumpTexture = new Texture(
    "/assets/materials/stone-normal.jpg",
    view.scene,
  );
  floor.bumpTexture.level = 0.55;
  floor.albedoColor = Color3.FromHexString("#9eaa83").toLinearSpace();
  floor.metallic = 0;
  floor.roughness = 0.96;
  floor.Fragment_Custom_Albedo(`
    float rootsDamp = sin(vPositionW.x*.17+sin(vPositionW.z*.21))*sin(vPositionW.z*.29);
    surfaceAlbedo *= .88 + rootsDamp*.13;
    surfaceAlbedo = mix(surfaceAlbedo, surfaceAlbedo*vec3(.72,.83,.56), smoothstep(-.2,.5,rootsDamp)*.55);
  `);
  view.materials.forestFloor = floor;
  const bark = new PBRMaterial("forest-root-bark", view.scene);
  bark.albedoTexture = new Texture(
    "/assets/nature/Textures/MapleTree_Bark.jpg",
    view.scene,
  );
  bark.bumpTexture = new Texture(
    "/assets/nature/Textures/MapleTree_Bark_Normal.jpg",
    view.scene,
  );
  bark.bumpTexture.level = 0.7;
  bark.albedoColor = Color3.FromHexString("#a9a38b").toLinearSpace();
  bark.metallic = 0;
  bark.roughness = 0.94;
  view.materials.forestBark = bark;
  const timber = new PBRMaterial("forest-bridge-timber", view.scene);
  timber.albedoTexture = new Texture(
    "/assets/materials/quarry-wood-diff.jpg",
    view.scene,
  );
  timber.bumpTexture = new Texture(
    "/assets/materials/quarry-wood-normal.jpg",
    view.scene,
  );
  timber.bumpTexture.level = 0.5;
  timber.albedoColor = Color3.FromHexString("#d5c8a9").toLinearSpace();
  timber.roughness = 0.9;
  timber.metallic = 0;
  view.materials.forestTimber = timber;
  const bed = new PBRMaterial("forest-bridge-underlay", view.scene);
  bed.albedoColor = new Color3(0.025, 0.018, 0.012);
  bed.roughness = 1;
  bed.metallic = 0;
  view.materials.forestBridgeBed = bed;
}

/** Roots stay below the decks; trees use collision derived from their lower trunk geometry. */
export function forestTerrace(view: GameScene, p: Point, index: number) {
  const half = p.arena ? 23 : 13;
  const rock = view.assets.building(
    "Rock_Mass",
    view.scene,
    view.root,
    new Vector3(p.x, -32, p.z),
    p.y + 30,
    (index % 2) * Math.PI,
    false,
    view.shadow,
    half * 1.95,
  );
  const rockBounds = rock.getHierarchyBoundingVectors(true);
  rock.scaling.z *= (p.arena ? 44 : 26) / (rockBounds.max.z - rockBounds.min.z);
  rock.getChildMeshes().forEach((m) => {
    m.metadata = { cameraSolid: true, physics: false, forest: true };
    m.isPickable = true;
  });
  const planted: Vector3[] = [];
  for (const side of [-1, 1]) {
    const at = forestTreePlacement(
      view,
      p,
      new Vector3(p.x + side * (half - 2), p.y, p.z + (side > 0 ? 8 : -6)),
      planted,
    );
    planted.push(at);
    const treeX = at.x,
      treeZ = at.z,
      treeSide = Math.sign(at.x - p.x) || side;
    forestTree(view, at, 3.6 + (index % 3) * 0.3);
    if (p.arena) {
      const other = forestTreePlacement(
        view,
        p,
        new Vector3(p.x + side * (half - 3), p.y, p.z + (side > 0 ? -17 : 17)),
        planted,
      );
      planted.push(other);
      forestTree(view, other, 2.6);
    }
    for (let j = 0; j < 2; j++) {
      const endZ = treeZ + (j ? 5 : -5);
      const path = Curve3.CreateCatmullRomSpline(
        [
          new Vector3(treeX, p.y - 1.3, treeZ),
          new Vector3(p.x + treeSide * (half + 1), p.y - 4 - j, endZ),
          new Vector3(p.x + treeSide * (half - 6), p.y - 11, endZ + 1),
          new Vector3(p.x + treeSide * (half - 8), p.y - 19, endZ + 4),
          new Vector3(p.x + treeSide * (half - 9), p.y - 23, endZ + 7),
        ],
        6,
        false,
      ).getPoints();
      const root = MeshBuilder.CreateTube(
        "forest-buttress-root",
        {
          path,
          tessellation: 10,
          cap: Mesh.CAP_ALL,
          radiusFunction: (i) => 1.15 * (1 - i / path.length) + 0.13,
        },
        view.scene,
      );
      root.parent = view.root;
      root.material = view.materials.forestBark;
      root.receiveShadows = true;
      root.metadata = { cameraSolid: true, physics: false, forest: true };
      root.isPickable = true;
      const uv = root.getVerticesData("uv")!;
      for (let k = 1; k < uv.length; k += 2) uv[k] *= 7;
      root.setVerticesData("uv", uv);
      view.shadow.addShadowCaster(root);
    }
    // Small plants frame the edge; the middle and cache approaches remain open.
    for (let j = 0; j < (p.arena ? 12 : 7); j++) {
      const z = p.z - (p.arena ? 18 : 10) + j * 3;
      if (!p.arena && side > 0 && index > 0 && Math.abs(z - p.z - 6) < 4)
        continue;
      view.assets.prop(
        "Grass_Small",
        view.scene,
        view.root,
        new Vector3(
          p.x + side * (half - 2.5 + Math.sin(j * 3.1) * 0.6),
          p.y,
          z,
        ),
        0.7 + 0.3 * (j % 3),
      );
    }
  }
}

export function forestBridge(view: GameScene, p: Point, q: Point) {
  const dx = q.x - p.x,
    dz = q.z - p.z,
    length = Math.hypot(dx, dz),
    nx = -dz / length,
    nz = dx / length;
  const exit = (point: Point) =>
    Math.min(
      (point.arena ? 23 : 13) / Math.max(0.001, Math.abs(dx)),
      (point.arena ? 23 : 14) / Math.max(0.001, Math.abs(dz)),
    );
  const from = exit(p),
    to = 1 - exit(q),
    span = (to - from) * length;
  const sample = (t: number, side = 0, height = 0) => {
    const x = p.x + dx * t,
      z = p.z + dz * t;
    return new Vector3(
      x + nx * side,
      (floorAt(view.current.chapter, x, z) ?? p.y) + height,
      z + nz * side,
    );
  };
  const count = Math.max(1, Math.ceil(span / 1.4));
  for (let j = 0; j <= count; j++) {
    const t = from + ((to - from) * j) / count,
      at = sample(t, 0, -0.1);
    const plank = view.box(
      "forest-bridge-plank",
      v(at.x, at.y, at.z),
      v(10, 0.27, 1.3),
      "forestTimber",
      false,
    );
    plank.rotation.y = Math.atan2(dx, dz);
    plank.metadata = { physics: true, cameraSolid: true, forest: true };
    const pos = plank.getVerticesData("position")!,
      uv = plank.getVerticesData("uv")!;
    for (let k = 0; k < uv.length / 2; k++) {
      uv[k * 2] = pos[k * 3] * 0.55;
      uv[k * 2 + 1] =
        (Math.abs(pos[k * 3 + 1]) > 0.12 ? pos[k * 3 + 2] : pos[k * 3 + 1]) *
        0.55;
    }
    plank.setVerticesData("uv", uv);
  }
  for (const side of [-1, 1]) {
    const cable: Vector3[] = [];
    for (let j = 0; j <= 40; j++) {
      const f = j / 40;
      cable.push(
        sample(
          from + (to - from) * f,
          side * 5.3,
          1.6 - Math.sin(f * Math.PI) * 0.45,
        ),
      );
    }
    const rope = MeshBuilder.CreateTube(
      "forest-handrail",
      { path: cable, radius: 0.065, tessellation: 6 },
      view.scene,
    );
    rope.parent = view.root;
    rope.material = view.materials.forestBark;
    rope.isPickable = false;
    rope.metadata = { physics: true, cameraSolid: false, forest: true };
    rope.receiveShadows = true;
    view.shadow.addShadowCaster(rope);
    for (let j = 0; j <= Math.ceil(span / 6); j++) {
      const at = sample(
        from + ((to - from) * j) / Math.ceil(span / 6),
        side * 5.3,
        0.7,
      );
      const post = view.box(
        "forest-bridge-post",
        v(at.x, at.y, at.z),
        v(0.25, 1.8, 0.25),
        "forestTimber",
        true,
      );
      post.metadata = { physics: true, cameraSolid: true, forest: true };
    }
  }
  return { from: Math.max(0, from - 0.025), to: Math.min(1, to + 0.025) };
}

function forestTree(view: GameScene, at: Vector3, scale: number) {
  const tree = view.assets.prop(
    "MapleTree_2",
    view.scene,
    view.root,
    at,
    scale,
  );
  tree.metadata.forestCanopy = true;
  for (const source of tree.getChildMeshes()) {
    if (!source.material?.name.includes("Bark")) continue;
    source.computeWorldMatrix(true);
    const positions = source.getVerticesData("position"),
      sourceIndices = source.getIndices();
    if (!positions || !sourceIndices) continue;
    const transformed: number[] = [],
      indices: number[] = [];
    for (let k = 0; k < positions.length; k += 3) {
      const p = Vector3.TransformCoordinates(
        new Vector3(positions[k], positions[k + 1], positions[k + 2]),
        source.getWorldMatrix(),
      );
      transformed.push(p.x, p.y, p.z);
    }
    for (let k = 0; k < sourceIndices.length; k += 3) {
      const a = sourceIndices[k],
        b = sourceIndices[k + 1],
        c = sourceIndices[k + 2];
      if (
        Math.min(
          transformed[a * 3 + 1],
          transformed[b * 3 + 1],
          transformed[c * 3 + 1],
        ) <
        at.y + 4.5
      )
        indices.push(a, b, c);
    }
    const collider = new Mesh("forest-trunk-collider", view.scene),
      data = new VertexData(),
      normals: number[] = [];
    VertexData.ComputeNormals(transformed, indices, normals);
    data.positions = transformed;
    data.indices = indices;
    data.normals = normals;
    data.applyToMesh(collider);
    collider.parent = view.root;
    collider.isVisible = false;
    collider.isPickable = true;
    collider.metadata = {
      physics: true,
      cameraSolid: true,
      cameraQuery: true,
      forest: true,
    };
  }
  return tree;
}

function forestTreePlacement(
  view: GameScene,
  p: Point,
  desired: Vector3,
  used: Vector3[],
) {
  const hz = p.arena ? 20 : 11;
  const hx = (p.arena ? 23 : 13) - 3;
  const candidates = [
    desired,
    ...Array.from({ length: 64 }, (_, i) => {
      const a = (i * Math.PI) / 32,
        x = Math.cos(a),
        z = Math.sin(a),
        r = Math.min(
          hx / Math.max(0.001, Math.abs(x)),
          hz / Math.max(0.001, Math.abs(z)),
        );
      return new Vector3(p.x + x * r, p.y, p.z + z * r);
    }),
  ];
  const clearance = (at: Vector3) => {
    let d = Infinity;
    const points = view.current.chapter.points;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i],
        b = points[i + 1],
        dx = b.x - a.x,
        dz = b.z - a.z,
        t = Math.max(
          0,
          Math.min(
            1,
            ((at.x - a.x) * dx + (at.z - a.z) * dz) / (dx * dx + dz * dz),
          ),
        );
      d = Math.min(d, Math.hypot(at.x - a.x - dx * t, at.z - a.z - dz * t));
    }
    return d;
  };
  const pointIndex = view.current.chapter.points.indexOf(p);
  const valid = candidates.filter(
    (at) =>
      clearance(at) > 7 &&
      used.every((other) => Vector3.Distance(at, other) > 6) &&
      (pointIndex === 0 ||
        pointIndex % 2 === 1 ||
        Math.hypot(at.x - p.x - 10, at.z - p.z - 6) > 4.5),
  );
  valid.sort(
    (a, b) => Vector3.Distance(a, desired) - Vector3.Distance(b, desired),
  );
  if (!valid.length) throw Error("No clear forest tree position at " + p.z);
  return valid[0];
}
