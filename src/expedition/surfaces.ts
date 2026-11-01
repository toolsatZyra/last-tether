import { Scene, Texture, Color3 } from "@babylonjs/core";
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
