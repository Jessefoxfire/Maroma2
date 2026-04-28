import type { ProductRecord } from "./product-types";

/** WooCommerce / import often pointed many SKUs at one generic “large” asset (not a real product photo). */
const PLACEHOLDER_PATHS = new Set<string>([
  "/staging-media/wp-content/uploads/2013/04/large.jpg"
]);

const PLACEHOLDER_SUBSTRINGS = [
  "woocommerce-placeholder",
  "/wp-content/uploads/woocommerce-placeholder",
  "-placeholder.",
  "/placeholder.",
  "/sample-image",
  "sample-product"
];

const imagePathKey = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return new URL(trimmed).pathname.toLowerCase();
    }
  } catch {
    // fall through
  }
  const lower = trimmed.toLowerCase();
  return lower.startsWith("/") ? lower : `/${lower}`;
};

/** True when this URL is empty or a known generic / placeholder image. */
export const isPlaceholderImageUrl = (raw: string): boolean => {
  const path = imagePathKey(raw);
  if (!path) {
    return true;
  }
  if (PLACEHOLDER_PATHS.has(path)) {
    return true;
  }
  return PLACEHOLDER_SUBSTRINGS.some((fragment) => path.includes(fragment));
};

/** First non-placeholder image URL for `<img src>`, or empty string. */
export const getDisplayImageUrl = (product: Pick<ProductRecord, "imageUrl" | "images">): string => {
  for (const raw of [product.imageUrl, ...product.images]) {
    const url = (raw || "").trim();
    if (url && !isPlaceholderImageUrl(url)) {
      return url;
    }
  }
  return "";
};

/** True when the product has at least one non-placeholder image URL. */
export const hasDisplayImage = (product: Pick<ProductRecord, "imageUrl" | "images">): boolean => {
  return getDisplayImageUrl(product).length > 0;
};
