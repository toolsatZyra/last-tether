import {
  Color3,
  Color4,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  ParticleSystem,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import type { GameScene } from "./scene";
import type { Expedition } from "./engine";
import { pressureGates, pressurePhase } from "./pressure";

export class PressureGallery {
  dynamicMeshes: Mesh[] = [];
  banks: {
    signal: PBRMaterial;
    needle: TransformNode;
    jets: ParticleSystem;
  }[] = [];
  constructor(view: GameScene) {
    for (const gate of pressureGates(view.current.chapter)) {
      const root = new TransformNode("pressure-bank-" + gate.index, view.scene);
      root.parent = view.root;
      root.position.set(gate.p.x, gate.p.y, gate.p.z);
      root.rotation.y = gate.yaw;
      const box = (
        name: string,
        x: number,
        y: number,
        z: number,
        w: number,
        h: number,
        d: number,
        material = "metal",
        solid = false,
      ) => {
        const mesh = MeshBuilder.CreateBox(
          name,
          { width: w, height: h, depth: d },
          view.scene,
        );
        mesh.parent = root;
        mesh.position.set(x, y, z);
        mesh.material = view.materials[material];
        mesh.receiveShadows = true;
        mesh.metadata = { physics: solid, cameraSolid: solid };
        mesh.isPickable = solid;
        view.shadow.addShadowCaster(mesh);
        return mesh;
      };
      const pipe = (
        name: string,
        x: number,
        y: number,
        z: number,
        length: number,
        diameter: number,
        horizontal = false,
      ) => {
        const mesh = MeshBuilder.CreateCylinder(
          name,
          { height: length, diameter, tessellation: 12 },
          view.scene,
        );
        mesh.parent = root;
        mesh.position.set(x, y, z);
        if (horizontal) mesh.rotation.z = Math.PI / 2;
        mesh.material = view.materials.metal;
        mesh.receiveShadows = true;
        mesh.metadata = { physics: true, cameraSolid: true };
        view.shadow.addShadowCaster(mesh);
        return mesh;
      };
      for (const side of [-1, 1]) {
        pipe("pressure-riser", side * 5.8, 2.5, 0, 5, 0.4);
        box("pressure-foot", side * 5.8, 0.2, 0, 0.9, 0.4, 1, "metal", true);
        for (const y of [0.5, 2, 4.5])
          pipe("pipe-collar", side * 5.8, y, 0, 0.18, 0.58);
        box("pressure-brace", side * 5.8, 4.9, 0, 0.8, 0.45, 0.8, "brass");
      }
      pipe("pressure-header", 0, 5, 0, 12, 0.55, true);
      box("vent-grate", gate.offset, 0.04, 0, 6.2, 0.08, 1.4, "metal");
      for (let i = 0; i < 13; i++)
        box(
          "vent-slot",
          gate.offset - 2.9 + i * 0.48,
          0.09,
          0,
          0.12,
          0.04,
          1.2,
          "dark",
        );
      for (const edge of [-1, 1])
        for (let i = 0; i < 8; i++)
          box(
            "vent-warning-stripe",
            gate.offset - 2.8 + i * 0.8,
            0.11,
            edge * 0.72,
            0.4,
            0.025,
            0.18,
            "brass",
          );
      // The cyan strip identifies the lane that remains physically clear during a burst.
      box(
        "pressure-clear-lane",
        -Math.sign(gate.offset) * 3.4,
        0.06,
        0,
        2.2,
        0.025,
        0.22,
        "cyan",
      );
      const signal = new PBRMaterial(
        "pressure-signal-" + gate.index,
        view.scene,
      );
      signal.albedoColor = Color3.FromHexString("#394b48");
      signal.emissiveColor = Color3.FromHexString("#56958d");
      signal.roughness = 0.35;
      const lamp = box(
        "pressure-warning-lamp",
        Math.sign(gate.offset) * 5.6,
        3.8,
        -0.38,
        0.7,
        0.22,
        0.18,
      );
      lamp.material = signal;
      this.dynamicMeshes.push(lamp);
      const dial = MeshBuilder.CreateCylinder(
        "pressure-gauge",
        { height: 0.18, diameter: 0.85, tessellation: 24 },
        view.scene,
      );
      dial.parent = root;
      dial.position.set(Math.sign(gate.offset) * 5.6, 2.6, -0.3);
      dial.rotation.x = Math.PI / 2;
      dial.material = view.materials.brass;
      const face = MeshBuilder.CreateCylinder(
        "pressure-gauge-face",
        { height: 0.035, diameter: 0.7, tessellation: 24 },
        view.scene,
      );
      face.parent = root;
      face.position.set(Math.sign(gate.offset) * 5.6, 2.6, -0.405);
      face.rotation.x = Math.PI / 2;
      face.material = view.materials.dark;
      for (let tick = 0; tick < 7; tick++) {
        const angle = -1.3 + (tick * 2.6) / 6;
        const mark = box(
          "pressure-gauge-tick",
          Math.sign(gate.offset) * 5.6 + Math.sin(angle) * 0.27,
          2.6 + Math.cos(angle) * 0.27,
          -0.435,
          0.025,
          0.07,
          0.02,
          "white",
        );
        mark.rotation.z = -angle;
      }
      const needle = new TransformNode("pressure-gauge-hand", view.scene);
      needle.parent = root;
      needle.position.set(Math.sign(gate.offset) * 5.6, 2.6, -0.46);
      const hand = MeshBuilder.CreateBox(
        "pressure-needle",
        { width: 0.045, height: 0.3, depth: 0.04 },
        view.scene,
      );
      hand.parent = needle;
      hand.position.y = 0.12;
      hand.material = signal;
      this.dynamicMeshes.push(hand);
      const emitter = MeshBuilder.CreateBox(
        "pressure-emitter",
        { size: 0.01 },
        view.scene,
      );
      emitter.parent = root;
      emitter.position.set(gate.offset, 0.15, 0);
      emitter.isVisible = false;
      emitter.isPickable = false;
      this.dynamicMeshes.push(emitter);
      const jets = new ParticleSystem(
        "pressure-steam-" + gate.index,
        160,
        view.scene,
      );
      jets.particleTexture = view.sparkTexture;
      jets.emitter = emitter;
      jets.minEmitBox = new Vector3(-3.1, 0, -0.45);
      jets.maxEmitBox = new Vector3(3.1, 0, 0.45);
      jets.direction1 = new Vector3(-0.15, 1, -0.1);
      jets.direction2 = new Vector3(0.15, 1, 0.1);
      jets.minEmitPower = 7;
      jets.maxEmitPower = 9;
      jets.minLifeTime = 0.3;
      jets.maxLifeTime = 0.45;
      jets.minSize = 0.4;
      jets.maxSize = 0.8;
      jets.addSizeGradient(0, 0.4);
      jets.addSizeGradient(1, 1.3);
      jets.color1 = new Color4(0.8, 0.9, 0.91, 0.65);
      jets.color2 = new Color4(0.64, 0.78, 0.81, 0.5);
      jets.colorDead = new Color4(0.7, 0.8, 0.82, 0);
      jets.blendMode = ParticleSystem.BLENDMODE_STANDARD;
      jets.emitRate = 0;
      jets.start();
      this.banks.push({ signal, needle, jets });
    }
  }
  update(s: Expedition, dt: number) {
    this.banks.forEach((bank, index) => {
      const phase = pressurePhase(s.time, index),
        enabled = s.objective.hazard === "pressure";
      const active = enabled && phase.active,
        warning = enabled && phase.warning;
      bank.signal.emissiveColor = Color3.FromHexString(
        active ? "#fff2cf" : warning ? "#f3a347" : "#346960",
      );
      bank.signal.emissiveIntensity = warning
        ? 1.2 + Math.sin(s.time * 18) * 0.35
        : active
          ? 2
          : 0.5;
      bank.needle.rotation.z = enabled
        ? -0.9 + Math.sin((phase.phase / 3.6) * Math.PI) * 1.8
        : -0.9;
      bank.jets.emitRate = active ? 200 : warning ? 8 : 0;
      bank.jets.updateSpeed = dt > 0 ? dt : 0;
    });
  }
  dispose() {
    for (const bank of this.banks) {
      bank.jets.dispose(false);
      bank.signal.dispose();
    }
    this.banks = [];
  }
}
