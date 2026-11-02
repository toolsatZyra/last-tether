import crypto from "node:crypto";
import fs from "node:fs/promises";
import { NodeIO } from "@gltf-transform/core";
import { weld, simplify, prune, dedup } from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
const io = new NodeIO(),
  dir = "research/creature-assets/";
await fs.mkdir(dir, { recursive: true });
await fs.mkdir("public/assets/guardian", { recursive: true });
const path = dir + "bake3d-trex-animated.glb";
let source;
try {
  source = await fs.readFile(path);
} catch {
  const r = await fetch(
    "https://bake3d.ai/samples/free/bake3d-trex-animated.glb",
  );
  if (!r.ok) throw Error("Source unavailable");
  source = Buffer.from(await r.arrayBuffer());
  await fs.writeFile(path, source);
}
if (
  crypto.createHash("sha256").update(source).digest("hex") !==
  "58029a4da9c5daadea1a71c671d130af250673c6f298102aed5f13c6c336823b"
)
  throw Error("Source hash changed; review before conversion");
const doc = await io.read(dir + "bake3d-trex-animated.glb");
const stats = () => ({
  triangles: doc
    .getRoot()
    .listMeshes()
    .flatMap((m) => m.listPrimitives())
    .reduce((n, p) => n + p.getIndices().getCount() / 3, 0),
  vertices: doc
    .getRoot()
    .listMeshes()
    .flatMap((m) => m.listPrimitives())
    .reduce((n, p) => n + p.getAttribute("POSITION").getCount(), 0),
  animations: doc
    .getRoot()
    .listAnimations()
    .map((a) => a.getName()),
  skins: doc
    .getRoot()
    .listSkins()
    .map((s) => s.listJoints().length),
});
const before = stats();
await MeshoptSimplifier.ready;
await doc.transform(
  weld(),
  simplify({
    simplifier: MeshoptSimplifier,
    ratio: 0.2,
    error: 0.001,
    lockBorder: true,
  }),
  dedup(),
  prune(),
);
await io.write("public/assets/guardian/slateback.glb", doc);
const result = {
  before,
  after: stats(),
  bytes: (await fs.stat("public/assets/guardian/slateback.glb")).size,
};
await fs.writeFile(dir + "optimization.json", JSON.stringify(result, null, 2));
console.log(result);
