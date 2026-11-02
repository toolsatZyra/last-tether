import type { Chapter } from "./level.ts";
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
function hash(x: number, z: number, seed: number) {
  const n = Math.sin(x * 127.1 + z * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}
function noise(x: number, z: number, seed: number) {
  const ix = Math.floor(x),
    iz = Math.floor(z),
    fx = smooth(0, 1, x - ix),
    fz = smooth(0, 1, z - iz);
  return mix(
    mix(hash(ix, iz, seed), hash(ix + 1, iz, seed), fx),
    mix(hash(ix, iz + 1, seed), hash(ix + 1, iz + 1, seed), fx),
    fz,
  );
}
export const LANDSCAPES = [
  { height: 100, shoulder: 140, moss: 0.42, ochre: 0, color: "#89958b" },
  { height: 90, shoulder: 160, moss: 0.9, ochre: 0, color: "#94a184" },
  { height: 108, shoulder: 145, moss: 0.75, ochre: 0, color: "#82988d" },
  { height: 120, shoulder: 155, moss: 1, ochre: 0, color: "#7f9485" },
  { height: 130, shoulder: 140, moss: 0.06, ochre: 0.8, color: "#a6957e" },
  { height: 140, shoulder: 160, moss: 0.26, ochre: 0.1, color: "#849598" },
  { height: 110, shoulder: 145, moss: 0.35, ochre: 0, color: "#9b9f92" },
  { height: 120, shoulder: 150, moss: 0.5, ochre: 0, color: "#82958e" },
] as const;
/** Distance from the authored decks and crossings; rock never intrudes into their clearance. */
export function routeClearance(ch: Chapter, x: number, z: number) {
  let distance = Infinity;
  for (let i = 0; i < ch.points.length; i++) {
    const p = ch.points[i],
      hx = p.arena ? 23 : 13,
      hz = p.arena ? 23 : 14;
    distance = Math.min(
      distance,
      Math.hypot(
        Math.max(0, Math.abs(x - p.x) - hx),
        Math.max(0, Math.abs(z - p.z) - hz),
      ),
    );
    const q = ch.points[i + 1];
    if (q) {
      const dx = q.x - p.x,
        dz = q.z - p.z,
        t = clamp(((x - p.x) * dx + (z - p.z) * dz) / (dx * dx + dz * dz));
      distance = Math.min(
        distance,
        Math.max(0, Math.hypot(x - p.x - dx * t, z - p.z - dz * t) - 7),
      );
    }
  }
  return distance;
}
export function landscapeHeight(
  ch: Chapter,
  sector: number,
  x: number,
  z: number,
) {
  const profile = LANDSCAPES[sector],
    d = routeClearance(ch, x, z);
  if (d <= 12) return -18;
  const broad = noise(x * 0.012, z * 0.012, sector + 4),
    detail = noise(x * 0.045, z * 0.039, sector + 9);
  const shoulder = smooth(12, profile.shoulder + 12 + (broad - 0.5) * 12, d);
  const crown = profile.height * (0.72 + broad * 0.43 + detail * 0.16);
  const raw = -18 + shoulder * crown;
  const layer = 12,
    cell = Math.floor((raw + detail * 3) / layer),
    fraction = (raw + detail * 3) / layer - cell;
  const strata = (cell + smooth(0.15, 0.82, fraction)) * layer - detail * 3;
  return (
    mix(raw, strata, shoulder * 0.5) +
    shoulder * (noise(x * 0.15, z * 0.13, sector + 21) - 0.5) * 4
  );
}
