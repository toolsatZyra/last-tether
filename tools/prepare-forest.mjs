import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
const root = process.cwd(),
  revision = "c1920d176ab5443ff386959969074fd0eef86c4e";
const base =
  "https://raw.githubusercontent.com/walterpalladino/godot-shaders/" +
  revision +
  "/assets/godot-shaders/models/Ultimate%20Stylized%20Nature/";
const files = [
  "Textures/BirchTree_Bark.png",
  "Textures/BirchTree_Bark_Normal.png",
  "Textures/MapleTree_Bark.png",
  "Textures/MapleTree_Bark_Normal.png",
  "Textures/MapleTree_Leaves.png",
  "Textures/Grass.png",
  "MapleTree_2.gltf",
  "Grass_Small.gltf",
];
const manifest = JSON.parse(
  await fs.readFile("public/assets/manifest.json", "utf8"),
);
const hash = (b) => crypto.createHash("sha256").update(b).digest("hex");
await fs.mkdir("research/forest-source", { recursive: true });
for (const name of files) {
  const original = "research/forest-source/" + path.basename(name);
  let bytes = await fs.readFile(original).catch(() => null);
  if (!bytes) {
    const response = await fetch(base + name);
    if (!response.ok) throw Error(name + ": " + response.status);
    bytes = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(original, bytes);
  }
  const bark = name.includes("Bark"),
    dest = "assets/nature/" + (bark ? name.replace(".png", ".jpg") : name);
  const output = bark
    ? await sharp(bytes)
        .resize(1024, 1024, { fit: "inside" })
        .jpeg({ quality: 90, chromaSubsampling: "4:4:4" })
        .toBuffer()
    : bytes;
  await fs.writeFile("public/" + dest, output);
  const record = {
    path: dest,
    source: base + name,
    author: "Quaternius",
    license: "CC0-1.0",
    licenseSource: "https://quaternius.com/packs/ultimatestylizednature.html",
    originalDownloadSha256: hash(bytes),
    sha256: hash(output),
    bytes: output.length,
    modifications: bark
      ? "Original bark map resized to at most 1024px and JPEG quality 90 with 4:4:4 sampling."
      : "Unmodified source file; materials connected in Babylon at runtime.",
  };
  const at = manifest.findIndex((x) => x.path === dest);
  if (at < 0) manifest.push(record);
  else manifest[at] = record;
  console.log(dest, output.length);
}
await fs.writeFile(
  "public/assets/manifest.json",
  (JSON.stringify(manifest, null, 2) + "\n").replace(/\n/g, "\r\n"),
);
