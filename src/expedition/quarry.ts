import {
  Color3,
  Color4,
  ParticleSystem,
  DynamicTexture,
  StandardMaterial,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  Quaternion,
  Texture,
  Vector3,
} from "@babylonjs/core";
import type { GameScene } from "./scene";
import { v, type Point, type V } from "./level";
import { weatheredStone } from "./surfaces";

export function quarryMaterials(view: GameScene) {
  if (view.materials.quarryTimber) return;
  const timber = new PBRMaterial("quarry-timber", view.scene);
  timber.albedoColor = Color3.FromHexString("#b8a48a").toLinearSpace();
  timber.albedoTexture = new Texture(
    "/assets/materials/quarry-wood-diff.jpg",
    view.scene,
  );
  timber.bumpTexture = new Texture(
    "/assets/materials/quarry-wood-normal.jpg",
    view.scene,
  );
  timber.bumpTexture.level = 0.55;
  timber.metallicTexture = new Texture(
    "/assets/materials/quarry-wood-rough.jpg",
    view.scene,
  );
  timber.useRoughnessFromMetallicTextureAlpha = false;
  timber.useRoughnessFromMetallicTextureGreen = true;
  timber.useMetallnessFromMetallicTextureBlue = false;
  timber.roughness = 0.9;
  timber.metallic = 0;
  view.materials.quarryTimber = timber;
  const stoneMap = (view.materials.stone as PBRMaterial)
    .albedoTexture as Texture;
  view.materials.quarryStone = weatheredStone(
    "quarry-cut-face",
    view.scene,
    stoneMap,
    "#8a867c",
    0.16,
  );
}

function piece(
  view: GameScene,
  name: string,
  p: V,
  size: V,
  material: string,
  camera = true,
) {
  const m = view.box(name, p, size, material, false);
  m.metadata = { cameraSolid: camera, physics: false, quarry: true };
  m.isPickable = camera;
  return m;
}
function beam(
  view: GameScene,
  name: string,
  a: V,
  b: V,
  width = 0.65,
  material = "quarryTimber",
) {
  const start = new Vector3(a.x, a.y, a.z),
    end = new Vector3(b.x, b.y, b.z),
    direction = end.subtract(start);
  const m = piece(
    view,
    name,
    start.add(end).scale(0.5),
    v(width, direction.length(), width),
    material,
  );
  const up = Vector3.Up(),
    axis = Vector3.Cross(up, direction.normalize()),
    angle = Math.acos(Math.max(-1, Math.min(1, Vector3.Dot(up, direction))));
  m.rotationQuaternion =
    axis.lengthSquared() < 0.000001
      ? Quaternion.Identity()
      : Quaternion.RotationAxis(axis.normalize(), angle);
  if (material === "quarryTimber") {
    const positions = m.getVerticesData("position")!,
      normals = m.getVerticesData("normal")!,
      uv = m.getVerticesData("uv")!;
    for (let i = 0; i < uv.length / 2; i++) {
      uv[i * 2] =
        (Math.abs(normals[i * 3]) > 0.5
          ? positions[i * 3 + 2]
          : positions[i * 3]) / 0.7;
      uv[i * 2 + 1] = positions[i * 3 + 1] / 4;
    }
    m.updateVerticesData("uv", uv);
  }
  return m;
}
function cable(view: GameScene, name: string, points: V[], radius = 0.07) {
  const m = MeshBuilder.CreateTube(
    name,
    {
      path: points.map((p) => new Vector3(p.x, p.y, p.z)),
      radius,
      tessellation: 8,
      cap: Mesh.CAP_ALL,
    },
    view.scene,
  );
  m.parent = view.root;
  m.material = view.materials.metal;
  m.isPickable = false;
  m.metadata = { physics: false, cameraSolid: false, quarry: true };
  return m;
}
function pulley(view: GameScene, p: V, diameter = 2.1) {
  const rim = MeshBuilder.CreateTorus(
    "quarry-sheave-rim",
    { diameter, thickness: 0.22, tessellation: 32 },
    view.scene,
  );
  rim.position.set(p.x, p.y, p.z);
  rim.rotation.x = Math.PI / 2;
  rim.parent = view.root;
  rim.material = view.materials.brass;
  rim.isPickable = false;
  rim.metadata = { physics: false, cameraSolid: false, quarry: true };
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    beam(
      view,
      "sheave-spoke",
      p,
      v(
        p.x + (Math.cos(a) * diameter) / 2,
        p.y + (Math.sin(a) * diameter) / 2,
        p.z,
      ),
      0.12,
      "metal",
    );
  }
}

/** Cut quarry benches replace the ornamental bridge arcades below this area's decks. */
export function quarryBench(view: GameScene, p: Point) {
  const width = p.arena ? 46 : 26,
    depth = p.arena ? 46 : 28;
  const course = (p.y + 20.8) / 4;
  for (let tier = 0; tier < 4; tier++) {
    const w = width + (3 - tier) * 1.2,
      d = depth + (3 - tier) * 1.2;
    const y = -24 + course * (tier + 0.5);
    piece(
      view,
      "quarry-cut-bench",
      v(p.x, y, p.z),
      v(w, course - 0.08, d),
      "quarryStone",
    );
    for (const side of [-1, 1]) {
      for (let x = -w / 2 + 2.5; x < w / 2; x += 4.5) {
        piece(
          view,
          "bedrock-cut-mark",
          v(p.x + x, y, p.z + side * (d / 2 + 0.01)),
          v(0.035, course * 0.8, 0.025),
          "dark",
          false,
        );
      }
    }
  }
}
function cuttingFace(view: GameScene, p: Point, side: number) {
  for (let tier = 0; tier < 3; tier++) {
    const x = p.x + side * (36 + tier * 5),
      y = p.y + tier * 7;
    for (let z = 0; z < 4; z++) {
      const width = 7.5 + (z % 2) * 1.3;
      piece(
        view,
        "quarry-extraction-bench",
        v(x, (y + 6.4 - 24) / 2, p.z - 22 + z * 13),
        v(width, y + 6.4 + 24, 12.6),
        "quarryStone",
      );
      for (let k = 0; k < 7; k++)
        piece(
          view,
          "quarry-chisel-kerf",
          v(
            x - side * (width / 2 + 0.025),
            y + 3.2,
            p.z - 27 + k * 1.7 + z * 13,
          ),
          v(0.035, 5.4, 0.055),
          "dark",
          false,
        );
    }
  }
}
function derrick(view: GameScene, p: Point) {
  const x = p.x + 32,
    z = p.z + 10,
    y = p.y;
  piece(
    view,
    "derrick-plinth",
    v(x, (y - 24) / 2, z),
    v(12, y + 24, 14),
    "quarryStone",
  );
  for (const side of [-1, 1]) {
    const a = v(x + side * 3, y, z - 4),
      b = v(x + side * 1.6, y + 24, z);
    beam(view, "derrick-leg", a, b, 1.15);
    beam(view, "derrick-backstay", v(x + side * 3, y, z + 5), b, 0.8);
    for (const h of [1.5, 6, 12, 18])
      piece(
        view,
        "derrick-iron-band",
        v(x + side * (3 - (h / 24) * 1.4), y + h, z - 4 + h / 6),
        v(1.32, 0.3, 1.35),
        "metal",
      );
  }
  for (const h of [6, 12, 18, 24])
    beam(
      view,
      "derrick-crossbrace",
      v(x - 2.7, y + h, z - 4 + h / 6),
      v(x + 2.7, y + h, z - 4 + h / 6),
      0.55,
    );
  const heel = v(x + 5, y + 13, z),
    tip = v(p.x + 1, y + 25, z - 2);
  for (const side of [-1, 1]) {
    beam(
      view,
      "lifting-boom-chord",
      v(heel.x, heel.y, heel.z + side * 1.3),
      v(tip.x, tip.y, tip.z + side * 1.3),
      0.8,
    );
    beam(
      view,
      "lifting-boom-top",
      v(heel.x, heel.y + 3, heel.z + side * 1.3),
      v(tip.x, tip.y + 2, tip.z + side * 1.3),
      0.65,
    );
    for (let i = 0; i < 7; i++) {
      const t = i / 7,
        u = (i + 1) / 7;
      const a = v(
        heel.x + (tip.x - heel.x) * t,
        heel.y + (tip.y - heel.y) * t + (i % 2 ? 3 : 0),
        heel.z + (tip.z - heel.z) * t + side * 1.3,
      );
      const b = v(
        heel.x + (tip.x - heel.x) * u,
        heel.y + (tip.y - heel.y) * u + (i % 2 ? 0 : 3),
        heel.z + (tip.z - heel.z) * u + side * 1.3,
      );
      beam(view, "boom-truss", a, b, 0.3, "metal");
    }
  }
  cable(view, "derrick-stay", [v(x, y + 25, z), v(heel.x, heel.y + 3, heel.z)]);
  pulley(view, tip);
  const load = v(tip.x, y + 10, tip.z);
  for (const side of [-1, 1])
    cable(view, "hoist-rope", [
      v(tip.x + side * 0.6, tip.y, tip.z),
      v(load.x + side * 0.6, load.y + 2.5, load.z),
    ]);
  beam(
    view,
    "hoist-shackle",
    v(load.x - 0.8, load.y + 2.5, load.z),
    v(load.x + 0.8, load.y + 2.5, load.z),
    0.18,
    "metal",
  );
  piece(view, "suspended-cut-block", load, v(4.8, 3.2, 3.2), "quarryStone");
  for (const side of [-1, 1]) {
    cable(
      view,
      "load-sling",
      [
        v(load.x + side * 2, load.y - 1.65, load.z - 1.65),
        v(load.x + side * 2, load.y + 1.65, load.z - 1.65),
        v(load.x, load.y + 2.5, load.z),
        v(load.x + side * 2, load.y + 1.65, load.z + 1.65),
        v(load.x + side * 2, load.y - 1.65, load.z + 1.65),
        v(load.x + side * 2, load.y - 1.65, load.z - 1.65),
      ],
      0.09,
    );
  }
  for (let i = 0; i < 3; i++)
    piece(
      view,
      "derrick-counterweight",
      v(x + 7, y + 14 + i * 1.25, z),
      v(3.7, 1.15, 4),
      "quarryStone",
    );
}
function furnace(view: GameScene, p: Point) {
  const x = p.x - 41,
    z = p.z + 8,
    y = p.y;
  piece(
    view,
    "kiln-foot",
    v(x, (y - 24) / 2, z),
    v(19, y + 24, 20),
    "quarryStone",
  );
  piece(view, "kiln-body", v(x, y + 10, z), v(15, 20, 15), "quarryStone");
  for (let h = 3; h < 21; h += 4)
    piece(view, "kiln-iron-belt", v(x, y + h, z), v(15.3, 0.4, 15.3), "metal");
  for (let h = 0; h < 4; h++)
    piece(
      view,
      "kiln-stack-course",
      v(x, y + 23 + h * 4, z),
      v(9 - h, 3.85, 9 - h),
      "quarryStone",
    );
  piece(
    view,
    "kiln-mouth-shadow",
    v(x + 7.55, y + 4, z - 1),
    v(0.12, 6, 7),
    "dark",
    false,
  );
  piece(
    view,
    "kiln-embers",
    v(x + 7.64, y + 3, z - 1),
    v(0.08, 2.6, 6),
    "danger",
    false,
  );
  for (let i = 0; i < 8; i++)
    beam(
      view,
      "kiln-grate",
      v(x + 7.8, y + 1.7, z - 4 + i * 0.85),
      v(x + 7.8, y + 6.5, z - 4 + i * 0.85),
      0.16,
      "metal",
    );
  for (const side of [-1, 1])
    beam(
      view,
      "kiln-buttress",
      v(x + side * 9, y, z + 8),
      v(x + side * 6, y + 19, z + 5),
      1.2,
    );
  cable(
    view,
    "furnace-conduit",
    [
      v(x + 8, y + 7, z + 5),
      v(x + 14, y + 7, z + 5),
      v(x + 14, y + 0.5, z + 5),
      v(p.x - 23, y + 0.5, z + 5),
    ],
    0.45,
  );
}
export function quarryYard(view: GameScene) {
  const points = view.current.chapter.points;
  cuttingFace(view, points[1], 1);
  derrick(view, { ...points[1], z: points[1].z + 18 });
  furnace(view, points[3]);
  cuttingFace(view, points[5], -1);
  for (const p of points) {
    const half = p.arena ? 19 : 12;
    for (let z = -half; z <= half; z += 2.5) {
      piece(
        view,
        "rail-sleeper",
        v(p.x, p.y + 0.035, p.z + z),
        v(4.8, 0.06, 0.38),
        "quarryTimber",
        false,
      );
      for (const side of [-1, 1])
        piece(
          view,
          "rail-fastener",
          v(p.x + side * 2, p.y + 0.095, p.z + z),
          v(0.3, 0.04, 0.22),
          "brass",
          false,
        );
    }
    for (const side of [-1, 1])
      piece(
        view,
        "quarry-track",
        v(p.x + side * 2, p.y + 0.07, p.z),
        v(0.12, 0.14, half * 2 + 1),
        "metal",
        false,
      );
    if (p.arena) {
      for (let i = 0; i < 3; i++) {
        const stock = piece(
          view,
          "stock-cut-stone",
          v(
            p.x + 18 + (i % 2) * 3.6,
            p.y + 1.2 + Math.floor(i / 2) * 2.5,
            p.z - 8,
          ),
          v(3.3, 2.4, 5.2),
          "quarryStone",
        );
        stock.metadata.physics = true;
      }
    }
  }
  const kiln = points[3];
  const smoke = new ParticleSystem("quarry-kiln-smoke", 64, view.scene);
  smoke.particleTexture = view.sparkTexture;
  smoke.emitter = new Vector3(kiln.x - 41, kiln.y + 37, kiln.z + 8);
  smoke.minEmitBox = new Vector3(-0.8, 0, -0.8);
  smoke.maxEmitBox = new Vector3(0.8, 0, 0.8);
  smoke.direction1 = new Vector3(0.4, 1.4, 0.1);
  smoke.direction2 = new Vector3(0.8, 1.8, 0.4);
  smoke.minEmitPower = 1.2;
  smoke.maxEmitPower = 1.8;
  smoke.minLifeTime = 5;
  smoke.maxLifeTime = 8;
  smoke.minSize = 1.5;
  smoke.maxSize = 2.4;
  smoke.addSizeGradient(0, 1);
  smoke.addSizeGradient(1, 3.2);
  smoke.color1 = new Color4(0.18, 0.15, 0.12, 0.2);
  smoke.color2 = new Color4(0.22, 0.19, 0.16, 0.16);
  smoke.colorDead = new Color4(0.26, 0.23, 0.2, 0);
  smoke.blendMode = ParticleSystem.BLENDMODE_STANDARD;
  smoke.emitRate = 5;
  smoke.updateSpeed = 1 / 60;
  smoke.start();
  return smoke;
}

/** Shared stencil and batched fittings keep the interactive charge readable up close. */
export function quarryCharge(view: GameScene, p: V) {
  if (!view.materials.chargeStencil) {
    const texture = new DynamicTexture(
      "blasting-charge-stencil",
      { width: 256, height: 256 },
      view.scene,
      true,
    );
    const ctx = texture.getContext();
    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = "#d6b36b";
    ctx.beginPath();
    ctx.moveTo(128, 8);
    ctx.lineTo(248, 128);
    ctx.lineTo(128, 248);
    ctx.lineTo(8, 128);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#292b28";
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.fillStyle = "#292b28";
    ctx.font = "bold 128px sans-serif";
    (ctx as CanvasRenderingContext2D).textAlign = "center";
    ctx.fillText("!", 128, 173);
    texture.hasAlpha = true;
    texture.update();
    const mat = new StandardMaterial("charge-stencil", view.scene);
    mat.diffuseTexture = texture;
    mat.useAlphaFromDiffuseTexture = true;
    mat.specularColor = Color3.Black();
    mat.zOffset = -1;
    view.materials.chargeStencil = mat;
  }
  const body = view.cylinder("charge-pod", p, 1.7, 2.6, "red");
  const fittings: Mesh[] = [];
  for (const y of [-1.23, -0.85, 0.85, 1.23]) {
    const ring = MeshBuilder.CreateTorus(
      "charge-band",
      { diameter: 1.7, thickness: 0.1, tessellation: 32 },
      view.scene,
    );
    ring.position.y = y;
    fittings.push(ring);
  }
  for (const y of [-1.27, 1.27]) {
    const cap = MeshBuilder.CreateCylinder(
      "charge-end",
      { diameter: 1.64, height: 0.08, tessellation: 32 },
      view.scene,
    );
    cap.position.y = y;
    fittings.push(cap);
  }
  const neck = MeshBuilder.CreateCylinder(
    "charge-detonator",
    { diameter: 0.3, height: 0.28, tessellation: 16 },
    view.scene,
  );
  neck.position.y = 1.44;
  fittings.push(neck);
  for (const x of [-0.42, 0.42]) {
    const handle = MeshBuilder.CreateTorus(
      "charge-handle",
      { diameter: 0.45, thickness: 0.08, tessellation: 16 },
      view.scene,
    );
    handle.position.set(x, 1.38, 0);
    handle.rotation.x = Math.PI / 2;
    fittings.push(handle);
  }
  const hardware = Mesh.MergeMeshes(fittings, true, true)!;
  hardware.parent = body;
  hardware.material = view.materials.metal;
  hardware.receiveShadows = true;
  hardware.isPickable = false;
  view.shadow.addShadowCaster(hardware);
  for (const side of [-1, 1]) {
    const label = MeshBuilder.CreatePlane(
      "charge-warning",
      { width: 0.95, height: 0.95 },
      view.scene,
    );
    label.parent = body;
    label.position.z = side * 0.855;
    label.rotation.y = side === 1 ? Math.PI : 0;
    label.material = view.materials.chargeStencil;
    label.isPickable = false;
  }
  return body;
}
