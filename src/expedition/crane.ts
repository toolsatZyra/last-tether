import { v, type Chapter } from "./level.ts";

export const CRANE_WARNING = 0.5;
export const CRANE_FALL = 0.64;
export const CRANE_IMPACT = CRANE_WARNING + CRANE_FALL;
export const CRANE_RADIUS = 5.2;
export const CRANE_LOAD_HEIGHT = 7.2;
export const CRANE_DROP = CRANE_LOAD_HEIGHT - 1.6;

export function quarryTrap(chapter: Chapter) {
  const p = chapter.points[1];
  return {
    load: v(p.x + 1, p.y, p.z + 8),
    lever: v(p.x + 7.5, p.y, p.z + 5),
  };
}
