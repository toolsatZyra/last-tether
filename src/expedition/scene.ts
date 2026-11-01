import {
  Engine,
  Scene,
  Vector3,
  Color3,
  Color4,
  FreeCamera,
  HemisphericLight,
  DirectionalLight,
  MeshBuilder,
  PBRMaterial,
  StandardMaterial,
  Texture,
  HDRCubeTexture,
  ShadowGenerator,
  DefaultRenderingPipeline,
  GlowLayer,
  TransformNode,
  Mesh,
  VertexData,
  Matrix,
  Ray,
  ShaderMaterial,
  Effect,
  LinesMesh,
  ImageProcessingConfiguration,
  SSAO2RenderingPipeline,
  AbstractMesh,
  ParticleSystem,
  DynamicTexture,
} from "@babylonjs/core";
import { Assets, Actor } from "./actors";
import { PhysicsWorld } from "./physics";
import { createRiver } from "./water";
import { SkyMaterial } from "@babylonjs/materials/sky";
import { CHAPTERS, ASSETS, floorAt, v, type V } from "./level";
import { Expedition, clamp, type Event } from "./engine";
const c = (s: string) => Color3.FromHexString(s);
const V = (p: V) => new Vector3(p.x, p.y, p.z);
export class GameScene {
  sparkTexture!: DynamicTexture;
  particleBursts: { system: ParticleSystem; life: number }[] = [];
  foregroundProps: AbstractMesh[] = [];
  shadowCasters: AbstractMesh[] = [];
  foliage: TransformNode[] = [];
  wheels: TransformNode[] = [];
  staticDraws: Mesh[] = [];
  visibilityTick = 0;
  dials: { beat: number; index: number; hand: TransformNode }[] = [];
  blades: TransformNode[] = [];
  chargeMarks = new Map<number, Mesh>();
  flood!: Mesh;
  physics!: PhysicsWorld;
  river!: ReturnType<typeof createRiver>;
  engine: Engine;
  scene: Scene;
  camera: FreeCamera;
  sun: DirectionalLight;
  shadow: ShadowGenerator;
  pipeline: DefaultRenderingPipeline;
  assets = new Assets();
  hero!: Actor;
  actors = new Map<number, Actor>();
  root!: TransformNode;
  sector = -1;
  materials: Record<string, PBRMaterial | StandardMaterial> = {};
  yaw = 0;
  pitch = 0.38;
  menu = true;
  time = 0;
  shake = 0;
  ao: SSAO2RenderingPipeline;
  aoEnabled = true;
  quality = "high";
  reduced = false;
  loaded = false;
  anchors: Mesh[] = [];
  devices: TransformNode[] = [];
  gates: Mesh[] = [];
  pointers: Mesh[] = [];
  pods: Mesh[] = [];
  cacheMeshes: Mesh[] = [];
  shots = new Map<number, Mesh>();
  rings = new Map<number, Mesh>();
  effects: { mesh: Mesh; life: number; max: number; velocity: Vector3 }[] = [];
  water!: Mesh;
  waterMat!: ShaderMaterial;
  rope!: LinesMesh;
  dust: Mesh[] = [];
  ghostActor: Actor | null = null;
  ghostFrames: any[] = [];
  ghostEnabled = true;
  frameTimes: number[] = [];
  frameNow = 0;
  current!: Expedition;
  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      powerPreference: "high-performance",
    });
    this.scene = new Scene(this.engine);
    this.scene.skipPointerMovePicking = true;
    this.scene.clearColor = new Color4(0.22, 0.32, 0.37, 1);
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.0035;
    this.scene.fogColor = c("#7e979e");
    this.camera = new FreeCamera(
      "camera",
      new Vector3(12, 20, -15),
      this.scene,
    );
    this.camera.minZ = 0.15;
    this.camera.maxZ = 1100;
    this.camera.fov = 1.05;
    const hemi = new HemisphericLight("sky", new Vector3(0, 1, 0), this.scene);
    hemi.intensity = 0.35;
    hemi.diffuse = c("#b7d4dc");
    hemi.groundColor = c("#39434b");
    this.sun = new DirectionalLight(
      "sun",
      new Vector3(-0.6, -0.8, 0.4),
      this.scene,
    );
    this.sun.intensity = 2.5;
    this.sun.diffuse = c("#ffe1b6");
    this.sun.shadowMinZ = 1;
    this.sun.shadowMaxZ = 180;
    this.sun.autoCalcShadowZBounds = false;
    this.sun.autoUpdateExtends = false;
    this.sun.shadowFrustumSize = 90;
    this.shadow = new ShadowGenerator(2048, this.sun);
    this.shadow.usePoissonSampling = true;
    this.shadow.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
    this.shadow.bias = 0.0005;
    this.shadow.normalBias = 0.035;
    this.shadow.darkness = 0.18;
    const env = new HDRCubeTexture(
      "/assets/materials/sky.hdr",
      this.scene,
      128,
      false,
      true,
      false,
      true,
    );
    this.scene.environmentTexture = env;
    this.scene.environmentIntensity = 0.65;
    const skybox = this.scene.createDefaultSkybox(env, true, 1000, 0.15)!;
    skybox.name = "sky";
    skybox.isPickable = false;
    skybox.material!.fogEnabled = false;

    const ao = (this.ao = new SSAO2RenderingPipeline(
      "contact-shadows",
      this.scene,
      { ssaoRatio: 0.5, blurRatio: 0.5 },
      [this.camera],
    ));
    ao.radius = 1.4;
    ao.totalStrength = 0.85;
    ao.samples = 8;
    ao.expensiveBlur = false;
    ao.maxZ = 90;
    this.pipeline = new DefaultRenderingPipeline("finish", true, this.scene, [
      this.camera,
    ]);
    this.pipeline.fxaaEnabled = true;
    this.pipeline.samples = 4;
    this.pipeline.bloomEnabled = true;
    this.pipeline.bloomThreshold = 1.2;
    this.pipeline.bloomWeight = 0.18;
    this.pipeline.bloomKernel = 48;
    this.pipeline.imageProcessing.toneMappingEnabled = true;
    this.pipeline.imageProcessing.toneMappingType =
      ImageProcessingConfiguration.TONEMAPPING_ACES;
    this.pipeline.imageProcessing.exposure = 1.15;
    this.pipeline.imageProcessing.contrast = 1.08;
    this.pipeline.imageProcessing.vignetteEnabled = true;
    this.pipeline.imageProcessing.vignetteWeight = 1.5;
    this.pipeline.imageProcessing.vignetteColor = new Color4(
      0.02,
      0.05,
      0.07,
      1,
    );
    const glow = new GlowLayer("gold-bloom", this.scene, {
      mainTextureRatio: 0.4,
    });
    glow.intensity = 0.3;
    this.makeMaterials();
    this.makeWater();
    this.sparkTexture = new DynamicTexture(
      "spark-texture",
      { width: 32, height: 32 },
      this.scene,
      false,
    );
    const sparkCtx = this.sparkTexture.getContext();
    const sparkGradient = sparkCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    sparkGradient.addColorStop(0, "rgba(255,255,255,1)");
    sparkGradient.addColorStop(0.3, "rgba(255,255,255,.9)");
    sparkGradient.addColorStop(1, "rgba(255,255,255,0)");
    sparkCtx.fillStyle = sparkGradient;
    sparkCtx.fillRect(0, 0, 32, 32);
    this.sparkTexture.update();
    this.sparkTexture.hasAlpha = true;
    this.rope = MeshBuilder.CreateLines(
      "line",
      { points: [Vector3.Zero(), Vector3.One()], updatable: true },
      this.scene,
    );
    this.rope.color = c("#e8d6a3");
    this.rope.isPickable = false;
    for (let i = 0; i < 60; i++) {
      const m = MeshBuilder.CreateSphere(
        "mote",
        { diameter: 0.04, segments: 3 },
        this.scene,
      );
      m.material = this.materials.glow;
      m.isPickable = false;
      this.dust.push(m);
    }
    window.addEventListener("resize", () => this.engine.resize());
  }
  async load(progress: (n: number) => void) {
    this.physics = new PhysicsWorld(this.scene);
    await this.physics.init();
    await this.assets.load(this.scene, (n) => progress(n * 0.8));
    await this.assets.loadArchitecture(this.scene);
    progress(1);
    this.hero = this.assets.actor("hero", this.scene, "kavi", this.shadow);
    this.ghostActor = this.assets.actor(
      "hero",
      this.scene,
      "ghost",
      this.shadow,
    );
    this.ghostActor.meshes.forEach((m) => {
      m.visibility = 0.3;
    });
    this.ghostActor.root.setEnabled(false);
    this.ghostActor.contact.setEnabled(false);
    this.loaded = true;
  }
  async warmup() {
    const samples = (
      ["raptor", "spitter", "brute", "bomber", "wing", "guardian"] as const
    ).map((kind) =>
      this.assets.actor(kind, this.scene, "warmup-" + kind, this.shadow),
    );
    for (const actor of samples) actor.root.position.set(0, 8, 30);
    this.engine.beginFrame();
    this.scene.render();
    this.engine.endFrame();
    await Promise.all(
      samples.flatMap((actor) =>
        actor.meshes
          .filter((m) => m.material)
          .map((m) => m.material!.forceCompilationAsync(m)),
      ),
    );
    await this.scene.whenReadyAsync();
    samples.forEach((actor) => actor.dispose());
  }
  makeMaterials() {
    const pbr = (name: string, color: string, rough = 0.8, metal = 0) => {
      const m = new PBRMaterial(name, this.scene);
      m.albedoColor = c(color).toLinearSpace();
      m.roughness = rough;
      m.metallic = metal;
      this.materials[name] = m;
      return m;
    };
    const stone = pbr("stone", "#a1aaa0");
    stone.albedoTexture = new Texture(
      "/assets/materials/stone.jpg",
      this.scene,
    );
    stone.bumpTexture = new Texture(
      "/assets/materials/stone-normal.jpg",
      this.scene,
    );
    stone.bumpTexture.level = 0.45;
    const floor = pbr("floor", "#c6cac0");
    floor.albedoTexture = new Texture(
      "/assets/materials/floor-diff.jpg",
      this.scene,
    );
    floor.bumpTexture = new Texture(
      "/assets/materials/floor-nor_gl.jpg",
      this.scene,
    );
    floor.bumpTexture.level = 0.55;
    floor.backFaceCulling = true;
    const cut = pbr("cutstone", "#9ba6a1");
    cut.albedoTexture = stone.albedoTexture;
    cut.bumpTexture = stone.bumpTexture;
    const cliff = stone.clone("cliff");
    cliff.albedoTexture = stone.albedoTexture.clone();
    (cliff.albedoTexture as Texture).uScale = 4;
    (cliff.albedoTexture as Texture).vScale = 4;
    cliff.bumpTexture = stone.bumpTexture.clone();
    (cliff.bumpTexture as Texture).uScale = 4;
    (cliff.bumpTexture as Texture).vScale = 4;
    this.materials.cliff = cliff;
    pbr("edge", "#394d51");
    pbr("brass", "#ac8952", 0.36, 0.72);
    pbr("metal", "#30474c", 0.45, 0.8);
    pbr("wood", "#69513c");
    pbr("grass", "#486552");
    pbr("red", "#b34e35", 0.5, 0.3);
    pbr("white", "#c5d5d0");
    pbr("dark", "#263d43");
    for (const [key, color] of [
      ["glow", "#f2ce88"],
      ["cyan", "#7bdbd1"],
      ["danger", "#f2794e"],
    ]) {
      const m = new StandardMaterial(key, this.scene);
      m.diffuseColor = c(color);
      m.emissiveColor = c(color).scale(0.7);
      m.disableLighting = true;
      this.materials[key] = m;
    }
  }
  makeWater() {
    this.river = createRiver(this.scene);
    this.water = this.river.mesh;
  }
  box(
    name: string,
    p: V,
    size: V,
    mat = "stone",
    solid = true,
    parent = this.root,
  ) {
    const m = MeshBuilder.CreateBox(
      name,
      { width: size.x, height: size.y, depth: size.z },
      this.scene,
    );
    m.position.copyFrom(V(p));
    m.material = this.materials[mat];
    m.parent = parent;
    m.receiveShadows = true;
    m.isPickable = solid;
    m.metadata = { cameraSolid: solid, physics: solid };
    if (size.y > 1) this.shadow.addShadowCaster(m);
    return m;
  }
  cylinder(
    name: string,
    p: V,
    diameter: number,
    height: number,
    mat = "stone",
    top = diameter,
  ) {
    const m = MeshBuilder.CreateCylinder(
      name,
      { diameterBottom: diameter, diameterTop: top, height, tessellation: 16 },
      this.scene,
    );
    m.position.copyFrom(V(p));
    m.material = this.materials[mat];
    m.parent = this.root;
    m.receiveShadows = true;
    this.shadow.addShadowCaster(m);
    m.isPickable = name === "guardian-support";
    m.metadata = { physics: m.isPickable, cameraSolid: m.isPickable };
    return m;
  }
  slab(p: V, w: number, d: number, depth: number, mat = "floor") {
    const mesh = new Mesh("cut-stone", this.scene),
      positions: number[] = [],
      indices: number[] = [],
      uvs: number[] = [],
      normals: number[] = [];
    const bevel = 0.7;
    const outline = [
      [-w / 2 + bevel, -d / 2],
      [w / 2 - bevel, -d / 2],
      [w / 2, -d / 2 + bevel],
      [w / 2, d / 2 - bevel],
      [w / 2 - bevel, d / 2],
      [-w / 2 + bevel, d / 2],
      [-w / 2, d / 2 - bevel],
      [-w / 2, -d / 2 + bevel],
    ];
    for (const [x, z] of outline) {
      positions.push(p.x + x, p.y, p.z + z);
      uvs.push((p.x + x) / 3.6, (p.z + z) / 3.6);
      normals.push(0, 1, 0);
    }
    for (let i = 1; i < 7; i++) indices.push(0, i, i + 1);
    for (let i = 0; i < 8; i++) {
      const j = (i + 1) % 8,
        [x, z] = outline[i],
        [xx, zz] = outline[j],
        start = positions.length / 3,
        len = Math.hypot(xx - x, zz - z),
        nx = (zz - z) / len,
        nz = -(xx - x) / len;
      positions.push(
        p.x + x,
        p.y,
        p.z + z,
        p.x + xx,
        p.y,
        p.z + zz,
        p.x + x,
        p.y - depth,
        p.z + z,
        p.x + xx,
        p.y - depth,
        p.z + zz,
      );
      uvs.push(0, 0, len / 3.6, 0, 0, depth / 3.6, len / 3.6, depth / 3.6);
      for (let k = 0; k < 4; k++) normals.push(nx, 0, nz);
      indices.push(
        start,
        start + 2,
        start + 1,
        start + 1,
        start + 2,
        start + 3,
      );
    }
    const data = new VertexData();
    data.positions = positions;
    data.indices = indices;
    data.normals = normals;
    data.uvs = uvs;
    data.applyToMesh(mesh);
    mesh.material = this.materials[mat];
    mesh.parent = this.root;
    mesh.receiveShadows = true;
    mesh.isPickable = true;
    mesh.metadata = { cameraSolid: true, physics: mat !== "edge" };
    this.shadow.addShadowCaster(mesh);
    return mesh;
  }
  rock(p: V, scale: V, seed: number, mat = "cliff") {
    const m = MeshBuilder.CreateIcoSphere(
      "weathered-rock",
      { radius: 1, subdivisions: 2, flat: false },
      this.scene,
    );
    const pos = m.getVerticesData("position")!;
    for (let i = 0; i < pos.length; i += 3) {
      const n =
        1 +
        0.14 * Math.sin(pos[i] * 8 + seed) +
        0.08 * Math.sin(pos[i + 2] * 13 + seed * 2);
      pos[i] *= n;
      pos[i + 1] *= n;
      pos[i + 2] *= n;
    }
    m.updateVerticesData("position", pos);
    m.position.copyFrom(V(p));
    m.scaling.copyFrom(V(scale));
    m.rotation.y = seed;
    m.material = this.materials[mat];
    m.parent = this.root;
    m.receiveShadows = true;
    m.isPickable = false;
    return m;
  }
  architecture(
    key: string,
    p: V,
    height: number,
    rotation = 0,
    solid = true,
    width?: number,
  ) {
    return this.assets.building(
      key,
      this.scene,
      this.root,
      V(p),
      height,
      rotation,
      solid,
      this.shadow,
      width,
    );
  }
  arch(p: V, w = 15, h = 17) {
    return this.architecture(
      this.sector === 2 || this.sector === 6
        ? "Arch_Gothic_RoundColumn"
        : "Arch_Round_RoundColumn",
      p,
      h + w * 0.3,
      0,
      true,
      w + 3,
    );
  }
  lamp(p: V) {
    this.cylinder("lamp-base", v(p.x, p.y + 0.25, p.z), 0.9, 0.5, "edge");
    this.cylinder("lamp-post", v(p.x, p.y + 1.5, p.z), 0.14, 2.5, "brass");
    const lantern = this.box(
      "lantern",
      v(p.x, p.y + 3, p.z),
      v(0.5, 0.9, 0.5),
      "glow",
      false,
    );
    this.box(
      "lantern-cap",
      v(p.x, p.y + 3.5, p.z),
      v(0.8, 0.18, 0.8),
      "metal",
      false,
    );
    return lantern;
  }
  build(s: Expedition) {
    this.current = s;
    this.particleBursts.forEach((p) => p.system.dispose(false));
    this.particleBursts = [];
    this.sector = s.sector;
    this.root?.dispose(false, false);
    this.root = new TransformNode("sector-" + s.sector, this.scene);
    this.dials = [];
    this.anchors = [];
    this.devices = [];
    this.pointers = [];
    this.gates = [];
    this.pods = [];
    this.cacheMeshes = [];
    this.actors.forEach((a) => a.dispose());
    this.actors.clear();
    this.shots.forEach((m) => m.dispose());
    this.shots.clear();
    this.rings.forEach((m) => m.dispose());
    this.rings.clear();
    this.effects.forEach((e) => e.mesh.dispose());
    this.effects = [];
    const ch = s.chapter;
    this.scene.fogColor = c(ch.sky);
    this.scene.clearColor = new Color4(
      ...(c(ch.sky).asArray() as [number, number, number]),
      1,
    );
    this.river.material.waterColor = c(ch.water);
    this.sun.diffuse = c(ch.color);
    this.yaw = 0;
    let seed = 71 + s.sector * 37;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < ch.points.length; i++) {
      const p = ch.points[i];
      this.slab(p, p.arena ? 46 : 26, p.arena ? 46 : 28, 1.5);
      this.slab(
        v(p.x, p.y - 1.3, p.z),
        p.arena ? 47 : 27,
        p.arena ? 47 : 29,
        0.5,
        "edge",
      );
      for (const side of [-1, 1])
        this.architecture(
          "Column_BridgeSupport",
          v(p.x + side * (p.arena ? 15 : 8), -12, p.z),
          p.y + 11,
          0,
          false,
        );
      if (i % 2) {
        for (const side of [-1, 1]) {
          this.lamp(v(p.x + side * 18, p.y, p.z - 17));
          this.arch(v(p.x + side * 18, p.y, p.z + 18), 5, 8);
        }
      } else {
        this.lamp(v(p.x + 8, p.y, p.z + 5));
      }
      const q = ch.points[i + 1];
      if (q && !q.gap) {
        const left: Vector3[] = [],
          right: Vector3[] = [];
        const dx = q.x - p.x,
          dz = q.z - p.z,
          len = Math.hypot(dx, dz),
          nx = -dz / len,
          nz = dx / len;
        for (let j = 0; j <= 30; j++) {
          const t = j / 30,
            x = p.x + dx * t,
            z = p.z + dz * t,
            y = floorAt(ch, x, z) ?? p.y;
          left.push(new Vector3(x + nx * 5, y + 0.015, z + nz * 5));
          right.push(new Vector3(x - nx * 5, y + 0.015, z - nz * 5));
        }
        const road = MeshBuilder.CreateRibbon(
          "stone-road",
          { pathArray: [left, right], sideOrientation: Mesh.DOUBLESIDE },
          this.scene,
        );
        road.material = this.materials.floor;
        road.parent = this.root;
        road.receiveShadows = true;
        road.metadata = { physics: true, cameraSolid: true };
        const vertices = road.getVerticesData("position")!,
          uv = road.getVerticesData("uv")!;
        for (let k = 0; k < uv.length / 2; k++) {
          uv[k * 2] = vertices[k * 3] / 3.6;
          uv[k * 2 + 1] = vertices[k * 3 + 2] / 3.6;
        }
        road.setVerticesData("uv", uv);
        for (let j = 1; j < 6; j++) {
          const t = j / 6,
            x = p.x + dx * t,
            z = p.z + dz * t,
            y = floorAt(ch, x, z) ?? p.y;
          for (const side of [-1, 1]) {
            this.box(
              "causeway-edge",
              v(x + nx * side * 5.1, y + 0.22, z + nz * side * 5.1),
              v(1, 0.5, 3),
              "cutstone",
              false,
            );
            if (j % 2 === 0)
              this.lamp(v(x + nx * side * 4.5, y, z + nz * side * 4.5));
          }
        }
      }
      if (p.gap) {
        const anchor = MeshBuilder.CreateTorus(
          "grapple-ring",
          { diameter: 3.4, thickness: 0.13, tessellation: 40 },
          this.scene,
        );
        anchor.position.set(p.x, p.y + 6, p.z - 7);
        anchor.rotation.x = Math.PI / 2;
        anchor.material = this.materials.glow;
        anchor.parent = this.root;
        anchor.isPickable = false;
        this.anchors.push(anchor);
        this.arch(v(p.x, p.y, p.z - 8), 11, 10);
      }
      for (let j = 0; j < 5; j++) {
        const side = j % 2 ? 1 : -1,
          x = p.x + side * (13 + rand() * 9),
          z = p.z - 20 + rand() * 40;
        if (Math.abs(z - p.z) > 13 && !p.arena) continue;
        this.assets.prop(
          j % 3 ? "Bush_Small" : "Bush_Large",
          this.scene,
          this.root,
          new Vector3(x, p.y, z),
          1.2 + rand() * 1.8,
        );
      }
      if (i > 0 && i % 2 === 0) {
        const cache = this.box(
          "memory-cache",
          v(p.x + 10, p.y + 0.8, p.z + 6),
          v(1.2, 1.4, 1.2),
          "brass",
          false,
        );
        this.box(
          "cache-light",
          v(p.x + 10, p.y + 1.6, p.z + 6),
          v(0.7, 0.12, 0.7),
          "cyan",
          false,
        );
        this.cacheMeshes.push(cache);
      }
    }
    for (let i = 0; i < 65; i++) {
      const z = -40 + rand() * 540,
        side = i % 2 ? 1 : -1,
        x = side * (100 + rand() * 100),
        y = -10 + rand() * 20;
      this.rock(
        v(x, y - 18, z),
        v(15 + rand() * 20, 20 + rand() * 20, 15 + rand() * 20),
        rand() * 6,
      );
      if (i % 2 === 0)
        this.assets.prop(
          i % 3 ? "BirchTree_1" : "BirchTree_2",
          this.scene,
          this.root,
          new Vector3(x, y + 3, z),
          1.4 + rand() * 1.3,
        );
    }
    for (let i = 0; i < 20; i++) {
      const side = i % 2 ? 1 : -1;
      this.rock(
        v(side * (230 + rand() * 130), 15, -100 + i * 40),
        v(50, 80 + rand() * 70, 60),
        rand() * 10,
        "cutstone",
      );
    }
    for (let j = -3; j <= 3; j++) {
      const mountain = this.rock(
        v(j * 65, -10, 570 + Math.abs(j) * 15),
        v(55, 115 - Math.abs(j) * 14, 65),
        j + 7,
      );
      mountain.metadata = { distant: true };
    }
    ch.beats.forEach((b, i) => {
      const p = ch.points[b.node];
      const device = new TransformNode("device-" + i, this.scene);
      device.parent = this.root;
      device.position.copyFrom(V(p));
      this.devices.push(device);
      if (b.device && b.device !== "rune") {
        const pedestal = this.cylinder(
          "pedestal",
          v(p.x, p.y + 0.7, p.z),
          2.8,
          1.4,
          "stone",
        );
        const ring = MeshBuilder.CreateTorus(
          "brass-dial",
          { diameter: 2.7, thickness: 0.16, tessellation: 36 },
          this.scene,
        );
        ring.material = this.materials.brass;
        ring.position.set(p.x, p.y + 2.6, p.z);
        ring.rotation.x = Math.PI / 2;
        ring.parent = this.root;
        const pointer = this.box(
          "dial-hand",
          v(p.x, p.y + 2.6, p.z),
          v(0.12, 2.3, 0.13),
          "cyan",
          false,
        );
        this.pointers.push(pointer);
        for (let j = 0; j < 4; j++) {
          const a = (j * Math.PI) / 2;
          this.box(
            "dial-notch",
            v(p.x + Math.sin(a) * 1.55, p.y + 2.6 + Math.cos(a) * 1.55, p.z),
            v(0.23, 0.23, 0.23),
            j === ((s.sector + i * 2) % 3) + 1 ? "glow" : "metal",
            false,
          );
        }
      } else
        this.pointers.push(
          this.box(
            "marker",
            v(p.x, p.y - 0.4, p.z),
            v(0.1, 0.1, 0.1),
            "stone",
            false,
          ),
        );
      if (b.device === "rune") {
        const targets =
          s.sector === 2 && i === 1
            ? [0, 3, 1]
            : s.sector === 2
              ? [1, 0, 3]
              : [3, 1, 0];
        for (let j = 0; j < 3; j++) {
          const q = v(p.x + [-7, 7, 0][j], p.y, p.z + [0, 0, 9][j]);
          this.cylinder(
            "linked-wheel-base",
            v(q.x, q.y + 0.6, q.z),
            2.5,
            1.2,
            "cutstone",
          );
          const ring = MeshBuilder.CreateTorus(
            "linked-wheel",
            { diameter: 2.8, thickness: 0.17, tessellation: 40 },
            this.scene,
          );
          ring.position.set(q.x, q.y + 2.3, q.z);
          ring.rotation.x = Math.PI / 2;
          ring.material = this.materials.brass;
          ring.parent = this.root;
          const hand = new TransformNode("wheel-pointer", this.scene);
          hand.parent = this.root;
          hand.position.set(q.x, q.y + 2.3, q.z);
          this.box(
            "pointer",
            v(0, 0.57, 0),
            v(0.12, 1.14, 0.14),
            "cyan",
            false,
            hand,
          );
          this.box(
            "pointer-tip",
            v(0, 1.15, 0),
            v(0.25, 0.16, 0.18),
            "cyan",
            false,
            hand,
          );
          this.dials.push({ beat: i, index: j, hand });
          for (let k = 0; k < 4; k++) {
            const a = (k * Math.PI) / 2;
            this.box(
              "gold-alignment",
              v(q.x + Math.sin(a) * 1.6, q.y + 2.3 + Math.cos(a) * 1.6, q.z),
              v(0.24, 0.24, 0.2),
              k === targets[j] ? "glow" : "metal",
              false,
            );
          }
          const next = v(
            p.x + [-7, 7, 0][(j + 1) % 3],
            p.y,
            p.z + [0, 0, 9][(j + 1) % 3],
          );
          const link = this.box(
            "linked-gears",
            v((q.x + next.x) / 2, p.y + 0.08, (q.z + next.z) / 2),
            v(0.08, 0.06, Math.hypot(q.x - next.x, q.z - next.z)),
            "brass",
            false,
          );
          link.rotation.y = Math.atan2(next.x - q.x, next.z - q.z);
        }
      }
      const gate = this.box(
        "route-seal",
        v(p.x, p.y + 3, p.z + 23),
        v(44, 6, 0.2),
        "cyan",
        false,
      );
      gate.visibility = 0.12;
      this.gates.push(gate);
      if (b.hazard === "blades") {
        this.cylinder("turbine", v(p.x, p.y - 1, p.z), 9, 3, "metal");
      }
    });
    if (s.sector === 6) {
      const p = ch.points[3];
      for (const pillar of [
        v(p.x - 13, p.y, p.z - 11),
        v(p.x + 13, p.y, p.z - 11),
        v(p.x - 13, p.y, p.z + 12),
        v(p.x + 13, p.y, p.z + 12),
      ]) {
        this.cylinder(
          "guardian-support",
          v(pillar.x, pillar.y + 5, pillar.z),
          3.3,
          10,
        );
        for (let j = 0; j < 5; j++)
          this.cylinder(
            "support-stripe",
            v(pillar.x, pillar.y + 1 + j * 1.7, pillar.z),
            3.4,
            0.35,
            "brass",
          );
      }
      this.arch(v(p.x, p.y, p.z + 28), 48, 32);
    }
    if (s.sector === 4)
      for (let i = 0; i < 3; i++)
        this.pods.push(this.cylinder("charge-pod", s.pod(i), 1.7, 2.6, "red"));
    const last = ch.points[7];
    this.arch(v(last.x, last.y, last.z + 23), 22, 22);
    this.arch(v(last.x, last.y, last.z + 34), 26, 30);
    this.dress(s);
    this.batchStatic();
    this.foregroundProps = this.root
      .getChildMeshes()
      .filter((m) =>
        /^(lantern|lantern-cap|lamp-post|lamp-base)$/.test(m.name),
      );
    this.foliage = this.root
      .getChildTransformNodes()
      .filter((n) => n.metadata?.foliage);
    this.wheels = this.root
      .getChildTransformNodes()
      .filter((n) => n.metadata?.wheel);
    this.shadowCasters = [...(this.shadow.getShadowMap()?.renderList || [])];
    this.river.reflect(
      this.staticDraws.filter((m) => m.material === this.materials.cliff),
    );
    this.physics.rebuild(
      this.root.getChildMeshes().filter((m) => m instanceof Mesh) as Mesh[],
      s,
    );
    this.camera.position.set(s.p.x + 8, s.p.y + 7, s.p.z - 12);
    this.camera.setTarget(new Vector3(s.p.x, s.p.y + 2, s.p.z));
  }
  batchStatic() {
    const keep = new Set<Mesh>([
      ...this.anchors,
      ...this.gates,
      ...this.pointers,
      ...this.pods,
      ...this.cacheMeshes,
    ]);
    const groups = new Map<string, Mesh[]>();
    for (const m of this.root.getChildMeshes()) {
      if (
        !(m instanceof Mesh) ||
        !m.getTotalVertices() ||
        m.skeleton ||
        keep.has(m) ||
        /^(lantern|lantern-cap|lamp-post|lamp-base)$/.test(m.name)
      )
        continue;
      let parent = m.parent,
        animated = false;
      while (parent && parent !== this.root) {
        if (
          parent.metadata?.foliage ||
          parent.metadata?.wheel ||
          this.blades.includes(parent as TransformNode) ||
          this.dials.some((d) => d.hand === parent)
        )
          animated = true;
        parent = parent.parent;
      }
      if (animated || m.name === "oncoming-flood") continue;
      m.computeWorldMatrix(true);
      const p = m.getBoundingInfo().boundingBox.centerWorld;
      const key = [
        m.material?.uniqueId,
        Math.floor(p.x / 70),
        Math.floor(p.z / 70),
        !!m.metadata?.physics,
        !!m.metadata?.cameraSolid,
        !!m.metadata?.distant,
        m.getVerticesDataKinds().sort().join(","),
      ].join(":");
      const list = groups.get(key) || [];
      list.push(m);
      groups.set(key, list);
    }
    for (const list of groups.values())
      for (const mesh of list) mesh.setParent(this.root);
    this.staticDraws = [];
    for (const meshes of groups.values()) {
      const metadata = meshes[0].metadata,
        material = meshes[0].material;
      const cast = meshes.some((m) =>
        this.shadow.getShadowMap()?.renderList?.includes(m),
      );
      const merged =
        meshes.length > 1
          ? Mesh.MergeMeshes(meshes, true, true, undefined, false, false)
          : meshes[0];
      if (!merged) continue;
      merged.name = "environment-batch";
      merged.parent = this.root;
      merged.material = material;
      merged.metadata = metadata;
      merged.receiveShadows = true;
      merged.isPickable = !!metadata?.cameraSolid;
      merged.freezeWorldMatrix();
      if (cast) this.shadow.addShadowCaster(merged);
      this.staticDraws.push(merged);
    }
  }
  project(p: V) {
    const out = Vector3.Project(
      V(p),
      Matrix.IdentityReadOnly,
      this.scene.getTransformMatrix(),
      this.camera.viewport.toGlobal(
        this.engine.getRenderWidth(),
        this.engine.getRenderHeight(),
      ),
    );
    return {
      x: (out.x / this.engine.getRenderWidth()) * 100,
      y: (out.y / this.engine.getRenderHeight()) * 100,
      visible: out.z > 0 && out.z < 1,
    };
  }
  dress(s: Expedition) {
    this.blades = [];
    this.chargeMarks.forEach((m) => m.dispose());
    this.chargeMarks.clear();
    const ch = s.chapter;
    for (let i = 0; i < 8; i++) {
      const p = ch.points[i];
      const wide = p.arena ? 21 : 11;
      if (i % 2) {
        for (const side of [-1, 1]) {
          this.architecture(
            "Wall_ArchRound_Overgrown_Broken",
            v(p.x + side * wide, p.y, p.z - 7),
            6.5,
            Math.PI / 2,
            true,
          );
          this.architecture(
            i === 7 ? "Statue_Stag" : "Statue_Fox",
            v(p.x + side * (wide - 1), p.y, p.z + 12),
            i === 7 ? 8 : 5,
            side < 0 ? Math.PI / 2 : -Math.PI / 2,
            true,
          );
          this.architecture(
            "Rail_Straight",
            v(p.x + side * wide, p.y, p.z + 3),
            1.4,
            0,
            true,
          );
          this.architecture(
            "Bricks",
            v(p.x + side * (wide - 2), p.y, p.z - 15),
            0.7,
            i * 0.7,
            false,
          );
          this.architecture(
            "Pot1_Broken",
            v(p.x + side * (wide - 3), p.y, p.z + 17),
            1.1,
            i,
            false,
          );
        }
      } else {
        for (const side of [-1, 1]) {
          this.architecture(
            "Rail_Straight",
            v(p.x + side * 11.8, p.y, p.z - 5),
            1.3,
            0,
            true,
          );
          this.architecture(
            "Column_BridgeSupport",
            v(p.x + side * 8, p.y - 17, p.z),
            17,
            0,
            false,
          );
        }
      }
      if (s.sector === 4) {
        this.architecture("Cart", v(p.x + 15, p.y, p.z - 12), 2.3, 0.4, true);
        this.architecture(
          "Crate",
          v(p.x - 17, p.y, p.z + 14),
          2,
          i * 0.3,
          true,
        );
        this.architecture("Barrel", v(p.x - 19, p.y, p.z + 10), 1.8, 0, true);
      }
      if (s.sector === 0 && i % 2 === 1) {
        this.architecture(
          "Flag_Wall",
          v(p.x - 20, p.y + 5, p.z - 7),
          4,
          Math.PI / 2,
          false,
        );
        this.architecture("Barrel", v(p.x + 18, p.y, p.z - 12), 1.6, 0, true);
      }
      // A planted perimeter gives each deck a silhouette without hiding the playable floor.
      if ([0, 1, 2, 3].includes(s.sector)) {
        for (const side of [-1, 1]) {
          const x = p.x + side * (p.arena ? 21 : 11),
            z = p.z + (i % 2 ? 14 : 5);
          this.assets.prop(
            "BirchTree_1",
            this.scene,
            this.root,
            new Vector3(x, p.y, z),
            s.sector === 3 ? 2.3 : 1.25,
          );
        }
      }
      if (i % 2) {
        const ring = MeshBuilder.CreateTorus(
          "terrace-inlay",
          { diameter: 32, thickness: 0.045, tessellation: 80 },
          this.scene,
        );
        ring.position.set(p.x, p.y + 0.035, p.z);
        ring.material = this.materials.brass;
        ring.parent = this.root;
        ring.isPickable = false;
        for (let j = 0; j < 12; j++) {
          const a = (j * Math.PI) / 6;
          const m = this.box(
            "inlaid-route",
            v(p.x + Math.sin(a) * 16, p.y + 0.04, p.z + Math.cos(a) * 16),
            v(0.17, 0.025, 1.4),
            "brass",
            false,
          );
          m.rotation.y = a;
        }
      }
      if (s.sector === 2) {
        for (const side of [-1, 1]) {
          this.box(
            "garden-channel",
            v(p.x + side * 10, p.y + 0.04, p.z),
            v(0.7, 0.08, p.arena ? 33 : 23),
            "cyan",
            false,
          );
          for (let j = -1; j <= 1; j++) {
            this.cylinder(
              "garden-column",
              v(p.x + side * 17, p.y + 4, p.z + j * 12),
              0.75,
              8,
              "cutstone",
            );
            this.box(
              "pergola-beam",
              v(p.x, p.y + 8, p.z + j * 12),
              v(35, 0.45, 0.6),
              "wood",
              false,
            );
          }
        }
      }
      if (s.sector === 4) {
        for (const side of [-1, 1]) {
          this.box(
            "rail",
            v(p.x + side * 2, p.y + 0.06, p.z),
            v(0.12, 0.12, p.arena ? 38 : 26),
            "metal",
            false,
          );
          this.box(
            "quarry-gantry",
            v(p.x + side * 14, p.y + 8, p.z + 5),
            v(1.2, 16, 1.2),
            "wood",
          );
          for (let j = 0; j < 3; j++) {
            const ore = this.rock(
              v(p.x + side * 19, p.y + 1.2, p.z - 10 + j * 8),
              v(1, 2.5, 1.2),
              j + 0.3,
              "red",
            );
            ore.rotation.z = side * 0.3;
          }
        }
        this.box(
          "gantry-crossbeam",
          v(p.x, p.y + 16, p.z + 5),
          v(30, 1.2, 1.2),
          "wood",
          false,
        );
      }
      if (s.sector === 5 && i % 2) {
        const frame = new TransformNode("pressure-wheel", this.scene);
        frame.parent = this.root;
        frame.position.set(p.x + 32, p.y + 12, p.z);
        const wheel = MeshBuilder.CreateTorus(
          "turbine-rim",
          { diameter: 24, thickness: 0.7, tessellation: 60 },
          this.scene,
        );
        wheel.parent = frame;
        wheel.rotation.z = Math.PI / 2;
        wheel.material = this.materials.brass;
        for (let j = 0; j < 12; j++) {
          const a = (j * Math.PI) / 6,
            m = this.box(
              "turbine-spoke",
              v(0, Math.sin(a) * 6, Math.cos(a) * 6),
              v(0.6, 1.3, 12),
              "metal",
              false,
              frame,
            );
          m.rotation.x = -a;
        }
        frame.metadata = { wheel: true };
      }
    }
    ch.beats.forEach((b) => {
      if (b.hazard !== "blades") return;
      const p = ch.points[b.node];
      const root = new TransformNode("sweeping-turbine", this.scene);
      root.parent = this.root;
      root.position.set(p.x, p.y + 0.65, p.z);
      this.box("sweep-arm", v(0, 0, 0), v(0.5, 0.28, 43), "brass", false, root);
      this.box(
        "sweep-edge",
        v(0.3, 0.15, 0),
        v(0.08, 0.08, 43),
        "danger",
        false,
        root,
      );
      this.blades.push(root);
    });
    // The distant aqueduct is a landmark that establishes the height of the route.
    for (let j = 0; j < 6; j++)
      this.arch(v(85 + j * 22, -3, 95 + j * 36), 19, 29 + j * 2);
    if (s.sector === 7) {
      this.flood = this.box(
        "oncoming-flood",
        v(0, 4, -65),
        v(180, 13, 8),
        "cyan",
        false,
      );
      this.flood.visibility = 0.45;
    }
  }
  burst(p: V, mat = "glow", count = 12) {
    const particles = new ParticleSystem("impact-sparks", count, this.scene);
    particles.particleTexture = this.sparkTexture;
    particles.emitter = new Vector3(p.x, p.y + 1, p.z);
    particles.minEmitBox = Vector3.Zero();
    particles.maxEmitBox = Vector3.Zero();
    particles.direction1 = new Vector3(-1, 0.4, -1);
    particles.direction2 = new Vector3(1, 1.5, 1);
    particles.minEmitPower = 3;
    particles.maxEmitPower = 7;
    particles.gravity = new Vector3(0, -12, 0);
    particles.minSize = 0.06;
    particles.maxSize = 0.2;
    particles.minLifeTime = 0.2;
    particles.maxLifeTime = 0.6;
    const color = c(
      mat === "danger" ? "#ed813e" : mat === "cyan" ? "#85ddd2" : "#efd293",
    );
    particles.color1 = new Color4(color.r, color.g, color.b, 1);
    particles.color2 = particles.color1;
    particles.colorDead = new Color4(color.r, color.g, color.b, 0);
    particles.blendMode = ParticleSystem.BLENDMODE_ADD;
    particles.manualEmitCount = count;
    particles.emitRate = 0;
    particles.updateSpeed = 1 / 60;
    particles.start();
    this.particleBursts.push({ system: particles, life: 1.1 });
  }
  event(e: Event, s: Expedition) {
    if (
      ["hit", "kill", "armour", "secured", "heal", "grapple", "stun"].includes(
        e.type,
      )
    )
      this.burst(
        e.p || s.p,
        e.type === "heal" ? "cyan" : "glow",
        e.type === "kill" ? 22 : 10,
      );
    if (["slam", "burst", "explode"].includes(e.type)) {
      this.burst(e.p || s.p, e.type === "explode" ? "danger" : "cyan", 35);
      this.shake = 0.35;
    }
    if (e.type === "hurt") this.shake = 0.2;
    if (e.type === "attack") {
      const points = [];
      for (let i = 0; i < 20; i++) {
        const a = s.yaw - 1.4 + (i / 19) * 2.8;
        points.push(
          new Vector3(
            s.p.x + Math.sin(a) * 3.5,
            s.p.y + 1.1 + Math.sin((i / 19) * Math.PI) * 0.5,
            s.p.z + Math.cos(a) * 3.5,
          ),
        );
      }
      const m = MeshBuilder.CreateTube(
        "spear-arc",
        { path: points, radius: 0.055, tessellation: 5 },
        this.scene,
      );
      m.material = this.materials.glow;
      this.effects.push({
        mesh: m,
        life: 0.16,
        max: 0.16,
        velocity: Vector3.Zero(),
      });
    }
  }
  update(s: Expedition, dt: number) {
    if (!this.loaded) return;
    this.current = s;
    if (this.sector !== s.sector) this.build(s);
    this.scene.animationsEnabled = dt > 0;
    for (const p of this.particleBursts) {
      p.system.updateSpeed = dt > 0 ? 1 / 60 : 0;
      p.life -= dt;
      if (p.life <= 0) p.system.dispose(false);
    }
    this.particleBursts = this.particleBursts.filter((p) => p.life > 0);
    this.time += dt;
    this.hero.player(s, dt);
    for (const e of s.enemies) {
      let a = this.actors.get(e.id);
      if (!a) {
        a = this.assets.actor(e.kind, this.scene, "enemy-" + e.id, this.shadow);
        this.actors.set(e.id, a);
      }
      a.enemy(e, dt);
    }
    for (const [id, a] of this.actors)
      if (!s.enemies.some((e) => e.id === id)) {
        a.dispose();
        this.actors.delete(id);
      }
    this.foliage.forEach(
      (n) =>
        (n.rotation.z = Math.sin(this.time * 0.8 + n.metadata.phase) * 0.012),
    );
    this.dials.forEach((d) => {
      d.hand.rotation.z =
        (-(d.beat === s.beat ? s.runes[d.index] : 0) * Math.PI) / 2;
    });
    this.blades.forEach((m) => (m.rotation.y = s.time * 0.75));
    this.wheels.forEach((n) => (n.rotation.x = s.time * 0.2));
    if (s.sector === 7 && this.flood) {
      this.flood.position.z = s.seconds * 0 + (110 - s.escape) * 4 - 65;
      this.flood.position.y = 4 + (110 - s.escape) * 0.12;
    }
    for (const e of s.living) {
      let mark = this.chargeMarks.get(e.id);
      if (!mark) {
        mark = MeshBuilder.CreateGround(
          "attack-tell",
          {
            width: e.kind === "guardian" ? 4 : 1.5,
            height: e.kind === "guardian" ? 36 : 9,
          },
          this.scene,
        );
        mark.material = this.materials.danger;
        mark.visibility = 0.22;
        mark.isPickable = false;
        this.chargeMarks.set(e.id, mark);
      }
      mark.setEnabled(
        e.state === "windup" && ["guardian", "raptor", "wing"].includes(e.kind),
      );
      mark.position.set(
        e.p.x + e.dir.x * (e.kind === "guardian" ? 18 : 4.5),
        e.p.y + 0.08,
        e.p.z + e.dir.z * (e.kind === "guardian" ? 18 : 4.5),
      );
      mark.rotation.y = Math.atan2(e.dir.x, e.dir.z);
    }
    for (const [id, m] of this.chargeMarks)
      if (!s.living.some((e) => e.id === id)) {
        m.dispose();
        this.chargeMarks.delete(id);
      }
    this.gates.forEach((m, i) => m.setEnabled(i === s.beat && !s.clear));
    this.pointers.forEach((m, i) => {
      if (i === s.beat) m.rotation.z = (-s.deviceTurn * Math.PI) / 2;
    });
    this.anchors.forEach((m) => (m.rotation.z = this.time * 0.35));
    this.pods.forEach((m, i) => {
      m.position.copyFrom(V(s.pod(i)));
      m.position.y += 1.3;
      m.setEnabled(!s.podUsed.has(i));
    });
    for (const shot of s.shots) {
      let m = this.shots.get(shot.id);
      if (!m) {
        m = MeshBuilder.CreateSphere(
          "shot",
          { diameter: shot.friendly ? 0.3 : 0.7, segments: 6 },
          this.scene,
        );
        m.material = this.materials[shot.friendly ? "glow" : "danger"];
        m.isPickable = false;
        this.shots.set(shot.id, m);
      }
      m.position.copyFrom(V(shot.p));
      m.scaling.z = shot.friendly ? 6 : 1;
    }
    for (const [id, m] of this.shots)
      if (!s.shots.some((x) => x.id === id)) {
        m.dispose();
        this.shots.delete(id);
      }
    for (const ring of s.rings) {
      let m = this.rings.get(ring.id);
      if (!m) {
        m = MeshBuilder.CreateTorus(
          "shockwave",
          { diameter: 2, thickness: 0.1, tessellation: 64 },
          this.scene,
        );
        m.material = this.materials[ring.damage ? "danger" : "cyan"];
        m.isPickable = false;
        this.rings.set(ring.id, m);
      }
      m.position.set(ring.p.x, ring.p.y + 0.3, ring.p.z);
      m.scaling.set(Math.max(0.1, ring.r), 1, Math.max(0.1, ring.r));
      m.visibility = Math.min(1, ring.life * 2);
    }
    for (const [id, m] of this.rings)
      if (!s.rings.some((x) => x.id === id)) {
        m.dispose();
        this.rings.delete(id);
      }
    for (const e of this.effects) {
      e.life -= dt;
      e.mesh.position.addInPlace(e.velocity.scale(dt));
      e.velocity.y -= 12 * dt;
      e.mesh.visibility = Math.max(0, e.life / e.max);
      if (e.life <= 0) e.mesh.dispose();
    }
    this.effects = this.effects.filter((e) => e.life > 0);
    const g = s.grapple;
    this.rope.setEnabled(!!g);
    if (g)
      MeshBuilder.CreateLines("line", {
        points: [
          new Vector3(s.p.x, s.p.y + 1.5, s.p.z),
          new Vector3(g.to.x, g.to.y + 6, g.to.z),
        ],
        instance: this.rope,
      });
    this.dust.forEach((m, i) =>
      m.position.set(
        s.p.x + Math.sin(i * 17 + this.time * 0.08) * 25,
        s.p.y + 1 + (i % 13) + Math.cos(this.time + i) * 0.3,
        s.p.z + Math.cos(i * 12 + this.time * 0.04) * 25,
      ),
    );
    if (this.ghostActor) {
      const frame = this.ghostFrames.find(
        (f) => f.t >= s.seconds && f.sector === s.sector,
      );
      this.ghostActor.root.setEnabled(
        !!frame && this.ghostEnabled && !this.menu,
      );
      if (frame) {
        this.ghostActor.root.position.set(frame.x, frame.y, frame.z);
        this.ghostActor.root.rotation.y = frame.yaw;
        this.ghostActor.play("Run", 1.5);
        this.ghostActor.update(dt);
      }
    }
    let target: Vector3, desired: Vector3;
    if (this.menu) {
      target = new Vector3(6, 13, 45);
      desired = new Vector3(29 + Math.sin(this.time * 0.05) * 5, 27, 5);
    } else {
      target = new Vector3(
        s.p.x + Math.sin(this.yaw) * 2,
        s.p.y + 2.1,
        s.p.z + Math.cos(this.yaw) * 2,
      );
      const bossPresent = s.living.some((e) => e.kind === "guardian");
      const distance = s.grapple ? 13 : bossPresent ? 17 : 9.5;
      if (bossPresent) target.y += 2.5;
      desired = new Vector3(
        s.p.x - Math.sin(this.yaw) * distance,
        s.p.y + (bossPresent ? 7 : 3) + this.pitch * 5,
        s.p.z - Math.cos(this.yaw) * distance,
      );
      const ray = new Ray(
        target,
        desired.subtract(target).normalize(),
        Vector3.Distance(target, desired),
      );
      const hit = this.scene.pickWithRay(ray, (m) => !!m.metadata?.cameraSolid);
      if (hit?.hit && hit.distance > 1.5)
        desired = target.add(
          ray.direction.scale(Math.max(2, hit.distance - 0.6)),
        );
    }
    this.shake = Math.max(0, this.shake - dt);
    if (this.shake > 0 && !this.reduced) {
      desired.x += (Math.random() - 0.5) * this.shake * 0.8;
      desired.y += (Math.random() - 0.5) * this.shake * 0.6;
    }
    this.camera.position = Vector3.Lerp(
      this.camera.position,
      desired,
      1 - Math.exp(-dt * 10),
    );
    this.camera.setTarget(target);
    const sight = target.subtract(this.camera.position),
      sightLength = sight.length(),
      sightDir = sight.normalizeToNew();
    const occludes = (center: Vector3, radius: number) => {
      const along = Vector3.Dot(
        center.subtract(this.camera.position),
        sightDir,
      );
      return (
        along > 0 &&
        along < sightLength - 1 &&
        Vector3.Distance(
          center,
          this.camera.position.add(sightDir.scale(along)),
        ) < radius
      );
    };
    for (const actor of this.actors.values()) {
      const center = actor.root.position.add(
        new Vector3(0, actor.height * 0.5, 0),
      );
      const alpha = occludes(center, actor.height * 0.45) ? 0.22 : 1;
      actor.meshes.forEach((m) => (m.visibility = alpha));
    }
    for (const prop of this.foregroundProps) {
      prop.visibility = occludes(
        prop.getBoundingInfo().boundingBox.centerWorld,
        0.8,
      )
        ? 0.15
        : 1;
      prop.isVisible =
        Vector3.Distance(
          prop.getBoundingInfo().boundingBox.centerWorld,
          V(s.p),
        ) < 110;
    }

    this.camera.fov = mixF(
      this.camera.fov,
      !this.reduced && (s.dodge > 0 || s.grapple) ? 1.14 : 1.02,
      dt * 5,
    );
    this.sun.position.set(s.p.x + 40, s.p.y + 60, s.p.z - 35);
    this.sun.setDirectionToTarget(new Vector3(s.p.x, s.p.y, s.p.z + 12));
    if (++this.visibilityTick % 15 === 0) {
      for (const n of this.foliage)
        n.setEnabled(
          Math.hypot(n.position.x - s.p.x, n.position.z - s.p.z) < 145,
        );
      this.shadow.getShadowMap()!.renderList = [
        ...this.shadowCasters.filter(
          (m) =>
            !m.isDisposed() &&
            Vector3.Distance(
              m.getBoundingInfo().boundingBox.centerWorld,
              V(s.p),
            ) < 80,
        ),
        ...this.hero.meshes,
        ...[...this.actors.values()].flatMap((a) => a.meshes),
      ];
      for (const m of this.staticDraws) {
        const b = m.getBoundingInfo().boundingBox,
          center = b.centerWorld;
        const radius = b.extendSizeWorld.length();
        m.isVisible =
          !!m.metadata?.distant ||
          Math.hypot(center.x - s.p.x, center.z - s.p.z) < 150 + radius;
      }
    }
    this.scene.render();
    if (dt > 0) {
      this.frameTimes.push(dt * 1000);
      if (this.frameTimes.length > 600) this.frameTimes.shift();
    }
  }
  setQuality(q: string) {
    this.quality = q;
    this.engine.setHardwareScalingLevel(
      q === "low" ? 1.8 : q === "balanced" ? 1.25 : 1,
    );
    this.pipeline.samples = q === "high" ? 4 : 1;
    this.pipeline.bloomEnabled = q !== "low";
    if ((q !== "low") !== this.aoEnabled) {
      this.aoEnabled = q !== "low";
      if (this.aoEnabled)
        this.scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(
          "contact-shadows",
          this.camera,
        );
      else
        this.scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(
          "contact-shadows",
          this.camera,
        );
    }
    this.shadow.getShadowMap()!.refreshRate = q === "low" ? 3 : 1;
    this.river?.material.enableRenderTargets(q !== "low");
  }
}
const mixF = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, t);
