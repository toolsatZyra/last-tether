import { AbstractMesh, InstancedMesh, Mesh, Vector3 } from "@babylonjs/core";

export interface FoliageView {
  meshes: AbstractMesh[];
  center: Vector3;
  radius: number;
  fades: Map<InstancedMesh, Mesh>;
}

// Instance visibility is shared by Babylon. Keep ordinary plants instanced,
// and use a geometry-sharing clone only for a plant that obscures the player.
export function fadeFoliage(
  plant: FoliageView,
  blocked: boolean,
  shadowCasters: AbstractMesh[],
) {
  for (const mesh of plant.meshes) {
    if (!(mesh instanceof InstancedMesh)) {
      mesh.visibility = blocked ? 0.16 : 1;
      continue;
    }
    let fade = plant.fades.get(mesh);
    if (blocked && !fade) {
      fade = mesh.sourceMesh.clone(
        mesh.name + "-camera-fade",
        mesh.parent,
        true,
      );
      fade.position.copyFrom(mesh.position);
      fade.rotation.copyFrom(mesh.rotation);
      fade.rotationQuaternion = mesh.rotationQuaternion?.clone() ?? null;
      fade.scaling.copyFrom(mesh.scaling);
      fade.isPickable = false;
      fade.visibility = 0.16;
      fade.setEnabled(true);
      plant.fades.set(mesh, fade);
      shadowCasters.push(fade);
    }
    mesh.isVisible = !blocked;
    if (fade) fade.isVisible = blocked;
  }
}
