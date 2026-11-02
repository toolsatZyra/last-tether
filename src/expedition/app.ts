import "./style.css";
import { Expedition, validSave, clamp, type Input } from "./engine";
import { CHAPTERS, distance, v } from "./level";
import { GameScene } from "./scene";
import { Soundscape } from "./audio";
import { markup } from "./markup";
import { validPreferences, validRecords } from "./profile";
const $ = (id: string) => document.getElementById(id)!;
document.querySelector("#app")!.innerHTML = markup;
const STORY = "last-tether-v2:story",
  RUNS = "last-tether-v2:runs";
let storage = true;
function read(key: string) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    storage = false;
    return null;
  }
}
function write(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    storage = false;
    return false;
  }
}
const time = (s: number) =>
  `${Math.floor(s / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(s % 60)
    .toString()
    .padStart(2, "0")}`;
let game = new Expedition(),
  view: GameScene,
  playing = false,
  paused = false,
  transitioning = false,
  last = performance.now(),
  acc = 0,
  uiTime = 0,
  saveTime = 0,
  revealTime = 0,
  toastTime = 0,
  dialogueTime = 0;
const sound = new Soundscape();
const keys = new Set<string>(),
  edges = new Set<string>();
let testInput: ((state: Expedition) => Input) | null = null;
let drag = false;
let day = new Date().toISOString().slice(0, 10);
let preferences = validPreferences(read("last-tether-v2:settings"));
let quality = preferences.quality,
  reduced = preferences.reduced,
  showGhost = preferences.ghost;
game.difficulty = preferences.difficulty;
function savePreferences() {
  write("last-tether-v2:settings", {
    quality,
    reduced,
    ghost: showGhost,
    difficulty: game.difficulty,
  });
}
let lastFocus: HTMLElement | null = null;
function save() {
  if (game.mode === "story") {
    const ok = write(STORY, game.save());
    $("saved").textContent = ok
      ? "◇ Route saved on this device"
      : "Storage unavailable · keep this tab open";
  }
}
function records() {
  return validRecords(read(RUNS));
}
function camp() {
  playing = false;
  paused = false;
  view.menu = true;
  $("hud").hidden = true;
  $("ending").hidden = true;
  $("camp").hidden = false;
  $("modal-layer").hidden = true;
  const s = validSave(read(STORY));
  $("continue").hidden = !s || s.finished;
  $("begin").innerHTML =
    (s ? "New expedition" : "Begin expedition") + " <span>↗</span>";
  $("begin").focus();
}
function start(mode: "story" | "daily", resume = false, immediate = false) {
  if (transitioning) return;
  day = new Date().toISOString().slice(0, 10);
  game = new Expedition(resume ? validSave(read(STORY)) : null, mode);
  if (!resume)
    game.difficulty = validPreferences(
      read("last-tether-v2:settings"),
    ).difficulty;
  playing = true;
  paused = false;
  keys.clear();
  edges.clear();
  view.menu = false;
  view.ghostFrames =
    mode === "daily"
      ? records()
          .filter((r) => r.date === day)
          .sort((a, b) => a.seconds - b.seconds)[0]?.ghost || []
      : [];
  view.ghostEnabled = showGhost;
  $("camp").hidden = true;
  $("ending").hidden = true;
  $("hud").hidden = false;
  close();
  $("game").focus();
  acc = 0;
  last = performance.now();
  save();
  events(immediate);
  hud();
}
function modal(title: string, body: string) {
  lastFocus = document.activeElement as HTMLElement;
  paused = true;
  keys.clear();
  edges.clear();
  $("modal").innerHTML =
    `<div class="modal-heading"><span class="eyebrow">LAST TETHER / FIELDNOTES</span><button id="close" aria-label="Close dialog">×</button></div><h2 id="modal-title">${title}</h2>${body}`;
  $("modal-layer").hidden = false;
  $("close").onclick = close;
  $("close").focus();
}
function close() {
  const open = !$("modal-layer").hidden;
  $("modal-layer").hidden = true;
  paused = false;
  last = performance.now();
  acc = 0;
  if (open) (playing ? $("game") : lastFocus || $("begin")).focus();
}
function pause() {
  if (!playing || game.finished) return;
  modal(
    "Take a breath.",
    `<p>The world and expedition timer are paused.</p><div class="stack"><button id="resume" class="primary">Continue expedition →</button><button id="retry" class="secondary">Return to secured terrace</button><button id="pause-settings" class="secondary">Settings & controls</button><button id="back-camp" class="link">Save & return to camp</button></div>`,
  );
  $("resume").onclick = close;
  $("retry").onclick = () => {
    game.deaths++;
    game.retry();
    events();
    close();
  };
  $("pause-settings").onclick = settings;
  $("back-camp").onclick = () => {
    save();
    camp();
  };
}
function settings() {
  modal(
    "Make it your expedition.",
    `<div class="settings"><label>Visual quality<select id="quality"><option value="high">High</option><option value="balanced">Balanced</option><option value="low">Low · lighter rendering</option></select></label><label>Combat difficulty<select id="difficulty"><option value="explorer">Explorer · forgiving damage</option><option value="hunter">Hunter · full damage</option></select></label><label><input id="sound" type="checkbox" ${sound.enabled ? "checked" : ""}/> Soundscape & effects <small>Off until you choose to listen</small></label><label><input id="motion" type="checkbox" ${reduced ? "checked" : ""}/> Reduce camera effects</label><label><input id="ghost" type="checkbox" ${showGhost ? "checked" : ""}/> Show my personal-best ghost</label></div><div class="controls-grid">${[
      ["WASD", "Move"],
      ["SPACE", "Jump / release"],
      ["F / CLICK", "Spear chain · hold to continue"],
      ["R", "Returning spear"],
      ["Q", "Grapple / pull a creature"],
      ["SHIFT", "Dodge"],
      ["X", "Hunt burst at full meter"],
      ["H", "Healing flask"],
      ["E", "Interact"],
      ["RIGHT DRAG", "Look"],
      ["C", "Recenter"],
      ["ESC / J", "Pause / journal"],
    ]
      .map(([k, t]) => `<div><kbd>${k}</kbd><span>${t}</span></div>`)
      .join(
        "",
      )}</div><p class="fine">The chapter saves locally. Cloud transfer and public rankings are not connected in this build.</p>`,
  );
  ($("quality") as HTMLSelectElement).value = quality;
  ($("difficulty") as HTMLSelectElement).value = game.difficulty;
  $("quality").onchange = (e) => {
    quality = (e.target as HTMLSelectElement).value as typeof quality;
    savePreferences();
    view.setQuality(quality);
  };
  $("difficulty").onchange = (e) => {
    game.difficulty = (e.target as HTMLSelectElement).value as any;
    savePreferences();
    if (playing) save();
    else {
      const stored = validSave(read(STORY));
      if (stored) write(STORY, { ...stored, difficulty: game.difficulty });
    }
  };
  $("sound").onchange = (e) =>
    sound.set((e.target as HTMLInputElement).checked);
  $("motion").onchange = (e) => {
    reduced = (e.target as HTMLInputElement).checked;
    view.reduced = reduced;
    savePreferences();
  };
  $("ghost").onchange = (e) => {
    showGhost = (e.target as HTMLInputElement).checked;
    view.ghostEnabled = showGhost;
    savePreferences();
  };
}
function journal() {
  const s = playing ? game.save() : validSave(read(STORY));
  modal(
    "The field journal.",
    `<p>“A safe route is not something you find. It is something you learn.”</p><div class="journal">${CHAPTERS.map((ch, i) => `<article class="${s && i <= s.sector ? "known" : ""}"><span class="eyebrow">${ch.subtitle}</span><h3>${ch.title}</h3><p>${s && i <= s.sector ? ch.entry : "A route still waiting to be discovered."}</p></article>`).join("")}</div><p class="fine">${s?.secrets.length || 0} routefinder memories found. Memories restore a healing flask; they are optional.</p>`,
  );
}
function daily() {
  const today = new Date().toISOString().slice(0, 10),
    runs = records()
      .filter((r) => r.date === today)
      .sort((a, b) => a.seconds - b.seconds);
  modal(
    "The hanging forest.",
    `<span class="eyebrow">PERSONAL ROUTE / ${today} UTC</span><p>Cross the suspended forest, defeat its hunters and open the sky gate. Finish once to record your route. Then race your own ghost.</p><div class="records">${
      runs
        .slice(0, 5)
        .map(
          (r, i) =>
            `<div><span>0${i + 1} / KAVI</span><strong>${time(r.seconds)}</strong><small>${r.deaths} recoveries</small></div>`,
        )
        .join("") || "<p>No recorded time yet. Make the first crossing.</p>"
    }</div><button id="daily-start" class="primary">Begin sky route ↗</button><p class="fine">Same authored course each day. Personal times and ghosts are stored on this device; there is no public leaderboard.</p>`,
  );
  $("daily-start").onclick = () => start("daily");
}
function toast(text: string, duration = 4) {
  $("toast").textContent = text;
  $("toast").classList.add("show");
  toastTime = duration;
}
function speak(text: string) {
  const at = text.indexOf(":");
  $("dialogue-speaker").textContent = at > 0 ? text.slice(0, at) : "FIELDNOTES";
  $("dialogue-text").textContent = at > 0 ? text.slice(at + 1).trim() : text;
  $("dialogue").classList.add("show");
  dialogueTime = 7;
}
function ending() {
  playing = false;
  save();
  $("hud").hidden = true;
  $("ending").hidden = false;
  const daily = game.mode === "daily";
  let recorded = false;
  if (daily) {
    const all = [
      ...records(),
      {
        date: day,
        seconds: game.seconds,
        deaths: game.deaths,
        ghost: game.ghost,
      },
    ];
    const dates = [...new Set(all.map((r) => r.date))]
      .sort()
      .reverse()
      .slice(0, 4);
    recorded = write(
      RUNS,
      dates.flatMap((d) =>
        all
          .filter((r) => r.date === d)
          .sort((a, b) => a.seconds - b.seconds)
          .slice(0, 5),
      ),
    );
  }
  $("end-kicker").textContent = daily
    ? "THE SKY ROUTE / COMPLETE"
    : "CHAPTER ONE / COMPLETE";
  $("end-title").innerHTML = daily
    ? "A way<br><em>through.</em>"
    : "The valley<br><em>holds.</em>";
  $("end-copy").textContent = daily
    ? recorded
      ? "Your line through the forest is recorded. Find a faster one."
      : "You crossed the hanging forest. Storage was unavailable, so this run could not be recorded."
    : "You read the terrain. You learned its hunters. You gave your home another morning.";
  $("end-stats").innerHTML =
    `<div><strong>${time(game.seconds)}</strong><span>EXPEDITION</span></div><div><strong>${game.kills}</strong><span>CREATURES DEFEATED</span></div><div><strong>${game.deaths}</strong><span>RECOVERIES</span></div><div><strong>${game.secrets.length}</strong><span>MEMORIES</span></div>`;
  $("end-note").textContent = daily
    ? recorded
      ? "Personal record saved on this device."
      : "Record not saved · browser storage unavailable."
    : "Chapter complete. The forest beyond is a future adventure.";
  $("end-daily").focus();
}
async function crossArea() {
  transitioning = true;
  keys.clear();
  edges.clear();
  drag = false;
  const sector = game.sector;
  $("crossing-number").textContent =
    String(sector + 1).padStart(2, "0") + " / THE BROKEN SPILLWAY";
  $("crossing-title").textContent = game.chapter.title;
  $("crossing").classList.toggle("reduce-motion", reduced);
  $("crossing").hidden = false;
  try {
    // Give the browser a paint before replacing the world beneath the transition.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    await view.buildAsync(game);
    await view.prepareArea(game);
    view.update(game, 0);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    $("crossing").hidden = true;
    hud();
  } catch (error) {
    console.error(error);
    playing = false;
    $("crossing").hidden = true;
    modal(
      "The route could not open.",
      '<p>Your secured checkpoint is saved. Reload the valley to try again.</p><button id="reload-route" class="primary">Reload valley →</button>',
    );
    $("reload-route").onclick = () => location.reload();
  } finally {
    acc = 0;
    last = performance.now();
    keys.clear();
    edges.clear();
    transitioning = false;
  }
}
function events(immediate = false) {
  for (const e of game.events) {
    sound.play(e.type, e.value, e.impact?.blocked);
    view.event(e, game);
    if (e.type === "sector") {
      if (immediate) view.build(game);
      else if (!transitioning) void crossArea();
      $("chapter-reveal").querySelector("span")!.textContent =
        game.chapter.subtitle;
      $("chapter-reveal").querySelector("h1")!.textContent = game.chapter.title;
      $("chapter-reveal").hidden = false;
      revealTime = 1.8;
    }
    if (e.type === "story") speak(e.text || "");
    if (
      [
        "secured",
        "secret",
        "stun",
        "armour",
        "bossphase",
        "falling",
        "reinforcement",
        "environmentkill",
        "crane-release",
      ].includes(e.type)
    )
      toast(e.text || "");
    if (e.type === "save") save();
    if (e.type === "complete") ending();
  }
  game.events = [];
}
function hud() {
  $("sector-name").textContent = game.chapter.title;
  $("objective-kicker").textContent =
    `${String(game.sector + 1).padStart(2, "0")} / ${game.chapter.subtitle}`;
  $("objective-title").textContent = game.objective.title;
  $("objective-hint").textContent = game.objective.hint;
  $("chapter-pips").innerHTML = CHAPTERS.map(
    (_, i) =>
      `<i class="${i < game.sector ? "done" : i === game.sector ? "current" : ""}"></i>`,
  ).join("");
  $("health-fill").style.width = game.health + "%";
  $("health-number").textContent = `${Math.ceil(game.health)} / 100`;
  $("flasks").textContent =
    `H  ${"◆".repeat(game.flasks)}${"◇".repeat(3 - game.flasks)}`;
  $("hunt-fill").style.width = game.hunt + "%";
  $("hunt-ability").hidden = game.sector < 3;
  $("throw-ability").hidden = game.sector === 0 && game.beat < 2;
  $("hunt-ability").classList.toggle("ready", game.hunt >= 100);
  $("throw-ability").classList.toggle("cooling", game.throwCooldown > 0);
  $("dodge-ability").classList.toggle("cooling", game.dodgeCooldown > 0);
  $("clock").textContent = time(game.sector === 7 ? game.escape : game.seconds);
  $("clock-label").textContent =
    game.sector === 7
      ? "FLOOD ARRIVES IN"
      : game.mode === "daily"
        ? "SKY ROUTE"
        : "EXPEDITION";
  $("run-meta").textContent =
    `${game.kills} defeated · ${game.deaths} recoveries`;
  const boss = game.living.find((e) => e.kind === "guardian");
  $("boss").hidden = !boss;
  if (boss) {
    $("boss-fill").style.width = (boss.hp / boss.max) * 100 + "%";
    $("boss-phase").textContent = boss.armour
      ? boss.state === "stunned"
        ? "Q · TEAR OFF THE ARMOUR"
        : "BAIT ITS CHARGE INTO A STRIPED SUPPORT"
      : "EXPOSED · STRIKE NOW";
  }
  $("enemy-bars").innerHTML = game.living
    .filter((e) => e.kind !== "guardian" && distance(e.p, game.p) < 45)
    .map((e) => {
      const p = view.project(
        v(e.p.x, e.p.y + (e.kind === "brute" ? 4.4 : 3), e.p.z),
      );
      return p.visible
        ? `<div class="enemy-bar ${e.state === "windup" ? "warning" : ""}" style="left:${p.x}%;top:${p.y}%"><span>${e.state === "windup" ? "!" : e.kind === "spitter" ? "SILKSPITTER" : e.kind === "wing" ? "STORMWING" : e.kind.toUpperCase()}</span><i style="width:${(e.hp / e.max) * 100}%"></i></div>`
        : "";
    })
    .join("");
  const anchor = game.anchor;
  const target = anchor || game.target?.p;
  const projected = target
    ? view.project(v(target.x, target.y + (anchor ? 6 : 3), target.z))
    : null;
  $("target").hidden = !projected?.visible || !!game.grapple;
  if (projected) {
    $("target").style.left = projected.x + "%";
    $("target").style.top = projected.y + "%";
    $("target-text").textContent = anchor
      ? "CROSS THE GAP"
      : boss?.state === "stunned"
        ? "TEAR ARMOUR"
        : "PULL";
  }
  const wp = view.project(
    v(game.destination.x, game.destination.y + 3, game.destination.z),
  );
  $("waypoint").hidden = !wp.visible || distance(game.p, game.destination) < 12;
  $("waypoint").style.left = clamp(wp.x, 12, 88) + "%";
  $("waypoint").style.top = clamp(wp.y, 18, 70) + "%";
  $("waypoint-distance").textContent =
    Math.round(distance(game.p, game.destination)) + " m";
  let prompt = "";
  if (
    game.clear &&
    game.objective.device &&
    distance(game.p, game.destination) < 7
  )
    prompt =
      game.objective.device === "rune"
        ? "E · Rotate the blue hand to the gold notch"
        : "E · " + game.objective.title;
  if (game.clear && game.objective.device === "rune") {
    prompt = "";
    for (let j = 0; j < 3; j++)
      if (distance(game.p, game.dial(j)) < 4)
        prompt =
          "E · Turn wheel " +
          (j + 1) +
          " · also moves wheel " +
          (((j + 1) % 3) + 1);
  }
  for (let i = 0; i < 3; i++) {
    const p = game.chapter.points[i * 2 + 2];
    if (
      distance(game.p, v(p.x + 10, p.y, p.z + 6)) < 4 &&
      !game.secrets.includes(game.sector + "-" + i)
    )
      prompt = "E · Read the routefinder’s memory";
  }
  if (game.canReleaseCrane)
    prompt = "E · Release crane load · lure creatures onto the marked ground";
  $("interact").hidden = !prompt;
  $("interact").textContent = prompt;
  $("death").hidden = game.death <= 0;
}
function input(): Input {
  let x =
      Number(keys.has("KeyD") || keys.has("ArrowRight")) -
      Number(keys.has("KeyA") || keys.has("ArrowLeft")),
    z =
      Number(keys.has("KeyW") || keys.has("ArrowUp")) -
      Number(keys.has("KeyS") || keys.has("ArrowDown"));
  const a = view.yaw;
  const i: Input = {
    x: x * Math.cos(a) + z * Math.sin(a),
    z: z * Math.cos(a) - x * Math.sin(a),
    jump: edges.has("Space"),
    attack: keys.has("KeyF") || keys.has("Mouse0"),
    throw: keys.has("KeyR"),
    dodge: edges.has("ShiftLeft") || edges.has("ShiftRight"),
    grapple: edges.has("KeyQ"),
    interact: edges.has("KeyE"),
    heal: edges.has("KeyH"),
    burst: edges.has("KeyX"),
  };
  edges.clear();
  return i;
}
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (transitioning) return;
  if (playing && game.events.length) {
    events();
    if (transitioning) return;
  }
  if (playing && !paused) {
    acc += dt;
    const i =
      acc >= 1 / 60
        ? import.meta.env.DEV && testInput
          ? testInput(game)
          : input()
        : { x: 0, z: 0 };
    let first = true;
    while (acc >= 1 / 60) {
      game.step(
        1 / 60,
        first
          ? i
          : {
              ...i,
              jump: false,
              dodge: false,
              grapple: false,
              interact: false,
              heal: false,
              burst: false,
            },
      );
      events();
      if (transitioning) {
        acc = 0;
        return;
      }
      acc -= 1 / 60;
      first = false;
    }
    saveTime += dt;
    if (saveTime > 20) {
      saveTime = 0;
      save();
    }
    sound.update(dt, game.speed > 1 && game.grounded, game.living.length > 0);
  }
  view.update(game, paused ? 0 : dt);
  uiTime += dt;
  if (uiTime > 0.07) {
    uiTime = 0;
    if (playing) hud();
  }
  if (!paused) {
    revealTime -= dt;
    if (revealTime <= 0) $("chapter-reveal").hidden = true;
    toastTime -= dt;
    if (toastTime <= 0) $("toast").classList.remove("show");
    dialogueTime -= dt;
    if (dialogueTime <= 0) $("dialogue").classList.remove("show");
  }
}
document.addEventListener("keydown", (e) => {
  if (e.code === "Escape") {
    e.preventDefault();
    if (!$("modal-layer").hidden) close();
    else pause();
    return;
  }
  if ((e.target as HTMLElement).matches("input,select,textarea")) return;
  if (e.code === "Tab" && !$("modal-layer").hidden) {
    const list = [
      ...$("modal").querySelectorAll<HTMLElement>("button,input,select,a"),
    ];
    const first = list[0],
      end = list.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      end?.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === end) {
      first.focus();
      e.preventDefault();
    }
    return;
  }
  if (!playing || paused || transitioning) return;
  if (e.code === "KeyJ") {
    journal();
    return;
  }
  if (e.code === "KeyC") view.yaw = 0;
  if (
    ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
      e.code,
    )
  )
    e.preventDefault();
  if (!keys.has(e.code)) edges.add(e.code);
  keys.add(e.code);
});
document.addEventListener("keyup", (e) => keys.delete(e.code));
window.addEventListener("blur", () => {
  keys.clear();
  edges.clear();
  drag = false;
  if (playing && !paused) pause();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && playing && !paused) pause();
});
$("game").addEventListener("contextmenu", (e) => e.preventDefault());
$("game").addEventListener("pointerdown", (e) => {
  const p = e as PointerEvent;
  if (transitioning) return;
  if (p.button === 2) drag = true;
  if (p.button === 0) keys.add("Mouse0");
});
window.addEventListener("pointerup", () => {
  drag = false;
  keys.delete("Mouse0");
});
window.addEventListener("pointermove", (e) => {
  if (drag && playing && !paused) {
    view.yaw += e.movementX * 0.004;
    view.pitch = clamp(view.pitch - e.movementY * 0.003, -0.1, 1.2);
  }
});
$("begin").onclick = () => {
  if (validSave(read(STORY))) {
    modal(
      "A new route?",
      '<p>Your current local expedition will be replaced. Personal sky-route records stay in your journal.</p><button id="confirm-new" class="primary">Begin a new expedition →</button>',
    );
    $("confirm-new").onclick = () => start("story");
  } else start("story");
};
$("continue").onclick = () => start("story", true);
$("daily").onclick = daily;
$("settings").onclick = settings;
$("journal").onclick = journal;
$("pause").onclick = pause;
$("end-daily").onclick = daily;
$("end-camp").onclick = camp;
$("narrow-dismiss").onclick = () => {
  $("narrow").style.display = "none";
};
$("credits").onclick = () =>
  modal(
    "The people behind the valley.",
    `<p>Created by Zyra. Original world, encounters, gameplay, interface and environment composition.</p><p>Character, creatures, ruins and vegetation: <a href="https://quaternius.com" target="_blank" rel="noreferrer">Quaternius</a> · CC0.<br>Stone and timber: Rob Tuytel and Amal Kumar. Rock scan: Rico Cilliers. Sky: Greg Zaal and Jarod Guest, <a href="https://polyhaven.com" target="_blank" rel="noreferrer">Poly Haven</a> · CC0.<br>Silkspitter and stormwing: <a href="https://github.com/danielgruginski/Insectoids" target="_blank" rel="noreferrer">Daniel Gruginski</a> · CC0. Procedurally authored mesh, textures and clips; materials adapted for this game.<br>Guardian: “T. rex” by <a href="https://bake3d.ai/free-3d-models" target="_blank" rel="noreferrer">Bake3D</a>, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Geometry reduced; armour and combat poses added.<br>Foley and impact recordings: <a href="https://kenney.nl/assets" target="_blank" rel="noreferrer">Kenney</a> · CC0.</p><p>Powered by Babylon.js and Havok Physics for the web. License records accompany the source.</p><p class="fine">Sound starts only when enabled in settings.</p>`,
  );
async function boot() {
  try {
    view = new GameScene($("game") as HTMLCanvasElement);
    view.setQuality(quality);
    view.reduced = reduced;
    await view.load((n) => {
      $("load-bar").style.width = Math.round(n * 100) + "%";
      $("load-status").textContent =
        "Preparing characters and the valley · " + Math.round(n * 100) + "%";
    });
    view.build(game);
    $("load-status").textContent =
      "Preparing lighting and creature animations…";
    await view.warmup();
    game.events = [];
    $("loading").hidden = true;
    camp();
    last = performance.now();
    view.engine.runRenderLoop(() => frame(performance.now()));
    if (import.meta.env.DEV)
      (window as any).__expedition = {
        get game() {
          return game;
        },
        get view() {
          return view;
        },
        start(mode: "story" | "daily", resume = false) {
          start(mode, resume, true);
        },
        setTestInput(handler: ((state: Expedition) => Input) | null) {
          testInput = handler;
        },
        pause,
        close,
        save,
        step(i: Input, n = 1) {
          for (let k = 0; k < n; k++) {
            game.step(1 / 60, i);
            events(true);
          }
          view.update(game, 1 / 60);
          hud();
        },
        snapshot() {
          return {
            sector: game.sector,
            beat: game.beat,
            p: game.p,
            health: game.health,
            seconds: game.seconds,
            deaths: game.deaths,
            kills: game.kills,
            finished: game.finished,
            paused,
            transitioning,
            playing,
            enemies: game.living.map((e) => ({
              kind: e.kind,
              p: e.p,
              hp: e.hp,
              state: e.state,
            })),
            fps: view.engine.getFps(),
            meshes: view.scene.meshes.length,
            animation: view.hero.active,
          };
        },
      };
  } catch (e) {
    console.error(e);
    $("load-status").textContent =
      "The valley could not load. Reload to try again.";
  }
}
void boot();
