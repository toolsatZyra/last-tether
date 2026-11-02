import { NodeIO } from "@gltf-transform/core";
import sharp from "sharp";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
const commit = "3f9939fd57c977934b9a5e0dc5a954ad765cf15f";
const base =
  "https://raw.githubusercontent.com/danielgruginski/Insectoids/" +
  commit +
  "/export/godot/Spider/";
const dir = "research/creature-assets/fantasy-creatures/export/godot/Spider";
await fs.mkdir(dir, { recursive: true });
const expected = {
  "Spider.glb":
    "01392cd888484d89beead84dbfa90a5b5b09880df19a20b5b7055926ae5f71de",
  "T_Spider.png":
    "611375f5c1d8955a7f97260bb4c60462e89b9a3e66d772f67f2c3b229b1396bc",
};
for (const [name, hash] of Object.entries(expected)) {
  let data;
  try {
    data = await fs.readFile(dir + "/" + name);
  } catch {
    const r = await fetch(base + name);
    if (!r.ok) throw Error("Source unavailable: " + name);
    data = Buffer.from(await r.arrayBuffer());
    await fs.writeFile(dir + "/" + name, data);
  }
  if (createHash("sha256").update(data).digest("hex") !== hash)
    throw Error("Source changed: " + name);
}
const io = new NodeIO(),
  doc = await io.read(dir + "/Spider.glb");
const input = await fs.readFile(dir + "/T_Spider.png");
// Source alpha stores smoothness, not opacity. glTF roughness uses green.
const colour = await sharp(input).removeAlpha().png().toBuffer();
const { data, info } = await sharp(input)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const packed = Buffer.alloc(info.width * info.height * 3);
for (let i = 0; i < info.width * info.height; i++) {
  packed[i * 3] = 255;
  packed[i * 3 + 1] = 255 - data[i * 4 + 3];
  packed[i * 3 + 2] = 0;
}
const roughness = await sharp(packed, {
  raw: { width: info.width, height: info.height, channels: 3 },
})
  .png()
  .toBuffer();
const albedo = doc
  .createTexture("silkspitter-colour")
  .setImage(colour)
  .setMimeType("image/png");
const orm = doc
  .createTexture("silkspitter-roughness")
  .setImage(roughness)
  .setMimeType("image/png");
for (const mat of doc.getRoot().listMaterials())
  mat
    .setBaseColorFactor([1, 1, 1, 1])
    .setBaseColorTexture(albedo)
    .setMetallicFactor(0)
    .setRoughnessFactor(1)
    .setMetallicRoughnessTexture(orm)
    .setAlphaMode("OPAQUE");
await fs.mkdir("public/assets/insects", { recursive: true });
await io.write("public/assets/insects/silkspitter.glb", doc);
console.log({
  triangles: doc
    .getRoot()
    .listMeshes()
    .flatMap((m) => m.listPrimitives())
    .reduce((n, p) => n + p.getIndices().getCount() / 3, 0),
  clips: doc
    .getRoot()
    .listAnimations()
    .map((a) => a.getName()),
  joints: doc
    .getRoot()
    .listSkins()
    .map((s) => s.listJoints().length),
  bytes: (await fs.stat("public/assets/insects/silkspitter.glb")).size,
});
