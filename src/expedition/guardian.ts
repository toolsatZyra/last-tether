import {
  Mesh,
  MeshBuilder,
  PBRMaterial,
  Color3,
  Quaternion,
  Texture,
  Vector3,
  type Scene,
  type TransformNode,
} from "@babylonjs/core";
import type { Enemy } from "./engine";
/** Authored skeletal accents layered after native glTF motion evaluation. */
export class GuardianMotion {
  bases = new Map<TransformNode, Quaternion>();
  nodes: Map<string, TransformNode>;
  plates: Mesh[] = [];
  material: PBRMaterial;
  enemy?: Enemy;
  remove: () => void;
  constructor(
    scene: Scene,
    public root: TransformNode,
    nodes: TransformNode[],
  ) {
    this.nodes = new Map(
      nodes.map((n) => [n.name.split("_").slice(1).join("_"), n]),
    );
    const stone = scene.textures.find((t) =>
      t.name.endsWith("/assets/materials/stone.jpg"),
    ) as Texture | undefined;
    this.material = new PBRMaterial("slateback-armour", scene);
    this.material.albedoTexture = stone || null;
    this.material.albedoColor = Color3.FromHexString("#8b948a").toLinearSpace();
    this.material.metallic = 0.12;
    this.material.roughness = 0.78;
    root.computeWorldMatrix(true);
    nodes.forEach((n) => n.computeWorldMatrix(true));
    for (const [i, name] of [
      "hips",
      "spine0",
      "spine1",
      "chest",
      "neck",
    ].entries()) {
      const node = this.nodes.get(name);
      if (!node) continue;
      const plate = MeshBuilder.CreateSphere(
        "slateback-plate-" + i,
        { diameter: 1, segments: 12 },
        scene,
      );
      plate.material = this.material;
      plate.parent = node;
      plate.scaling.set(2 - i * 0.15, 0.45, 1.9 - i * 0.12);
      plate.rotationQuaternion = node.absoluteRotationQuaternion.conjugate();
      const p = node
        .getAbsolutePosition()
        .add(new Vector3(0, [1.3, 1.05, 0.85, 0.75, 0.55][i], 0));
      plate.setAbsolutePosition(p);
      plate.isPickable = false;
      plate.receiveShadows = true;
      this.plates.push(plate);
    }
    const observer = scene.onAfterAnimationsObservable.add(() => this.pose());
    this.remove = () => scene.onAfterAnimationsObservable.remove(observer);
  }
  restore() {
    for (const [node, q] of this.bases) node.rotationQuaternion?.copyFrom(q);
    this.bases.clear();
  }
  update(e: Enemy) {
    this.restore();
    this.enemy = e;
    for (const [i, p] of this.plates.entries())
      p.setEnabled(e.hp > 0 && e.armour && i >= e.phase - 1);
  }
  rotate(name: string, x: number, z = 0) {
    const n = this.nodes.get(name);
    if (!n?.rotationQuaternion) return;
    this.bases.set(n, n.rotationQuaternion.clone());
    n.rotationQuaternion.multiplyInPlace(
      Quaternion.RotationYawPitchRoll(0, x, z),
    );
  }
  pose() {
    const e = this.enemy;
    if (!e) return;
    let neck = 0,
      head = 0,
      jaw = 0;
    if (e.hp <= 0) {
      head = 0.28;
      neck = -0.25;
      this.rotate("tail0", 0, 0.15);
    } else if (e.state === "windup") {
      const t = Math.max(0, Math.min(1, 1 - e.timer / 1.25));
      neck = 0.27 * t;
      head = -0.15 * t;
      jaw = -0.15 * t;
      this.rotate("chest", -0.08 * t);
    } else if (e.state === "charge") {
      neck = 0.28;
      head = -0.15;
      jaw = -0.2;
    } else if (e.state === "stunned") {
      neck = 0.32;
      head = 0.1 * Math.sin(e.timer * 7);
      jaw = 0.1;
    } else if (e.state === "pulse" || e.state === "roar") {
      const duration = e.state === "pulse" ? 1.2 : 2,
        t = Math.max(0, Math.min(1, 1 - e.timer / duration));
      const lift = Math.sin(Math.PI * t);
      neck = -0.3 * lift;
      head = -0.12 * lift;
      jaw = 0.25 * lift;
    } else if (e.flash > 0) {
      neck = -0.08;
      head = 0.1;
    }
    this.rotate("neck", neck);
    this.rotate("head", head);
    this.rotate("jaw", jaw);
  }
  dispose() {
    this.restore();
    this.remove();
    for (const p of this.plates) p.dispose();
    this.material.dispose();
  }
}
