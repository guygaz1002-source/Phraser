import maps from "../content/worlds.json";
import type { Journey, Tile } from "./types";

type Rect = { x: number; y: number; w: number; h: number };
export type Direction = "up" | "down" | "left" | "right";
export type ChapterWorld = {
  id: string; image: string; width: number; height: number;
  start: Tile; checkpoint: Tile; movement: "walk" | "float";
  water: Rect[]; blocked: Rect[]; navigable?: Rect[]; bonusSpots: Tile[];
};
export const worlds = maps as Record<string, ChapterWorld>;
export const vectors: Record<Direction, Tile> = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
  left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
};
export const sameTile = (a: Tile, b: Tile) => a.x === b.x && a.y === b.y;
const inside = (p: Tile, r: Rect) => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h;
export function canExplore(world: ChapterWorld, point: Tile) {
  if (!Number.isInteger(point.x) || !Number.isInteger(point.y) || point.x < 1 || point.y < 1 || point.x >= world.width - 1 || point.y >= world.height - 1) return false;
  if (world.blocked.some(r => inside(point, r))) return false;
  if (world.navigable && !world.navigable.some(r => inside(point, r))) return false;
  const water = world.water.some(r => inside(point, r));
  return world.movement === "float" ? water : !water;
}
export function explorePosition(journey: Journey, stopId: string): Tile {
  return journey.positions?.[stopId] ?? worlds[stopId]!.start;
}
export function findExplorePath(world: ChapterWorld, start: Tile, goal: Tile): Tile[] {
  if (!canExplore(world, start) || !canExplore(world, goal) || sameTile(start, goal)) return [];
  const key = (p: Tile) => `${p.x},${p.y}`;
  const queue = [start], parents = new Map<string, Tile | null>([[key(start), null]]);
  for (let head = 0; head < queue.length; head++) for (const v of Object.values(vectors)) {
    const p = queue[head]!, next = { x: p.x + v.x, y: p.y + v.y };
    if (!canExplore(world, next) || parents.has(key(next))) continue;
    parents.set(key(next), p);
    if (sameTile(next, goal)) {
      const path: Tile[] = [];
      let cursor: Tile | null = next;
      while (cursor && !sameTile(cursor, start)) { path.unshift(cursor); cursor = parents.get(key(cursor)) ?? null; }
      return path;
    }
    queue.push(next);
  }
  return [];
}
