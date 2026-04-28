export type CatalogCategory = {
  slug: string;
  label: string;
  description: string;
  keywords: string[];
  /** Optional hero image (local `/staging-media/...` path), e.g. from maroma.com category asset. */
  bannerImage?: string;
  /** `wide-cover`: full-bleed banner with text overlaid (maroma.com–style). Default: side thumbnail. */
  bannerLayout?: "thumb" | "wide-cover";
  /** When set, used as the category hero `h1` instead of `label`. */
  heroTitle?: string;
  /** When set, used as the hero paragraph instead of `description`. */
  heroTagline?: string;
};

export const catalogCategories: CatalogCategory[] = [
  {
    slug: "face-care",
    label: "Face Care",
    description: "Botanical cleansers, serums, and skincare rituals for daily glow.",
    keywords: ["face", "facial", "skin care", "serum", "cleanser"],
    bannerImage: "/staging-media/wp-content/uploads/2025/07/facecare-hero.png",
    bannerLayout: "wide-cover",
    heroTitle: "Love Your Skin",
    heroTagline:
      "Because your skin deserves to feel happy, balanced, and naturally glowing."
  },
  {
    slug: "body-care",
    label: "Body Care",
    description: "Body washes, soaps, oils, and nourishing care essentials.",
    keywords: ["body care", "bath", "soap", "body", "lotion"],
    bannerImage: "/staging-media/wp-content/uploads/2025/07/facecare-hero.png",
    bannerLayout: "wide-cover"
  },
  {
    slug: "hair-care",
    label: "Hair Care",
    description: "Shampoos, conditioners, and hair rituals made with natural ingredients.",
    keywords: ["hair", "shampoo", "conditioner", "scalp"],
    bannerImage: "/staging-media/wp-content/uploads/2025/07/facecare-hero.png",
    bannerLayout: "wide-cover"
  },
  {
    slug: "perfumes",
    label: "Perfumes",
    description: "Fine fragrances and aromatics designed around mood and memory.",
    keywords: ["perfume", "fragrance", "aroma", "eau", "attar"],
    bannerImage: "/staging-media/wp-content/uploads/2025/07/facecare-hero.png",
    bannerLayout: "wide-cover"
  },
  {
    slug: "home-essentials",
    label: "Home Essentials",
    description: "Incense, candles, and ambient rituals for your space.",
    keywords: ["home", "incense", "candle", "ambient", "room", "diffuser"],
    bannerImage: "/staging-media/wp-content/uploads/2025/07/facecare-hero.png",
    bannerLayout: "wide-cover"
  },
  {
    slug: "gifting",
    label: "Gifting",
    description: "Gift-ready selections and curated wellbeing sets.",
    keywords: ["gift", "gifting", "set", "hamper", "collection"],
    bannerImage: "/staging-media/wp-content/uploads/2025/07/facecare-hero.png",
    bannerLayout: "wide-cover"
  }
];

export const categoryBySlug = (slug: string): CatalogCategory | undefined => {
  let decoded = slug.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // leave as-is if segment is not valid percent-encoding
  }
  const key = decoded.trim().toLowerCase();
  return catalogCategories.find((category) => category.slug === key);
};

const normalize = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, " ");

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const navHrefByNormalizedLabel: Record<string, string> = (() => {
  const map: Record<string, string> = {
    home: "/"
  };
  for (const category of catalogCategories) {
    map[normalize(category.label)] = `/${category.slug}`;
    map[normalize(category.slug)] = `/${category.slug}`;
  }
  return map;
})();

/** Resolves homepage nav labels (any casing/spacing) to category routes. */
export const getNavHref = (label: string): string => {
  const key = normalize(label);
  if (!key) {
    return "/";
  }
  return navHrefByNormalizedLabel[key] ?? categoryPathByLabel(label);
};

export const categoryPathByLabel = (label: string): string => {
  const cleaned = normalize(label);
  if (!cleaned || cleaned === "home") {
    return "/";
  }

  const matched = catalogCategories.find(
    (category) => normalize(category.label) === cleaned || normalize(category.slug) === cleaned
  );
  if (matched) {
    return `/${matched.slug}`;
  }

  return `/${slugify(cleaned)}`;
};
