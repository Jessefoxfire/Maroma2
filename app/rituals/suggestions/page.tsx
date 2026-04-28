import { SiteHeader } from "../../components/SiteHeader";
import { siteContent } from "../../content";
import SuggestionsClient from "./suggestions-client";

export default function RitualSuggestionsPage() {
  return (
    <div className="rituals-page-container">
      <SiteHeader initialNav={{ brand: siteContent.brand, nav: siteContent.nav }} />
      <SuggestionsClient />
    </div>
  );
}
