import {
  Color3,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  TransformNode,
  Vector3,
  Texture,
} from "@babylonjs/core";
import { PBRCustomMaterial } from "@babylonjs/materials/custom/pbrCustomMaterial";
import type { GameScene } from "./scene";
import type { Expedition } from "./engine";
import { v, type V } from "./level";
import { block } from "./structures";

const V3 = (p: V) => new Vector3(p.x, p.y, p.z);

/** Shared PBR water surfaces: no extra reflection render targets per channel. */
function flowMaterial(view: GameScene, name: string, foam = false) {
  if (view.materials[name]) return view.materials[name] as PBRCustomMaterial;
  const m = new PBRCustomMaterial(name, view.scene),
    clock = new Vector3(0, 1, 0);
  m.albedoTexture = (view.materials.stone as PBRMaterial)
    .albedoTexture as Texture;
  m.metallic = 0;
  m.roughness = foam ? 0.78 : 0.42;
  m.alpha = foam ? 0.6 : 0.78;
  m.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
  m.backFaceCulling = false;
  m.twoSidedLighting = true;
  m.emissiveColor = new Color3(0.025, 0.045, 0.045);
  m.AddUniform("flowClock", "vec3", clock);
  m.metadata = { flowClock: clock };
  m.Fragment_Definitions(`
float flowHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float flowNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(flowHash(i),flowHash(i+vec2(1,0)),f.x),mix(flowHash(i+vec2(0,1)),flowHash(i+vec2(1,1)),f.x),f.y);}
float flowPattern(vec2 uv){vec2 p=uv*vec2(26.0,12.0)+vec2(0.0,-flowClock.x*(0.4+1.7*flowClock.y));return flowNoise(p)*0.65+flowNoise(p*2.1+vec2(3.0,flowClock.x))*0.35;}
`);
  m.Fragment_Custom_Albedo(`
float flowN=flowPattern(vAlbedoUV);
surfaceAlbedo=mix(vec3(0.055,0.19,0.19),vec3(0.68,0.82,0.75),smoothstep(0.40,0.77,flowN));
${foam ? "surfaceAlbedo=mix(surfaceAlbedo,vec3(0.72,0.83,0.76),0.7);" : ""}
`);
  m.Fragment_Custom_Alpha(
    foam
      ? `
vec2 foamP=(vAlbedoUV-0.5)*2.0;
alpha*=(1.0-smoothstep(0.18,1.0,length(foamP)))*smoothstep(0.3,0.66,flowPattern(vAlbedoUV))*flowClock.y;
`
      : `
float flowEdge=smoothstep(0.0,0.08,vAlbedoUV.x)*smoothstep(0.0,0.08,1.0-vAlbedoUV.x);
alpha*=flowEdge*(0.45+0.55*flowPattern(vAlbedoUV))*(0.35+0.65*flowClock.y);
`,
  );
  if (!foam)
    m.Fragment_Before_Lights(`
normalW=normalize(normalW+vec3(sin(vPositionW.x*3.0+flowClock.x*2.2)*0.045,0.0,sin(vPositionW.z*3.7+flowClock.x*2.8)*0.035));
`);
  view.materials[name] = m;
  return m;
}

/** Objective state drives the machinery; puzzle rules remain in Expedition. */
export class Waterworks {
  dynamicMeshes: Mesh[] = [];
  /** Keep the canyon outside the spill faces, lifting gear and falling-water path. */
  spillwayBounds: { min: V; max: V };
  gates: {
    mesh: Mesh;
    baseY: number;
    open: number;
    material: PBRCustomMaterial;
    fall?: { mesh: Mesh; foam: Mesh };
  }[] = [];
  controls: {
    beat: number;
    index?: number;
    target: number;
    rotor: TransformNode;
    angle: number;
  }[] = [];
  pools: { mesh: Mesh; baseY: number; beat: number }[] = [];
  flows: PBRCustomMaterial[] = [];
  constructor(public view: GameScene) {
    const anchor = view.current.chapter.points[1];
    this.spillwayBounds = {
      min: v(anchor.x + 9, -8, anchor.z + 43),
      max: v(anchor.x + 51, 38, anchor.z + 54),
    };
    if (!view.materials.waterworksCavity) {
      const cavity = new PBRMaterial("spill-throat-shadow", view.scene);
      cavity.albedoColor = Color3.FromHexString("#142b2a").toLinearSpace();
      cavity.roughness = 1;
      cavity.metallic = 0;
      view.materials.waterworksCavity = cavity;
    }
    for (let i = 0; i < 3; i++)
      this.flows.push(flowMaterial(view, "reservoir-flow-" + i));
    this.flows.push(flowMaterial(view, "waterworks-channel-flow"));
    flowMaterial(view, "waterworks-foam", true);
    this.reservoir();
    this.channels();
  }
  part(
    name: string,
    p: V,
    size: V,
    material = "metal",
    parent = this.view.root,
  ) {
    const m = this.view.box(name, p, size, material, false, parent);
    m.isPickable = false;
    m.metadata = { physics: false, cameraSolid: false };
    return m;
  }
  cylinder(
    name: string,
    p: V,
    diameter: number,
    height: number,
    material = "metal",
    parent = this.view.root,
  ) {
    const m = MeshBuilder.CreateCylinder(
      name,
      { diameter, height, tessellation: 20 },
      this.view.scene,
    );
    m.position.copyFrom(V3(p));
    m.parent = parent;
    m.material = this.view.materials[material];
    m.receiveShadows = true;
    m.isPickable = false;
    m.metadata = { physics: false, cameraSolid: false };
    this.view.shadow.addShadowCaster(m);
    return m;
  }
  ring(
    name: string,
    p: V,
    diameter: number,
    thickness: number,
    material: string,
    parent: TransformNode,
  ) {
    const m = MeshBuilder.CreateTorus(
      name,
      { diameter, thickness, tessellation: 36 },
      this.view.scene,
    );
    m.position.copyFrom(V3(p));
    m.rotation.x = Math.PI / 2;
    m.parent = parent;
    m.material = this.view.materials[material];
    m.receiveShadows = true;
    m.isPickable = false;
    this.view.shadow.addShadowCaster(m);
    return m;
  }
  /** Fixed puzzle notches stay on the housing while the complete handwheel turns. */
  control(p: V, beat: number, index?: number, target = 1) {
    const center = v(p.x, p.y + 1.85, p.z),
      members: Mesh[] = [];
    this.view.cylinder(
      "waterworks-control-plinth",
      v(p.x, p.y + 0.3, p.z + 0.2),
      2.3,
      0.6,
      "cutstone",
    );
    const collider = this.view.box(
      "valve-housing-collider",
      v(p.x, p.y + 1.25, p.z + 0.15),
      v(1.8, 2.5, 1.6),
      "metal",
      true,
    );
    collider.isVisible = false;
    collider.isPickable = false;
    collider.metadata = { physics: true, cameraSolid: false };
    this.view.shadow.removeShadowCaster(collider);
    this.dynamicMeshes.push(collider);
    members.push(
      this.part(
        "valve-pedestal",
        v(p.x, p.y + 1, p.z + 0.3),
        v(0.85, 1.4, 0.75),
      ),
    );
    members.push(
      this.part(
        "valve-gear-housing",
        v(p.x, p.y + 1.85, p.z + 0.25),
        v(1.25, 1.15, 0.7),
      ),
    );
    const axle = this.cylinder(
      "valve-spindle",
      v(p.x, p.y + 1.85, p.z - 0.15),
      0.3,
      1.05,
      "brass",
    );
    axle.rotation.x = Math.PI / 2;
    members.push(axle);
    for (const side of [-1, 1]) {
      members.push(
        this.part(
          "gearbox-bracket",
          v(p.x + side * 0.62, p.y + 1.3, p.z + 0.25),
          v(0.16, 0.7, 0.9),
        ),
      );
      for (const y of [1.45, 2.25]) {
        const bolt = this.cylinder(
          "gearbox-bolt",
          v(p.x + side * 0.47, p.y + y, p.z - 0.13),
          0.11,
          0.08,
          "brass",
        );
        bolt.rotation.x = Math.PI / 2;
        members.push(bolt);
      }
    }
    const rotor = new TransformNode("relief-valve-handwheel", this.view.scene);
    rotor.parent = this.view.root;
    rotor.position.copyFrom(V3(v(center.x, center.y, center.z - 0.45)));
    members.push(this.ring("cast-handwheel", v(), 2.05, 0.13, "brass", rotor));
    const hub = this.cylinder("handwheel-hub", v(), 0.4, 0.28, "metal", rotor);
    hub.rotation.x = Math.PI / 2;
    members.push(hub);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3,
        spoke = this.part(
          "handwheel-spoke",
          v(Math.sin(a) * 0.52, Math.cos(a) * 0.52, 0),
          v(0.085, 0.88, 0.09),
          "metal",
          rotor,
        );
      spoke.rotation.z = -a;
      members.push(spoke);
    }
    const pointer = this.part(
      "enamel-index-hand",
      v(0, 0.5, -0.1),
      v(0.1, 0.9, 0.055),
      "cyan",
      rotor,
    );
    members.push(pointer);
    members.push(
      this.part(
        "enamel-index-tip",
        v(0, 1.06, -0.1),
        v(0.22, 0.16, 0.06),
        "cyan",
        rotor,
      ),
    );
    for (let j = 0; j < 4; j++) {
      const a = (j * Math.PI) / 2,
        x = p.x + Math.sin(a) * 1.25,
        y = center.y + Math.cos(a) * 1.25;
      const mount = this.part(
        "alignment-mount",
        v(x, y, p.z - 0.38),
        v(0.3, 0.3, 0.12),
      );
      mount.rotation.z = -a;
      members.push(mount);
      const mark = this.part(
        "alignment-enamel",
        v(x, y, p.z - 0.46),
        v(0.14, 0.21, 0.04),
        j === target ? "glow" : "brass",
      );
      mark.rotation.z = -a;
      members.push(mark);
    }
    // An outlet stem and a flush service trench connect the housing to the under-deck manifold.
    members.push(
      this.cylinder(
        "valve-outlet-stem",
        v(p.x, p.y + 0.72, p.z + 0.65),
        0.5,
        1.1,
        "brass",
      ),
    );
    for (let k = 0; k < 8; k++)
      this.part(
        "service-trench-grate",
        v(p.x, p.y + 0.035, p.z + 1 + k * 0.35),
        v(0.95, 0.06, 0.09),
      );
    // Batch each material within its moving or fixed part, retaining the rotor pivot.
    const batches = new Map<string, Mesh[]>();
    for (const mesh of members) {
      const key = mesh.material!.uniqueId + ":" + (mesh.parent === rotor);
      const list = batches.get(key) || [];
      list.push(mesh);
      batches.set(key, list);
    }
    const grouped: Mesh[] = [];
    for (const list of batches.values()) {
      const parent = list[0].parent as TransformNode;
      const merged =
        list.length > 1
          ? Mesh.MergeMeshes(list, false, true, undefined, false, false)!
          : list[0];
      if (list.length > 1) {
        merged.setParent(parent);
        for (const mesh of list) {
          this.view.shadow.removeShadowCaster(mesh);
          mesh.dispose(false, false);
        }
        this.view.shadow.addShadowCaster(merged);
      }
      merged.isPickable = false;
      merged.metadata = { physics: false, cameraSolid: false };
      grouped.push(merged);
    }
    this.view.controlViews.push({
      center: V3(center),
      meshes: grouped,
      opacity: 1,
    });
    const steps =
      index === undefined
        ? this.view.current.beat > beat
          ? 1
          : 0
        : this.view.current.beat > beat
          ? target
          : this.view.current.beat === beat
            ? this.view.current.runes[index]
            : 0;
    const angle = (-steps * Math.PI) / 2;
    rotor.rotation.z = angle;
    this.controls.push({ beat, index, target, rotor, angle });
    if (index !== undefined) this.view.dials.push({ beat, index, hand: rotor });
  }
  controlsFor(p: V, beat: number, linked: boolean) {
    this.view.pointers.push(
      this.part(
        "waterworks-marker",
        v(p.x, p.y - 0.4, p.z),
        v(0.01, 0.01, 0.01),
        "stone",
      ),
    );
    if (linked) {
      const targets = beat === 1 ? [0, 3, 1] : [1, 0, 3];
      for (let j = 0; j < 3; j++)
        this.control(
          v(p.x + [-7, 7, 0][j], p.y, p.z + [0, 0, 9][j]),
          beat,
          j,
          targets[j],
        );
    } else this.control(p, beat);
  }
  fallingWater(
    p: V,
    width: number,
    height: number,
    material: PBRCustomMaterial,
  ) {
    const paths: Vector3[][] = [];
    for (let x = 0; x <= 8; x++) {
      const row: Vector3[] = [];
      for (let j = 0; j <= 28; j++) {
        const t = j / 28,
          u = x / 8 - 0.5;
        row.push(
          new Vector3(
            p.x +
              u * width * (1 + 0.2 * t) +
              Math.sin(t * 13 + x * 0.7) * 0.06 * t,
            p.y - height * t,
            p.z - 1.65 * t * t,
          ),
        );
      }
      paths.push(row);
    }
    const mesh = MeshBuilder.CreateRibbon(
      "reservoir-waterfall",
      { pathArray: paths, sideOrientation: Mesh.DOUBLESIDE },
      this.view.scene,
    );
    const positions = mesh.getVerticesData("position")!,
      uvs = mesh.getVerticesData("uv")!;
    for (let i = 0; i < uvs.length / 2; i++) {
      const t = (p.y - positions[i * 3 + 1]) / height;
      uvs[i * 2] = (positions[i * 3] - p.x) / (width * (1 + 0.2 * t)) + 0.5;
      uvs[i * 2 + 1] = t;
    }
    mesh.setVerticesData("uv", uvs);
    mesh.material = material;
    mesh.parent = this.view.root;
    mesh.isPickable = false;
    mesh.metadata = { animatedWater: true };
    const foam = MeshBuilder.CreateGround(
      "spill-pool-foam",
      { width: width * 1.8, height: 6 },
      this.view.scene,
    );
    foam.position.set(p.x, p.y - height + 0.06, p.z - 1.8);
    foam.material = this.view.materials["waterworks-foam"];
    foam.parent = this.view.root;
    foam.isPickable = false;
    foam.metadata = { animatedWater: true };
    mesh.setPivotPoint(V3(p));
    return { mesh, foam };
  }
  reservoir() {
    const p = this.view.current.chapter.points[1],
      x = p.x + 30,
      z = p.z + 61;
    block(this.view, "reservoir-dam-body", v(x, 7, z + 4), v(34, 40, 21));
    // Separate spill bays with deep buttresses and a walkable-looking maintenance crown.
    for (const dx of [-17, -5.5, 5.5, 17]) {
      block(this.view, "dam-buttress", v(x + dx, 10, z - 8), v(3, 48, 7));
      block(
        this.view,
        "dam-buttress-cap",
        v(x + dx, 34.6, z - 8),
        v(4.2, 1.2, 8.5),
      );
      for (let y = -8; y < 28; y += 6)
        block(
          this.view,
          "dam-course",
          v(x + dx, y, z - 11.6),
          v(3.4, 0.35, 0.7),
        );
    }
    block(this.view, "maintenance-crown", v(x, 34.7, z - 7.5), v(39, 1.1, 10));
    for (const side of [-1, 1]) {
      this.part(
        "crown-rail",
        v(x, 36.3, z - 7.5 + side * 4.2),
        v(38, 0.15, 0.15),
      );
      for (let j = -4; j <= 4; j++)
        this.part(
          "crown-rail-post",
          v(x + j * 4.4, 35.7, z - 7.5 + side * 4.2),
          v(0.12, 1.8, 0.12),
        );
    }
    for (let i = 0; i < 3; i++) {
      const gx = x + (i - 1) * 11.25;
      block(this.view, "spill-bay-head", v(gx, 26, z - 9), v(9.2, 1.2, 6));
      block(this.view, "spill-bay-sill", v(gx, 17, z - 10), v(9.2, 0.8, 8));
      this.part(
        "spill-throat",
        v(gx, 21.2, z - 10.2),
        v(7.4, 7.4, 1),
        "waterworksCavity",
      );
      const panel = this.part(
        "sluice-gate",
        v(gx, 21.15, z - 12.8),
        v(7.3, 7.4, 0.45),
      );
      const ribs: Mesh[] = [];
      for (let j = -2; j <= 2; j++)
        ribs.push(
          this.part(
            "sluice-gate-rib",
            v(j * 1.35, 0, -0.28),
            v(0.15, 7.3, 0.18),
            "brass",
            panel,
          ),
        );
      ribs.push(
        this.part(
          "gate-travelling-nut",
          v(0, 3.1, -0.25),
          v(0.7, 0.55, 0.65),
          "brass",
          panel,
        ),
      );
      this.dynamicMeshes.push(panel, ...ribs);
      const open = this.view.current.beat > i ? 1 : 0;
      this.gates.push({
        mesh: panel,
        baseY: 21.15,
        open,
        material: this.flows[i],
      });
      panel.position.y += open * 7.8;
      (this.flows[i].metadata.flowClock as Vector3).y = 0.16 + 0.84 * open;
      for (const side of [-1, 1])
        this.part(
          "gate-guide",
          v(gx + side * 3.95, 25.5, z - 12.8),
          v(0.25, 18, 0.45),
          "brass",
        );
      this.cylinder(
        "gate-lifting-screw",
        v(gx, 29.6, z - 12.9),
        0.22,
        12,
        "brass",
      );
      this.part("gate-headstock", v(gx, 35.4, z - 12.9), v(2.2, 0.55, 1.1));
      for (let k = 0; k < 19; k++)
        this.cylinder(
          "lifting-screw-collar",
          v(gx, 25.1 + k * 0.55, z - 12.9),
          0.34,
          0.08,
          "metal",
        );
      const fall = this.fallingWater(
        v(gx, 17.35, z - 14.25),
        6.8,
        24.25,
        this.flows[i],
      );
      this.gates[this.gates.length - 1].fall = fall;
      fall.mesh.scaling.x = fall.foam.scaling.x = 0.12 + 0.88 * open;
      fall.foam.visibility = 0.16 + 0.84 * open;
    }
  }
  channels() {
    const ch = this.view.current.chapter;
    for (let i = 0; i < ch.points.length; i++) {
      const p = ch.points[i],
        half = p.arena ? 23 : 13,
        length = p.arena ? 35 : 20;
      for (const side of [-1, 1]) {
        const x = p.x + side * (half + 3.1);
        block(
          this.view,
          "filter-channel-bed",
          v(x, p.y - 0.95, p.z),
          v(5.3, 0.65, length),
        );
        for (const edge of [-1, 1])
          block(
            this.view,
            "filter-channel-wall",
            v(x + edge * 2.5, p.y + 0.2, p.z),
            v(0.6, 1.7, length + 1),
          );
        for (const end of [-1, 1])
          block(
            this.view,
            "filter-channel-end",
            v(x, p.y + 0.2, p.z + (end * length) / 2),
            v(5.6, 1.7, 0.7),
          );
        for (let j = -1; j <= 1; j++)
          block(
            this.view,
            "channel-underbrace",
            v(x, p.y - 3.5, p.z + j * length * 0.35),
            v(5, 5.2, 2.2),
          );
        const surface = MeshBuilder.CreateGround(
          "filter-channel-water",
          { width: 4.4, height: length - 0.8 },
          this.view.scene,
        );
        surface.position.set(
          x,
          p.y - 0.25 - (this.view.current.beat > Math.floor(i / 2) ? 0.25 : 0),
          p.z,
        );
        surface.material = this.flows[3];
        surface.parent = this.view.root;
        surface.isPickable = false;
        surface.metadata = { animatedWater: true };
        this.pools.push({
          mesh: surface,
          baseY: p.y - 0.25,
          beat: Math.floor(i / 2),
        });
        // Trash screens and copper manifolds make the canal a machine rather than a painted stripe.
        if (p.arena) {
          for (let j = -3; j <= 3; j++)
            this.part(
              "channel-trash-screen",
              v(x + j * 0.55, p.y + 0.2, p.z + length * 0.3),
              v(0.09, 1.7, 0.12),
            );
          this.part(
            "trash-screen-top",
            v(x, p.y + 1.1, p.z + length * 0.3),
            v(4.5, 0.16, 0.22),
          );
          const pipe = this.cylinder(
            "channel-feed-pipe",
            v(p.x + side * (half + 0.1), p.y - 1, p.z - 10),
            0.7,
            6.5,
            "brass",
          );
          pipe.rotation.z = Math.PI / 2;
          for (let j = 0; j < 4; j++) {
            const flange = this.cylinder(
              "feed-pipe-flange",
              v(p.x + side * (half - 2 + j * 1.6), p.y - 1, p.z - 10),
              0.95,
              0.13,
            );
            flange.rotation.z = Math.PI / 2;
          }
        }
      }
    }
  }
  update(s: Expedition, dt: number) {
    for (const m of this.flows) (m.metadata.flowClock as Vector3).x = s.time;
    (this.view.materials["waterworks-foam"].metadata.flowClock as Vector3).x =
      s.time;
    for (let i = 0; i < this.gates.length; i++) {
      const g = this.gates[i],
        target = s.beat > i ? 1 : 0;
      g.open += (target - g.open) * (1 - Math.exp(-dt * 2));
      g.mesh.position.y = g.baseY + g.open * 7.8;
      (g.material.metadata.flowClock as Vector3).y = 0.16 + 0.84 * g.open;
      if (g.fall) {
        g.fall.mesh.scaling.x = g.fall.foam.scaling.x = 0.12 + 0.88 * g.open;
        g.fall.foam.visibility = 0.16 + 0.84 * g.open;
      }
    }
    for (const pool of this.pools)
      pool.mesh.position.y +=
        (pool.baseY - (s.beat > pool.beat ? 0.25 : 0) - pool.mesh.position.y) *
        (1 - Math.exp(-dt * 1.8));
    for (const c of this.controls) {
      const steps =
        c.index === undefined
          ? s.beat > c.beat
            ? 1
            : 0
          : s.beat > c.beat
            ? c.target
            : s.beat === c.beat
              ? s.runes[c.index]
              : 0;
      const target = (-steps * Math.PI) / 2;
      if (dt > 0)
        c.angle +=
          Math.atan2(Math.sin(target - c.angle), Math.cos(target - c.angle)) *
          (1 - Math.exp(-dt * 12));
      c.rotor.rotation.z = c.angle;
    }
  }
}
