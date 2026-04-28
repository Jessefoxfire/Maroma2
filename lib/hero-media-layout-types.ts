export type HeroMediaLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type XY = { x: number; y: number };

export type HeroLayerSettings = {
  visible: boolean;
  opacity: number;
  zIndex: number;
  rotateDeg: number;
  scale: number;
  fit: "cover" | "contain";
};

export type HeroOverlayLayer = HeroLayerSettings & {
  src: string;
  layout: HeroMediaLayout;
};

export type HeroVisualState = {
  layout: HeroMediaLayout;
  heroPos: XY;
  headlinePos: XY;
  headlineSizeRem: number;
  eyebrowPosRatio: XY;
  heroActionsPos: XY;
  heroCopyWidthVw: number;
  primarySettings: HeroLayerSettings;
  overlayLayer: HeroOverlayLayer;
  ritualCarouselPos: XY;
  bgColors: string[];
  bgAngle: number;
  heroLayout: HeroMediaLayout;
  productShowcasePos: XY;
  heroSectionHeight: number;
};

export const VISUAL_STATE_STORAGE_KEY = "maroma-hero-visual-state";
