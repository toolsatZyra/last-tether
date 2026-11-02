import { Color3, Mesh, PBRMaterial, Scene } from "@babylonjs/core";
import { PBRCustomMaterial } from "@babylonjs/materials/custom/pbrCustomMaterial";

/** Smooth duplicated surface normals without changing skin weights, UVs or silhouette. */
export function softenCharacterSurface(mesh: Mesh) {
  const positions = mesh.getVerticesData("position"),
    normals = mesh.getVerticesData("normal");
  if (!positions || !normals) return;
  const joints = mesh.getVerticesData("matricesIndices"),
    weights = mesh.getVerticesData("matricesWeights");
  const groups = new Map<string, number[]>();
  for (let i = 0; i < positions.length / 3; i++) {
    let key = [0, 1, 2]
      .map((k) => Math.round(positions[i * 3 + k] * 100000))
      .join(",");
    if (joints && weights)
      key +=
        ":" +
        [0, 1, 2, 3]
          .map(
            (k) =>
              joints[i * 4 + k] + "/" + Math.round(weights[i * 4 + k] * 10000),
          )
          .join(",");
    const group = groups.get(key);
    if (group) group.push(i);
    else groups.set(key, [i]);
  }
  const result = Float32Array.from(normals);
  for (const group of groups.values())
    for (const i of group) {
      let x = 0,
        y = 0,
        z = 0;
      for (const j of group) {
        const dot =
          normals[i * 3] * normals[j * 3] +
          normals[i * 3 + 1] * normals[j * 3 + 1] +
          normals[i * 3 + 2] * normals[j * 3 + 2];
        if (dot < 0.55) continue; // Keep deliberate corners rather than rounding every seam.
        x += normals[j * 3];
        y += normals[j * 3 + 1];
        z += normals[j * 3 + 2];
      }
      const length = Math.hypot(x, y, z);
      if (length > 1e-5)
        result.set([x / length, y / length, z / length], i * 3);
    }
  mesh.makeGeometryUnique();
  mesh.setVerticesData("normal", result);
}

export function characterSurface(
  scene: Scene,
  original: PBRMaterial,
  id: string,
  pack: boolean,
) {
  const name = original.name;
  const cloth = ["Green", "LightGreen", "Brown", "Brown2"].includes(name);
  const mat = cloth
    ? new PBRCustomMaterial(id + "_" + name + (pack ? "_pack" : ""), scene)
    : original.clone(id + "_" + name);
  mat.albedoColor = original.albedoColor.clone();
  mat.backFaceCulling = original.backFaceCulling;
  mat.metallic = 0;
  mat.roughness =
    name === "Skin"
      ? 0.63
      : name === "Eye"
        ? 0.24
        : name === "Hair"
          ? 0.68
          : 0.88;
  const colors: Record<string, string> = {
    Green: "#484139",
    LightGreen: pack ? "#82705a" : "#59756f",
    Brown: pack ? "#69503d" : "#606352",
    Brown2: "#42483e",
    Grey: "#49463e",
    Black: "#252c2a",
    Gold: "#c5a266",
  };
  if (colors[name])
    mat.albedoColor = Color3.FromHexString(colors[name]).toLinearSpace();
  if (name === "Gold") {
    mat.metallic = 0.72;
    mat.roughness = 0.32;
  }
  if (mat instanceof PBRCustomMaterial) {
    mat.Vertex_Definitions("varying vec3 tailorPosition;");
    mat.Vertex_Before_PositionUpdated("tailorPosition=position;");
    mat.Fragment_Definitions(
      "varying vec3 tailorPosition; float tailorHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);} float tailorNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(tailorHash(i),tailorHash(i+vec3(1,0,0)),f.x),mix(tailorHash(i+vec3(0,1,0)),tailorHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(tailorHash(i+vec3(0,0,1)),tailorHash(i+vec3(1,0,1)),f.x),mix(tailorHash(i+vec3(0,1,1)),tailorHash(i+vec3(1,1,1)),f.x),f.y),f.z);}",
    );
    mat.Fragment_Custom_Albedo(
      "float tailorWear=tailorNoise(tailorPosition*32.0);float weaveFade=1.0-smoothstep(0.003,0.012,length(fwidth(tailorPosition)));float tailorWeave=sin(tailorPosition.x*780.0)*sin(tailorPosition.y*780.0);surfaceAlbedo*=0.91+0.18*tailorWear+0.035*tailorWeave*weaveFade;",
    );
    mat.Fragment_Custom_MetallicRoughness(
      "metallicRoughness.g=clamp(metallicRoughness.g+(tailorNoise(tailorPosition*45.0)-0.5)*0.1,0.5,1.0);",
    );
  }
  return mat;
}
