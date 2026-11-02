import { stormSpur, stormGrapple } from "./storm-road";
import { EncounterGate } from "./encounter-gate";
import { actorSight, actorOpacity } from "./actor-visibility";
import {
  Engine,
  Scene,
  Vector3,
  Color3,
  Color4,
  FreeCamera,
  HemisphericLight,
  PointLight,
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
  SubMesh,
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
import "@babylonjs/core/Culling/Octrees/octreeSceneComponent";
import { Assets, Actor } from "./actors";
import { PhysicsWorld } from "./physics";
import { createRiver } from "./water";
import { weatheredStone, pavingMaterial } from "./surfaces";
import { terraceStructure, bridgeStructure } from "./structures";
import { landmarks } from "./landmarks";
import { landscapeHeight, LANDSCAPES } from "./landscape";
import { fadeFoliage, type FoliageView } from "./foliage";
import {
  quarryMaterials,
  quarryBench,
  quarryYard,
  quarryCharge,
} from "./quarry";
import { forestMaterials, forestTerrace, forestBridge } from "./forest";
import { PressureGallery } from "./pressure-gallery";
import { SkyMaterial } from "@babylonjs/materials/sky";
import { CHAPTERS, ASSETS, floorAt, v, type V } from "./level";
import { Expedition, clamp, type Event } from "./engine";
const c = (s: string) => Color3.FromHexString(s);
const V = (p: V) => new Vector3(p.x, p.y, p.z);
export class GameScene {
  surfaceClimate = new Vector3(0.3, 0.8, 0);
  landscapeClimate = new Vector3(0.42, 0, 0);
  lampPositions: Vector3[] = [];
  lampLights: PointLight[] = [];
  cascadeTexture!: DynamicTexture;
  rain!: ParticleSystem;
  motes!: ParticleSystem;
  sparkTexture!: DynamicTexture;
  particleBursts: { system: ParticleSystem; life: number }[] = [];
  foregroundProps: AbstractMesh[] = [];
  shadowCasters: AbstractMesh[] = [];
  foliage: TransformNode[] = [];
  foliageViews: FoliageView[] = [];
  wheels: TransformNode[] = [];
  staticDraws: Mesh[] = [];
  visibilityTick = 0;
  dials: { beat: number; index: number; hand: TransformNode }[] = [];
  blades: TransformNode[] = [];
  pressureGallery?: PressureGallery;
  quarrySmoke?: ParticleSystem;
  quarryCrane?: {
    dynamicMeshes: Mesh[];
    load: TransformNode;
    lever: TransformNode;
    update(s: Expedition): void;
  };
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
  landingKick = 0;
  craneFraming = 0;
  ao: SSAO2RenderingPipeline;
  aoEnabled = true;
  quality = "high";
  reduced = false;
  loaded = false;
  anchors: Mesh[] = [];
  devices: TransformNode[] = [];
  gates: EncounterGate[] = [];
  pointers: Mesh[] = [];
  pods: Mesh[] = [];
  cacheMeshes: AbstractMesh[] = [];
  memoryCaches: {
    key: string;
    lid: TransformNode;
    light: Mesh;
    opened: number;
  }[] = [];
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
  worldMaterials = new Set<PBRMaterial>();
  pendingWorldFreeze = 0;
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
    hemi.intensity = 0.22;
    hemi.diffuse = c("#b7d4dc");
    hemi.groundColor = c("#39434b");
    this.sun = new DirectionalLight(
      "sun",
      new Vector3(-0.6, -0.8, 0.4),
      this.scene,
    );
    this.sun.intensity = 3.6;
    for (let i = 0; i < 2; i++) {
      const light = new PointLight(
        "nearby-lantern-" + i,
        Vector3.Zero(),
        this.scene,
      );
      light.diffuse = c("#ffc778");
      light.intensity = 0;
      light.range = 13;
      this.lampLights.push(light);
    }
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
    this.shadow.darkness = 0;
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
    this.scene.environmentIntensity = 0.35;
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
    this.motes = new ParticleSystem("valley-motes", 100, this.scene);
    this.motes.particleTexture = this.sparkTexture;
    this.motes.emitter = Vector3.Zero();
    this.motes.minEmitBox = new Vector3(-25, 0, -25);
    this.motes.maxEmitBox = new Vector3(25, 13, 25);
    this.motes.direction1 = new Vector3(-0.1, 0.04, -0.1);
    this.motes.direction2 = new Vector3(0.1, 0.2, 0.1);
    this.motes.minEmitPower = 0.3;
    this.motes.maxEmitPower = 0.8;
    this.motes.minLifeTime = 4;
    this.motes.maxLifeTime = 6;
    this.motes.minSize = 0.035;
    this.motes.maxSize = 0.09;
    this.motes.color1 = new Color4(0.9, 0.75, 0.45, 0.35);
    this.motes.color2 = new Color4(0.7, 0.85, 0.8, 0.25);
    this.motes.colorDead = new Color4(0.7, 0.8, 0.7, 0);
    this.motes.emitRate = 16;
    this.motes.updateSpeed = 1 / 60;
    this.motes.start();
    this.rain = new ParticleSystem("storm-rain", 500, this.scene);
    this.rain.particleTexture = this.sparkTexture;
    this.rain.emitter = Vector3.Zero();
    this.rain.minEmitBox = new Vector3(-22, 0, -22);
    this.rain.maxEmitBox = new Vector3(22, 0, 22);
    this.rain.direction1 = new Vector3(-0.12, -1, 0.04);
    this.rain.direction2 = new Vector3(-0.08, -1, 0.08);
    this.rain.minEmitPower = 26;
    this.rain.maxEmitPower = 32;
    this.rain.minLifeTime = 0.7;
    this.rain.maxLifeTime = 1.1;
    this.rain.minSize = 0.025;
    this.rain.maxSize = 0.045;
    this.rain.minScaleY = 12;
    this.rain.maxScaleY = 22;
    this.rain.color1 = new Color4(0.6, 0.75, 0.8, 0.22);
    this.rain.color2 = new Color4(0.75, 0.85, 0.9, 0.14);
    this.rain.colorDead = new Color4(0.7, 0.8, 0.9, 0);
    this.rain.emitRate = 200;
    this.rain.updateSpeed = 1 / 60;
    this.rain.start();
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
    const cascade = new StandardMaterial("spillway-water", this.scene);
    this.cascadeTexture = new DynamicTexture(
      "cascade-streaks",
      { width: 256, height: 256 },
      this.scene,
      true,
    );
    const ink = this.cascadeTexture.getContext();
    ink.clearRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x++) {
      const edge = Math.sin((x / 255) * Math.PI),
        a = (0.25 + 0.22 * Math.sin(x * 0.7) + 0.1 * Math.sin(x * 2.9)) * edge;
      ink.fillStyle = "rgba(181,225,218," + Math.max(0.04, a) + ")";
      ink.fillRect(x, 0, 1, 256);
    }
    for (let y = 0; y < 256; y += 16) {
      ink.fillStyle = "rgba(215,246,237,0.08)";
      ink.fillRect(0, y, 256, 2);
    }
    this.cascadeTexture.hasAlpha = true;
    this.cascadeTexture.update();
    cascade.diffuseTexture = this.cascadeTexture;
    cascade.useAlphaFromDiffuseTexture = true;
    cascade.emissiveColor = c("#527f7d");
    cascade.backFaceCulling = false;
    cascade.disableDepthWrite = true;
    this.materials.cascade = cascade;
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
    this.materials.terrain = weatheredStone(
      "gorge-stone",
      this.scene,
      stone.albedoTexture as Texture,
      "#899383",
      0.13,
      this.landscapeClimate,
    );
    this.materials.masonry = weatheredStone(
      "structural-stone",
      this.scene,
      stone.albedoTexture as Texture,
      "#87927e",
      0.45,
    );
    const terrainNormal = (stone.bumpTexture as Texture).clone();
    terrainNormal.uScale = 96;
    terrainNormal.vScale = 134;
    terrainNormal.level = 0.45;
    (this.materials.terrain as PBRMaterial).bumpTexture = terrainNormal;
    this.materials.floor = pavingMaterial(this.scene, this.surfaceClimate);
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
    const channel = pbr("channel", "#2f6a62", 0.24, 0.15);
    channel.alpha = 0.84;
    channel.clearCoat.isEnabled = true;
    channel.clearCoat.intensity = 0.4;
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
  terrainHeight(x: number, z: number) {
    return landscapeHeight(
      CHAPTERS[this.sector < 0 ? 0 : this.sector],
      this.sector < 0 ? 0 : this.sector,
      x,
      z,
    );
  }
  makeLandscape() {
    const terrain = MeshBuilder.CreateGround(
      "river-gorge",
      { width: 720, height: 1000, subdivisions: 180, updatable: true },
      this.scene,
    );
    terrain.position.z = 230;
    const positions = terrain.getVerticesData("position")!;
    for (let i = 0; i < positions.length; i += 3)
      positions[i + 1] = this.terrainHeight(
        positions[i],
        positions[i + 2] + 230,
      );
    const normals: number[] = [];
    VertexData.ComputeNormals(positions, terrain.getIndices()!, normals);
    terrain.updateVerticesData("position", positions);
    terrain.updateVerticesData("normal", normals);
    terrain.refreshBoundingInfo();
    terrain.material = this.materials.terrain;
    terrain.parent = this.root;
    // Preserve every triangle and vertex; smaller bounds let Babylon reject
    // terrain tiles before testing camera rays against their triangles.
    const indices = terrain.getIndices()!;
    const tiles: number[][] = Array.from({ length: 36 }, () => []);
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i] * 3,
        b = indices[i + 1] * 3,
        d = indices[i + 2] * 3;
      const x = (positions[a] + positions[b] + positions[d]) / 3;
      const z = (positions[a + 2] + positions[b + 2] + positions[d + 2]) / 3;
      const col = Math.min(5, Math.max(0, Math.floor((x + 360) / 120)));
      const row = Math.min(5, Math.max(0, Math.floor((z + 500) / (1000 / 6))));
      tiles[row * 6 + col].push(indices[i], indices[i + 1], indices[i + 2]);
    }
    terrain.setIndices(tiles.flat());
    terrain.releaseSubMeshes();
    let offset = 0;
    for (const tile of tiles) {
      new SubMesh(
        0,
        0,
        terrain.getTotalVertices(),
        offset,
        tile.length,
        terrain,
      );
      offset += tile.length;
    }
    const cameraTerrain = terrain.clone("gorge-camera-query", this.root, true);
    cameraTerrain.isVisible = false;
    cameraTerrain.isPickable = true;
    cameraTerrain.metadata = {
      cameraSolid: true,
      cameraQuery: true,
      physics: false,
    };
    cameraTerrain.computeWorldMatrix(true);
    cameraTerrain.createOrUpdateSubmeshesOctree(8, 2);
    cameraTerrain.freezeWorldMatrix();
    // The visible surface keeps one draw; the hidden query shares its geometry.
    terrain.releaseSubMeshes();
    new SubMesh(0, 0, terrain.getTotalVertices(), 0, indices.length, terrain);
    terrain.receiveShadows = true;
    terrain.isPickable = true;
    terrain.metadata = {
      landscape: true,
      distant: true,
      cameraSolid: false,
      physics: false,
    };
  }
  addCascade(p: V, width: number, height: number) {
    const left: Vector3[] = [],
      right: Vector3[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16,
        z = p.z - Math.sin((t * Math.PI) / 2) * 1.6;
      left.push(new Vector3(p.x - width / 2, p.y - height * t, z));
      right.push(new Vector3(p.x + width / 2, p.y - height * t, z));
    }
    const mesh = MeshBuilder.CreateRibbon(
      "spillway-cascade",
      { pathArray: [left, right], sideOrientation: Mesh.DOUBLESIDE },
      this.scene,
    );
    mesh.material = this.materials.cascade;
    mesh.parent = this.root;
    mesh.isPickable = false;
    mesh.metadata = { animatedWater: true };
    const foam = MeshBuilder.CreateGround(
      "spillway-foam",
      { width: width * 1.7, height: 6 },
      this.scene,
    );
    foam.position.set(p.x, p.y - height + 0.1, p.z - 2);
    foam.material = this.materials.cascade;
    foam.parent = this.root;
    foam.isPickable = false;
    foam.metadata = { animatedWater: true };
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
  memoryCache(p: V, key: string, s: Expedition) {
    const chest = this.architecture("Chest_Gold", p, 1.3, 0, false);
    const meshes = chest.getChildMeshes();
    const tops = meshes.filter((m) => m.name.includes("Top"));
    const lid = new TransformNode("memory-lid", this.scene);
    lid.parent = chest;
    if (tops.length) {
      const min = new Vector3(Infinity, Infinity, Infinity),
        max = new Vector3(-Infinity, -Infinity, -Infinity);
      for (const mesh of tops) {
        mesh.computeWorldMatrix(true);
        const b = mesh.getBoundingInfo().boundingBox;
        min.minimizeInPlace(b.minimumWorld);
        max.maximizeInPlace(b.maximumWorld);
      }
      lid.setAbsolutePosition(new Vector3((min.x + max.x) / 2, min.y, max.z));
      for (const mesh of tops) mesh.setParent(lid);
    }
    const light = MeshBuilder.CreateSphere(
      "memory-glimmer",
      { diameter: 0.16, segments: 8 },
      this.scene,
    );
    light.position.set(p.x, p.y + 1.65, p.z);
    light.parent = this.root;
    light.material = this.materials.cyan;
    light.isPickable = false;
    this.cacheMeshes.push(...meshes, light);
    const opened = s.secrets.includes(key) ? 1 : 0;
    lid.rotation.x = opened * 1.15;
    light.setEnabled(!opened);
    this.memoryCaches.push({ key, lid, light, opened });
  }
  lamp(p: V) {
    const parts: Mesh[] = [];
    const cylinder = (
      name: string,
      y: number,
      diameter: number,
      height: number,
      top = diameter,
    ) => {
      const mesh = this.cylinder(
        name,
        v(p.x, p.y + y, p.z),
        diameter,
        height,
        "metal",
        top,
      );
      parts.push(mesh);
      return mesh;
    };
    cylinder("lantern-foot", 0.16, 0.85, 0.32);
    cylinder("lantern-foot-ring", 0.36, 0.58, 0.12);
    cylinder("lantern-shaft", 1.62, 0.12, 2.5);
    cylinder("lantern-collar", 2.7, 0.3, 0.12);
    cylinder("lantern-cup", 2.86, 0.75, 0.18, 0.62);
    cylinder("lantern-roof", 3.66, 0.95, 0.42, 0.16);
    cylinder("lantern-finial", 3.95, 0.12, 0.2, 0.03);
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      parts.push(
        this.box(
          "lantern-mullion",
          v(
            p.x + Math.sin(angle) * 0.33,
            p.y + 3.19,
            p.z + Math.cos(angle) * 0.33,
          ),
          v(0.045, 0.68, 0.045),
          "metal",
          false,
        ),
      );
    }
    const frame = Mesh.MergeMeshes(parts, true, true, undefined, false, false)!;
    frame.name = "lamp-post";
    frame.parent = this.root;
    frame.material = this.materials.metal;
    frame.receiveShadows = true;
    frame.isPickable = false;
    frame.metadata = { physics: false, cameraSolid: false };
    this.shadow.addShadowCaster(frame);
    const lantern = MeshBuilder.CreateCylinder(
      "lantern",
      { diameter: 0.57, height: 0.65, tessellation: 6 },
      this.scene,
    );
    lantern.position.set(p.x, p.y + 3.19, p.z);
    lantern.material = this.materials.glow;
    lantern.parent = this.root;
    lantern.isPickable = false;
    this.lampPositions.push(new Vector3(p.x, p.y + 3.1, p.z));
    return lantern;
  }
  build(s: Expedition) {
    for (const _ of this.buildSteps(s)) {
      /* synchronous developer/load path */
    }
    this.freezeWorldMaterials();
  }
  async buildAsync(s: Expedition) {
    let slice = performance.now();
    for (const _ of this.buildSteps(s)) {
      if (performance.now() - slice >= 5) {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
        slice = performance.now();
      }
    }
  }
  async prepareArea(s: Expedition) {
    this.update(s, 0, false);
    let slice = performance.now();
    for (const mesh of this.scene.meshes) {
      while (!mesh.isReady(true))
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
      if (performance.now() - slice >= 5) {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
        slice = performance.now();
      }
    }
    await this.scene.whenReadyAsync();
    this.freezeWorldMaterials();
  }
  freezeWorldMaterials() {
    if (!this.root) return;
    for (const mesh of this.root.getChildMeshes()) {
      const material = mesh.material;
      if (material instanceof PBRMaterial) this.worldMaterials.add(material);
    }
    this.worldMaterials.forEach((m) => m.freeze());
    this.pendingWorldFreeze = 0;
  }
  *buildSteps(s: Expedition): Generator<void> {
    this.current = s;
    this.worldMaterials.forEach((m) => m.unfreeze());
    this.worldMaterials.clear();
    this.quarrySmoke?.dispose(false);
    this.quarrySmoke = undefined;
    this.quarryCrane = undefined;
    this.craneFraming = 0;
    this.pressureGallery?.dispose();
    this.pressureGallery = undefined;
    this.particleBursts.forEach((p) => p.system.dispose(false));
    this.particleBursts = [];
    this.sector = s.sector;
    if (this.root) {
      for (const mesh of this.root.getChildMeshes()) {
        if (!mesh.isDisposed()) mesh.dispose(false, false);
        yield;
      }
      this.root.dispose(false, false);
      yield;
    }
    this.root = new TransformNode("sector-" + s.sector, this.scene);
    this.lampPositions = [];
    this.dials = [];
    this.anchors = [];
    this.devices = [];
    this.pointers = [];
    this.gates = [];
    this.pods = [];
    this.cacheMeshes = [];
    this.memoryCaches = [];
    this.actors.forEach((a) => a.dispose());
    this.actors.clear();
    this.shots.forEach((m) => m.dispose());
    this.shots.clear();
    this.rings.forEach((m) => m.dispose());
    this.rings.clear();
    this.effects.forEach((e) => e.mesh.dispose());
    this.effects = [];
    const ch = s.chapter;
    if (s.sector === 4) quarryMaterials(this);
    if (s.sector === 3) forestMaterials(this);
    const climates = [
      [0.32, 0.85, 0],
      [0.85, 0.2, 0],
      [0.7, 1, 0],
      [1, 0.45, 0],
      [0.05, 0.05, 1],
      [0.15, 0.75, 0],
      [0.2, 0.25, 0],
      [0.4, 1, 0],
    ];
    this.surfaceClimate.copyFromFloats(
      ...(climates[s.sector] as [number, number, number]),
    );
    const landscape = LANDSCAPES[s.sector];
    this.landscapeClimate.set(landscape.moss, landscape.ochre, 0);
    (this.materials.terrain as PBRMaterial).albedoColor = c(
      landscape.color,
    ).toLinearSpace();
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
      this.slab(
        p,
        p.arena ? 46 : 26,
        p.arena ? 46 : 28,
        s.sector === 3 ? 1.8 : 3.1,
        s.sector === 3 ? "forestFloor" : "floor",
      );
      if (s.sector !== 3)
        this.slab(
          v(p.x, p.y - 2.8, p.z),
          p.arena ? 47 : 27,
          p.arena ? 47 : 29,
          0.5,
          "edge",
        );
      if (s.sector === 4) quarryBench(this, p);
      else if (s.sector === 3) forestTerrace(this, p, i);
      else if (s.sector === 0 && !p.arena) stormSpur(this, p, i);
      else terraceStructure(this, p);
      yield;
      if (i % 2) {
        for (const side of [-1, 1]) {
          this.lamp(v(p.x + side * 18, p.y, p.z - 17));
          if (i === 3 && side === -1)
            this.arch(v(p.x + side * 18, p.y, p.z + 18), 5, 8);
        }
      } else {
        this.lamp(v(p.x + 8, p.y, p.z + 5));
      }
      const q = ch.points[i + 1];
      if (q && !q.gap) {
        const crossing = s.sector === 3 ? forestBridge(this, p, q) : null;
        if (!crossing) bridgeStructure(this, p, q);
        const left: Vector3[] = [],
          right: Vector3[] = [];
        const dx = q.x - p.x,
          dz = q.z - p.z,
          len = Math.hypot(dx, dz),
          nx = -dz / len,
          nz = dx / len;
        for (let j = 0; j <= 30; j++) {
          const t = crossing
              ? crossing.from + ((crossing.to - crossing.from) * j) / 30
              : j / 30,
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
        road.material =
          this.materials[s.sector === 3 ? "forestBridgeBed" : "floor"];
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
            if (s.sector !== 3)
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
      yield;
      if (p.gap && s.sector === 0) this.anchors.push(stormGrapple(this, p));
      else if (p.gap) {
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
      for (let j = 0; j < ([3, 4].includes(s.sector) ? 0 : 5); j++) {
        const side = j % 2 ? 1 : -1,
          x = p.x + side * ((p.arena ? 21 : 11) - rand() * 3),
          z = p.z - 20 + rand() * 40;
        if (Math.abs(z - p.z) > 13 && !p.arena) continue;
        if (i > 0 && i % 2 === 0 && Math.hypot(x - p.x - 10, z - p.z - 6) < 3.5)
          continue;
        this.assets.prop(
          j % 3 ? "Bush_Small" : "Bush_Large",
          this.scene,
          this.root,
          new Vector3(x, p.y, z),
          1.2 + rand() * 1.8,
        );
      }
      if (i > 0 && i % 2 === 0)
        this.memoryCache(
          v(p.x + 10, p.y, p.z + 6),
          s.sector + "-" + (i / 2 - 1),
          s,
        );
      yield;
    }
    this.makeLandscape();
    yield;
    for (let i = 0; i < 65; i++) {
      const x = (i % 2 ? 1 : -1) * (95 + rand() * 100),
        z = -30 + rand() * 530,
        y = this.terrainHeight(x, z);
      this.assets.prop(
        s.sector === 3 && i % 3
          ? "MapleTree_2"
          : i % 3
            ? "BirchTree_1"
            : "BirchTree_2",
        this.scene,
        this.root,
        new Vector3(x, y, z),
        1.4 + rand() * 1.4,
      );
      yield;
    }
    for (const [i, b] of ch.beats.entries()) {
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
      this.gates.push(new EncounterGate(this, p, i === s.beat && !s.clear));
      if (b.hazard === "blades") {
        this.cylinder("turbine", v(p.x, p.y - 1, p.z), 9, 3, "metal");
      }
      yield;
    }
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
      for (let i = 0; i < 3; i++) this.pods.push(quarryCharge(this, s.pod(i)));
    const last = ch.points[7];
    this.arch(v(last.x, last.y, last.z + 23), 22, 22);
    this.arch(v(last.x, last.y, last.z + 34), 26, 30);
    yield* this.dressSteps(s);
    landmarks(this);
    if (s.sector === 4) this.quarrySmoke = quarryYard(this);
    if (s.sector === 5) this.pressureGallery = new PressureGallery(this);
    yield;
    yield* this.batchStaticSteps();
    this.foregroundProps = this.root
      .getChildMeshes()
      .filter((m) =>
        /^(lantern|lantern-cap|lamp-post|lamp-base)$/.test(m.name),
      );
    this.foliage = this.root
      .getChildTransformNodes()
      .filter((n) => n.metadata?.foliage);
    this.foliageViews = this.foliage.map((n) => {
      const bounds = n.getHierarchyBoundingVectors(true);
      return {
        meshes: n.getChildMeshes(),
        fades: new Map(),
        center: bounds.min.add(bounds.max).scale(0.5),
        radius: bounds.max.subtract(bounds.min).length() * 0.42,
      };
    });
    this.wheels = this.root
      .getChildTransformNodes()
      .filter((n) => n.metadata?.wheel);
    for (const n of this.foliage)
      for (const m of n.getChildMeshes()) this.shadow.addShadowCaster(m);
    // This cache owns only the current environment. Characters are added once
    // below, otherwise every rebuild carries another copy of the hero forward.
    this.shadowCasters = [
      ...new Set(this.shadow.getShadowMap()?.renderList || []),
    ].filter((m) => m.isDescendantOf(this.root));
    this.river.reflect([
      this.scene.getMeshByName("sky")!,
      ...this.staticDraws.filter(
        (m) =>
          m.metadata?.landscape ||
          m.material === this.materials.masonry ||
          m.material === this.materials.metal ||
          m.material === this.materials.brass,
      ),
    ]);
    yield* this.physics.rebuildSteps(
      this.root.getChildMeshes().filter((m) => m instanceof Mesh) as Mesh[],
      s,
    );
    this.camera.position.set(s.p.x + 8, s.p.y + 7, s.p.z - 12);
    this.camera.setTarget(new Vector3(s.p.x, s.p.y + 2, s.p.z));
    // Cull the newly built area before its first render, not fifteen frames later.
    this.visibilityTick = 14;
  }
  batchStatic() {
    for (const _ of this.batchStaticSteps()) {
    }
  }
  *batchStaticSteps(): Generator<void> {
    const keep = new Set<AbstractMesh>([
      ...this.anchors,
      ...this.gates.flatMap((gate) => gate.meshes),
      ...this.pointers,
      ...this.pods,
      ...this.pods.flatMap((pod) => pod.getChildMeshes()),
      ...this.cacheMeshes,
      ...(this.pressureGallery?.dynamicMeshes || []),
      ...(this.quarryCrane?.dynamicMeshes || []),
    ]);
    const groups = new Map<string, Mesh[]>();
    for (const m of this.root.getChildMeshes()) {
      if (
        !(m instanceof Mesh) ||
        !m.getTotalVertices() ||
        m.skeleton ||
        keep.has(m) ||
        m.metadata?.cameraQuery ||
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
      if (animated || m.metadata?.animatedWater || m.name === "oncoming-flood")
        continue;
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
      let bucket = key,
        index = 0,
        list = groups.get(bucket) || [];
      while (
        list.reduce((total, mesh) => total + mesh.getTotalVertices(), 0) +
          m.getTotalVertices() >
          16000 &&
        list.length
      ) {
        bucket = key + ":" + ++index;
        list = groups.get(bucket) || [];
      }
      list.push(m);
      groups.set(bucket, list);
      yield;
    }
    for (const list of groups.values()) {
      for (const mesh of list) mesh.setParent(this.root);
      yield;
    }
    this.staticDraws = [];
    for (const meshes of groups.values()) {
      const metadata = meshes[0].metadata,
        material = meshes[0].material;
      const cast = meshes.some((m) =>
        this.shadow.getShadowMap()?.renderList?.includes(m),
      );
      const merged =
        meshes.length > 1
          ? Mesh.MergeMeshes(meshes, false, true, undefined, false, false)
          : meshes[0];
      if (!merged) continue;
      // Preserve shared imported geometry while the engine copies and offsets indices.
      if (meshes.length > 1)
        meshes.forEach((mesh) => mesh.dispose(false, false));
      merged.name = "environment-batch";
      merged.parent = this.root;
      merged.material = material;
      merged.metadata = metadata;
      merged.receiveShadows = true;
      merged.isPickable = !!metadata?.cameraSolid;
      merged.freezeWorldMatrix();
      if (cast) this.shadow.addShadowCaster(merged);
      this.staticDraws.push(merged);
      yield;
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
    for (const _ of this.dressSteps(s)) {
    }
  }
  *dressSteps(s: Expedition): Generator<void> {
    this.blades = [];
    this.chargeMarks.forEach((m) => m.dispose());
    this.chargeMarks.clear();
    const ch = s.chapter;
    for (let i = 0; i < 8; i++) {
      const p = ch.points[i];
      const wide = p.arena ? 21 : 11;
      if (i % 2 && s.sector !== 4 && s.sector !== 3) {
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
      } else if (s.sector !== 4 && s.sector !== 3) {
        for (const side of [-1, 1]) {
          this.architecture(
            "Rail_Straight",
            v(p.x + side * 11.8, p.y, p.z - 5),
            1.3,
            0,
            true,
          );
        }
      }
      if (s.sector === 4 && p.arena) {
        this.architecture("Cart", v(p.x + 15, p.y, p.z - 12), 2.3, 0.4, true);
        this.architecture("Crate", v(p.x - 17, p.y, p.z + 1), 2, i * 0.3, true);
        this.architecture("Barrel", v(p.x - 19, p.y, p.z - 4), 1.8, 0, true);
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
      if ([0, 1, 2].includes(s.sector)) {
        for (const side of [-1, 1]) {
          const x = p.x + side * (p.arena ? 21 : 11),
            z = p.z + (i % 2 ? 14 : side === 1 && i > 0 ? -9 : 5);
          this.assets.prop(
            "BirchTree_1",
            this.scene,
            this.root,
            new Vector3(x, p.y, z),
            s.sector === 3 ? 2.3 : 1.25,
          );
        }
      }
      if (i % 2 && s.sector !== 4 && s.sector !== 3) {
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
            v(0.85, 0.08, p.arena ? 33 : 23),
            "channel",
            false,
          );
          for (const edge of [-1, 1])
            this.box(
              "channel-curb",
              v(p.x + side * 10 + edge * 0.56, p.y + 0.15, p.z),
              v(0.24, 0.3, p.arena ? 33 : 23),
              "cutstone",
              false,
            );
          for (let j = -1; j <= 1; j++) {
            this.cylinder(
              "garden-column",
              v(
                p.x + side * (p.arena ? 17 : 10),
                p.y + 4,
                p.z + j * (p.arena ? 12 : 10),
              ),
              0.75,
              8,
              "cutstone",
            );
            this.box(
              "pergola-beam",
              v(p.x, p.y + 8, p.z + j * (p.arena ? 12 : 10)),
              v(p.arena ? 35 : 21, 0.45, 0.6),
              "wood",
              false,
            );
          }
        }
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
        const spokes: Mesh[] = [];
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
          spokes.push(m);
        }
        const spokeRing = Mesh.MergeMeshes(spokes, true, true);
        if (spokeRing) {
          spokeRing.name = "turbine-spoke-ring";
          spokeRing.setParent(frame);
          spokeRing.receiveShadows = true;
          spokeRing.isPickable = false;
          this.shadow.addShadowCaster(spokeRing);
        }
        frame.metadata = { wheel: true };
      }
      yield;
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
    for (let j = 0; j < 6; j++) {
      this.arch(v(85 + j * 22, -3, 95 + j * 36), 19, 29 + j * 2);
      yield;
    }
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
    if (mat === "stone") {
      color.set(0.42, 0.37, 0.3);
      particles.minSize = 0.6;
      particles.maxSize = 1.6;
      particles.minLifeTime = 0.5;
      particles.maxLifeTime = 1.4;
      particles.gravity.set(0, -1, 0);
    }
    particles.color1 = new Color4(
      color.r,
      color.g,
      color.b,
      mat === "stone" ? 0.5 : 1,
    );
    particles.color2 = particles.color1;
    particles.colorDead = new Color4(color.r, color.g, color.b, 0);
    particles.blendMode =
      mat === "stone"
        ? ParticleSystem.BLENDMODE_STANDARD
        : ParticleSystem.BLENDMODE_ADD;
    particles.manualEmitCount = count;
    particles.emitRate = 0;
    particles.updateSpeed = 1 / 60;
    particles.start();
    this.particleBursts.push({
      system: particles,
      life: mat === "stone" ? 2 : 1.1,
    });
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
    if (e.type === "crane-impact") {
      this.burst(e.p || s.p, "stone", 38);
      this.shake = 0.4;
    }
    if (e.type === "hurt") this.shake = 0.2;
    if (e.type === "land") {
      this.landingKick = 0.22;
      this.burst(e.p || s.p, "glow", 5);
    }
    if (e.type === "hit")
      this.shake = Math.max(this.shake, (e.value || 0) >= 70 ? 0.12 : 0.055);
  }
  update(s: Expedition, dt: number, render = true) {
    if (!this.loaded) return;
    this.current = s;
    if (this.sector !== s.sector) this.build(s);
    this.scene.animationsEnabled = dt > 0 && s.hitstop <= 0;
    for (const p of this.particleBursts) {
      p.system.updateSpeed = dt > 0 ? 1 / 60 : 0;
      p.life -= dt;
      if (p.life <= 0) p.system.dispose(false);
    }
    this.particleBursts = this.particleBursts.filter((p) => p.life > 0);
    this.time += dt;
    this.pressureGallery?.update(s, dt);
    this.cascadeTexture.vOffset = (this.cascadeTexture.vOffset - dt * 0.7) % 1;
    const actorDt = s.hitstop > 0 ? 0 : dt;
    this.hero.player(s, actorDt);
    const visibleEnemies = s.enemies.filter((e) => e.hp > 0 || e.dead > 0);
    const visibleEnemyIds = new Set(visibleEnemies.map((e) => e.id));
    for (const e of visibleEnemies) {
      let a = this.actors.get(e.id);
      if (!a) {
        a = this.assets.actor(e.kind, this.scene, "enemy-" + e.id, this.shadow);
        this.actors.set(e.id, a);
      }
      a.enemy(e, actorDt);
      const contactFloor = floorAt(s.chapter, e.p.x, e.p.z);
      if (contactFloor === null) a.contact.visibility = 0;
      else {
        const altitude = Math.max(0, e.p.y - contactFloor);
        a.contact.position.y = contactFloor + 0.045;
        a.contact.visibility *= 1 / (1 + altitude * 0.22);
        a.contact.scaling.setAll(1 + Math.min(0.6, altitude * 0.08));
      }
    }
    for (const [id, a] of this.actors)
      if (!visibleEnemyIds.has(id)) {
        a.dispose();
        this.actors.delete(id);
      }
    this.foliage.forEach(
      (n) =>
        (n.rotation.z = Math.sin(this.time * 0.8 + n.metadata.phase) * 0.012),
    );
    for (const cache of this.memoryCaches) {
      const opened = s.secrets.includes(cache.key);
      cache.opened +=
        ((opened ? 1 : 0) - cache.opened) * (1 - Math.exp(-dt * 8));
      cache.lid.rotation.x = cache.opened * 1.15;
      cache.light.setEnabled(!opened);
    }
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
    this.gates.forEach((gate, i) => gate.update(i === s.beat && !s.clear, dt));
    this.pointers.forEach((m, i) => {
      if (i === s.beat) m.rotation.z = (-s.deviceTurn * Math.PI) / 2;
    });
    this.anchors.forEach((m) => {
      if (!m.metadata?.fixedAnchor) m.rotation.z = this.time * 0.35;
    });
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
    const pulled = s.living.find((e) => e.pull);
    this.rope.setEnabled(!!g || !!pulled);
    if (g || pulled)
      MeshBuilder.CreateLines("line", {
        points: [
          new Vector3(s.p.x, s.p.y + 1.5, s.p.z),
          g
            ? new Vector3(g.to.x, g.to.y + 6, g.to.z)
            : new Vector3(pulled!.p.x, pulled!.p.y + 1, pulled!.p.z),
        ],
        instance: this.rope,
      });
    this.motes.emitter = new Vector3(s.p.x, s.p.y + 1, s.p.z);
    this.motes.updateSpeed = dt > 0 ? 1 / 60 : 0;
    this.quarryCrane?.update(s);
    if (this.quarrySmoke) this.quarrySmoke.updateSpeed = dt > 0 ? 1 / 60 : 0;
    this.rain.emitter = new Vector3(s.p.x, s.p.y + 20, s.p.z);
    this.rain.emitRate = [0, 7].includes(s.sector)
      ? this.quality === "low"
        ? 80
        : 220
      : 0;
    this.rain.updateSpeed = dt > 0 ? 1 / 60 : 0;
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
      const nearbyThreats = s.living.filter(
        (e) => Math.hypot(e.p.x - s.p.x, e.p.z - s.p.z) < 13,
      ).length;
      const frameCrane =
        this.quarryCrane && !s.craneSpent
          ? clamp(
              (18 -
                Math.hypot(
                  s.p.x - this.quarryCrane.load.position.x,
                  s.p.z - this.quarryCrane.load.position.z,
                )) /
                8,
              0,
              1,
            )
          : 0;
      this.craneFraming +=
        (frameCrane - this.craneFraming) * (1 - Math.exp(-dt * 3));
      let distance = s.grapple
        ? 13
        : bossPresent
          ? 13
          : nearbyThreats > 2
            ? 10
            : nearbyThreats
              ? 8.8
              : 7.8;
      distance = Math.max(distance, 7.8 + this.craneFraming * 4);
      target.y += this.craneFraming * 1.8;
      if (bossPresent) target.y += 2.5;
      desired = new Vector3(
        s.p.x - Math.sin(this.yaw) * distance,
        s.p.y +
          (bossPresent ? 4.8 : 2.7) +
          this.craneFraming * 2 +
          this.pitch * (bossPresent ? 4 : 3.8),
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
    this.landingKick = Math.max(0, this.landingKick - dt);
    if (!this.reduced && this.landingKick > 0)
      desired.y -= Math.sin((Math.PI * this.landingKick) / 0.22) * 0.16;
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
    const actorBlocksPlayer = actorSight(
      this.camera.position,
      new Vector3(s.p.x, s.p.y + 1.15, s.p.z),
    );
    for (const actor of this.actors.values()) {
      actor.visibilityBounds.update(actor.root.computeWorldMatrix());
      const blocked = actorBlocksPlayer(actor.visibilityBounds.boundingBox);
      actor.occlusionAlpha = actorOpacity(actor.occlusionAlpha, blocked, dt);
      actor.meshes.forEach((m) => (m.visibility = actor.occlusionAlpha));
    }
    for (const plant of this.foliageViews) {
      const blocked =
        occludes(plant.center, plant.radius) ||
        Vector3.Distance(this.camera.position, plant.center) < plant.radius;
      fadeFoliage(plant, blocked, this.shadowCasters);
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
    const nearestLamps = this.lampPositions
      .map((p) => ({ p, d: Vector3.DistanceSquared(p, V(s.p)) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    for (let i = 0; i < this.lampLights.length; i++) {
      const lamp = nearestLamps[i],
        light = this.lampLights[i];
      if (lamp) light.position.copyFrom(lamp.p);
      light.intensity = lamp
        ? 22 * clamp((22 - Math.sqrt(lamp.d)) / 8, 0, 1)
        : 0;
    }
    this.sun.position.set(s.p.x + 40, s.p.y + 60, s.p.z - 35);
    this.sun.setDirectionToTarget(new Vector3(s.p.x, s.p.y, s.p.z + 12));
    if (++this.visibilityTick % 15 === 0) {
      for (const n of this.foliage)
        n.setEnabled(
          Math.hypot(n.position.x - s.p.x, n.position.z - s.p.z) < 145,
        );
      this.shadow.getShadowMap()!.renderList = [
        ...new Set([
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
        ]),
      ].filter(
        (m) => !m.isDisposed() && m.isEnabled() && m.getTotalVertices() > 0,
      );
      for (const m of this.staticDraws) {
        const b = m.getBoundingInfo().boundingBox,
          center = b.centerWorld;
        const radius = b.extendSizeWorld.length();
        m.isVisible =
          !!m.metadata?.distant ||
          Math.hypot(center.x - s.p.x, center.z - s.p.z) < 150 + radius;
      }
    }
    if (render) {
      this.scene.render();
      if (
        this.pendingWorldFreeze > 0 &&
        this.scene.isReady() &&
        --this.pendingWorldFreeze === 0
      )
        this.freezeWorldMaterials();
    }
    if (dt > 0) {
      this.frameTimes.push(dt * 1000);
      if (this.frameTimes.length > 600) this.frameTimes.shift();
    }
  }
  setQuality(q: string) {
    this.worldMaterials.forEach((m) => m.unfreeze());
    this.pendingWorldFreeze = 2;
    this.quality = q;
    this.engine.setHardwareScalingLevel(
      q === "low" ? 1.8 : q === "balanced" ? 1.25 : 1,
    );
    this.pipeline.samples = q === "high" ? 4 : 1;
    this.pipeline.bloomEnabled = q !== "low";
    if ((q === "high") !== this.aoEnabled) {
      this.aoEnabled = q === "high";
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
