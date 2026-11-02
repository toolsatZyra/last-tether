import type { Scene, ShadowGenerator } from "@babylonjs/core";
import { Actor, Assets } from "./actors";
import type { Chapter, Kind } from "./level";
import { CREATURE_KINDS, encounterCapacity } from "./encounter-capacity";

/** Area-bounded rig reserves: creation/disposal happens behind the area title. */
export class ActorPool {
  idle = new Map<Kind, Actor[]>();
  kinds = new Map<Actor, Kind>();
  inUse = new Set<Actor>();
  capacity = Object.fromEntries(
    CREATURE_KINDS.map((kind) => [kind, 0]),
  ) as Record<Kind, number>;
  created = 0;
  disposed = 0;
  misses = 0;
  constructor(
    public assets: Assets,
    public scene: Scene,
    public shadow: ShadowGenerator,
  ) {}
  private create(kind: Kind) {
    const actor = this.assets.actor(
      kind,
      this.scene,
      "reserve-" + kind + "-" + ++this.created,
      this.shadow,
    );
    this.kinds.set(actor, kind);
    return actor;
  }
  private park(actor: Actor) {
    actor.park();
    for (const mesh of actor.meshes) this.shadow.removeShadowCaster(mesh);
  }
  *prepare(chapter: Chapter): Generator<void> {
    this.capacity = encounterCapacity(chapter);
    for (const kind of CREATURE_KINDS) {
      const spare = this.idle.get(kind) || [];
      this.idle.set(kind, spare);
      while (spare.length > this.capacity[kind]) {
        const actor = spare.pop()!;
        this.kinds.delete(actor);
        actor.dispose();
        this.disposed++;
        yield;
      }
      while (spare.length < this.capacity[kind]) {
        const actor = this.create(kind);
        this.park(actor);
        spare.push(actor);
        yield;
      }
    }
  }
  acquire(kind: Kind) {
    let actor = this.idle.get(kind)?.pop();
    if (!actor) {
      this.misses++;
      actor = this.create(kind);
    }
    this.inUse.add(actor);
    actor.activate(kind);
    for (const mesh of actor.meshes) this.shadow.addShadowCaster(mesh);
    return actor;
  }
  release(actor: Actor) {
    if (!this.inUse.delete(actor)) return;
    const kind = this.kinds.get(actor)!;
    const spare = this.idle.get(kind) || [];
    this.park(actor);
    if (spare.length < this.capacity[kind]) {
      spare.push(actor);
      this.idle.set(kind, spare);
    } else {
      this.kinds.delete(actor);
      actor.dispose();
      this.disposed++;
    }
  }
}
