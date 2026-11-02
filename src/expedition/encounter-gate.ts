import { Mesh, MeshBuilder, TransformNode } from "@babylonjs/core";
import type { GameScene } from "./scene";
import { EXIT_GATE_OFFSET, type Point } from "./level";

/** Open metalwork marks the encounter boundary without coloring the landscape. */
export class EncounterGate {
  root: TransformNode;
  meshes: Mesh[] = [];
  amount: number;
  private floor: number;
  constructor(view: GameScene, p: Point, closed: boolean) {
    this.root = new TransformNode("encounter-gate", view.scene);
    this.root.parent = view.root;
    this.root.position.set(p.x, p.y, p.z + EXIT_GATE_OFFSET);
    this.floor = p.y;
    this.amount = closed ? 1 : 0;
    const iron: Mesh[] = [],
      brass: Mesh[] = [];
    const box = (
      list: Mesh[],
      name: string,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
    ) => {
      const m = MeshBuilder.CreateBox(
        name,
        { width: w, height: h, depth: d },
        view.scene,
      );
      m.position.set(x, y, z);
      list.push(m);
      return m;
    };
    for (const y of [0.45, 3.95])
      box(iron, "gate-crossrail", 0, y, 0, 44, 0.16, 0.22);
    for (let i = -10; i <= 10; i++) {
      const x = i * 2.1;
      box(iron, "gate-upright", x, 2.2, 0, 0.12, 4.3, 0.14);
      const tip = MeshBuilder.CreateCylinder(
        "gate-finial",
        { diameterBottom: 0.32, diameterTop: 0, height: 0.42, tessellation: 4 },
        view.scene,
      );
      tip.position.set(x, 4.5, 0);
      brass.push(tip);
      for (const y of [0.45, 3.95])
        box(brass, "gate-rivet", x, y, -0.14, 0.22, 0.22, 0.09);
    }
    for (const x of [-21.8, -11, 11, 21.8]) {
      box(iron, "gate-stanchion", x, 2.3, 0, 0.38, 4.6, 0.45);
      for (const y of [0.2, 2.25, 4.35])
        box(brass, "gate-collar", x, y, 0, 0.52, 0.18, 0.56);
    }
    for (const a of [-Math.PI / 4, Math.PI / 4]) {
      const emblem = box(
        brass,
        "gate-lock-diamond",
        0,
        2.3,
        -0.18,
        0.12,
        1.25,
        0.12,
      );
      emblem.rotation.z = a;
    }
    for (const [parts, material] of [
      [iron, view.materials.metal],
      [brass, view.materials.brass],
    ] as const) {
      const mesh = Mesh.MergeMeshes(parts, true, true)!;
      mesh.name = "encounter-gate-" + material.name;
      mesh.parent = this.root;
      mesh.material = material;
      mesh.receiveShadows = true;
      mesh.isPickable = false;
      mesh.metadata = { physics: false, cameraSolid: false };
      view.shadow.addShadowCaster(mesh);
      this.meshes.push(mesh);
    }
    this.update(closed, 0);
  }
  update(closed: boolean, dt: number) {
    this.amount = Math.max(
      0,
      Math.min(1, this.amount + ((closed ? 1 : -1) * dt) / 0.45),
    );
    const eased = this.amount * this.amount * (3 - 2 * this.amount);
    this.root.position.y = this.floor - (1 - eased) * 4.9;
    this.root.setEnabled(this.amount > 0);
  }
}
