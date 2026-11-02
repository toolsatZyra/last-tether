import {
  Scene,
  SceneLoader,
  AssetContainer,
  TransformNode,
  AnimationGroup,
  Mesh,
  MeshBuilder,
  Vector3,
  Quaternion,
  PBRMaterial,
  Color3,
  ShadowGenerator,
  Texture,
  VertexData,
  StandardMaterial,
  DynamicTexture,
  InstantiatedEntries,
  TrailMesh,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import "@babylonjs/loaders/OBJ";
import { PBRCustomMaterial } from "@babylonjs/materials/custom/pbrCustomMaterial";
const creatureMaterials = new Map<number, PBRCustomMaterial>();
import { ASSETS, type Kind } from "./level";
import type { Expedition, Enemy } from "./engine";
import { weatheredStone } from "./surfaces";
import { characterSurface, softenCharacterSurface } from "./character-finish";
export class Actor {
  instance: InstantiatedEntries;
  height: number;
  contact: Mesh;
  cloak?: Mesh;
  cloakRest: number[] = [];
  root: TransformNode;
  groups: AnimationGroup[];
  meshes: Mesh[];
  active = "";
  weights = new Map<AnimationGroup, number>();
  air = 0;
  landing = 0;
  weaponTrail?: TrailMesh;
  trailActive = false;
  speed = 1;
  nodes: TransformNode[];
  hero: boolean;
  removePose: (() => void) | null = null;
  lastAttack = 0;
  lastDodge = 0;
  attackPose = -1;
  attackPhase = 0;
  turnLean = 0;
  poseBases = new Map<TransformNode, Quaternion>();
  constructor(
    container: AssetContainer,
    scene: Scene,
    id: string,
    height: number,
    shadows: ShadowGenerator,
    hero = false,
  ) {
    this.height = height;
    const contactMat = new StandardMaterial(id + "-contact", scene);
    const contactTexture = new DynamicTexture(
      id + "-contact-map",
      { width: 64, height: 64 },
      scene,
      false,
    );
    const ctx = contactTexture.getContext();
    const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    gradient.addColorStop(0, "rgba(3,12,13,0.5)");
    gradient.addColorStop(1, "rgba(3,12,13,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    contactTexture.update();
    contactTexture.hasAlpha = true;
    contactMat.diffuseTexture = contactTexture;
    contactMat.useAlphaFromDiffuseTexture = true;
    contactMat.disableLighting = true;
    contactMat.emissiveColor = Color3.White();
    contactMat.disableDepthWrite = true;
    this.contact = MeshBuilder.CreateGround(
      id + "-contact",
      { width: height * 0.75, height: height * 0.55 },
      scene,
    );
    this.contact.material = contactMat;
    this.contact.isPickable = false;
    this.hero = hero;
    const instance = container.instantiateModelsToScene(
      (n) => id + "_" + n,
      false,
      { doNotInstantiate: true },
    );
    this.instance = instance;
    this.root = new TransformNode(id, scene);
    instance.rootNodes.forEach((n) => (n.parent = this.root));
    this.groups = instance.animationGroups;
    this.nodes = this.root.getChildTransformNodes();
    this.meshes = this.root
      .getChildMeshes()
      .filter((m) => m instanceof Mesh) as Mesh[];
    const bounds = this.root.getHierarchyBoundingVectors(true),
      h = bounds.max.y - bounds.min.y;
    this.root.scaling.setAll(height / Math.max(0.1, h));
    this.meshes.forEach((m) => {
      m.receiveShadows = true;
      m.isPickable = false;
      shadows.addShadowCaster(m);
      if (m.material instanceof PBRMaterial) {
        if (hero) {
          if (!/Hair|Eyebrows|Eye|Gold/.test(m.material.name))
            softenCharacterSurface(m);
          m.material = characterSurface(
            scene,
            m.material,
            id,
            m.name.includes("Backpack"),
          );
        } else {
          const original = m.material;
          let appearance = creatureMaterials.get(original.uniqueId);
          if (!appearance) {
            appearance = new PBRCustomMaterial(
              original.name + "-valley",
              scene,
            );
            appearance.albedoTexture = original.albedoTexture;
            appearance.backFaceCulling = original.backFaceCulling;
            const tint =
              height > 7
                ? "0.65,0.78,0.85"
                : height > 3
                  ? "0.75,0.8,0.78"
                  : height === 2.1
                    ? "0.7,0.85,0.5"
                    : height === 2
                      ? "0.95,0.7,0.4"
                      : "0.85,0.66,0.48";
            appearance.Fragment_Custom_Albedo(
              "float valleyLuma=dot(surfaceAlbedo,vec3(0.299,0.587,0.114));surfaceAlbedo=mix(surfaceAlbedo,vec3(valleyLuma)*vec3(" +
                tint +
                "),0.76*(1.0-smoothstep(0.65,0.95,valleyLuma)));",
            );
            creatureMaterials.set(original.uniqueId, appearance);
          }
          m.material = appearance;
        }
        const mat = m.material as PBRMaterial;
        if (!hero) {
          mat.roughness = 0.83;
          mat.metallic = 0;
          mat.albedoColor = new Color3(0.62, 0.68, 0.57);
        }
      }
    });
    this.groups.forEach((g) => g.stop());
    this.play(hero ? "Idle_Sword" : "Idle");
    const observer = scene.onAfterAnimationsObservable.add(() => {
      if (this.air > 0.01 || this.landing > 0.01 || this.attackPose >= 0) {
        for (const n of this.nodes) {
          if (!n.rotationQuaternion) continue;
          const name = n.name;
          let amount = 0;
          if (/UpperArm\.L$/.test(name)) amount = -0.8;
          if (/UpperArm\.R$/.test(name)) amount = -1.1;
          if (/UpperLeg\.L$/.test(name)) amount = -0.8;
          if (/LowerLeg\.L$/.test(name)) amount = 1.1;
          if (/UpperLeg\.R$/.test(name)) amount = 0.3;
          amount *= this.air;
          if (/UpperLeg\.[LR]$/.test(name)) amount -= 0.24 * this.landing;
          if (/LowerLeg\.[LR]$/.test(name)) amount += 0.46 * this.landing;
          if (/Chest$/.test(name)) amount += 0.08 * this.landing;
          const strike =
            this.attackPose >= 0 ? Math.sin(Math.PI * this.attackPhase) : 0;
          let twist = 0,
            lift = 0;
          if (/Chest$/.test(name)) {
            twist =
              (this.attackPose === 1
                ? -0.28
                : this.attackPose === 2
                  ? 0.16
                  : 0) * strike;
            if (this.attackPose === 2) amount -= 0.18 * strike;
          }
          if (/UpperArm\.R$/.test(name))
            lift = (this.attackPose === 1 ? -0.48 : 0) * strike;
          if (/UpperArm\.R$/.test(name) && this.attackPose === 2)
            lift =
              0.85 * Math.sin(Math.PI * Math.min(1, this.attackPhase / 0.32)) -
              0.38 * strike;
          if (amount || twist || lift) {
            this.poseBases.set(n, n.rotationQuaternion.clone());
            n.rotationQuaternion = n.rotationQuaternion.multiply(
              Quaternion.RotationYawPitchRoll(twist, amount, lift),
            );
          }
        }
      }
      if (scene.animationsEnabled && this.trailActive)
        this.weaponTrail?.update();
    });
    this.removePose = () => {
      scene.onAfterAnimationsObservable.remove(observer);
    };
    if (hero) {
      this.weapon(scene);
      this.outfit(scene);
      for (const mesh of this.root.getChildMeshes()) {
        if (!(mesh instanceof Mesh) || this.meshes.includes(mesh)) continue;
        mesh.receiveShadows = true;
        mesh.isPickable = false;
        this.meshes.push(mesh);
        shadows.addShadowCaster(mesh);
      }
    }
  }
  outfit(scene: Scene) {
    const chest = this.nodes.find((n) => /Chest$/.test(n.name));
    if (!chest) return;
    const cloth = new PBRMaterial("kavi-stormcloak", scene);
    cloth.albedoColor = Color3.White();
    const weave = new DynamicTexture(
      "stormcloak-weave",
      { width: 256, height: 256 },
      scene,
      true,
    );
    const ink = weave.getContext();
    ink.fillStyle = "#294e51";
    ink.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 3) {
      ink.fillStyle = y % 2 ? "rgba(7,20,23,0.16)" : "rgba(158,180,166,0.12)";
      ink.fillRect(0, y, 256, 1);
    }
    for (let x = 0; x < 256; x += 3) {
      ink.fillStyle = x % 2 ? "rgba(8,25,28,0.14)" : "rgba(174,187,161,0.09)";
      ink.fillRect(x, 0, 1, 256);
    }
    ink.strokeStyle = "#86795a";
    ink.lineWidth = 2;
    ink.setLineDash([3, 4]);
    ink.strokeRect(8, 8, 240, 240);
    weave.update();
    cloth.albedoTexture = weave;
    cloth.roughness = 0.96;
    cloth.backFaceCulling = false;
    const cape = new Mesh("weather-cloak", scene);
    const data = new VertexData();
    data.positions = [];
    data.indices = [];
    data.uvs = [];
    for (let row = 0; row <= 12; row++) {
      const t = row / 12,
        width = 0.2 + 0.16 * t;
      for (let col = 0; col <= 8; col++) {
        const u = col / 8;
        data.positions.push(
          (u * 2 - 1) * width,
          0.14 - 0.76 * t + Math.sin(u * Math.PI) * 0.025 * t,
          -0.105 -
            0.05 * Math.sin(t * Math.PI) +
            Math.sin(u * Math.PI * 8) * 0.012 * t,
        );
        data.uvs.push(u, t);
        if (row < 12 && col < 8) {
          const a = row * 9 + col;
          data.indices.push(a, a + 9, a + 1, a + 1, a + 9, a + 10);
        }
      }
    }
    this.cloakRest = [...data.positions];
    const normals: number[] = [];
    VertexData.ComputeNormals(data.positions, data.indices, normals);
    data.normals = normals;
    data.applyToMesh(cape, true);
    this.cloak = cape;
    cape.material = cloth;
    cape.parent = chest;
    const collar = MeshBuilder.CreateTorus(
      "woven-scarf",
      { diameter: 0.25, thickness: 0.09, tessellation: 24 },
      scene,
    );
    collar.parent = chest;
    collar.position.y = 0.15;
    const amber = new PBRMaterial("scarf-ochre", scene);
    amber.albedoColor = Color3.FromHexString("#b8753c").toLinearSpace();
    amber.roughness = 1;
    collar.material = amber;
  }
  weapon(scene: Scene) {
    const hand = this.nodes.find((n) => /Wrist\.R$/.test(n.name));
    if (!hand) return;
    const grip = new TransformNode("spear-grip", scene);
    grip.parent = hand;
    grip.rotation.z = Math.PI / 2;
    grip.position.y = 0.08;
    const wood = new PBRMaterial("spear-wood", scene);
    wood.albedoColor = Color3.FromHexString("#473329");
    wood.roughness = 0.7;
    const metal = new PBRMaterial("spear-metal", scene);
    metal.albedoColor = Color3.FromHexString("#c6d1c9");
    metal.metallic = 0.85;
    metal.roughness = 0.24;
    const shaft = MeshBuilder.CreateCylinder(
      "ash-spear",
      { height: 1.85, diameter: 0.035, tessellation: 10 },
      scene,
    );
    shaft.parent = grip;
    shaft.position.y = 0.45;
    shaft.material = wood;
    const blade = MeshBuilder.CreateCylinder(
      "spear-tip",
      { height: 0.34, diameterBottom: 0.13, diameterTop: 0, tessellation: 4 },
      scene,
    );
    blade.parent = grip;
    blade.position.y = 1.52;
    blade.material = metal;
    const trail = new TrailMesh("spear-trail", blade, scene, {
      diameter: 0.13,
      length: 7,
      segments: 7,
      sections: 4,
      autoStart: false,
    });
    const trailMaterial = new StandardMaterial("spear-trail-light", scene);
    trailMaterial.disableLighting = true;
    trailMaterial.emissiveColor = Color3.FromHexString("#e5c18a");
    trailMaterial.alpha = 0.55;
    trailMaterial.disableDepthWrite = true;
    trail.material = trailMaterial;
    trail.isPickable = false;
    trail.isVisible = false;
    this.weaponTrail = trail;
    const wrap = MeshBuilder.CreateCylinder(
      "spear-wrap",
      { height: 0.19, diameter: 0.065, tessellation: 10 },
      scene,
    );
    wrap.parent = grip;
    wrap.position.y = 1.28;
    wrap.material = metal;
  }
  play(name: string, rate = 1, loop = true) {
    const group =
      this.groups.find((g) => g.name.endsWith("_" + name) || g.name === name) ||
      this.groups.find((g) => g.name.endsWith("_Idle")) ||
      this.groups[0];
    if (!group) return;
    if (this.active === group.name) {
      group.speedRatio = rate;
      return;
    }
    this.active = group.name;
    group.start(loop, rate);
    group.setWeightForAllAnimatables(0);
    this.weights.set(group, this.weights.get(group) ?? 0);
  }
  playTimed(name: string, elapsed: number, duration: number) {
    this.play(name, 1, false);
    const group = this.groups.find((g) => g.name === this.active);
    if (!group) return;
    group.pause();
    group.goToFrame(
      group.from +
        (group.to - group.from) *
          Math.max(0, Math.min(0.999, elapsed / duration)),
    );
  }
  update(dt: number) {
    for (const [g, w] of this.weights) {
      const target = g.name === this.active ? 1 : 0;
      const next = w + (target - w) * Math.min(1, dt * 16);
      g.setWeightForAllAnimatables(next);
      this.weights.set(g, next);
      if (target === 0 && next < 0.005) {
        g.stop();
        this.weights.delete(g);
      }
    }
  }
  clearPose() {
    for (const [node, base] of this.poseBases)
      node.rotationQuaternion?.copyFrom(base);
    this.poseBases.clear();
  }
  player(s: Expedition, dt: number) {
    this.clearPose();
    if (s.attack > this.lastAttack + 0.05 || s.dodge > this.lastDodge + 0.05) {
      this.groups.find((g) => g.name === this.active)?.stop();
      this.active = "";
    }
    this.lastAttack = s.attack;
    this.lastDodge = s.dodge;
    this.contact.position.set(s.p.x, s.p.y + 0.04, s.p.z);
    this.contact.visibility = s.grounded ? 0.8 : 0;
    this.landing =
      s.landTime > 0 ? Math.sin(Math.PI * (1 - s.landTime / 0.22)) : 0;
    this.root.position.set(s.p.x, s.p.y - this.landing * 0.06, s.p.z);
    const phase = 1 - s.attack / s.attackDuration;
    this.attackPose = s.attack > 0 && !s.slam && s.grounded ? s.combo : -1;
    this.attackPhase = Math.max(0, Math.min(1, phase));
    const trailActive = s.attack > 0 && !s.slam && phase > 0.27 && phase < 0.66;
    if (trailActive && !this.trailActive) this.weaponTrail?.reset();
    this.trailActive = trailActive;
    if (this.weaponTrail) this.weaponTrail.isVisible = trailActive;
    let delta = s.yaw - this.root.rotation.y;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    this.root.rotation.y += delta * Math.min(1, dt * 20);
    this.air += ((!s.grounded ? 1 : 0) - this.air) * Math.min(1, dt * 10);
    if (this.cloak && dt > 0) {
      const p = this.cloak.getVerticesData("position")!;
      for (let i = 0; i < p.length; i += 3) {
        const t = Math.floor(i / 3 / 9) / 12,
          u = ((i / 3) % 9) / 8;
        p[i] =
          this.cloakRest[i] +
          Math.max(-0.1, Math.min(0.1, delta * 0.08)) * t * t;
        p[i + 1] = this.cloakRest[i + 1];
        p[i + 2] =
          this.cloakRest[i + 2] -
          s.speed * 0.009 * t * t +
          Math.sin(s.time * 6 + t * 3 + u * 4) * 0.018 * t * t;
      }
      const normals: number[] = [];
      VertexData.ComputeNormals(p, this.cloak.getIndices()!, normals);
      this.cloak.updateVerticesData("position", p);
      this.cloak.updateVerticesData("normal", normals);
    }
    if (s.finished) this.play("Idle_Neutral");
    else if (s.death > 0) this.play("Death", 1, false);
    else if (s.dodge > 0) this.playTimed("Roll", 0.28 - s.dodge, 0.28);
    else if (s.hurtTime > 0) this.play("HitRecieve", 1.8, false);
    else if (s.throwTime > 0)
      this.playTimed("Punch_Right", 0.4 - s.throwTime, 0.4);
    else if (s.attack > 0)
      this.playTimed(
        "Sword_Slash",
        s.attackDuration - s.attack,
        s.attackDuration,
      );
    else if (!s.grounded) this.play("Idle_Sword");
    else if (s.speed > 0.7) this.play("Run", Math.max(0.6, s.speed / 5.8));
    else this.play("Idle_Sword");
    const lean =
      s.speed > 2 && !s.attack && !s.dodge && s.grounded
        ? Math.max(-0.12, Math.min(0.12, -delta * 0.16))
        : 0;
    this.turnLean += (lean - this.turnLean) * (1 - Math.exp(-dt * 12));
    this.root.rotation.z = this.turnLean;
    this.update(dt);
  }
  enemy(e: Enemy, dt: number) {
    this.clearPose();
    this.contact.position.set(e.p.x, e.p.y + 0.045, e.p.z);
    this.contact.visibility = e.hp > 0 ? 0.65 : 0;
    this.root.position.set(e.p.x, e.p.y, e.p.z);
    this.root.rotation.y = e.yaw;
    this.root.setEnabled(e.hp > 0 || e.dead > 0);
    const flying = e.kind === "wing" || e.kind === "guardian";
    let anim = flying ? "Flying_Idle" : "Idle";
    if (e.hp <= 0) anim = "Death";
    else if (e.flash > 0) anim = "HitReact";
    else if (e.state === "windup" || e.state === "pulse" || e.state === "roar")
      anim = flying ? "No" : "Duck";
    else if (["lunge", "charge"].includes(e.state))
      anim = flying ? "Headbutt" : "Punch";
    else if (e.state === "idle" && e.kind !== "spitter")
      anim = flying ? "Fast_Flying" : "Run";
    else if (e.state === "stunned") anim = "HitReact";
    this.play(anim, anim === "Run" ? 1.15 : 1, e.hp > 0);
    this.root.scaling.y =
      this.root.scaling.x * (e.hp <= 0 ? Math.min(1, e.dead * 2) : 1);
    this.update(dt);
  }
  dispose() {
    (this.contact.material as StandardMaterial).diffuseTexture?.dispose();
    this.contact.dispose(false, true);
    this.removePose?.();
    this.weaponTrail?.dispose(false, true);
    this.instance.dispose();
    this.root.dispose(false, false);
  }
}
export class Assets {
  containers = new Map<string, AssetContainer>();
  async load(scene: Scene, onProgress: (n: number) => void) {
    const entries = Object.entries(ASSETS);
    let count = 0;
    await Promise.all(
      entries.map(async ([key, url]) => {
        const at = url.lastIndexOf("/");
        const container = await SceneLoader.LoadAssetContainerAsync(
          url.slice(0, at + 1),
          url.slice(at + 1),
          scene,
        );
        this.containers.set(key, container);
        onProgress(++count / entries.length);
      }),
    );
    for (const name of [
      "BirchTree_1",
      "BirchTree_2",
      "Bush_Large",
      "Bush_Small",
    ]) {
      const container = await SceneLoader.LoadAssetContainerAsync(
        "/assets/nature/",
        name + ".gltf",
        scene,
      );
      for (const material of container.materials) {
        if (
          material instanceof PBRMaterial &&
          material.name.includes("Leaves")
        ) {
          material.albedoTexture = new Texture(
            "/assets/nature/Textures/" +
              (name.startsWith("Bush") ? "Bush_Leaves" : "BirchTree_Leaves") +
              ".png",
            scene,
            false,
            false,
          );
          material.albedoTexture.hasAlpha = true;
          material.useAlphaFromAlbedoTexture = true;
          material.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHATEST;
          material.alphaCutOff = 0.45;
          material.backFaceCulling = false;
          material.roughness = 0.9;
          material.metallic = 0;
          material.albedoColor = new Color3(0.22, 0.31, 0.15);
        }
      }
      this.containers.set(name, container);
    }
  }
  async loadArchitecture(scene: Scene) {
    const rock = await SceneLoader.LoadAssetContainerAsync(
      "/assets/geology/",
      "boulder_01.glb",
      scene,
    );
    this.containers.set("Rock_Mass", rock);
    const stoneTexture = new Texture("/assets/materials/stone.jpg", scene);
    const paletteMaterials = new Map<string, PBRMaterial>();
    const names = [
      "Arch_Gothic_RoundColumn",
      "Arch_Round_RoundColumn",
      "Column_BridgeSupport",
      "Column_Round",
      "Bricks",
      "Cart",
      "Chest_Gold",
      "Barrel",
      "Crate",
      "Statue_Stag",
      "Statue_Fox",
      "Rail_Straight",
      "Wall_ArchRound_Overgrown_Broken",
      "Wall_Broken",
      "Window_Bars_Overgrown",
      "Torch",
      "Pot1_Broken",
      "Flag_Wall",
    ];
    for (let i = 0; i < names.length; i += 4)
      await Promise.all(
        names.slice(i, i + 4).map(async (name) => {
          const container = await SceneLoader.LoadAssetContainerAsync(
            "/assets/ruins/",
            name + ".obj",
            scene,
          );
          const converted = new Map<StandardMaterial, PBRMaterial>();
          for (const mesh of container.meshes) {
            const original = mesh.material;
            if (!(original instanceof StandardMaterial)) continue;
            let mat = converted.get(original);
            if (!mat) {
              mat = new PBRMaterial(name + "-" + original.name, scene);
              mat.roughness = 0.88;
              mat.metallic = 0;
              const n = original.name.toLowerCase();
              let color = n.includes("highlight")
                ? "#b8ae8e"
                : n.includes("black")
                  ? "#343b36"
                  : n.includes("wood") || n.includes("brown")
                    ? "#74604a"
                    : n.includes("gold")
                      ? "#b2985c"
                      : n.includes("green") || n.includes("leaf")
                        ? "#465b32"
                        : n.includes("metal")
                          ? "#565b51"
                          : "#8f947c";
              mat.dispose();
              const stone =
                !original.diffuseTexture &&
                ![
                  "Cart",
                  "Barrel",
                  "Crate",
                  "Chest_Gold",
                  "Flag_Wall",
                  "Torch",
                ].includes(name) &&
                !n.includes("green") &&
                !n.includes("leaf") &&
                !n.includes("metal") &&
                !n.includes("black");
              const paletteKey =
                color +
                "-" +
                (stone ? "stone" : original.diffuseTexture?.name || "plain");
              const shared = paletteMaterials.get(paletteKey);
              mat =
                shared ||
                (stone
                  ? weatheredStone(
                      "ruins-" + paletteKey,
                      scene,
                      stoneTexture,
                      color,
                      0.6,
                    )
                  : new PBRMaterial("ruins-" + paletteKey, scene));
              const metal = n.includes("gold") || n.includes("metal");
              mat.roughness = metal ? 0.4 : 0.9;
              mat.metallic = metal ? 0.72 : 0;
              mat.albedoColor = Color3.FromHexString(color).toLinearSpace();
              if (!shared) paletteMaterials.set(paletteKey, mat);
              if (original.diffuseTexture) {
                mat.albedoTexture = original.diffuseTexture;
                mat.albedoTexture.hasAlpha = true;
                mat.useAlphaFromAlbedoTexture = true;
                mat.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHATEST;
                mat.alphaCutOff = 0.4;
                mat.backFaceCulling = false;
              }
              converted.set(original, mat);
              container.materials.push(mat);
              scene.removeMaterial(mat);
            }
            mesh.material = mat;
          }
          this.containers.set(name, container);
        }),
      );
  }
  building(
    key: string,
    scene: Scene,
    parent: TransformNode,
    p: Vector3,
    height: number,
    rotation = 0,
    solid = true,
    shadows?: ShadowGenerator,
    width?: number,
  ) {
    const container = this.containers.get(key)!;
    const instance = container.instantiateModelsToScene(
      (n) => key + "-" + n,
      false,
      { doNotInstantiate: true },
    );
    const root = new TransformNode(key, scene);
    instance.rootNodes.forEach((n) => (n.parent = root));
    const bounds = root.getHierarchyBoundingVectors(true),
      size = bounds.max.subtract(bounds.min),
      scale = height / size.y;
    const offset = new Vector3(
      -(bounds.min.x + bounds.max.x) / 2,
      -bounds.min.y,
      -(bounds.min.z + bounds.max.z) / 2,
    );
    instance.rootNodes.forEach((n) => {
      if (n instanceof TransformNode) n.position.addInPlace(offset);
    });
    root.scaling.set(width ? width / size.x : scale, scale, scale);
    root.rotation.y = rotation;
    root.position.copyFrom(p);
    root.parent = parent;
    root.getChildMeshes().forEach((m) => {
      m.receiveShadows = true;
      m.isPickable = solid;
      m.metadata = { physics: solid, cameraSolid: solid };
      if (shadows) shadows.addShadowCaster(m);
    });
    return root;
  }
  actor(
    key: "hero" | Kind,
    scene: Scene,
    id: string,
    shadows: ShadowGenerator,
  ) {
    const heights = {
      hero: 2.1,
      raptor: 2.4,
      spitter: 2.1,
      brute: 3.7,
      bomber: 2,
      wing: 2.4,
      guardian: 8,
    };
    return new Actor(
      this.containers.get(key)!,
      scene,
      id,
      heights[key],
      shadows,
      key === "hero",
    );
  }
  prop(
    key: string,
    scene: Scene,
    parent: TransformNode,
    p: Vector3,
    scale: number,
  ) {
    const c = this.containers.get(key)!;
    const root = new TransformNode(key, scene);
    root.parent = parent;
    const result = c.instantiateModelsToScene(undefined, false);
    result.rootNodes.forEach((n) => (n.parent = root));
    const base = root.getHierarchyBoundingVectors(true).min.y;
    root.position.copyFrom(p);
    root.position.y -= base * scale;
    if (key.startsWith("Bush")) {
      const bounds = root.getHierarchyBoundingVectors(true);
      root.position.y -= (bounds.max.y - bounds.min.y) * scale * 0.28;
    }
    root.scaling.setAll(scale);
    root.rotation.y = (p.x + p.z) * 0.47;
    root.metadata = { foliage: true, phase: (p.x + p.z) * 0.2 };
    root.getChildMeshes().forEach((m) => {
      m.receiveShadows = true;
      m.isPickable = false;
    });
    return root;
  }
}
