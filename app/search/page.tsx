import { readProducts, readOverrides, withOverrides, filterProducts } from "../../lib/product-db";
import { readSiteContentFromDisk } from "../../lib/read-site-content";
import SearchPageClient from "./search-page-client";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; ritual?: string };
}) {
  const query = searchParams.q || "";
  const ritualName = searchParams.ritual || "";
  
  const [productsRaw, overrides, siteContent] = await Promise.all([
    readProducts(),
    readOverrides(),
    readSiteContentFromDisk(),
  ]);

  const allProducts = withOverrides(productsRaw, overrides);
  const filteredProducts = filterProducts(allProducts, { 
    q: query,
    excludeGiftSets: !!ritualName 
  });

  return (
    <SearchPageClient 
      query={query} 
      ritualName={ritualName}
      products={filteredProducts} 
      initialSiteContent={siteContent} 
    />
  );
}
