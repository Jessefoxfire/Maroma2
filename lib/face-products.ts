import { hasDisplayImage } from "./product-image";
import type { ProductRecord } from "./product-types";

const faceCategory = (category: string): boolean => {
  const n = category.toLowerCase();
  return n.includes("face care") || n.includes("facial");
};

const faceNameHint = (name: string): boolean => {
  const n = name.toLowerCase();
  return (
    /\bface (cream|serum|mask|wash|oil|balm|scrub|toner|mist|lotion|gel|powder)\b/.test(n) ||
    /\bface mask\b/.test(n) ||
    /\bfacial\b/.test(n) ||
    /\bfor face\b/.test(n)
  );
};

/** Face / facial care products that have a real catalog image (not placeholders). */
export function selectFaceCareProducts(products: ProductRecord[]): ProductRecord[] {
  return products.filter((p) => {
    if (!hasDisplayImage(p)) {
      return false;
    }
    if (p.categories.some(faceCategory)) {
      return true;
    }
    return faceNameHint(p.name);
  });
}
