import type { ProductRecord } from "./product-types";

export type FacetValueOption = {
  value: string;
  count: number;
};

export type FacetGroup = {
  id: string;
  label: string;
  /** How many products expose this attribute (popularity for sort order). */
  popularity: number;
  values: FacetValueOption[];
};

const toSetMap = (selected: Record<string, string[]>): Record<string, Set<string>> => {
  const out: Record<string, Set<string>> = {};
  for (const [facetId, values] of Object.entries(selected)) {
    if (values?.length) {
      out[facetId] = new Set(values);
    }
  }
  return out;
};

/** OR within a facet, AND across facets. Ignores one facet when checking others (for counts). */
export function productMatchesFacetSelections(
  product: ProductRecord,
  selected: Record<string, string[]>,
  ignoreFacetId?: string
): boolean {
  const map = toSetMap(selected);
  for (const [facetId, values] of Object.entries(map)) {
    if (facetId === ignoreFacetId) {
      continue;
    }
    const attrs = product.attributes?.[facetId];
    if (!attrs?.length) {
      return false;
    }
    const normalized = new Set(attrs.map((a) => a.trim()).filter(Boolean));
    const any = [...values].some((v) => normalized.has(v));
    if (!any) {
      return false;
    }
  }
  return true;
}

export function filterProductsByFacetSelections(
  products: ProductRecord[],
  selected: Record<string, string[]>
): ProductRecord[] {
  const active = Object.values(selected).some((arr) => arr.length > 0);
  if (!active) {
    return products;
  }
  return products.filter((p) => productMatchesFacetSelections(p, selected));
}

/** Count products matching all selections except `ignoreFacetId`, that include `value` for `facetId`. */
export function countForFacetValue(
  products: ProductRecord[],
  facetId: string,
  value: string,
  selected: Record<string, string[]>
): number {
  return products.filter((p) => {
    if (!productMatchesFacetSelections(p, selected, facetId)) {
      return false;
    }
    const attrs = p.attributes?.[facetId];
    if (!attrs?.length) {
      return false;
    }
    return attrs.some((a) => a.trim() === value);
  }).length;
}

/**
 * Build facet groups sorted by popularity (most-used attributes first).
 * Values within each group sorted by count descending.
 */
export function buildFacetGroups(products: ProductRecord[]): FacetGroup[] {
  const popularity = new Map<string, number>();
  const valueCounts = new Map<string, Map<string, number>>();

  for (const product of products) {
    const attrs = product.attributes ?? {};
    const keysThisProduct = new Set<string>();
    for (const key of Object.keys(attrs)) {
      const vals = attrs[key];
      if (!vals?.length) {
        continue;
      }
      keysThisProduct.add(key);
      let bucket = valueCounts.get(key);
      if (!bucket) {
        bucket = new Map();
        valueCounts.set(key, bucket);
      }
      const seen = new Set<string>();
      for (const raw of vals) {
        const v = raw.trim();
        if (!v || seen.has(v)) {
          continue;
        }
        seen.add(v);
        bucket.set(v, (bucket.get(v) || 0) + 1);
      }
    }
    for (const key of keysThisProduct) {
      popularity.set(key, (popularity.get(key) || 0) + 1);
    }
  }

  const groups: FacetGroup[] = [];
  for (const [label, pop] of popularity.entries()) {
    const bucket = valueCounts.get(label);
    if (!bucket?.size) {
      continue;
    }
    const values = [...bucket.entries()]
      .map(([v, count]) => ({ value: v, count }))
      .sort((a, b) => b.count - a.count);
    groups.push({
      id: label,
      label,
      popularity: pop,
      values
    });
  }

  groups.sort((a, b) => b.popularity - a.popularity);
  return groups;
}
