import { SceneLoader, TransformNode, Vector3 } from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
/** Offline capture: Babylon skins each authored frame once; runtime uses fixed envelopes. */
export async function sample(scene) {
  const c = await SceneLoader.LoadAssetContainerAsync(
    "/assets/insects/",
    "stormwing.glb",
    scene,
  );
  const i = c.instantiateModelsToScene((n) => "bounds_" + n, false, {
    doNotInstantiate: true,
  });
  const root = new TransformNode("bounds-root", scene);
  i.rootNodes.forEach((n) => (n.parent = root));
  const nodes = root.getChildTransformNodes(),
    meshes = root.getChildMeshes().filter((m) => m.getTotalVertices());
  const bounds = meshes.map((m) => ({
    mesh: m.name.replace("bounds_", ""),
    min: new Vector3(Infinity, Infinity, Infinity),
    max: new Vector3(-Infinity, -Infinity, -Infinity),
  }));
  let samples = 0;
  for (const g of i.animationGroups) {
    i.animationGroups.forEach((a) => a.stop());
    g.start(false);
    g.pause();
    for (let f = g.from; f <= g.to; f++) {
      g.goToFrame(f);
      nodes.forEach((n) => n.computeWorldMatrix(true));
      meshes.forEach((m, index) => {
        m.computeWorldMatrix(true);
        m.skeleton?.prepare(true);
        m.refreshBoundingInfo(true);
        const b = m.getBoundingInfo().boundingBox;
        bounds[index].min.minimizeInPlace(b.minimum);
        bounds[index].max.maximizeInPlace(b.maximum);
      });
      samples++;
    }
  }
  const result = {
    samples,
    bounds: bounds.map((b) => ({
      mesh: b.mesh,
      min: b.min.subtract(new Vector3(0.12, 0.12, 0.12)).asArray(),
      max: b.max.add(new Vector3(0.12, 0.12, 0.12)).asArray(),
    })),
  };
  i.dispose();
  root.dispose();
  c.dispose();
  return result;
}
