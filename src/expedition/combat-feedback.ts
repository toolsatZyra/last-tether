import {
  Color3,
  Mesh,
  Scene,
  StandardMaterial,
  Vector3,
  VertexData,
} from "@babylonjs/core";
import type { Event } from "./engine";

/** Bounded contact flashes and a short directional camera impulse, allocated before combat. */
export class CombatFeedback {
  slots: { mesh: Mesh; age: number; duration: number; size: number }[] = [];
  materials: StandardMaterial[] = [];
  offset = Vector3.Zero();
  direction = Vector3.Zero();
  cameraAge = 1;
  cameraStrength = 0;
  hurtLife = 0;
  next = 0;
  constructor(scene: Scene) {
    for (const [name, hex] of [
      ["strike", "#ffe3ae"],
      ["hurt", "#f2a185"],
      ["blocked", "#c4e0df"],
    ]) {
      const m = new StandardMaterial("contact-" + name, scene);
      m.disableLighting = true;
      m.emissiveColor = Color3.FromHexString(hex).scale(1.4);
      m.backFaceCulling = false;
      m.disableDepthWrite = true;
      m.alpha = 0.98;
      this.materials.push(m);
    }
    const data = new VertexData();
    data.positions = [];
    data.indices = [];
    data.colors = [];
    for (let i = 0; i < 7; i++) {
      const a = (i * Math.PI * 2) / 7,
        length = i % 2 ? 0.65 : 1;
      const base = data.positions.length / 3;
      data.positions.push(
        Math.cos(a - 0.22) * 0.09,
        Math.sin(a - 0.22) * 0.09,
        0,
        Math.cos(a) * length,
        Math.sin(a) * length,
        0,
        Math.cos(a + 0.22) * 0.09,
        Math.sin(a + 0.22) * 0.09,
        0,
      );
      data.indices.push(base, base + 1, base + 2);
      data.colors.push(1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1);
    }
    for (let i = 0; i < 12; i++) {
      const mesh = new Mesh("contact-flash-" + i, scene);
      data.applyToMesh(mesh);
      mesh.hasVertexAlpha = true;
      mesh.material = this.materials[i % 3];
      mesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
      mesh.isPickable = false;
      mesh.setEnabled(false);
      this.slots.push({ mesh, age: 1, duration: 0.14, size: 0.6 });
    }
  }
  async warmup() {
    await Promise.all(
      this.materials.map((m, i) => m.forceCompilationAsync(this.slots[i].mesh)),
    );
  }
  clear() {
    for (const slot of this.slots) {
      slot.age = 1;
      slot.mesh.setEnabled(false);
    }
    this.cameraAge = 1;
    this.hurtLife = 0;
  }
  event(event: Event) {
    const cue = event.impact;
    if (!cue) return;
    const slot = this.slots[this.next++ % this.slots.length];
    slot.age = 0;
    slot.duration = cue.fatal ? 0.17 : 0.12;
    slot.size = 0.32 + cue.strength * 0.36;
    slot.mesh.position.set(cue.contact.x, cue.contact.y, cue.contact.z);
    slot.mesh.scaling.setAll(slot.size);
    slot.mesh.rotation.z = (this.next * 2.4) % Math.PI;
    slot.mesh.material =
      this.materials[cue.blocked ? 2 : event.type === "hurt" ? 1 : 0];
    slot.mesh.visibility = 1;
    slot.mesh.setEnabled(true);
    const strength = event.type === "hurt" ? 0.22 : 0.055 + cue.strength * 0.09;
    if (this.cameraAge > 0.08 || strength >= this.cameraStrength) {
      this.cameraAge = 0;
      this.cameraStrength = strength;
      this.direction.set(cue.direction.x, 0.35, cue.direction.z).normalize();
    }
    if (event.type === "hurt") this.hurtLife = 0.28;
  }
  update(dt: number, reduced: boolean) {
    for (const slot of this.slots) {
      if (slot.age >= slot.duration) continue;
      slot.age += dt;
      const t = Math.min(1, slot.age / slot.duration);
      slot.mesh.visibility = (1 - t) * (1 - t);
      slot.mesh.scaling.setAll(slot.size * (1 + t * 0.6));
      if (t === 1) slot.mesh.setEnabled(false);
    }
    this.cameraAge += dt;
    this.hurtLife = Math.max(0, this.hurtLife - dt);
    const pulse =
      reduced || this.cameraAge > 0.24
        ? 0
        : this.cameraStrength *
          Math.cos(this.cameraAge * 30) *
          Math.exp(-this.cameraAge * 18);
    this.offset.copyFrom(this.direction).scaleInPlace(pulse);
  }
}
