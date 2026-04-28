import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { readOverrides, readProducts, writeOverrides } from "../../../../lib/product-db";

const uploadDir = path.join(process.cwd(), "public", "staging-media", "admin-products");

const extensionForMime = (mime: string): string => {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  return ".bin";
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const productId = String(formData.get("productId") ?? "").trim();
    const file = formData.get("image");

    if (!productId) {
      return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "image file is required." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are supported." }, { status: 400 });
    }

    const products = await readProducts();
    const exists = products.some((product) => product.id === productId);
    if (!exists) {
      return NextResponse.json({ error: "Unknown product id." }, { status: 404 });
    }

    const ext = extensionForMime(file.type);
    const safeId = productId.replace(/[^a-zA-Z0-9_-]/g, "");
    const slot = String(formData.get("slot") ?? "main").toLowerCase();
    const fileName = `${safeId}-${slot}-${Date.now()}${ext}`;
    const fullPath = path.join(uploadDir, fileName);

    await fs.mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(fullPath, buffer);

    const publicPath = `/staging-media/admin-products/${fileName}`;
    const store = await readOverrides();
    const existing = store.overrides[productId] || { images: [], updatedAt: "" };
    
    const nextImages = [...(existing.images || [])];
    let nextImageUrl = existing.imageUrl || publicPath;

    if (slot === "main") {
      nextImageUrl = publicPath;
      nextImages[0] = publicPath;
    } else if (slot === "view1") {
      nextImages[1] = publicPath;
    } else if (slot === "view2") {
      nextImages[2] = publicPath;
    } else if (slot === "view3") {
      nextImages[3] = publicPath;
    } else if (slot === "view4") {
      nextImages[4] = publicPath;
    }

    store.overrides[productId] = {
      ...existing,
      imageUrl: nextImageUrl,
      images: nextImages,
      updatedAt: new Date().toISOString()
    };
    await writeOverrides(store);

    return NextResponse.json({
      productId,
      slot,
      imageUrl: publicPath,
      allImages: nextImages
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to upload product image." },
      { status: 500 }
    );
  }
}
