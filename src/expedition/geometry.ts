import { Vector3, VertexData } from "@babylonjs/core";

export function archWedge(
  radius: number,
  rise: number,
  thickness: number,
  depth: number,
  a: number,
  b: number,
) {
  const points: Vector3[] = [];
  for (const z of [-depth / 2, depth / 2])
    for (const [r, h, t] of [
      [radius, rise, a],
      [radius + thickness, rise + thickness, a],
      [radius + thickness, rise + thickness, b],
      [radius, rise, b],
    ])
      points.push(new Vector3(Math.cos(t) * r, Math.sin(t) * h, z));
  const positions: number[] = [],
    indices: number[] = [],
    uvs: number[] = [],
    normals: number[] = [];
  for (const face of [
    [0, 3, 2, 1],
    [4, 5, 6, 7],
    [0, 1, 5, 4],
    [1, 2, 6, 5],
    [2, 3, 7, 6],
    [3, 0, 4, 7],
  ]) {
    const at = positions.length / 3;
    for (const j of face) {
      positions.push(points[j].x, points[j].y, points[j].z);
      uvs.push(points[j].x / 3, points[j].y / 3);
    }
    // Match Babylon’s left-handed normal and face-winding convention.
    indices.push(at, at + 2, at + 1, at, at + 3, at + 2);
  }
  VertexData.ComputeNormals(positions, indices, normals);
  const data = new VertexData();
  data.positions = positions;
  data.indices = indices;
  data.normals = normals;
  data.uvs = uvs;
  return data;
}
