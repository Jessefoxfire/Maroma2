import { siteContent, type SiteContent } from "../app/content";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isSiteContent = (value: unknown): value is SiteContent => {
  if (!isRecord(value)) {
    return false;
  }
  if (typeof value.brand !== "string" || !Array.isArray(value.nav)) {
    return false;
  }
  if (!isRecord(value.hero) || !isRecord(value.carousel) || !Array.isArray(value.highlights)) {
    return false;
  }
  if (!isRecord(value.hero.video)) {
    return false;
  }
  return (
    typeof value.hero.headline === "string" &&
    Array.isArray(value.carousel.slides) &&
    typeof value.hero.video.src === "string"
  );
};

export const parseSiteContent = (value: unknown): SiteContent | null => {
  if (!isSiteContent(value)) {
    return null;
  }
  return structuredClone(value);
};

export const mergeWithDefaults = (value: unknown): SiteContent => {
  const parsed = parseSiteContent(value);
  if (!parsed) {
    return structuredClone(siteContent);
  }
  return parsed;
};
