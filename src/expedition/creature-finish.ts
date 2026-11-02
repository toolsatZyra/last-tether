import { Color3, PBRMaterial, Scene } from "@babylonjs/core";
import { PBRCustomMaterial } from "@babylonjs/materials/custom/pbrCustomMaterial";
import type { Kind } from "./level";

const finishes = new WeakMap<PBRMaterial, Map<Kind, PBRCustomMaterial>>();

/** Fine detail stays attached to the bind surface through every skeletal pose. */
export function creatureSurface(
  scene: Scene,
  original: PBRMaterial,
  kind: Kind,
) {
  let variants = finishes.get(original);
  if (!variants) finishes.set(original, (variants = new Map()));
  const cached = variants.get(kind);
  if (cached) return cached;
  const mat = new PBRCustomMaterial(
    original.name + "-" + kind + "-hide",
    scene,
  );
  mat.albedoTexture = original.albedoTexture;
  mat.backFaceCulling = original.backFaceCulling;
  mat.albedoColor = new Color3(0.85, 0.85, 0.85);
  mat.metallic = 0;
  mat.roughness = kind === "spitter" ? 0.47 : kind === "wing" ? 0.68 : 0.86;
  const colors: Record<Kind, string> = {
    raptor: "0.86,0.64,0.43",
    spitter: "0.53,0.76,0.39",
    brute: "0.74,0.79,0.77",
    bomber: "0.93,0.59,0.28",
    wing: "0.68,0.53,0.43",
    guardian: "0.57,0.72,0.78",
  };
  const pattern: Record<Kind, string> = {
    raptor:
      "float scales=sin(creaturePoint.y*85.0+sin(creaturePoint.x*80.0))*sin(creaturePoint.z*85.0); float pattern=.09*scales*detailFade-.12*smoothstep(.62,.82,grain);",
    spitter: "float pattern=.24*(coarse-.5)+.1*smoothstep(.64,.82,grain);",
    brute:
      "float fur=sin(creaturePoint.x*170.0+coarse*12.0)*sin(creaturePoint.z*165.0+creaturePoint.y*12.0); float pattern=.12*(grain-.5)+.065*fur*detailFade;",
    bomber:
      "float spots=smoothstep(.69,.79,creatureNoise(creaturePoint*18.0)); float pattern=.16*(coarse-.5)+.22*spots;",
    wing: "float folds=sin(creaturePoint.x*70.0+creaturePoint.y*9.0+coarse*8.0); float pattern=.12*(grain-.5)+.07*folds*detailFade;",
    guardian:
      "float seam=1.0-smoothstep(.025,.075,abs(coarse-.51)); float pattern=.18*(grain-.5)-.2*seam;",
  };
  mat.Vertex_Definitions("varying vec3 creaturePoint;");
  mat.Vertex_Before_PositionUpdated("creaturePoint=position;");
  mat.Fragment_Definitions(
    "varying vec3 creaturePoint; float creatureHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);} float creatureNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(creatureHash(i),creatureHash(i+vec3(1,0,0)),f.x),mix(creatureHash(i+vec3(0,1,0)),creatureHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(creatureHash(i+vec3(0,0,1)),creatureHash(i+vec3(1,0,1)),f.x),mix(creatureHash(i+vec3(0,1,1)),creatureHash(i+vec3(1,1,1)),f.x),f.y),f.z);}",
  );
  mat.Fragment_Custom_Albedo(
    "float creatureLuma=dot(surfaceAlbedo,vec3(.299,.587,.114)); float skinMask=smoothstep(.025,.09,creatureLuma)*(1.0-smoothstep(.55,.78,creatureLuma)); float coarse=creatureNoise(creaturePoint*9.0); float grain=creatureNoise(creaturePoint*52.0); float detailFade=1.0-smoothstep(.004,.018,length(fwidth(creaturePoint))); " +
      pattern[kind] +
      "surfaceAlbedo=mix(surfaceAlbedo,vec3(creatureLuma)*vec3(" +
      colors[kind] +
      "),.63*skinMask); surfaceAlbedo*=1.0+pattern*skinMask;",
  );
  mat.Fragment_Custom_MetallicRoughness(
    "float skinGrain=creatureNoise(creaturePoint*32.0); metallicRoughness.g=clamp(metallicRoughness.g+(skinGrain-.5)*.18,.3,1.0);",
  );
  variants.set(kind, mat);
  return mat;
}
