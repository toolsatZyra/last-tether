import { archWedge } from "./geometry";
import { Mesh, MeshBuilder, TransformNode, Vector3 } from "@babylonjs/core";
import type { GameScene } from "./scene";
import { v, floorAt, type Point, type V } from "./level";

/** Structural dressing below the walking surface; route collision remains in the deck. */
export function block(
  view: GameScene,
  name: string,
  p: V,
  size: V,
  parent = view.root,
) {
  const mesh = view.box(name, p, size, "masonry", false, parent);
  mesh.isPickable = true;
  mesh.metadata = { cameraSolid: true, physics: false };
  return mesh;
}
export function stoneArch(
  view: GameScene,
  p: V,
  width: number,
  rise: number,
  depth: number,
  yaw = 0,
  base = -18,
) {
  const root = new TransformNode("masonry-arch", view.scene);
  root.parent = view.root;
  root.position.set(p.x, p.y, p.z);
  root.rotation.y = yaw;
  const radius = width / 2,
    thickness = 1.15;
  for (let i = 0; i < 19; i++) {
    const a = (i * Math.PI) / 19 + 0.006,
      b = ((i + 1) * Math.PI) / 19 - 0.006;
    const data = archWedge(radius, rise, thickness, depth, a, b);
    const mesh = new Mesh("arch-voussoir", view.scene);
    data.applyToMesh(mesh);
    mesh.parent = root;
    mesh.material = view.materials.masonry;
    mesh.receiveShadows = true;
    mesh.isPickable = true;
    mesh.metadata = { cameraSolid: true, physics: false };
    view.shadow.addShadowCaster(mesh);
  }
  const height = p.y - base;
  if (height > 0)
    for (const side of [-1, 1]) {
      const x = side * (radius + thickness / 2);
      block(
        view,
        "arch-pier",
        v(x, -height / 2, 0),
        v(2.8, height, depth + 0.5),
        root,
      );
      block(
        view,
        "pier-foot",
        v(x, -height + 1.3, 0),
        v(4.4, 2.6, depth + 1.8),
        root,
      );
      for (let y = -height + 4; y < 0; y += 5)
        block(
          view,
          "pier-course",
          v(x, y, 0),
          v(3.05, 0.24, depth + 0.75),
          root,
        );
      block(view, "arch-impost", v(x, 0.15, 0), v(3.5, 0.6, depth + 1), root);
    }
  return root;
}
export function terraceStructure(view: GameScene, p: Point) {
  const rise = p.arena ? 8 : 6.5;
  for (const z of [-1, 1])
    for (const x of p.arena ? [-10, 10] : [0])
      stoneArch(
        view,
        v(p.x + x, p.y - 3.1 - rise - 1.15, p.z + z * (p.arena ? 18 : 10)),
        p.arena ? 16.8 : 18,
        rise,
        3.4,
      );
  // Broad cornices connect the arcade to the deck, with visible masonry courses.
  const w = p.arena ? 46 : 26,
    d = p.arena ? 46 : 28;
  for (const side of [-1, 1]) {
    block(
      view,
      "deck-cornice",
      v(p.x + side * (w / 2 - 0.2), p.y - 2.7, p.z),
      v(1.2, 0.65, d + 0.8),
    );
    block(
      view,
      "deck-cornice",
      v(p.x, p.y - 2.7, p.z + side * (d / 2 - 0.2)),
      v(w + 0.8, 0.65, 1.2),
    );
    for (let j = 0; j < 5; j++)
      block(
        view,
        "deck-corbel",
        v(p.x + side * (w / 2 - 0.6), p.y - 3.6, p.z - d * 0.36 + j * d * 0.18),
        v(1.6, 1.4, 1.1),
      );
  }
}
export function bridgeStructure(view: GameScene, p: Point, q: Point) {
  const dx = q.x - p.x,
    dz = q.z - p.z,
    length = Math.hypot(dx, dz),
    nx = -dz / length,
    nz = dx / length;
  for (const side of [-1, 1]) {
    const top: Vector3[] = [],
      bottom: Vector3[] = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30,
        x = p.x + dx * t,
        z = p.z + dz * t,
        y = floorAt(view.current.chapter, x, z) ?? p.y;
      top.push(new Vector3(x + nx * side * 5, y - 0.02, z + nz * side * 5));
      bottom.push(new Vector3(x + nx * side * 5, y - 2.1, z + nz * side * 5));
    }
    const wall = MeshBuilder.CreateRibbon(
      "bridge-spandrel",
      { pathArray: [top, bottom], sideOrientation: Mesh.DOUBLESIDE },
      view.scene,
    );
    wall.parent = view.root;
    wall.material = view.materials.masonry;
    wall.receiveShadows = true;
    wall.isPickable = true;
    wall.metadata = { cameraSolid: true, physics: false };
    view.shadow.addShadowCaster(wall);
  }
  const span = Math.min(30, Math.max(16, length - 30)),
    rise = span * 0.31;
  stoneArch(
    view,
    v((p.x + q.x) / 2, Math.min(p.y, q.y) - 2.1 - rise - 1.15, (p.z + q.z) / 2),
    span,
    rise,
    8.8,
    Math.atan2(dx, dz) - Math.PI / 2,
  );
}
