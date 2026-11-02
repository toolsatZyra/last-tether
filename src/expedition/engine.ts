import { quarryTrap, CRANE_IMPACT, CRANE_RADIUS } from "./crane.ts";
import {
  pressureGates,
  pressurePhase,
  insidePressureLane,
} from "./pressure.ts";
import {
  CHAPTERS,
  distance,
  length3,
  floorAt,
  v,
  type V,
  type Kind,
} from "./level.ts";

export type Input = {
  x: number;
  z: number;
  jump?: boolean;
  attack?: boolean;
  dodge?: boolean;
  grapple?: boolean;
  throw?: boolean;
  interact?: boolean;
  heal?: boolean;
  burst?: boolean;
};

export type Event = { type: string; text?: string; p?: V; value?: number };

export type Enemy = {
  id: number;
  kind: Kind;
  p: V;
  home: V;
  hp: number;
  max: number;
  state: string;
  timer: number;
  dir: V;
  yaw: number;
  flash: number;
  dead: number;
  phase: number;
  armour: boolean;
  exposed: number;
  attackCount: number;
  verticalSpeed?: number;
  groundY?: number;
  fallVelocity?: V;
  knockVelocity?: V;
  pull?: { to: V; remaining: number };
};

export type Shot = {
  id: number;
  p: V;
  dir: V;
  speed: number;
  life: number;
  friendly: boolean;
  radius: number;
  damage: number;
  trail: V[];
};

export type Ring = {
  id: number;
  p: V;
  r: number;
  life: number;
  speed: number;
  damage: number;
  hit: boolean;
};

export type Frame = {
  t: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  sector: number;
};

export type Save = {
  version: 2;
  sector: number;
  beat: number;
  seconds: number;
  deaths: number;
  kills: number;
  secrets: string[];
  finished: boolean;
  difficulty: "explorer" | "hunter";
};

export const clamp = (n: number, a: number, b: number) =>
  Math.max(a, Math.min(b, n));

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export const norm = (a: V, b: V) => {
  const d = length3(a, b) || 1;
  return v((b.x - a.x) / d, (b.y - a.y) / d, (b.z - a.z) / d);
};

export function validSave(raw: unknown): Save | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Save;

  if (
    s.version !== 2 ||
    !Number.isInteger(s.sector) ||
    s.sector < 0 ||
    s.sector > 7 ||
    !Number.isInteger(s.beat) ||
    s.beat < 0 ||
    s.beat > 3 ||
    !Number.isFinite(s.seconds) ||
    s.seconds < 0 ||
    !Number.isInteger(s.deaths) ||
    s.deaths < 0 ||
    !Number.isInteger(s.kills) ||
    s.kills < 0 ||
    !Array.isArray(s.secrets) ||
    typeof s.finished !== "boolean" ||
    !["explorer", "hunter"].includes(s.difficulty)
  )
    return null;

  if (s.finished && (s.sector !== 7 || s.beat !== 3)) return null;

  return {
    version: 2,
    sector: s.sector,
    beat: s.beat,
    seconds: s.seconds,
    deaths: s.deaths,
    kills: s.kills,
    secrets: s.secrets
      .filter((x) => typeof x === "string" && /^\d-\d$/.test(x))
      .slice(0, 24),
    finished: s.finished,
    difficulty: s.difficulty,
  };
}

const stats: Record<
  Kind,
  { hp: number; speed: number; damage: number; range: number }
> = {
  raptor: { hp: 110, speed: 5.2, damage: 13, range: 4.7 },
  spitter: { hp: 115, speed: 2, damage: 13, range: 25 },
  brute: { hp: 340, speed: 2.8, damage: 25, range: 6 },
  bomber: { hp: 65, speed: 6.4, damage: 30, range: 3 },
  wing: { hp: 95, speed: 5, damage: 15, range: 24 },
  guardian: { hp: 2100, speed: 3, damage: 30, range: 80 },
};

export class Expedition {
  enemyMotion?: (
    enemy: Enemy,
    velocity: V,
    dt: number,
  ) => { p: V; grounded: boolean };
  syncEnemyPhysics?: (enemies: Enemy[]) => void;
  motion:
    | ((p: V, velocity: V, dt: number) => { p: V; grounded: boolean })
    | null = null;

  wave = 0;
  runes = [0, 0, 0];
  sector = 0;
  beat = 0;
  p = v(0, 8, 0);
  velocity = v();
  yaw = 0;
  health = 100;
  flasks = 3;
  hunt = 0;
  seconds = 0;
  deaths = 0;
  kills = 0;
  secrets: string[] = [];
  difficulty: "explorer" | "hunter" = "explorer";
  finished = false;
  mode: "story" | "daily" = "story";

  grounded = true;
  coyote = 0.1;
  jumpBuffer = 0;
  invuln = 0;
  dodge = 0;
  dodgeCooldown = 0;
  dodgeDir = v();
  attack = 0;
  attackCooldown = 0;
  attackDuration = 0.35;
  attackBuffer = 0;
  swingDelay = -1;
  landTime = 0;
  private bufferedActions: Partial<Input> = {};
  combo = 0;
  comboWindow = 0;
  throwTime = 0;
  throwCooldown = 0;
  hurtTime = 0;
  slam = false;
  death = 0;
  time = 0;
  hitstop = 0;
  speed = 0;

  grapple: { from: V; to: V; t: number; duration: number } | null = null;
  grappleCooldown = 0;
  enemies: Enemy[] = [];
  shots: Shot[] = [];
  rings: Ring[] = [];
  events: Event[] = [];
  ghost: Frame[] = [];
  recordClock = 0;
  serial = 0;
  spawned = false;
  deviceTurn = 0;
  hazardClock = 0;
  escape = 110;
  checkpoint = v(0, 8, 0);
  podUsed = new Set<number>();
  craneElapsed = -1;
  craneSpent = false;
  transition = 0;

  constructor(save?: Save | null, mode: "story" | "daily" = "story") {
    this.mode = mode;
    if (save && mode === "story") {
      Object.assign(this, save);
      this.loadSector(save.sector, save.beat);
    } else this.loadSector(mode === "daily" ? 3 : 0, 0);
  }

  get chapter() {
    return CHAPTERS[this.sector];
  }
  get objective() {
    return this.chapter.beats[this.beat];
  }
  get destination() {
    return this.chapter.points[this.objective.node];
  }

  get living() {
    return this.enemies.filter((e) => e.hp > 0);
  }
  get clear() {
    return (
      this.spawned &&
      this.living.length === 0 &&
      this.wave >= (this.objective.reinforcements?.length || 0)
    );
  }

  get runeTargets() {
    return this.sector === 2 && this.beat === 1
      ? [0, 3, 1]
      : this.sector === 2
        ? [1, 0, 3]
        : [3, 1, 0];
  }

  dial(i: number) {
    const p = this.destination;
    return v(p.x + [-7, 7, 0][i], p.y, p.z + [0, 0, 9][i]);
  }

  get runeTarget() {
    return ((this.sector + this.beat * 2) % 3) + 1;
  }

  get checkpointNode() {
    return this.beat === 0 ? 0 : this.chapter.beats[this.beat - 1].node;
  }

  save(): Save {
    return {
      version: 2,
      sector: this.sector,
      beat: this.beat,
      seconds: this.seconds,
      deaths: this.deaths,
      kills: this.kills,
      secrets: [...this.secrets],
      finished: this.finished,
      difficulty: this.difficulty,
    };
  }

  event(type: string, text?: string, p?: V, value?: number) {
    this.events.push({ type, text, p: p ? { ...p } : undefined, value });
  }

  loadSector(sector: number, beat = 0) {
    this.sector = sector;
    this.beat = beat;
    this.spawned = false;
    this.wave = 0;
    this.runes = [0, 0, 0];
    this.enemies = [];
    this.shots = [];
    this.rings = [];
    this.deviceTurn = 0;
    this.hazardClock = 0;
    this.podUsed.clear();
    this.craneElapsed = -1;
    this.craneSpent = beat > 0;
    this.grapple = null;
    this.resetActions();
    this.velocity = v();
    this.grounded = true;
    this.checkpoint = { ...this.chapter.points[this.checkpointNode] };
    this.p = { ...this.checkpoint };
    this.health = 100;
    this.flasks = 3;
    this.escape = 110;
    this.transition = 1;
    this.event("sector", this.chapter.title);
    this.event("story", this.chapter.entry);
  }

  spawn() {
    this.spawned = true;
    const p = this.destination;
    this.objective.enemies?.forEach((kind, i) => {
      const angle = i * 2.399;
      const pos = v(
        p.x + Math.sin(angle) * (8 + (i % 3) * 3),
        p.y + (kind === "wing" ? 3 : 0),
        p.z + Math.cos(angle) * (8 + (i % 3) * 3),
      );
      this.addEnemy(kind, pos);
    });
    if (this.objective.story) this.event("story", this.objective.story);
  }

  addEnemy(kind: Kind, p: V) {
    const hp = stats[kind].hp;
    this.enemies.push({
      id: ++this.serial,
      kind,
      p: { ...p },
      home: { ...p },
      hp,
      max: hp,
      state: "idle",
      timer: 0.4 + (this.serial % 4) * 0.25,
      dir: v(),
      yaw: 0,
      flash: 0,
      dead: 0,
      phase: 1,
      armour: kind === "guardian",
      exposed: 0,
      attackCount: 0,
    });
  }

  get anchor() {
    const points = this.chapter.points;
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      if (!p.gap || p.z < this.p.z - 10 || p.z > this.destination.z + 20)
        continue;
      const target = v(p.x, p.y, p.z - 6);
      if (length3(this.p, target) < 80 && this.p.z < p.z - 11) return target;
    }
    return null;
  }

  get target() {
    return (
      this.living
        .filter((e) => e.state !== "falling" && distance(this.p, e.p) < 32)
        .sort((a, b) => distance(this.p, a.p) - distance(this.p, b.p))[0] ||
      null
    );
  }

  hurt(damage: number) {
    if (this.invuln > 0 || this.death > 0 || this.finished) return;
    this.health = Math.max(
      0,
      this.health - damage * (this.difficulty === "explorer" ? 0.7 : 1),
    );
    this.invuln = 0.65;
    this.hurtTime = 0.3;
    this.swingDelay = -1;
    this.attack = this.attackBuffer = 0;
    this.hunt = Math.max(0, this.hunt - 8);
    this.event("hurt", undefined, this.p);
    if (this.health <= 0) this.die();
  }

  die() {
    if (this.death > 0 || this.finished) return;
    this.death = 1.1;
    this.deaths++;
    this.grapple = null;
    this.event("death", "A route is learned one crossing at a time.");
  }

  resetActions() {
    this.attack =
      this.attackCooldown =
      this.attackBuffer =
      this.comboWindow =
        0;
    this.swingDelay = -1;
    this.hitstop =
      this.landTime =
      this.dodge =
      this.throwTime =
      this.hurtTime =
        0;
    this.slam = false;
    this.bufferedActions = {};
  }

  retry() {
    this.resetActions();
    this.p = { ...this.checkpoint };
    this.velocity = v();
    this.health = 100;
    this.flasks = Math.max(2, this.flasks);
    this.invuln = 2;
    this.death = 0;
    this.enemies = [];
    this.shots = [];
    this.rings = [];
    this.spawned = false;
    this.wave = 0;
    this.runes = [0, 0, 0];
    this.deviceTurn = 0;
    this.hazardClock = 0;
    this.escape = 110;
    this.podUsed.clear();
    this.craneElapsed = -1;
    this.craneSpent = this.beat > 0;
    this.event("save");
  }

  damage(e: Enemy, amount: number, knock = 0) {
    if (e.hp <= 0) return;
    if (e.kind === "guardian" && e.armour) {
      amount *= 0.08;
      this.event("armoured", "Armoured: bait a charge into a striped support.");
    }
    e.hp = Math.max(0, e.hp - amount);
    e.flash = 0.18;
    this.hunt = clamp(this.hunt + amount * 0.1, 0, 100);
    if (knock && e.kind !== "guardian") {
      const d = norm(this.p, e.p);
      if (e.kind === "wing") {
        e.p.x += d.x * knock;
        e.p.z += d.z * knock;
      } else e.knockVelocity = v(d.x * knock * 12, 0, d.z * knock * 12);
    }
    this.event("hit", undefined, e.p, amount);

    if (e.hp <= 0) {
      e.pull = undefined;
      e.state = "death";
      e.dead = e.kind === "guardian" ? 2.4 : 1.4;
      this.kills++;
      this.event("kill", e.kind, e.p);
      this.health = Math.min(100, this.health + 2);
    } else if (
      e.kind !== "guardian" &&
      e.kind !== "brute" &&
      e.state !== "falling"
    ) {
      e.state = "stunned";
      e.timer = 0.28;
    }
  }

  strike() {
    if (
      this.attackCooldown > 0 ||
      this.throwTime > 0 ||
      this.hurtTime > 0 ||
      this.dodge > 0 ||
      this.grapple ||
      this.death > 0
    )
      return;
    this.combo = this.comboWindow > 0 ? (this.combo + 1) % 3 : 0;
    this.comboWindow = 1.1;
    this.attackCooldown = [0.35, 0.4, 0.58][this.combo];
    this.attackDuration = this.attackCooldown;
    this.attack = this.attackCooldown;
    this.attackBuffer = 0;
    this.swingDelay = this.attackDuration * (24 / 62);
    this.event("attack", undefined, this.p, this.combo);

    if (
      !this.grounded &&
      this.p.y > (floorAt(this.chapter, this.p.x, this.p.z) ?? this.p.y) + 1
    ) {
      this.swingDelay = -1;
      this.slam = true;
      this.velocity.y = -22;
      return;
    }

    const target = this.target;
    if (target && distance(this.p, target.p) < 6)
      this.yaw = Math.atan2(target.p.x - this.p.x, target.p.z - this.p.z);
  }

  resolveSwing() {
    this.event("swing", undefined, this.p, this.combo);
    let connected = false;
    for (const e of this.living) {
      const d = distance(this.p, e.p),
        dot =
          ((e.p.x - this.p.x) * Math.sin(this.yaw) +
            (e.p.z - this.p.z) * Math.cos(this.yaw)) /
          (d || 1);
      if (d < 4.2 && Math.abs(this.p.y - e.p.y) < 4 && dot > -0.2) {
        this.damage(e, [34, 42, 72][this.combo], this.combo === 2 ? 1.8 : 0.4);
        connected = true;
      }
    }

    this.checkPods(this.p, 6);
    if (connected) this.hitstop = this.combo === 2 ? 0.055 : 0.035;
  }

  checkPods(p: V, r: number) {
    if (this.sector !== 4) return;
    for (let i = 0; i < 3; i++) {
      if (this.podUsed.has(i)) continue;
      const pod = this.pod(i);
      if (distance(p, pod) < r) {
        this.podUsed.add(i);
        for (const e of this.living)
          if (distance(e.p, pod) < 12) this.damage(e, 180, 3);
        this.event("explode", undefined, pod);
      }
    }
  }

  pod(i: number) {
    return v(
      this.destination.x + (i - 1) * 11,
      this.destination.y,
      this.destination.z + (i % 2 ? 8 : -6),
    );
  }

  useGrapple() {
    if (this.grappleCooldown > 0 || this.grapple || this.death > 0) return;
    const anchor = this.anchor;

    if (anchor) {
      this.grapple = {
        from: { ...this.p },
        to: { ...anchor },
        t: 0,
        duration: Math.max(1.1, length3(this.p, anchor) / 28),
      };
      this.grappleCooldown = 0.4;
      this.event("grapple", undefined, anchor);
      return;
    }

    const e = this.target;
    if (!e) return;
    if (e.kind === "guardian") {
      if (e.state === "stunned" && e.armour) {
        e.armour = false;
        e.exposed = 10;
        e.state = "recover";
        e.timer = 3;
        this.damage(e, 90);
        this.event("armour", "Armour torn loose. Close in and strike!", e.p);
      }
      return;
    }

    const d = norm(this.p, e.p);
    this.damage(e, 22);
    if (e.hp > 0) {
      e.pull = {
        to: v(this.p.x + d.x * 3, this.p.y, this.p.z + d.z * 3),
        remaining: 0.3,
      };
      e.knockVelocity = undefined;
      e.state = "stunned";
      e.timer = 0.65;
    }
    this.grappleCooldown = 2;
    this.event("pull", undefined, e.p);
  }

  cast() {
    if (
      this.throwCooldown > 0 ||
      this.hurtTime > 0 ||
      this.attack > 0 ||
      this.dodge > 0 ||
      this.grapple ||
      this.death > 0
    )
      return;
    this.throwTime = 0.4;
    this.throwCooldown = 1.1;
    const e = this.target;
    const start = v(this.p.x, this.p.y + 1.3, this.p.z);
    const dir = e
      ? norm(start, v(e.p.x, e.p.y + 1, e.p.z))
      : v(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    if (e) this.yaw = Math.atan2(dir.x, dir.z);
    this.shots.push({
      id: ++this.serial,
      p: start,
      dir,
      speed: 34,
      life: 1.1,
      friendly: true,
      radius: 1,
      damage: 48,
      trail: [],
    });
    this.event("cast", undefined, this.p);
  }

  finishBeat() {
    this.health = Math.min(100, this.health + 16);
    this.hunt = Math.min(100, this.hunt + 10);
    this.event("secured", this.objective.title);
    this.checkpoint = { ...this.destination };
    if (this.beat < 3) {
      this.beat++;
      this.spawned = false;
      this.wave = 0;
      this.runes = [0, 0, 0];
      this.deviceTurn = 0;
      this.hazardClock = 0;
      this.podUsed.clear();
    } else if (this.sector === 7 || this.mode === "daily") {
      this.finished = true;
      this.event("complete", this.chapter.exit);
    } else {
      this.event("story", this.chapter.exit);
      this.loadSector(this.sector + 1);
    }

    this.event("save");
  }

  get canReleaseCrane() {
    if (
      this.sector !== 4 ||
      this.beat !== 0 ||
      this.craneSpent ||
      this.craneElapsed >= 0 ||
      !this.grounded ||
      this.grapple ||
      this.death > 0
    )
      return false;
    const lever = quarryTrap(this.chapter).lever;
    return distance(this.p, lever) < 3 && Math.abs(this.p.y - lever.y) < 2;
  }

  updateCrane(dt: number) {
    if (this.sector !== 4 || this.craneElapsed < 0 || this.craneSpent) return;
    this.craneElapsed += dt;
    if (this.craneElapsed < CRANE_IMPACT) return;
    this.craneElapsed = CRANE_IMPACT;
    this.craneSpent = true;
    const p = quarryTrap(this.chapter).load;
    for (const e of this.living)
      if (distance(e.p, p) < CRANE_RADIUS && Math.abs(e.p.y - p.y) < 4)
        this.damage(e, 360, 2);
    if (distance(this.p, p) < CRANE_RADIUS && Math.abs(this.p.y - p.y) < 3)
      this.hurt(35);
    // The first-yard charge sits below the load: a surviving charge chains the impact.
    if (this.beat === 0) this.checkPods(p, 2);
    this.event("crane-impact", undefined, p);
  }

  interact() {
    if (this.canReleaseCrane) {
      this.craneElapsed = 0;
      this.event(
        "crane-release",
        "Load released — clear the marked ground!",
        quarryTrap(this.chapter).load,
      );
      return;
    }
    const p = this.destination;

    if (this.clear && this.objective.device === "rune") {
      const index = [0, 1, 2].sort(
        (a, b) =>
          distance(this.p, this.dial(a)) - distance(this.p, this.dial(b)),
      )[0];
      if (distance(this.p, this.dial(index)) < 4) {
        this.runes[index] = (this.runes[index] + 1) % 4;
        this.runes[(index + 1) % 3] = (this.runes[(index + 1) % 3] + 1) % 4;
        this.event("rune", undefined, this.dial(index));
        if (this.runes.every((n, i) => n === this.runeTargets[i])) {
          this.event("device", undefined, p);
          this.finishBeat();
        }
        return;
      }
    } else if (this.clear && distance(this.p, p) < 6 && this.objective.device) {
      this.event("device", undefined, p);
      this.finishBeat();
      return;
    }

    for (let i = 0; i < 3; i++) {
      const node = this.chapter.points[i * 2 + 2],
        key = this.sector + "-" + i,
        cache = v(node.x + 10, node.y, node.z + 6);
      if (distance(this.p, cache) < 4 && !this.secrets.includes(key)) {
        this.secrets.push(key);
        this.flasks = Math.min(3, this.flasks + 1);
        this.event(
          "secret",
          "A routefinder’s memory · healing flask restored",
          cache,
        );
        this.event("save");
      }
    }
  }

  step(dt: number, input: Input) {
    dt = Math.min(0.0334, dt);
    if (this.finished) return;
    if (this.death > 0) {
      this.death -= dt;
      if (this.death <= 0) this.retry();
      return;
    }
    this.seconds += dt;
    const actions = [
      "jump",
      "dodge",
      "attack",
      "throw",
      "grapple",
      "interact",
      "heal",
      "burst",
    ] as const;
    if (this.hitstop > 0) {
      this.hitstop = Math.max(0, this.hitstop - dt);
      for (const key of actions)
        if (input[key]) this.bufferedActions[key] = true;
      return;
    }
    input = { ...input };
    for (const key of actions)
      input[key] = input[key] || this.bufferedActions[key];
    this.bufferedActions = {};
    this.time += dt;
    this.transition = Math.max(0, this.transition - dt);

    for (const key of [
      "invuln",
      "dodge",
      "dodgeCooldown",
      "attack",
      "attackCooldown",
      "comboWindow",
      "throwTime",
      "throwCooldown",
      "hurtTime",
      "grappleCooldown",
      "landTime",
      "attackBuffer",
    ] as const)
      this[key] = Math.max(0, this[key] - dt);

    if (input.heal && this.flasks > 0 && this.health < 100) {
      this.flasks--;
      this.health = Math.min(100, this.health + 55);
      this.event("heal", undefined, this.p);
    }

    if (input.burst && this.hunt >= 100 && this.sector >= 3) {
      this.hunt = 0;
      this.invuln = 1;
      this.rings.push({
        id: ++this.serial,
        p: { ...this.p },
        r: 0,
        life: 0.6,
        speed: 32,
        damage: 0,
        hit: false,
      });
      for (const e of this.living)
        if (distance(this.p, e.p) < 17) this.damage(e, 150, 4);
      this.hunt = 0;
      this.event("burst", undefined, this.p);
    }

    if (input.grapple) this.useGrapple();
    if (input.attack) this.attackBuffer = 0.14;
    if (input.interact) this.interact();

    if (input.jump) this.jumpBuffer = 0.16;
    else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);

    const len = Math.hypot(input.x, input.z),
      ix = len > 1 ? input.x / len : input.x,
      iz = len > 1 ? input.z / len : input.z;

    if (input.dodge && this.dodgeCooldown <= 0 && !this.grapple) {
      this.swingDelay = -1;
      this.attack = this.attackBuffer = 0;
      this.dodge = 0.28;
      this.dodgeCooldown = 0.65;
      this.invuln = 0.32;
      this.dodgeDir =
        len > 0.1 ? v(ix, 0, iz) : v(Math.sin(this.yaw), 0, Math.cos(this.yaw));
      this.event("dodge");
    }

    if (this.attackBuffer > 0) this.strike();
    if (input.throw && (this.sector > 0 || this.beat >= 2)) this.cast();

    if (this.grapple) {
      this.swingDelay = -1;
      const g = this.grapple;
      g.t += dt / g.duration;
      const t = clamp(g.t, 0, 1),
        ease = t * t * (3 - 2 * t);
      this.p = v(
        mix(g.from.x, g.to.x, ease),
        mix(g.from.y, g.to.y, ease) + Math.sin(t * Math.PI) * 12,
        mix(g.from.z, g.to.z, ease),
      );
      this.yaw = Math.atan2(g.to.x - g.from.x, g.to.z - g.from.z);
      this.grounded = false;

      if (t >= 1) {
        this.grapple = null;
        this.p = { ...g.to };
        this.velocity = v();
        this.grounded = true;
        this.landTime = 0.22;
        this.event("land", undefined, this.p);
      } else if (input.jump && t > 0.3) {
        this.grapple = null;
        this.velocity = v(Math.sin(this.yaw) * 12, 8, Math.cos(this.yaw) * 12);
        this.jumpBuffer = 0;
      }
    } else {
      if (this.grounded) this.coyote = 0.12;
      else this.coyote = Math.max(0, this.coyote - dt);

      if (this.jumpBuffer > 0 && this.coyote > 0) {
        this.velocity.y = 11;
        this.grounded = false;
        this.coyote = 0;
        this.jumpBuffer = 0;
        this.event("jump");
      }

      const targetSpeed = this.dodge > 0 ? 18 : this.attack > 0 ? 4.2 : 6.8,
        accel = this.grounded ? 18 : 8;

      // A short planted step closes melee reach; it uses the same collision sweep as walking.
      const closeTarget =
        this.swingDelay >= 0 && this.grounded && len < 0.15
          ? this.target
          : null;
      const reach = closeTarget ? distance(this.p, closeTarget.p) : 0;
      const stepFloor = floorAt(
        this.chapter,
        this.p.x + Math.sin(this.yaw) * 0.8,
        this.p.z + Math.cos(this.yaw) * 0.8,
      );
      const advance =
        closeTarget &&
        stepFloor !== null &&
        Math.abs(stepFloor - this.p.y) < 1.5 &&
        reach < 6 &&
        reach > 2.6
          ? Math.min(6.5, (reach - 2.6) * 8)
          : 0;
      this.velocity.x = mix(
        this.velocity.x,
        (this.dodge > 0 ? this.dodgeDir.x : ix) * targetSpeed +
          Math.sin(this.yaw) * advance,
        Math.min(1, accel * dt),
      );
      this.velocity.z = mix(
        this.velocity.z,
        (this.dodge > 0 ? this.dodgeDir.z : iz) * targetSpeed +
          Math.cos(this.yaw) * advance,
        Math.min(1, accel * dt),
      );

      if (len > 0.15 && this.attack <= 0) this.yaw = Math.atan2(ix, iz);
      this.speed = Math.hypot(this.velocity.x, this.velocity.z);
      this.velocity.y -= 28 * dt;

      const old = { ...this.p };
      let landed = false;

      if (this.motion) {
        const result = this.motion(old, this.velocity, dt);
        this.p = result.p;
        landed = !this.grounded && result.grounded && this.velocity.y < -5;
        this.grounded = result.grounded;
        if (this.grounded) this.velocity.y = 0;
      } else {
        this.p.x += this.velocity.x * dt;
        this.p.z += this.velocity.z * dt;
        this.p.y += this.velocity.y * dt;
        const ground = floorAt(this.chapter, this.p.x, this.p.z);
        if (
          ground !== null &&
          this.velocity.y <= 0 &&
          this.p.y <= ground &&
          old.y >= ground - 1.6
        ) {
          landed = !this.grounded && this.velocity.y < -5;
          this.p.y = ground;
          this.velocity.y = 0;
          this.grounded = true;
        } else this.grounded = false;
      }

      if (landed) {
        this.landTime = 0.22;
        this.event("land", undefined, this.p);
        if (this.slam) {
          for (const e of this.living)
            if (distance(this.p, e.p) < 9) this.damage(e, 85, 3);
          this.event("slam", undefined, this.p);
          this.slam = false;
        }
      }

      if (this.p.z > this.destination.z + 23 && !this.clear) {
        this.p.z = this.destination.z + 23;
        this.velocity.z = 0;
      }
    }

    const nearby = this.chapter.points.filter(
      (p) => Math.abs(p.z - this.p.z) < 65,
    );
    const recoveryFloor = nearby.length
      ? Math.min(...nearby.map((p) => p.y)) - 7
      : -12;
    if (this.p.y < recoveryFloor) this.die();

    if (this.swingDelay >= 0) {
      this.swingDelay -= dt;
      if (this.swingDelay <= 0) {
        this.swingDelay = -1;
        this.resolveSwing();
      }
    }

    if (!this.spawned && distance(this.p, this.destination) < 43) this.spawn();

    this.updateEnemies(dt);
    this.updateShots(dt);
    this.updateHazards(dt);
    this.updateCrane(dt);

    if (
      this.spawned &&
      this.living.length === 0 &&
      this.wave < (this.objective.reinforcements?.length || 0)
    ) {
      const next = this.objective.reinforcements![this.wave++];
      next.forEach((kind, i) => {
        const a = i * 2.4 + this.wave;
        this.addEnemy(
          kind,
          v(
            this.destination.x + Math.sin(a) * 17,
            this.destination.y + (kind === "wing" ? 3 : 0),
            this.destination.z + Math.cos(a) * 17,
          ),
        );
      });
      this.event(
        "reinforcement",
        "A second group approaches · keep your footing",
        this.destination,
      );
    }

    if (
      this.clear &&
      !this.objective.device &&
      distance(this.p, this.destination) < 15
    )
      this.finishBeat();

    if (this.sector === 7) {
      this.escape -= dt;
      if (this.escape <= 0) this.die();
    }

    this.recordClock += dt;
    if (this.recordClock > 0.1) {
      this.recordClock = 0;
      this.ghost.push({
        t: this.seconds,
        ...this.p,
        yaw: this.yaw,
        sector: this.sector,
      });
      if (this.ghost.length > 15000) this.ghost.shift();
    }
  }

  updateEnemies(dt: number) {
    this.syncEnemyPhysics?.(this.enemies);
    for (const e of this.enemies) {
      e.flash = Math.max(0, e.flash - dt);
      if (e.hp <= 0) {
        e.dead = Math.max(0, e.dead - dt);
        continue;
      }
      e.timer -= dt;
      const d = distance(this.p, e.p);
      const committedFacing =
        e.state === "falling" ||
        e.state === "lunge" ||
        (e.kind === "raptor" && e.state === "windup") ||
        (e.kind === "guardian" &&
          ["windup", "charge", "stunned"].includes(e.state));
      if (!committedFacing)
        e.yaw = Math.atan2(this.p.x - e.p.x, this.p.z - e.p.z);

      if (e.kind === "guardian") {
        this.guardian(e, dt);
        continue;
      }

      const velocity = v();
      if (e.state === "falling") {
        e.pull = undefined;
        this.moveGroundEnemy(e, e.fallVelocity || velocity, dt);
        continue;
      }

      if (e.state === "stunned") {
        if (e.timer <= 0) {
          e.state = "idle";
          e.timer = 0.2;
        }
      } else if (e.state === "idle") {
        const range =
          e.kind === "spitter"
            ? 15
            : e.kind === "wing"
              ? 13
              : stats[e.kind].range;

        const returning = distance(e.p, this.destination) > 21;
        if (d > range || returning) {
          const dir = norm(e.p, returning ? this.destination : this.p);
          velocity.x = dir.x * stats[e.kind].speed;
          velocity.z = dir.z * stats[e.kind].speed;
        }

        if (e.kind === "wing")
          e.p.y = e.home.y + Math.sin(this.time * 2 + e.id) * 1.2;

        if (d < stats[e.kind].range && e.timer <= 0) {
          e.state = "windup";
          e.timer =
            e.kind === "brute"
              ? 1.05
              : e.kind === "bomber"
                ? 0.9
                : e.kind === "raptor"
                  ? 0.6
                  : 0.85;
          e.dir = norm(e.p, v(this.p.x, e.p.y, this.p.z));
          this.event("tell", e.kind, e.p);
        }
      } else if (e.state === "windup" && e.timer <= 0) {
        if (e.kind === "spitter") {
          for (const a of [-0.16, 0, 0.16]) {
            const dir = norm(
              v(e.p.x, e.p.y + 1.2, e.p.z),
              v(this.p.x, this.p.y + 1, this.p.z),
            );
            const x = dir.x * Math.cos(a) - dir.z * Math.sin(a),
              z = dir.x * Math.sin(a) + dir.z * Math.cos(a);
            this.projectile(
              v(e.p.x, e.p.y + 1.2, e.p.z),
              v(x, dir.y, z),
              15,
              13,
            );
          }
          e.state = "recover";
          e.timer = 1.6;
        } else if (e.kind === "brute") {
          this.rings.push({
            id: ++this.serial,
            p: { ...e.p },
            r: 1,
            life: 2.5,
            speed: 10,
            damage: 25,
            hit: false,
          });
          this.event("slam", undefined, e.p);
          e.state = "recover";
          e.timer = 1.4;
        } else if (e.kind === "bomber") {
          if (d < 7 && Math.abs(this.p.y - e.p.y) < 4) this.hurt(30);
          e.hp = 0;
          e.dead = 0.6;
          this.kills++;
          this.event("explode", undefined, e.p);
        } else {
          e.state = "lunge";
          e.timer = 0.55;
          if (e.kind === "wing") {
            e.dir = norm(e.p, v(this.p.x, this.p.y + 1, this.p.z));
          }
        }
      } else if (e.state === "lunge") {
        velocity.x = e.dir.x * 17;
        velocity.z = e.dir.z * 17;
        velocity.y = e.dir.y * 17;
        if (e.timer <= 0) {
          e.state = "recover";
          e.timer = 0.9;
        }
      } else if (e.state === "recover" && e.timer <= 0) {
        e.state = "idle";
        e.timer = 0.7;
      }
      if (e.hp <= 0) continue;
      if (e.pull) {
        const remaining = Math.max(dt, e.pull.remaining);
        const delta = norm(e.p, e.pull.to);
        const speed = Math.min(70, length3(e.p, e.pull.to) / remaining);
        velocity.x = delta.x * speed;
        velocity.y = delta.y * speed;
        velocity.z = delta.z * speed;
        e.pull.remaining -= dt;
        if (e.pull.remaining <= 0) e.pull = undefined;
      }
      if (e.kind === "wing") {
        e.p.x += velocity.x * dt;
        e.p.y += velocity.y * dt;
        e.p.z += velocity.z * dt;
      } else this.moveGroundEnemy(e, velocity, dt);
      if (
        e.state === "lunge" &&
        distance(e.p, this.p) < 2.4 &&
        Math.abs(this.p.y - e.p.y) < 3
      )
        this.hurt(stats[e.kind].damage);
    }
  }

  moveGroundEnemy(e: Enemy, horizontal: V, dt: number) {
    e.verticalSpeed = Math.max(-40, (e.verticalSpeed || 0) - 28 * dt);
    const velocity = v(
      horizontal.x + (e.knockVelocity?.x || 0),
      e.verticalSpeed,
      horizontal.z + (e.knockVelocity?.z || 0),
    );
    if (e.knockVelocity) {
      const decay = Math.exp(-12 * dt);
      e.knockVelocity.x *= decay;
      e.knockVelocity.z *= decay;
    }
    let result: { p: V; grounded: boolean };
    if (this.enemyMotion) result = this.enemyMotion(e, velocity, dt);
    else {
      // Logic-only route tests use the authored floor. Browser play uses Havok.
      const p = v(
        e.p.x + velocity.x * dt,
        e.p.y + velocity.y * dt,
        e.p.z + velocity.z * dt,
      );
      let floor = floorAt(this.chapter, p.x, p.z);
      if (floor !== null && floor > e.p.y + 0.5) {
        p.x = e.p.x;
        p.z = e.p.z;
        floor = floorAt(this.chapter, p.x, p.z);
      }
      const grounded =
        floor !== null && e.p.y >= floor - 0.5 && p.y <= floor + 0.05;
      if (grounded) p.y = floor!;
      result = { p, grounded };
    }
    e.p = result.p;
    if (result.grounded) {
      e.verticalSpeed = 0;
      e.groundY = e.p.y;
      if (e.state === "falling") {
        e.state = "recover";
        e.timer = 0.6;
        e.fallVelocity = undefined;
      }
    } else if (e.verticalSpeed < -4 && e.state !== "falling") {
      e.state = "falling";
      e.fallVelocity = v(velocity.x, 0, velocity.z);
      e.knockVelocity = undefined;
      e.pull = undefined;
    }
    if (e.p.y < (e.groundY ?? e.home.y) - 18) {
      this.damage(e, e.hp);
      this.event("environmentkill", "Lost to the gorge.", e.p);
    }
  }

  projectile(p: V, dir: V, speed: number, damage: number) {
    this.shots.push({
      id: ++this.serial,
      p,
      dir,
      speed,
      damage,
      life: 4,
      friendly: false,
      radius: 0.5,
      trail: [],
    });
  }

  updateShots(dt: number) {
    for (const s of this.shots) {
      s.life -= dt;
      s.trail.push({ ...s.p });
      if (s.trail.length > 7) s.trail.shift();
      s.p.x += s.dir.x * s.speed * dt;
      s.p.y += s.dir.y * s.speed * dt;
      s.p.z += s.dir.z * s.speed * dt;
      if (s.friendly) {
        for (const e of this.living) {
          if (
            length3(s.p, v(e.p.x, e.p.y + 1, e.p.z)) <
            (e.kind === "guardian" ? 4 : 2.1)
          ) {
            this.damage(e, s.damage, 1);
            s.life = 0;
            break;
          }
        }
        if (this.sector === 4) this.checkPods(s.p, 2);
      } else if (length3(s.p, v(this.p.x, this.p.y + 1, this.p.z)) < 1.3) {
        this.hurt(s.damage);
        s.life = 0;
      }
    }

    this.shots = this.shots.filter((s) => s.life > 0);
    for (const r of this.rings) {
      r.life -= dt;
      r.r += r.speed * dt;
      const d = distance(this.p, r.p);
      if (
        !r.hit &&
        r.damage > 0 &&
        Math.abs(d - r.r) < 1.1 &&
        this.p.y < r.p.y + 1.4
      ) {
        this.hurt(r.damage);
        r.hit = true;
      }
    }
    this.rings = this.rings.filter((r) => r.life > 0);
  }

  pillars() {
    const p = this.destination;
    return [
      v(p.x - 13, p.y, p.z - 11),
      v(p.x + 13, p.y, p.z - 11),
      v(p.x - 13, p.y, p.z + 12),
      v(p.x + 13, p.y, p.z + 12),
    ];
  }

  guardian(e: Enemy, dt: number) {
    e.exposed = Math.max(0, e.exposed - dt);
    if (!e.armour && e.exposed === 0) e.armour = true;
    const phase = e.hp < e.max * 0.33 ? 3 : e.hp < e.max * 0.66 ? 2 : 1;
    if (phase > e.phase) {
      e.phase = phase;
      e.state = "roar";
      e.timer = 2;
      this.event(
        "bossphase",
        phase === 2
          ? "The crown is breaking. Watch for shockwaves."
          : "Its armour is failing. Keep moving!",
        e.p,
      );
      for (let i = 0; i < phase; i++)
        this.addEnemy(
          i % 2 ? "wing" : "raptor",
          v(e.home.x + (i - 1) * 10, e.home.y, e.home.z + 15),
        );
    }

    if (e.state === "idle" && e.timer <= 0) {
      e.attackCount++;
      if (e.phase > 1 && e.attackCount % 3 === 0) {
        e.state = "pulse";
        e.timer = 1.2;
        this.event("tell", "guardian", e.p);
      } else {
        e.state = "windup";
        e.timer = 1.25;
        e.dir = norm(e.p, v(this.p.x, e.p.y, this.p.z));
        this.event("tell", "charge", e.p);
      }
    } else if (e.state === "windup" && e.timer <= 0) {
      e.state = "charge";
      e.timer = 1.8;
    } else if (e.state === "charge") {
      e.p.x += e.dir.x * 24 * dt;
      e.p.z += e.dir.z * 24 * dt;
      if (distance(e.p, this.p) < 4) this.hurt(32);
      if (this.pillars().some((p) => distance(p, e.p) < 4.2)) {
        e.state = "stunned";
        e.timer = 6;
        this.event("stun", "Armour loose. Q tears it away!", e.p);
      } else if (e.timer <= 0 || distance(e.p, e.home) > 21) {
        e.state = "recover";
        e.timer = 1.5;
        const n = norm(e.home, e.p);
        e.p.x = e.home.x + n.x * 19;
        e.p.z = e.home.z + n.z * 19;
      }
    } else if (e.state === "pulse" && e.timer <= 0) {
      for (let i = 0; i < e.phase; i++)
        this.rings.push({
          id: ++this.serial,
          p: { ...e.p },
          r: -i * 5,
          life: 4,
          speed: 12,
          damage: 26,
          hit: false,
        });
      if (e.phase === 3) {
        for (let i = 0; i < 12; i++) {
          const a = (i * Math.PI) / 6;
          this.projectile(
            v(e.p.x, e.p.y + 1, e.p.z),
            v(Math.sin(a), 0, Math.cos(a)),
            12,
            15,
          );
        }
      }
      e.state = "recover";
      e.timer = 1.5;
      this.event("slam", undefined, e.p);
    } else if (
      ["recover", "stunned", "roar"].includes(e.state) &&
      e.timer <= 0
    ) {
      e.state = "idle";
      e.timer = 1.1;
    }
  }

  updateHazards(dt: number) {
    if (this.objective.hazard === "pressure") {
      for (const gate of pressureGates(this.chapter))
        if (
          pressurePhase(this.time, gate.index).active &&
          insidePressureLane(gate, this.p)
        )
          this.hurt(24);
      return;
    }
    if (!this.objective.hazard || distance(this.p, this.destination) > 35)
      return;
    this.hazardClock += dt;
    const p = this.destination;
    if (this.objective.hazard === "blades") {
      const angle = this.time * 0.75,
        d = distance(this.p, p),
        a = Math.atan2(this.p.x - p.x, this.p.z - p.z);
      if (
        d > 5 &&
        d < 22 &&
        Math.abs(Math.sin(a - angle)) < 0.08 &&
        this.p.y < p.y + 1.2
      )
        this.hurt(20);
    } else if (this.hazardClock > 4) {
      this.hazardClock = 0;
      if (this.objective.hazard === "surge")
        this.rings.push({
          id: ++this.serial,
          p: v(p.x - 17, p.y, p.z),
          r: 1,
          life: 3.5,
          speed: 10,
          damage: 15,
          hit: false,
        });
      else {
        this.event("falling", "Falling stone · keep moving", this.p);
        this.projectile(
          v(this.p.x, this.p.y + 24, this.p.z),
          v(0, -1, 0),
          18,
          24,
        );
      }
    }
  }
}
