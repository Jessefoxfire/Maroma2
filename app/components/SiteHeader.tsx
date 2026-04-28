"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { contentStorageKey, siteContent, type SiteContent } from "../content";
import { getNavHref } from "../../lib/catalog-categories";

type SiteHeaderProps = {
  initialNav: Pick<SiteContent, "brand" | "nav">;
};

export function SiteHeader({ initialNav }: SiteHeaderProps) {
  const pathname = usePathname();
  const [navContent, setNavContent] = useState<Pick<SiteContent, "brand" | "nav">>(initialNav);
  const [scrolled, setScrolled] = useState(false);
  const [navLiftUp, setNavLiftUp] = useState(false);
  const lastScrollY = useRef(0);

  const refreshFromStorage = useCallback(() => {
    const stored = window.localStorage.getItem(contentStorageKey);
    if (!stored) {
      setNavContent({ brand: siteContent.brand, nav: siteContent.nav });
      return;
    }
    try {
      const parsed = JSON.parse(stored) as SiteContent;
      setNavContent({ brand: parsed.brand, nav: parsed.nav });
    } catch {
      setNavContent({ brand: siteContent.brand, nav: siteContent.nav });
    }
  }, []);

  const refreshFromServerThenStorage = useCallback(async () => {
    try {
      const response = await fetch("/api/site-content", { cache: "no-store" });
      if (response.ok) {
        const payload = (await response.json()) as { content?: SiteContent | null };
        if (payload.content) {
          setNavContent({ brand: payload.content.brand, nav: payload.content.nav });
          try {
            window.localStorage.setItem(contentStorageKey, JSON.stringify(payload.content));
          } catch {
            // ignore
          }
          return;
        }
      }
    } catch {
      // ignore
    }
    refreshFromStorage();
  }, [refreshFromStorage]);

  useEffect(() => {
    const onResume = () => {
      if (document.visibilityState === "visible") {
        void refreshFromServerThenStorage();
      }
    };
    const onFocus = () => void refreshFromServerThenStorage();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onResume);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onResume);
    };
  }, [refreshFromServerThenStorage]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === contentStorageKey || event.key === null) {
        refreshFromStorage();
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshFromServerThenStorage();
      }
    };
    const onSiteContentChanged = () => {
      refreshFromStorage();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("maroma-site-content-changed", onSiteContentChanged);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("maroma-site-content-changed", onSiteContentChanged);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshFromStorage, refreshFromServerThenStorage]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastScrollY.current;
      lastScrollY.current = y;

      setScrolled(y > 24);

      if (y < 10) {
        setNavLiftUp(false);
        return;
      }

      if (y < 120 && dy < -0.5) {
        setNavLiftUp(true);
      } else if (dy > 0.5 && y > 40) {
        setNavLiftUp(false);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { brand, nav } = navContent;

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <nav
      className={`nav ${scrolled ? "nav-solid" : "nav-overlay"} ${navLiftUp ? "nav-lift" : ""}`}
    >
      <Link href="/" className="brand">
        <img src="/maroma-logo.png" alt={brand} className="brand-logo" />
      </Link>
      <div className="nav-links">
        {nav.map((item) => (
          <Link key={item} href={getNavHref(item)}>
            {item}
          </Link>
        ))}
      </div>
      <div className="spa-cta-wrap">
        <img src="/spa-logo.png" alt="Maroma Spa" className="spa-book-logo" />
        <a
          className="spa-book-btn"
          href="https://www.themaromaspa.com/treatments"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="spa-book-text">Book a Treatment</span>
        </a>
      </div>
    </nav>
  );
}
