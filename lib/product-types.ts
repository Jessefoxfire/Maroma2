export type ProductRecord = {
  id: string;
  sku: string;
  name: string;
  description: string;
  shortDescription: string;
  price: string;
  categories: string[];
  tags: string[];
  brand: string;
  images: string[];
  imageUrl: string;
  attributes: Record<string, string[]>;
};
