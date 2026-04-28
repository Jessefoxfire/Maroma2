import { readHeroVisualState } from "../lib/hero-media-layout-state";
import { readSiteContentFromDisk } from "../lib/read-site-content";
import HomePageClient from "./home-page-client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [initialHeroVisual, initialSiteContent] = await Promise.all([
    readHeroVisualState(),
    readSiteContentFromDisk()
  ]);
  return (
    <HomePageClient initialHeroVisual={initialHeroVisual} initialSiteContent={initialSiteContent} />
  );
}
