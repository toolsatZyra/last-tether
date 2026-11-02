import { Matrix, Quaternion, TransformNode, Vector3 } from "@babylonjs/core";

/** Preserve a separately animated boot's attachment when adding a leg pose.
 * This export keeps feet under Root, rather than below the lower-leg nodes.
 * Native matrix transforms carry only our extra pose; source animation stays intact.
 */
export class FootPose {
  private relative = Matrix.Identity();
  private inverse = Matrix.Identity();
  private world = Matrix.Identity();
  private local = Matrix.Identity();
  private basePosition = Vector3.Zero();
  private baseRotation = Quaternion.Identity();
  private applied = false;

  constructor(
    private lower: TransformNode,
    private foot: TransformNode,
  ) {}

  capture() {
    this.lower.computeWorldMatrix(true);
    this.foot.computeWorldMatrix(true);
    this.lower.getWorldMatrix().invertToRef(this.inverse);
    this.foot.getWorldMatrix().multiplyToRef(this.inverse, this.relative);
    this.basePosition.copyFrom(this.foot.position);
    this.baseRotation.copyFrom(this.foot.rotationQuaternion!);
  }

  apply() {
    this.lower.computeWorldMatrix(true);
    this.relative.multiplyToRef(this.lower.getWorldMatrix(), this.world);
    this.foot.parent!.computeWorldMatrix(true).invertToRef(this.inverse);
    this.world.multiplyToRef(this.inverse, this.local);
    this.local.decompose(
      undefined,
      this.foot.rotationQuaternion!,
      this.foot.position,
    );
    this.applied = true;
  }

  restore() {
    if (!this.applied) return;
    this.foot.position.copyFrom(this.basePosition);
    this.foot.rotationQuaternion!.copyFrom(this.baseRotation);
    this.applied = false;
  }
}
