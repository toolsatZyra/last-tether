import { NodeIO } from "@gltf-transform/core";
import sharp from "sharp";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
const commit = "3f9939fd57c977934b9a5e0dc5a954ad765cf15f";
const base =
  "https://raw.githubusercontent.com/danielgruginski/Insectoids/" +
  commit +
  "/export/godot/Wasp/";
const dir = "research/creature-assets/fantasy-creatures/export/godot/Wasp";
await fs.mkdir(dir, { recursive: true });
const expected = {
  "T_Wasp_Wing.png":
    "23438991241044a1f8637dabcf6cbc48897de7e77c60aa6dea784b719a7729dc",
  "Wasp.glb":
    "35e0db4ff8cac6fe89e9e8e795066d63917c1e3f9136e44bdaf595c77e0f2190",
  "T_Wasp.png":
    "dc6f78b9d67a80989f13a39344197ecfa58ffd8fdb3c666a17a57062abaede06",
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
  doc = await io.read(dir + "/Wasp.glb");
const input = await fs.readFile(dir + "/T_Wasp.png");
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
  .createTexture("stormwing-colour")
  .setImage(colour)
  .setMimeType("image/png");
const orm = doc
  .createTexture("stormwing-roughness")
  .setImage(roughness)
  .setMimeType("image/png");
const wing = doc
  .createTexture("stormwing-wings")
  .setImage(await fs.readFile(dir + "/T_Wasp_Wing.png"))
  .setMimeType("image/png");
for (const mat of doc.getRoot().listMaterials()) {
  if (mat.getName().includes("Wing")) {
    mat
      .setBaseColorFactor([1, 1, 1, 1])
      .setBaseColorTexture(wing)
      .setMetallicFactor(0)
      .setRoughnessFactor(0.35)
      .setAlphaMode("BLEND")
      .setDoubleSided(true);
    continue;
  }
  mat
    .setBaseColorFactor([1, 1, 1, 1])
    .setBaseColorTexture(albedo)
    .setMetallicFactor(0)
    .setRoughnessFactor(1)
    .setMetallicRoughnessTexture(orm)
    .setAlphaMode("OPAQUE");
}
// The game controller owns dives and falls; preserve articulated rotations,
// but remove authored body translation to avoid double locomotion.
for (const animation of doc.getRoot().listAnimations()) {
  if (["Idle", "Fly"].includes(animation.getName())) continue;
  for (const channel of animation.listChannels()) {
    if (
      channel.getTargetNode()?.getName() !== "Body" ||
      channel.getTargetPath() !== "translation"
    )
      continue;
    const sampler = channel.getSampler();
    const output = sampler.getOutput();
    const values = new Float32Array(output.getArray());
    const bind = channel.getTargetNode().getTranslation();
    for (let i = 0; i < values.length; i += 3) values.set(bind, i);
    sampler.setOutput(output.clone().setArray(values));
  }
}
await fs.mkdir("public/assets/insects", { recursive: true });
await io.write("public/assets/insects/stormwing.glb", doc);
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
  bytes: (await fs.stat("public/assets/insects/stormwing.glb")).size,
});
