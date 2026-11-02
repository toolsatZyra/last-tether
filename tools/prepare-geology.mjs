import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { NodeIO } from "@gltf-transform/core";
import { weld, simplify, prune } from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
const root = process.cwd(),
  id = "boulder_01";
const source = path.join(root, "research/geology", id);
await fs.mkdir(source, { recursive: true });
const response = await fetch("https://api.polyhaven.com/files/" + id);
if (!response.ok) throw new Error("Asset metadata unavailable");
const metadata = await response.json();
await fs.writeFile(
  path.join(source, "source.json"),
  JSON.stringify(metadata, null, 2),
);
const model = metadata.gltf["1k"].gltf;
const files = [[id + "_1k.gltf", model], ...Object.entries(model.include)];
const provenance = [];
for (const [name, file] of files) {
  const out = path.join(source, name);
  await fs.mkdir(path.dirname(out), { recursive: true });
  let data;
  try {
    data = await fs.readFile(out);
  } catch {}
  if (
    !data ||
    crypto.createHash("md5").update(data).digest("hex") !== file.md5
  ) {
    const r = await fetch(file.url);
    if (!r.ok) throw new Error(file.url);
    data = Buffer.from(await r.arrayBuffer());
  }
  if (crypto.createHash("md5").update(data).digest("hex") !== file.md5)
    throw new Error("Source integrity: " + name);
  await fs.writeFile(out, data);
  provenance.push({
    name,
    url: file.url,
    sha256: crypto.createHash("sha256").update(data).digest("hex"),
    bytes: data.length,
  });
}
const io = new NodeIO();
const doc = await io.read(path.join(source, id + "_1k.gltf"));
const count = () =>
  doc
    .getRoot()
    .listMeshes()
    .flatMap((m) => m.listPrimitives())
    .reduce((n, p) => n + p.getIndices().getCount() / 3, 0);
const before = count();
await MeshoptSimplifier.ready;
await doc.transform(weld());
const primitive = doc.getRoot().listMeshes()[0].listPrimitives()[0];
const normal = primitive.getAttribute("NORMAL").getArray(),
  uv = primitive.getAttribute("TEXCOORD_0").getArray();
const attributes = new Float32Array((normal.length / 3) * 5);
for (let i = 0; i < normal.length / 3; i++) {
  attributes.set(normal.subarray(i * 3, i * 3 + 3), i * 5);
  attributes.set(uv.subarray(i * 2, i * 2 + 2), i * 5 + 3);
}
const optimizer = {
  simplify(indices, positions, stride, target, error) {
    return MeshoptSimplifier.simplifyWithAttributes(
      indices,
      positions,
      stride,
      attributes,
      5,
      [0.5, 0.5, 0.5, 2, 2],
      null,
      target,
      error,
      ["Permissive"],
    );
  },
};
await doc.transform(
  simplify({
    simplifier: optimizer,
    ratio: 0.25,
    error: 0.01,
    lockBorder: false,
  }),
  prune(),
);
const relative = "assets/geology/boulder_01.glb",
  output = path.join(root, "public", relative);
await fs.mkdir(path.dirname(output), { recursive: true });
await io.write(output, doc);
const data = await fs.readFile(output);
const entry = {
  path: relative,
  source: model.url,
  sha256: crypto.createHash("sha256").update(data).digest("hex"),
  bytes: data.length,
  author: "Rico Cilliers / Poly Haven",
  license: "CC0-1.0",
  assetPage: "https://polyhaven.com/a/boulder_01",
  licensePage: "https://polyhaven.com/license",
  modifications:
    "Mesh welded and simplified with glTF Transform and Meshoptimizer; ratio 0.25, error 0.01, attribute-aware permissive collapse. Original 1K textures embedded unchanged.",
  originalTriangles: before,
  triangles: count(),
  sourceFiles: provenance,
};
const manifestPath = path.join(root, "public/assets/manifest.json");
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8")).filter(
  (e) => e.path !== relative,
);
manifest.push(entry);
await fs.writeFile(
  manifestPath,
  (JSON.stringify(manifest, null, 2) + "\n").replace(/\n/g, "\r\n"),
);
console.log(JSON.stringify({ before, after: count(), bytes: data.length }));
