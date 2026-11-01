import {
  Scene,
  MeshBuilder,
  DynamicTexture,
  Vector2,
  Color3,
  AbstractMesh,
} from "@babylonjs/core";
import { WaterMaterial } from "@babylonjs/materials/water";

export function createRiver(scene: Scene) {
  const normal = new DynamicTexture(
    "river-normal",
    { width: 256, height: 256 },
    scene,
    false,
  );
  const ctx = normal.getContext();
  const image = ctx.getImageData(0, 0, 256, 256);
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      const a = (x / 256) * Math.PI * 2,
        b = (y / 256) * Math.PI * 2;
      const dx =
          Math.cos(a * 4 + b * 3) * 0.22 + Math.sin(a * 9 - b * 6) * 0.12,
        dy = Math.cos(b * 7 - a * 2) * 0.18;
      const at = (y * 256 + x) * 4;
      image.data[at] = (dx * 0.5 + 0.5) * 255;
      image.data[at + 1] = (dy * 0.5 + 0.5) * 255;
      image.data[at + 2] = 250;
      image.data[at + 3] = 255;
    }
  ctx.putImageData(image, 0, 0);
  normal.update();
  normal.uScale = normal.vScale = 28;
  const material = new WaterMaterial(
    "river-reflection",
    scene,
    new Vector2(512, 512),
  );
  material.bumpTexture = normal;
  material.windForce = -2;
  material.windDirection = new Vector2(0.8, 0.4);
  material.waveHeight = 0.18;
  material.waveLength = 0.18;
  material.waveSpeed = 24;
  material.bumpHeight = 0.25;
  material.bumpSuperimpose = true;
  material.fresnelSeparate = true;
  material.bumpAffectsReflection = true;
  material.waterColor = new Color3(0.08, 0.22, 0.25);
  material.waterColor2 = new Color3(0.18, 0.31, 0.34);
  material.colorBlendFactor = 0.4;
  material.colorBlendFactor2 = 0.25;
  material.specularColor = new Color3(0.6, 0.7, 0.65);
  material.specularPower = 110;
  const mesh = MeshBuilder.CreateGround(
    "river",
    { width: 1100, height: 1400, subdivisions: 70 },
    scene,
  );
  mesh.position.set(0, -7, 250);
  mesh.material = material;
  mesh.isPickable = false;
  return {
    mesh,
    material,
    reflect(meshes: AbstractMesh[]) {
      const list = material.getRenderList();
      if (list) list.length = 0;
      meshes.forEach((m) => material.addToRenderList(m));
      if (material.reflectionTexture)
        material.reflectionTexture.refreshRate = 2;
      if (material.refractionTexture)
        material.refractionTexture.refreshRate = 3;
    },
  };
}
