import { promises as fs } from "fs";
import path from "path";
import {
  type HeroMediaLayout,
  type XY,
  type HeroLayerSettings,
  type HeroOverlayLayer,
  type HeroVisualState,
  VISUAL_STATE_STORAGE_KEY
} from "./hero-media-layout-types";

export {
  type HeroMediaLayout,
  type XY,
  type HeroLayerSettings,
  type HeroOverlayLayer,
  type HeroVisualState,
  VISUAL_STATE_STORAGE_KEY
};



const defaultLayout: HeroMediaLayout = {
  x: 0,
  y: 0,
  width: 100,
  height: 100
};

const defaultBgColors = ["#dbe3d0", "#cbd5c0", "#d6deca"];

export const defaultHeroVisualState: HeroVisualState = {
  layout: defaultLayout,
  heroPos: { x: 0, y: 0 },
  headlinePos: { x: 0, y: 0 },
  headlineSizeRem: 5.28,
  eyebrowPosRatio: { x: 0, y: 0 },
  heroActionsPos: { x: 0, y: 0 },
  heroCopyWidthVw: 46,
  primarySettings: {
    visible: true,
    opacity: 1,
    zIndex: 2,
    rotateDeg: 0,
    scale: 1,
    fit: "cover"
  },
  overlayLayer: {
    src: "/staging-media/admin-hero/overlay-gemini.png",
    layout: defaultLayout,
    visible: true,
    opacity: 0.7,
    zIndex: 1,
    rotateDeg: 0,
    scale: 1,
    fit: "cover"
  },
  ritualCarouselPos: { x: 0, y: 0 },
  bgColors: defaultBgColors,
  bgAngle: 135,
  heroLayout: { x: 0, y: 0, width: 100, height: 80 },
  productShowcasePos: { x: 0, y: 0 },
  heroSectionHeight: 100
};


const storageDir = path.join(process.cwd(), "data");
const storagePath = path.join(storageDir, "hero-media-layout.json");

const clampLayout = (layout: HeroMediaLayout): HeroMediaLayout => {
  const width = Math.min(200, Math.max(30, layout.width));
  const height = Math.min(500, Math.max(30, layout.height));
  const x = Math.max(-100, Math.min(100, layout.x));
  const y = Math.max(-100, Math.min(100, layout.y));
  return { x, y, width, height };
};

const clampXY = (value: XY): XY => ({
  x: Math.max(-2000, Math.min(2000, Number(value.x) || 0)),
  y: Math.max(-2000, Math.min(2000, Number(value.y) || 0))
});


const clampOpacity = (value: number): number => Math.max(0, Math.min(1, Number(value) || 0));
const clampCopyWidth = (value: number): number => Math.max(24, Math.min(92, Number(value) || 46));
const clampHeadlineSize = (value: number): number => Math.max(2.2, Math.min(7, Number(value) || 5.28));
const clampRotateDeg = (value: number): number => Math.max(-180, Math.min(180, Number(value) || 0));
const clampScale = (value: number): number => Math.max(0.1, Math.min(3, Number(value) || 1));

const clampLayerSettings = (settings: HeroLayerSettings): HeroLayerSettings => ({
  visible: Boolean(settings.visible),
  opacity: clampOpacity(settings.opacity),
  zIndex: Math.max(0, Math.min(20, Math.round(Number(settings.zIndex) || 0))),
  rotateDeg: clampRotateDeg(settings.rotateDeg),
  scale: clampScale(settings.scale),
  fit: settings.fit === "contain" ? "contain" : "cover"
});

const parseLayout = (value: unknown, base?: HeroMediaLayout): HeroMediaLayout => {
  if (!value || typeof value !== "object") {
    return base ?? defaultLayout;
  }
  const raw = value as Record<string, unknown>;
  const x = typeof raw.x === "number" ? raw.x : (base?.x ?? defaultLayout.x);
  const y = typeof raw.y === "number" ? raw.y : (base?.y ?? defaultLayout.y);
  const width = typeof raw.width === "number" ? raw.width : (base?.width ?? defaultLayout.width);
  const height = typeof raw.height === "number" ? raw.height : (base?.height ?? defaultLayout.height);

  return clampLayout({ x, y, width, height });
};


export const parseHeroVisualState = (value: unknown, base?: HeroVisualState): HeroVisualState => {
  const b = base ?? defaultHeroVisualState;
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const hasFlatLayout = typeof raw.x === "number" || typeof raw.y === "number";
  const layout = parseLayout(raw.layout ?? (hasFlatLayout ? raw : undefined), b.layout);
  const heroPos = clampXY((raw.heroPos as XY) ?? b.heroPos);

  const headlinePos = clampXY((raw.headlinePos as XY) ?? b.headlinePos);
  const headlineSizeRem = clampHeadlineSize(
    (raw.headlineSizeRem as number) ?? b.headlineSizeRem
  );
  const eyebrowPosRatio = clampXY((raw.eyebrowPosRatio as XY) ?? b.eyebrowPosRatio);
  const heroActionsPos = clampXY((raw.heroActionsPos as XY) ?? b.heroActionsPos);
  const heroCopyWidthVw = clampCopyWidth((raw.heroCopyWidthVw as number) ?? b.heroCopyWidthVw);

  const primarySettings = clampLayerSettings({
    ...b.primarySettings,
    ...((raw.primarySettings as HeroLayerSettings) ?? {})
  });

  const overlayRaw = (raw.overlayLayer as Record<string, unknown>) ?? {};
  const overlayLayer: HeroOverlayLayer = {
    ...clampLayerSettings({
      ...b.overlayLayer,
      ...(overlayRaw as HeroLayerSettings)
    }),
    src:
      typeof overlayRaw.src === "string" && overlayRaw.src.trim()
        ? overlayRaw.src
        : b.overlayLayer.src,
    layout: parseLayout(overlayRaw.layout ?? b.overlayLayer.layout)
  };

  const ritualCarouselPos = clampXY(
    (raw.ritualCarouselPos as XY) ?? b.ritualCarouselPos
  );


  const bgColors = Array.isArray(raw.bgColors)
    ? raw.bgColors.map((c) => (typeof c === "string" ? c : "#ffffff"))
    : b.bgColors;
  const bgAngle = typeof raw.bgAngle === "number" ? raw.bgAngle : b.bgAngle;

  return {
    layout,
    heroPos,
    headlinePos,
    headlineSizeRem,
    eyebrowPosRatio,
    heroActionsPos,
    heroCopyWidthVw,
    primarySettings,
    overlayLayer,
    ritualCarouselPos,
    bgColors,
    bgAngle,
    heroLayout: parseLayout(raw.heroLayout, b.heroLayout),
    productShowcasePos: clampXY((raw.productShowcasePos as XY) ?? b.productShowcasePos),
    heroSectionHeight: typeof raw.heroSectionHeight === "number" ? raw.heroSectionHeight : b.heroSectionHeight
  };
};


export async function readHeroVisualState(): Promise<HeroVisualState> {
  try {
    const raw = await fs.readFile(storagePath, "utf8");
    return parseHeroVisualState(JSON.parse(raw));
  } catch {
    return defaultHeroVisualState;
  }
}
