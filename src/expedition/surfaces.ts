import { Scene, Texture, Color3, Vector3 } from "@babylonjs/core";
import { PBRCustomMaterial } from "@babylonjs/materials/custom/pbrCustomMaterial";

/** World-space projection keeps stone grain consistent across differently scaled ruins. */
export function weatheredStone(
  name: string,
  scene: Scene,
  texture: Texture,
  color: string,
  scale = 0.5,
) {
  const material = new PBRCustomMaterial(name, scene);
  material.albedoColor = Color3.FromHexString(color).toLinearSpace();
  material.metallic = 0;
  material.roughness = 0.92;
  material.AddUniform("weatherTexture", "sampler2D", texture);
  material.Fragment_Custom_Albedo(
    "vec3 weatherWeights=pow(abs(normalize(vNormalW)),vec3(4.0));weatherWeights/=max(0.001,weatherWeights.x+weatherWeights.y+weatherWeights.z);vec3 weatherGrain=texture2D(weatherTexture,vPositionW.yz*" +
      scale.toFixed(3) +
      ").rgb*weatherWeights.x+texture2D(weatherTexture,vPositionW.xz*" +
      scale.toFixed(3) +
      ").rgb*weatherWeights.y+texture2D(weatherTexture,vPositionW.xy*" +
      scale.toFixed(3) +
      ").rgb*weatherWeights.z;surfaceAlbedo*=mix(vec3(0.85),weatherGrain*1.65,0.65);",
  );
  return material;
}

/** Authored flagstone wear, damp patches and moss share the existing licensed stone maps. */
export function pavingMaterial(scene: Scene, climate: Vector3) {
  const m = new PBRCustomMaterial("floor", scene);
  m.albedoColor = Color3.FromHexString("#e2e4df").toLinearSpace();
  m.roughness = 0.85;
  m.metallic = 0;
  m.AddUniform("routeClimate", "vec3", climate);
  m.Fragment_Definitions(`
float routeHash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float routeNoise(vec2 p) { vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(routeHash(i),routeHash(i+vec2(1,0)),f.x),mix(routeHash(i+vec2(0,1)),routeHash(i+vec2(1,1)),f.x),f.y); }
float routeDamp(vec2 p) { return smoothstep(0.46,0.72,routeNoise(p*0.16)*0.65+routeNoise(p*0.63)*0.35); }
`);
  m.Fragment_Custom_Albedo(`
vec2 routeP=vPositionW.xz;
vec2 routeTiles=routeP/vec2(2.8,1.7); routeTiles.x+=mod(floor(routeTiles.y),2.0)*0.5;
vec2 routeCell=fract(routeTiles); vec2 routeEdge=min(routeCell,1.0-routeCell);
float routeJoint=1.0-smoothstep(0.008,0.021,min(routeEdge.x,routeEdge.y));
float routeLuma=dot(surfaceAlbedo,vec3(0.299,0.587,0.114));
surfaceAlbedo=mix(surfaceAlbedo,vec3(routeLuma)*vec3(0.94,1.0,1.04),0.82);
surfaceAlbedo*=0.94+routeHash(floor(routeTiles))*0.18;
surfaceAlbedo=mix(surfaceAlbedo,surfaceAlbedo*0.42,routeJoint*0.75);
float routeMoss=smoothstep(0.49,0.69,routeNoise(routeP*0.13)*0.7+routeNoise(routeP*1.3)*0.3)*routeClimate.x;
routeMoss=clamp(routeMoss+routeJoint*routeClimate.x*0.24,0.0,0.85);
surfaceAlbedo=mix(surfaceAlbedo,vec3(0.075,0.12,0.037)*(0.7+routeNoise(routeP*3.0)*0.7),routeMoss);
surfaceAlbedo*=1.0-routeDamp(routeP)*routeClimate.y*0.28;
surfaceAlbedo=mix(surfaceAlbedo,surfaceAlbedo*vec3(1.12,0.87,0.76),routeClimate.z*routeNoise(routeP*0.27));
`);
  m.Fragment_Custom_MetallicRoughness(
    "metallicRoughness.g=mix(metallicRoughness.g,0.38,routeDamp(vPositionW.xz)*routeClimate.y);",
  );
  m.albedoTexture = new Texture("/assets/materials/floor-diff.jpg", scene);
  m.bumpTexture = new Texture("/assets/materials/floor-nor_gl.jpg", scene);
  m.bumpTexture.level = 0.42;
  m.metallicTexture = new Texture("/assets/materials/floor-rough.jpg", scene);
  m.useRoughnessFromMetallicTextureGreen = true;
  m.useRoughnessFromMetallicTextureAlpha = false;
  m.useMetallnessFromMetallicTextureBlue = false;
  return m;
}
