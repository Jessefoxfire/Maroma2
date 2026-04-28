import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { catalogCategories } from "../../../../lib/catalog-categories";
import { readCategoryBannerStore, writeCategoryBannerStore } from "../../../../lib/category-banner-store";

export const runtime = "nodejs";

const uploadDir = path.join(process.cwd(), "public", "staging-media", "admin-category-banners");

const extensionForMime = (mime: string): string => {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  return ".bin";
};

const validSlug = (slug: string): boolean =>
  catalogCategories.some((category) => category.slug === slug);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const slug = String(formData.get("slug") ?? "").trim();
    const file = formData.get("image");

    if (!slug || !validSlug(slug)) {
      return NextResponse.json({ error: "Unknown or missing category slug." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "image file is required." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are supported." }, { status: 400 });
    }

    const ext = extensionForMime(file.type);
    const safeSlug = slug.replace(/[^a-z0-9-]/gi, "");
    const fileName = `${safeSlug}-${Date.now()}${ext}`;
    const fullPath = path.join(uploadDir, fileName);

    await fs.mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(fullPath, buffer);

    const publicPath = `/staging-media/admin-category-banners/${fileName}`;
    const store = await readCategoryBannerStore();
    store.banners[slug] = {
      ...(store.banners[slug] ?? {}),
      imageUrl: publicPath,
      updatedAt: new Date().toISOString()
    };
    await writeCategoryBannerStore(store);

    return NextResponse.json({ slug, imageUrl: publicPath });
  } catch {
    return NextResponse.json({ error: "Unable to upload category banner." }, { status: 500 });
  }
}
