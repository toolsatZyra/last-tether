import {
  AnimationGroup,
  type Bone,
  BoneIKController,
  Matrix,
  Mesh,
  Quaternion,
  TransformNode,
  Vector3,
} from "@babylonjs/core";

const smooth = (x: number) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};

/** A supported thrust layered over the licensed body clip using Babylon arm IK. */
export class SpearThrust {
  private space: TransformNode;
  private right: BoneIKController;
  private left: BoneIKController;
  private wristR: TransformNode;
  private wristL: TransformNode;
  private joints: TransformNode[];
  private bases: Quaternion[];
  private syncBones: { bone: Bone; node: TransformNode }[];
  private applied = false;
  private inverse = Matrix.Identity();
  private parentInverse = Matrix.Identity();
  private basis = Matrix.Identity();
  private point = Vector3.Zero();
  private world = Vector3.Zero();
  private forward = Vector3.Zero();
  private down = Vector3.Zero();
  private xAxis = Vector3.Zero();
  private yAxis = Vector3.Zero();
  private zAxis = Vector3.Zero();
  private target = Vector3.Zero();
  private pole = Vector3.Zero();

  constructor(
    private root: TransformNode,
    private mesh: Mesh,
    nodes: TransformNode[],
    private grip: TransformNode,
    groups: AnimationGroup[],
  ) {
    const skeleton = mesh.skeleton!;
    this.wristR = nodes.find((n) => n.name.endsWith("Wrist.R"))!;
    this.wristL = nodes.find((n) => n.name.endsWith("Wrist.L"))!;
    this.joints = [
      "UpperArm.R",
      "LowerArm.R",
      "Wrist.R",
      "UpperArm.L",
      "LowerArm.L",
      "Wrist.L",
    ].map((name) => nodes.find((n) => n.name.endsWith(name))!);
    this.bases = this.joints.map(() => Quaternion.Identity());
    const chain = new Set<Bone>();
    for (const side of ["R", "L"]) {
      for (
        let bone: Bone | null = skeleton.bones.find((b) =>
          b.name.endsWith("Wrist." + side),
        )!;
        bone;
        bone = bone.getParent()
      )
        chain.add(bone);
    }
    this.syncBones = [...chain]
      .map((bone) => ({ bone, node: bone.getTransformNode()! }))
      .filter((item) => item.node);

    // Retain the licensed punch's body weight shift, with a spear guard for the
    // arms. Blending back to an empty-hand fist pose would flip the shaft.
    const source = groups.find((g) => g.name.endsWith("_Punch_Right"))!;
    const guard = groups.find((g) => g.name.endsWith("_Idle_Sword"))!;
    const clip = source.clone(
      root.name + "_Spear_Thrust",
      (target) => target,
      true,
      true,
    );
    for (const track of clip.targetedAnimations) {
      if (
        !this.joints.includes(track.target) ||
        track.animation.targetProperty !== "rotationQuaternion"
      )
        continue;
      const pose = guard.targetedAnimations.find(
        (t) =>
          t.target === track.target &&
          t.animation.targetProperty === "rotationQuaternion",
      );
      const value = pose?.animation.getKeys()[0]?.value as
        | Quaternion
        | undefined;
      if (value)
        track.animation.setKeys([
          { frame: clip.from, value: value.clone() },
          { frame: clip.to, value: value.clone() },
        ]);
    }
    groups.push(clip);
    // The glTF scene root is mirrored. Solve in skeleton model space so the
    // native controller never has to decompose a reflected world transform.
    this.space = new TransformNode(
      root.name + "-arm-ik-space",
      root.getScene(),
    );
    this.right = new BoneIKController(
      this.space,
      skeleton.bones.find((b) => b.name.endsWith("LowerArm.R"))!,
      { maxAngle: 2.9 },
    );
    this.left = new BoneIKController(
      this.space,
      skeleton.bones.find((b) => b.name.endsWith("LowerArm.L"))!,
      { maxAngle: 2.9 },
    );
    this.right.poleTargetBone = null;
    this.left.poleTargetBone = null;
  }
  restore() {
    if (!this.applied) return;
    this.joints.forEach((n, i) =>
      n.rotationQuaternion!.copyFrom(this.bases[i]),
    );
    this.applied = false;
  }
  private at(x: number, y: number, z: number, out: Vector3) {
    const scale = this.root.scaling.x;
    this.point.set(x / scale, y / scale, z / scale);
    Vector3.TransformCoordinatesToRef(
      this.point,
      this.root.getWorldMatrix(),
      out,
    );
  }
  private aim(node: TransformNode, side: number) {
    node.parent!.computeWorldMatrix(true).invertToRef(this.parentInverse);
    Vector3.TransformNormalToRef(this.forward, this.parentInverse, this.xAxis);
    this.xAxis.scaleInPlace(side).normalize();
    Vector3.TransformNormalToRef(this.down, this.parentInverse, this.yAxis);
    this.yAxis.normalize();
    Vector3.CrossToRef(this.xAxis, this.yAxis, this.zAxis);
    this.zAxis.normalize();
    Matrix.FromXYZAxesToRef(this.xAxis, this.yAxis, this.zAxis, this.basis);
    Quaternion.FromRotationMatrixToRef(this.basis, node.rotationQuaternion!);
    node.computeWorldMatrix(true);
  }
  apply(phase: number) {
    const weight = smooth(phase / 0.18) * smooth((1 - phase) / 0.22);
    if (weight <= 0) return;
    this.joints.forEach((n, i) =>
      this.bases[i].copyFrom(n.rotationQuaternion!),
    );
    this.applied = true;
    this.mesh.computeWorldMatrix(true).invertToRef(this.inverse);
    const skeleton = this.mesh.skeleton!;
    // Synchronize only the arm chains before IK. The normal scene preparation
    // uploads the complete skinning palette once after this pose is applied.
    for (const { bone, node } of this.syncBones) {
      bone.position = node.position;
      bone.rotationQuaternion = node.rotationQuaternion!;
      bone.scaling = node.scaling;
    }
    skeleton.computeAbsoluteMatrices(true);
    const drive =
      phase < 0.52
        ? smooth((phase - 0.3) / 0.22)
        : 1 - smooth((phase - 0.66) / 0.34);
    this.at(0.12, 1.35 + drive * 0.1, -0.12 + drive * 0.55, this.target);
    Vector3.TransformCoordinatesToRef(
      this.target,
      this.inverse,
      this.right.targetPosition,
    );
    this.at(1, 0.9, -0.2, this.pole);
    Vector3.TransformCoordinatesToRef(
      this.pole,
      this.inverse,
      this.right.poleTargetPosition,
    );
    this.right.update();
    this.point.set(0, 0, 1);
    Vector3.TransformNormalToRef(
      this.point,
      this.root.getWorldMatrix(),
      this.forward,
    );
    this.forward.normalize();
    this.point.set(0, -1, 0);
    Vector3.TransformNormalToRef(
      this.point,
      this.root.getWorldMatrix(),
      this.down,
    );
    this.down.normalize();
    this.aim(this.wristR, -1);
    this.grip.computeWorldMatrix(true);
    this.point.set(0, 0.18, 0);
    Vector3.TransformCoordinatesToRef(
      this.point,
      this.grip.getWorldMatrix(),
      this.world,
    );
    const palm = -0.08 * this.root.scaling.x;
    this.world.addInPlaceFromFloats(
      this.down.x * palm,
      this.down.y * palm,
      this.down.z * palm,
    );
    Vector3.TransformCoordinatesToRef(
      this.world,
      this.inverse,
      this.left.targetPosition,
    );
    this.at(-1, 0.9, 0.2, this.pole);
    Vector3.TransformCoordinatesToRef(
      this.pole,
      this.inverse,
      this.left.poleTargetPosition,
    );
    this.left.update();
    this.aim(this.wristL, 1);
    if (weight < 1)
      this.joints.forEach((n, i) =>
        Quaternion.SlerpToRef(
          this.bases[i],
          n.rotationQuaternion!,
          weight,
          n.rotationQuaternion!,
        ),
      );
  }
  dispose() {
    this.restore();
    this.space.dispose();
  }
}
