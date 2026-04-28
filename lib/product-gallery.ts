import type { ProductRecord } from "./product-types";
import { isPlaceholderImageUrl } from "./product-image";

/** Unique, non-placeholder image URLs for PDP gallery (main + thumbnails). */
export function getGalleryImageUrls(product: ProductRecord): string[] {
  const raw = [product.imageUrl, ...product.images].map((url) => (url || "").trim()).filter(Boolean);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const url of raw) {
    if (isPlaceholderImageUrl(url)) {
      continue;
    }
    if (seen.has(url)) {
      continue;
    }
    seen.add(url);
    out.push(url);
  }
  return out;
}
