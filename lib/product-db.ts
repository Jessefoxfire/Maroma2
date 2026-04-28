import { promises as fs } from "fs";
import path from "path";
import { hasDisplayImage } from "./product-image";
import type { ProductRecord } from "./product-types";

export type { ProductRecord } from "./product-types";

export type ProductOverride = {
  imageUrl?: string;
  images?: string[];
  updatedAt: string;
};

type ProductOverrideStore = {
  overrides: Record<string, ProductOverride>;
};

const productDataPath = path.join(process.cwd(), "data", "maroma-products.json");
const overrideDataPath = path.join(process.cwd(), "data", "product-overrides.json");

const readJson = async <T>(filePath: string, fallback: T): Promise<T> => {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const cleanText = (text: string | null | undefined): string => {
  if (!text) return "";
  return text
    .replace(/\\n\s*KEY INGREDIENTS\s*\\n/gi, "")
    .replace(/\n\s*KEY INGREDIENTS\s*\n/gi, "")
    .replace(/KEY INGREDIENTS/gi, "")
    .trim();
};

export const readProducts = async (): Promise<ProductRecord[]> => {
  const products = await readJson<ProductRecord[]>(productDataPath, []);
  return products.map(p => ({
    ...p,
    shortDescription: cleanText(p.shortDescription),
    description: cleanText(p.description)
  }));
};

export const readOverrides = async (): Promise<ProductOverrideStore> => {
  return readJson<ProductOverrideStore>(overrideDataPath, { overrides: {} });
};

export const writeOverrides = async (store: ProductOverrideStore): Promise<void> => {
  await fs.mkdir(path.dirname(overrideDataPath), { recursive: true });
  await fs.writeFile(overrideDataPath, JSON.stringify(store, null, 2), "utf8");
};

const normalize = (value: string): string => value.toLowerCase().trim();

export const withOverrides = (
  products: ProductRecord[],
  store: ProductOverrideStore
): ProductRecord[] => {
  return products.map((product) => {
    const override = store.overrides[product.id];
    if (!override) {
      return product;
    }
    return {
      ...product,
      imageUrl: override.imageUrl ?? product.imageUrl,
      images: override.images && override.images.length > 0 ? override.images : product.images
    };
  });
};

type ProductQuery = {
  q?: string;
  category?: string;
  limit?: number;
  onlyWithImages?: boolean;
  excludeGiftSets?: boolean;
};

export const filterProducts = (
  products: ProductRecord[],
  query: ProductQuery
): ProductRecord[] => {
  const q = normalize(query.q ?? "");
  const category = normalize(query.category ?? "");
  const limit = query.limit && query.limit > 0 ? query.limit : undefined;
  const onlyWithImages = query.onlyWithImages === true;

  const filtered = products.filter((product) => {
    if (onlyWithImages && !hasDisplayImage(product)) {
      return false;
    }

    if (query.excludeGiftSets) {
      const nameLower = product.name.toLowerCase();
      const isGiftSet = 
        product.categories.some(c => normalize(c).includes("gifting")) ||
        nameLower.includes("gift set") ||
        nameLower.includes("giftset") ||
        nameLower.includes("nurture set"); // Specifically seen in screenshot
      
      if (isGiftSet) {
        return false;
      }
    }

    const matchesCategory =
      !category ||
      product.categories.some((entry) => normalize(entry).includes(category));

    if (!matchesCategory) {
      return false;
    }

    if (!q) {
      return true;
    }

    // High-priority fields: If it matches here, it's a strong result
    const strongHaystack = [
      product.name,
      ...product.categories
    ].join(" ").toLowerCase();

    if (strongHaystack.includes(q)) {
      return true;
    }

    // Lower-priority fields: Check if it's a genuine match or just a mention
    const weakHaystack = [
      product.sku,
      product.shortDescription,
      product.description,
      product.brand,
      ...product.tags
    ].join(" ").toLowerCase();

    if (weakHaystack.includes(q)) {
      // If we only matched in the description, ensure we aren't a conflicting product type.
      // e.g. If searching for 'candle', and product is in 'Incense' category but not 'Candle' category, exclude it.
      const isSearchForCandle = q.includes("candle");
      const isSearchForIncense = q.includes("incense");
      
      const inCandleCategory = product.categories.some(c => normalize(c).includes("candle"));
      const inIncenseCategory = product.categories.some(c => normalize(c).includes("incense"));

      if (isSearchForCandle && !inCandleCategory && inIncenseCategory) {
        return false; // It's an incense product mentioning candles
      }
      if (isSearchForIncense && !inIncenseCategory && inCandleCategory) {
        return false; // It's a candle product mentioning incense
      }

      return true;
    }

    return false;
  });

  if (limit) {
    return filtered.slice(0, limit);
  }

  return filtered;
};
