export type CategoryBannerOverride = {
  imageUrl?: string;
  heroTitle?: string;
  heroTagline?: string;
  objectPosition?: string;
  minHeight?: string;
  maxHeight?: string;
  thumbMaxWidth?: number;
  updatedAt?: string;
};

export type CategoryBannerStore = {
  banners: Record<string, CategoryBannerOverride>;
};

export type ResolvedCategoryBanner = {
  imageUrl: string | undefined;
  heroTitle: string;
  heroTagline: string;
  objectPosition: string;
  minHeight: string;
  maxHeight: string;
  thumbMaxWidth: number;
};
