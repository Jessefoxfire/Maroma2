export const RITUAL_TEASER_POS_STORAGE_KEY = "maroma-ritual-teaser-pos";

export type RitualTeaserPos = { x: number; y: number };

export function parseRitualTeaserPos(raw: string | null): RitualTeaserPos | null {
  if (!raw) {
    return null;
  }
  try {
    const o = JSON.parse(raw) as unknown;
    if (typeof o !== "object" || o === null) {
      return null;
    }
    const x = (o as { x?: unknown }).x;
    const y = (o as { y?: unknown }).y;
    if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) {
      return null;
    }
    return { x, y };
  } catch {
    return null;
  }
}
