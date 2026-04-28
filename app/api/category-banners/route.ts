import { NextResponse } from "next/server";
import { catalogCategories } from "../../../lib/catalog-categories";
import type { CategoryBannerOverride } from "../../../lib/category-banner-types";
import { readCategoryBannerStore, writeCategoryBannerStore } from "../../../lib/category-banner-store";

export const runtime = "nodejs";

const validSlug = (slug: string): boolean =>
  catalogCategories.some((category) => category.slug === slug);

export async function GET() {
  const store = await readCategoryBannerStore();
  return NextResponse.json(store);
}

type PostBody = {
  slug?: string;
  patch?: CategoryBannerOverride;
  reset?: boolean;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PostBody;
    const slug = String(body.slug ?? "").trim();
    if (!slug || !validSlug(slug)) {
      return NextResponse.json({ error: "Unknown or missing category slug." }, { status: 400 });
    }

    const store = await readCategoryBannerStore();

    if (body.reset === true) {
      delete store.banners[slug];
      await writeCategoryBannerStore(store);
      return NextResponse.json({ ok: true, banners: store.banners });
    }

    const patch = body.patch ?? {};
    const prev = store.banners[slug] ?? {};
    const merged: CategoryBannerOverride = {
      ...prev,
      ...patch,
      updatedAt: new Date().toISOString()
    };

    if (merged.thumbMaxWidth !== undefined) {
      merged.thumbMaxWidth = Math.min(560, Math.max(120, Math.round(merged.thumbMaxWidth)));
    }
    if (typeof merged.objectPosition === "string") {
      merged.objectPosition = merged.objectPosition.trim();
    }
    if (typeof merged.minHeight === "string") {
      merged.minHeight = merged.minHeight.trim();
    }
    if (typeof merged.maxHeight === "string") {
      merged.maxHeight = merged.maxHeight.trim();
    }

    store.banners[slug] = merged;
    await writeCategoryBannerStore(store);
    return NextResponse.json({ ok: true, banner: merged });
  } catch {
    return NextResponse.json({ error: "Unable to update category banner." }, { status: 500 });
  }
}
