import { promises as fs } from "fs";
import path from "path";
import { defaultWideBannerLayout } from "./category-banner-defaults";
import type { CategoryBannerStore, ResolvedCategoryBanner } from "./category-banner-types";
import type { CatalogCategory } from "./catalog-categories";

export type { CategoryBannerOverride, CategoryBannerStore, ResolvedCategoryBanner } from "./category-banner-types";
export { defaultWideBannerLayout } from "./category-banner-defaults";

const storePath = path.join(process.cwd(), "data", "category-banner-overrides.json");

export async function readCategoryBannerStore(): Promise<CategoryBannerStore> {
  try {
    const raw = await fs.readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as CategoryBannerStore;
    if (!parsed.banners || typeof parsed.banners !== "object") {
      return { banners: {} };
    }
    return parsed;
  } catch {
    return { banners: {} };
  }
}

export async function writeCategoryBannerStore(store: CategoryBannerStore): Promise<void> {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

export async function resolveCategoryBanner(
  slug: string,
  category: Pick<
    CatalogCategory,
    "bannerImage" | "heroTitle" | "heroTagline" | "label" | "description"
  >
): Promise<ResolvedCategoryBanner> {
  const store = await readCategoryBannerStore();
  const o = store.banners[slug] ?? {};
  return {
    imageUrl: o.imageUrl ?? category.bannerImage,
    heroTitle: o.heroTitle ?? category.heroTitle ?? category.label,
    heroTagline: o.heroTagline ?? category.heroTagline ?? category.description,
    objectPosition: o.objectPosition ?? defaultWideBannerLayout.objectPosition,
    minHeight: o.minHeight ?? defaultWideBannerLayout.minHeight,
    maxHeight: o.maxHeight ?? defaultWideBannerLayout.maxHeight,
    thumbMaxWidth: o.thumbMaxWidth ?? 280
  };
}
