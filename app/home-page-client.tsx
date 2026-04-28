"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ProductListingWithFilters } from "./components/ProductListingWithFilters";
import { ProductScroller } from "./components/ProductScroller";
import { DynamicProductShowcase } from "./components/DynamicProductShowcase";
import { RitualFaceTeaser } from "./components/RitualFaceTeaser";
import type { ProductRecord } from "../lib/product-types";
import { RITUAL_TEASER_POS_STORAGE_KEY } from "../lib/ritual-teaser-pos";
import { VISUAL_STATE_STORAGE_KEY, type HeroVisualState } from "../lib/hero-media-layout-types";
import { contentStorageKey, siteContent, type SiteContent } from "./content";
import { getDisplayImageUrl } from "../lib/product-image";

type HeroMediaLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type HeroLayerId = "primary" | "overlay";

type HeroLayerSettings = {
  visible: boolean;
  opacity: number;
  zIndex: number;
  rotateDeg: number;
  scale: number;
  fit: "cover" | "contain";
};

type HeroOverlayLayer = HeroLayerSettings & {
  src: string;
  layout: HeroMediaLayout;
};

type HeroVisualApiState = {
  layout?: HeroMediaLayout;
  heroPos?: { x: number; y: number };
  headlinePos?: { x: number; y: number };
  headlineSizeRem?: number;
  eyebrowPosRatio?: { x: number; y: number };
  heroActionsPos?: { x: number; y: number };
  heroCopyWidthVw?: number;
  primarySettings?: HeroLayerSettings;
  overlayLayer?: HeroOverlayLayer;
  heroLayout?: HeroMediaLayout;
  productShowcasePos?: { x: number; y: number };
  ritualCarouselPos?: { x: number; y: number };
  bgColors?: string[];
  bgAngle?: number;
  heroSectionHeight?: number;
  error?: string;
};

type HomePageClientProps = {
  initialHeroVisual: HeroVisualState;
  initialSiteContent: SiteContent;
};

export default function HomePageClient({ initialHeroVisual, initialSiteContent }: HomePageClientProps) {
  const [content, setContent] = useState<SiteContent>(initialSiteContent);
  const [heroLayout, setHeroLayout] = useState<HeroMediaLayout>(initialHeroVisual.heroLayout || { x: 0, y: 0, width: 100, height: 80 });
  const [headlinePos, setHeadlinePos] = useState(initialHeroVisual.headlinePos);
  const [headlineSizeRem, setHeadlineSizeRem] = useState(initialHeroVisual.headlineSizeRem);
  const [heroActionsPos, setHeroActionsPos] = useState(initialHeroVisual.heroActionsPos);
  const [ritualCarouselPos, setRitualCarouselPos] = useState(initialHeroVisual.ritualCarouselPos);

  const [eyebrowPosRatio, setEyebrowPosRatio] = useState(initialHeroVisual.eyebrowPosRatio);
  const [heroCopySize, setHeroCopySize] = useState({ width: 1, height: 1 });
  const [heroCopyWidthVw, setHeroCopyWidthVw] = useState(initialHeroVisual.heroCopyWidthVw);
  const [heroMediaLayout, setHeroMediaLayout] = useState<HeroMediaLayout>(initialHeroVisual.layout);
  const [heroPrimarySettings, setHeroPrimarySettings] = useState<HeroLayerSettings>(() => ({
    ...initialHeroVisual.primarySettings
  }));
  const [heroOverlayLayer, setHeroOverlayLayer] = useState<HeroOverlayLayer>(() => ({
    ...initialHeroVisual.overlayLayer,
    layout: { ...initialHeroVisual.overlayLayer.layout }
  }));
  const [selectedHeroLayer, setSelectedHeroLayer] = useState<HeroLayerId>("primary");

  const [floatingPanelPos, setFloatingPanelPos] = useState({ x: 0, y: 0 });
  const [floatingPanelMinimized, setFloatingPanelMinimized] = useState(false);
  const [adminDragEnabled, setAdminDragEnabled] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [bgColors, setBgColors] = useState<string[]>(initialHeroVisual.bgColors || ["#dbe3d0", "#cbd5c0", "#d6deca"]);
  const [bgAngle, setBgAngle] = useState<number>(initialHeroVisual.bgAngle || 135);
  const [productShowcasePos, setProductShowcasePos] = useState(initialHeroVisual.productShowcasePos || { x: 0, y: 0 });
  const [heroSectionHeight, setHeroSectionHeight] = useState(initialHeroVisual.heroSectionHeight || 100);

  type AdminLayerId = 'background' | 'primary' | 'overlay' | 'headline' | 'eyebrow' | 'actions' | 'rituals';
  const [adminEditLayer, setAdminEditLayer] = useState<AdminLayerId>('primary');

  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [productStatus, setProductStatus] = useState("Loading products...");
  const heroCopyRef = useRef<HTMLDivElement | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const basePos = useRef(initialHeroVisual.headlinePos);
  const heroActionsDragStart = useRef<{ x: number; y: number } | null>(null);
  const heroActionsBaseRef = useRef({ x: 0, y: 0 });
  const heroActionsPosRef = useRef(initialHeroVisual.heroActionsPos);
  const legacyEyebrowPosPx = useRef<{ x: number; y: number } | null>(null);
  const eyebrowRatioRef = useRef(initialHeroVisual.eyebrowPosRatio);
  const floatingPanelDragStart = useRef<{ x: number; y: number } | null>(null);
  const floatingPanelBase = useRef({ x: 0, y: 0 });
  const floatingPanelRef = useRef<HTMLDivElement | null>(null);

  const clampFloatingPanelPos = useCallback((pos: { x: number; y: number }) => {
    if (typeof window === "undefined") {
      return pos;
    }
    const iw = window.innerWidth;
    const ih = window.innerHeight;
    const pad = 12;
    const rightOffset = 20;
    const bottomOffset = 20;
    const el = floatingPanelRef.current;
    const panelW = Math.max(el?.offsetWidth ?? 260, 120);
    const panelH = Math.max(el?.offsetHeight ?? 260, 120);
    const leftAtZero = iw - rightOffset - panelW;
    const topAtZero = ih - bottomOffset - panelH;
    const minX = pad - leftAtZero;
    const maxX = iw - pad - panelW - leftAtZero;
    const minY = pad - topAtZero;
    const maxY = ih - pad - panelH - topAtZero;
    if (minX > maxX || minY > maxY) {
      return pos;
    }
    return {
      x: Math.max(minX, Math.min(maxX, pos.x)),
      y: Math.max(minY, Math.min(maxY, pos.y))
    };
  }, []);

  const mediaDragStart = useRef<{ x: number; y: number } | null>(null);
  const mediaResizeStart = useRef<{ x: number; y: number } | null>(null);
  const mediaBaseLayout = useRef<HeroMediaLayout>({ ...initialHeroVisual.layout });
  const mediaInteractionLayerRef = useRef<HeroLayerId>("primary");

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(contentStorageKey);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as SiteContent;
      if (JSON.stringify(parsed) !== JSON.stringify(initialSiteContent)) {
        setContent(parsed);
      }
    } catch {
      // keep server-provided content
    }
  }, [initialSiteContent]);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch("/api/site-content", { cache: "no-store" });
        if (response.ok) {
          const payload = (await response.json()) as { content?: SiteContent | null };
          if (payload.content) {
            const next = payload.content;
            setContent((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
            try {
              window.localStorage.setItem(contentStorageKey, JSON.stringify(payload.content));
            } catch {
              // ignore quota errors
            }
            window.dispatchEvent(new Event("maroma-site-content-changed"));
            return;
          }
        }
      } catch {
        // ignore
      }
    };
    const onResume = () => {
      if (document.visibilityState === "visible") {
        void loadContent();
      }
    };
    const onFocus = () => void loadContent();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onResume);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onResume);
    };
  }, []);

  const persistSiteContentToServer = async (next: SiteContent) => {
    try {
      window.localStorage.setItem(contentStorageKey, JSON.stringify(next));
    } catch {
      // quota or private mode
    }
    try {
      await fetch("/api/site-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: next })
      });
      window.dispatchEvent(new Event("maroma-site-content-changed"));
    } catch {
      // server unavailable — local copy may still exist
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const loadProducts = async () => {
      try {
        const params = new URLSearchParams();
        if (productSearch.trim()) {
          params.set("q", productSearch.trim());
        }
        params.set("onlyWithImages", "1");
        params.set("limit", "120");
        const response = await fetch(`/api/products?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error("Failed to load products");
        }
        const data = (await response.json()) as { products?: ProductRecord[]; count?: number };
        const allProducts = data.products ?? [];
        const filtered = allProducts.filter(p => {
          const isBabyName = p.name.toLowerCase().includes("baby");
          const isBabyCategory = p.categories.some(c => c.toLowerCase().includes("baby"));
          return !isBabyName && !isBabyCategory;
        });
        setProducts(filtered);
        const count = filtered.length;
        setProductStatus(
          count > 0 ? `${count} products found` : "No products match this search yet."
        );
      } catch (error) {
        if ((error as { name?: string }).name === "AbortError") {
          return;
        }
        setProductStatus("Unable to load products right now.");
      }
    };
    void loadProducts();
    return () => controller.abort();
  }, [productSearch]);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".scroll-zoom"));
    if (nodes.length === 0) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-inview");
          }
        }
      },
      { threshold: 0.22, rootMargin: "0px 0px -6% 0px" }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [content, products.length]);

  useEffect(() => {
    const stored = window.localStorage.getItem("maroma-admin-drag");
    setAdminDragEnabled(stored === "true");
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem("maroma-floating-admin-minimized");
    setFloatingPanelMinimized(stored === "true");
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem("maroma-floating-admin-pos");
    if (stored) {
      try { setFloatingPanelPos(JSON.parse(stored)); } catch { }
    }
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(VISUAL_STATE_STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored) as HeroVisualApiState;
        if (data.layout) setHeroMediaLayout(data.layout);
        if (data.primarySettings) setHeroPrimarySettings(data.primarySettings);
        if (data.overlayLayer) setHeroOverlayLayer(data.overlayLayer);
        if (data.headlineSizeRem) setHeadlineSizeRem(data.headlineSizeRem);
        if (data.heroCopyWidthVw) setHeroCopyWidthVw(data.heroCopyWidthVw);
        if (data.heroLayout) setHeroLayout(data.heroLayout);
        if (data.headlinePos) setHeadlinePos(data.headlinePos);
        if (data.heroActionsPos) setHeroActionsPos(data.heroActionsPos);
        if (data.eyebrowPosRatio) setEyebrowPosRatio(data.eyebrowPosRatio);
        if (data.bgColors) setBgColors(data.bgColors);
        if (data.bgAngle) setBgAngle(data.bgAngle);
        if (typeof data.heroSectionHeight === "number") setHeroSectionHeight(data.heroSectionHeight);
      } catch { }
    }
  }, []);

  useEffect(() => {
    const onResize = () => {
      setFloatingPanelPos((prev) => clampFloatingPanelPos(prev));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampFloatingPanelPos]);

  useEffect(() => {
    setFloatingPanelPos((prev) => clampFloatingPanelPos(prev));
  }, [adminDragEnabled, clampFloatingPanelPos]);

  useEffect(() => {
    const el = floatingPanelRef.current;
    if (!el) {
      return;
    }
    const observer = new ResizeObserver(() => {
      setFloatingPanelPos((prev) => clampFloatingPanelPos(prev));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [adminDragEnabled, clampFloatingPanelPos]);

  useEffect(() => {
    const loadHeroVisualState = async () => {
      try {
        const response = await fetch("/api/hero-media-layout", { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as HeroVisualApiState;
        if (data && !data.error) {
          if (data.heroLayout) setHeroLayout(data.heroLayout);
          
          if (data.headlinePos) {
            setHeadlinePos(data.headlinePos);
            basePos.current = data.headlinePos;
          }
          
          if (data.heroActionsPos) {
            setHeroActionsPos(data.heroActionsPos);
            heroActionsPosRef.current = data.heroActionsPos;
          }
          
          if (data.ritualCarouselPos) setRitualCarouselPos(data.ritualCarouselPos);
          
          if (typeof data.headlineSizeRem === "number") setHeadlineSizeRem(data.headlineSizeRem);
          
          if (data.eyebrowPosRatio) {
            setEyebrowPosRatio(data.eyebrowPosRatio);
            eyebrowRatioRef.current = data.eyebrowPosRatio;
          }
          
          if (typeof data.heroCopyWidthVw === "number") setHeroCopyWidthVw(data.heroCopyWidthVw);
          
          if (data.layout) {
            setHeroMediaLayout(data.layout);
            mediaBaseLayout.current = data.layout;
          }
          
          if (data.primarySettings) setHeroPrimarySettings(data.primarySettings);
          if (data.overlayLayer) setHeroOverlayLayer(data.overlayLayer);
          if (data.bgColors) setBgColors(data.bgColors);
          if (typeof data.bgAngle === "number") setBgAngle(data.bgAngle);
          if (data.productShowcasePos) setProductShowcasePos(data.productShowcasePos);
          if (typeof data.heroSectionHeight === "number") setHeroSectionHeight(data.heroSectionHeight);
        }




      } catch {
        // Keep current layout when unavailable.
      }
    };
    const onResume = () => {
      if (document.visibilityState === "visible") {
        void loadHeroVisualState();
      }
    };
    const onFocus = () => void loadHeroVisualState();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onResume);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onResume);
    };
  }, []);

  useEffect(() => {
    eyebrowRatioRef.current = eyebrowPosRatio;
  }, [eyebrowPosRatio]);

  useEffect(() => {
    heroActionsPosRef.current = heroActionsPos;
  }, [heroActionsPos]);

  useLayoutEffect(() => {
    const element = heroCopyRef.current;
    if (!element) {
      return;
    }
    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setHeroCopySize({
        width: Math.max(rect.width, 1),
        height: Math.max(rect.height, 1)
      });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [content, heroCopyWidthVw]);

  useEffect(() => {
    if (!legacyEyebrowPosPx.current) {
      return;
    }
    setEyebrowPosRatio({
      x: legacyEyebrowPosPx.current.x / heroCopySize.width,
      y: legacyEyebrowPosPx.current.y / heroCopySize.height
    });
    legacyEyebrowPosPx.current = null;
  }, [heroCopySize]);

  const handlePointerDown = (event: React.PointerEvent<HTMLHeadingElement>) => {
    if (!adminDragEnabled) {
      return;
    }
    dragStart.current = { x: event.clientX, y: event.clientY };
    basePos.current = headlinePos;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLHeadingElement>) => {
    if (!dragStart.current || !adminDragEnabled) {
      return;
    }
    const dx = event.clientX - dragStart.current.x;
    const dy = event.clientY - dragStart.current.y;
    setHeadlinePos({
      x: basePos.current.x + dx,
      y: basePos.current.y + dy
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLHeadingElement>) => {
    if (!adminDragEnabled) {
      return;
    }
    dragStart.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    void persistHeroVisualPatch({ headlinePos });
  };

  const handleHeroActionsPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!adminDragEnabled) {
      return;
    }
    heroActionsDragStart.current = { x: event.clientX, y: event.clientY };
    heroActionsBaseRef.current = heroActionsPosRef.current;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleHeroActionsPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!heroActionsDragStart.current || !adminDragEnabled) {
      return;
    }
    const dx = event.clientX - heroActionsDragStart.current.x;
    const dy = event.clientY - heroActionsDragStart.current.y;
    const next = {
      x: heroActionsBaseRef.current.x + dx,
      y: heroActionsBaseRef.current.y + dy
    };
    heroActionsPosRef.current = next;
    setHeroActionsPos(next);
  };

  const handleHeroActionsPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!adminDragEnabled) {
      return;
    }
    heroActionsDragStart.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    void persistHeroVisualPatch({
      heroActionsPos: {
        x: heroActionsPosRef.current.x,
        y: heroActionsPosRef.current.y
      }
    });
  };

  const eyebrowDragStart = useRef<{ x: number; y: number } | null>(null);
  const eyebrowBase = useRef({ x: 0, y: 0 });
  const eyebrowDragBounds = useRef({ width: 1, height: 1 });

  const handleEyebrowDown = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (!adminDragEnabled) {
      return;
    }
    eyebrowDragStart.current = { x: event.clientX, y: event.clientY };
    eyebrowBase.current = eyebrowPosRatio;
    const rect = heroCopyRef.current?.getBoundingClientRect();
    eyebrowDragBounds.current = {
      width: rect ? Math.max(rect.width, 1) : heroCopySize.width,
      height: rect ? Math.max(rect.height, 1) : heroCopySize.height
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleEyebrowMove = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (!eyebrowDragStart.current || !adminDragEnabled) {
      return;
    }
    const dx = event.clientX - eyebrowDragStart.current.x;
    const dy = event.clientY - eyebrowDragStart.current.y;
    const next = {
      x: eyebrowBase.current.x + dx / eyebrowDragBounds.current.width,
      y: eyebrowBase.current.y + dy / eyebrowDragBounds.current.height
    };
    eyebrowRatioRef.current = next;
    setEyebrowPosRatio(next);
  };

  const handleEyebrowUp = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (!adminDragEnabled) {
      return;
    }
    eyebrowDragStart.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    void persistHeroVisualPatch({
      eyebrowPosRatio: {
        x: eyebrowRatioRef.current.x,
        y: eyebrowRatioRef.current.y
      }
    });
  };

  const eyebrowPos = {
    x: eyebrowPosRatio.x * heroCopySize.width,
    y: eyebrowPosRatio.y * heroCopySize.height
  };

  const persistHeroVisualPatch = async (patch: HeroVisualApiState) => {
    try {
      await fetch("/api/hero-media-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
    } catch {
      // Best-effort persistence.
    }
  };

  const handleSaveAll = async () => {
    setSaveStatus("saving");
    const visualData = {
      layout: heroMediaLayout,
      primarySettings: heroPrimarySettings,
      overlayLayer: heroOverlayLayer,
      headlineSizeRem,
      heroCopyWidthVw,
      heroLayout,
      headlinePos,
      heroActionsPos,
      eyebrowPosRatio,
      bgColors,
      bgAngle,
      heroSectionHeight
    };

    // Backup to localStorage immediately
    try {
      window.localStorage.setItem(VISUAL_STATE_STORAGE_KEY, JSON.stringify(visualData));
    } catch { }

    try {
      const visualPromise = fetch("/api/hero-media-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(visualData)
      });

      const contentPromise = fetch("/api/site-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });

      await Promise.all([visualPromise, contentPromise]);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("idle");
    }
  };

  const handleCopyConfig = () => {
    const config = {
      visual: {
        layout: heroMediaLayout,
        primarySettings: heroPrimarySettings,
        overlayLayer: heroOverlayLayer,
        headlineSizeRem,
        heroCopyWidthVw,
        heroLayout,
        headlinePos,
        heroActionsPos,
        eyebrowPosRatio,
        bgColors,
        bgAngle,
        ritualCarouselPos,
        heroSectionHeight
      },
      content
    };
    void navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    alert("Configuration copied to clipboard! Paste it into the chat.");
  };

  const clampLayout = (layout: HeroMediaLayout): HeroMediaLayout => {
    const width = Math.min(100, Math.max(30, layout.width));
    const height = Math.min(100, Math.max(30, layout.height));
    const x = Math.max(-100, Math.min(100, layout.x));
    const y = Math.max(-100, Math.min(100, layout.y));
    return { x, y, width, height };
  };

  const clampLayerSettings = (settings: HeroLayerSettings): HeroLayerSettings => ({
    ...settings,
    opacity: Math.min(1, Math.max(0, settings.opacity)),
    zIndex: Math.min(20, Math.max(0, Math.round(settings.zIndex))),
    rotateDeg: Math.min(180, Math.max(-180, Number(settings.rotateDeg) || 0))
  });

  const setHeroMediaLayoutAndSave = (next: HeroMediaLayout) => {
    const clamped = clampLayout(next);
    setHeroMediaLayout(clamped);
    void persistHeroVisualPatch({ layout: clamped });
  };

  const setPrimarySettingsAndSave = (next: HeroLayerSettings) => {
    const clamped = clampLayerSettings(next);
    setHeroPrimarySettings(clamped);
    void persistHeroVisualPatch({ primarySettings: clamped });
  };

  const setOverlayLayerAndSave = (next: HeroOverlayLayer) => {
    const clamped: HeroOverlayLayer = {
      ...clampLayerSettings(next),
      src: next.src,
      layout: clampLayout(next.layout)
    };
    setHeroOverlayLayer(clamped);
    void persistHeroVisualPatch({ overlayLayer: clamped });
  };

  const activeLayerLayout =
    selectedHeroLayer === "primary" ? heroMediaLayout : heroOverlayLayer.layout;
  const activeLayerSettings =
    selectedHeroLayer === "primary" ? heroPrimarySettings : heroOverlayLayer;

  const handleHeroMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") {
        return;
      }
      if (selectedHeroLayer === "overlay") {
        setOverlayLayerAndSave({
          ...heroOverlayLayer,
          src: dataUrl,
          visible: true
        });
        return;
      }
      setContent((prev) => {
        const next = {
          ...prev,
          hero: {
            ...prev.hero,
            video: file.type.startsWith("video/")
              ? {
                  ...prev.hero.video,
                  src: dataUrl
                }
              : {
                  ...prev.hero.video,
                  poster: dataUrl,
                  src: ""
                }
          }
        };
        void persistSiteContentToServer(next);
        return next;
      });
    };
    reader.readAsDataURL(file);
    event.currentTarget.value = "";
  };

  const handleCarouselFrameUpload = (
    slideIndex: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") {
        return;
      }
      setContent((prev) => {
        const slides = [...prev.carousel.slides];
        const target = slides[slideIndex];
        if (!target) {
          return prev;
        }
        slides[slideIndex] = { ...target, image: dataUrl };
        const next = {
          ...prev,
          carousel: {
            ...prev.carousel,
            slides
          }
        };
        void persistSiteContentToServer(next);
        return next;
      });
    };
    reader.readAsDataURL(file);
    event.currentTarget.value = "";
  };

  const getHeroBounds = () => {
    const rect = heroSectionRef.current?.getBoundingClientRect();
    return {
      width: Math.max(rect?.width ?? 1, 1),
      height: Math.max(rect?.height ?? 1, 1)
    };
  };

  const handleRitualPositionChange = useCallback((next: { x: number; y: number }) => {
    setRitualCarouselPos(next);
    void persistHeroVisualPatch({ ritualCarouselPos: next });
  }, []);

  const bestSellersItems = useMemo(() => {
    return products
      .filter((p) => p.tags?.some((t) => t.toLowerCase() === "best seller"))
      .map((p) => ({
        label: p.name,
        description: p.shortDescription,
        image: getDisplayImageUrl(p) || "",
        color: "#f8f8f8",
        href: `/product/${p.id}`
      }))
      .slice(0, 15);
  }, [products]);

  const handleMediaDragDown = (event: React.PointerEvent<HTMLDivElement>, layerId: HeroLayerId) => {
    if (!adminDragEnabled) {
      return;
    }
    mediaInteractionLayerRef.current = layerId;
    const baseLayout =
      layerId === "primary" ? heroMediaLayout : heroOverlayLayer.layout;
    mediaDragStart.current = { x: event.clientX, y: event.clientY };
    mediaBaseLayout.current = { ...baseLayout };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleMediaDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!adminDragEnabled || !mediaDragStart.current || mediaResizeStart.current) {
      return;
    }
    const bounds = getHeroBounds();
    const dxPct = ((event.clientX - mediaDragStart.current.x) / bounds.width) * 100;
    const dyPct = ((event.clientY - mediaDragStart.current.y) / bounds.height) * 100;
    const next = clampLayout({
      ...mediaBaseLayout.current,
      x: mediaBaseLayout.current.x + dxPct,
      y: mediaBaseLayout.current.y + dyPct
    });
    if (mediaInteractionLayerRef.current === "primary") {
      setHeroMediaLayout(next);
    } else {
      setHeroOverlayLayer((prev) => ({ ...prev, layout: next }));
    }
  };

  const handleMediaDragUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!mediaDragStart.current) {
      return;
    }
    mediaDragStart.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (mediaResizeStart.current) {
      return;
    }
    if (mediaInteractionLayerRef.current === "primary") {
      setHeroMediaLayout((cur) => {
        const clamped = clampLayout(cur);
        void persistHeroVisualPatch({ layout: clamped });
        return clamped;
      });
    } else {
      setHeroOverlayLayer((prev) => {
        const clamped: HeroOverlayLayer = {
          ...prev,
          layout: clampLayout(prev.layout)
        };
        void persistHeroVisualPatch({ overlayLayer: clamped });
        return clamped;
      });
    }
  };

  const handleMediaResizeDown = (event: React.PointerEvent<HTMLButtonElement>, layerId: HeroLayerId) => {
    if (!adminDragEnabled) {
      return;
    }
    event.stopPropagation();
    mediaInteractionLayerRef.current = layerId;
    const baseLayout =
      layerId === "primary" ? heroMediaLayout : heroOverlayLayer.layout;
    mediaResizeStart.current = { x: event.clientX, y: event.clientY };
    mediaBaseLayout.current = { ...baseLayout };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleMediaResizeMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!adminDragEnabled || !mediaResizeStart.current) {
      return;
    }
    event.stopPropagation();
    const bounds = getHeroBounds();
    const dwPct = ((event.clientX - mediaResizeStart.current.x) / bounds.width) * 100;
    const dhPct = ((event.clientY - mediaResizeStart.current.y) / bounds.height) * 100;
    const next = clampLayout({
      ...mediaBaseLayout.current,
      width: mediaBaseLayout.current.width + dwPct,
      height: mediaBaseLayout.current.height + dhPct
    });
    if (mediaInteractionLayerRef.current === "primary") {
      setHeroMediaLayout(next);
    } else {
      setHeroOverlayLayer((prev) => ({ ...prev, layout: next }));
    }
  };

  const handleMediaResizeUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!mediaResizeStart.current) {
      return;
    }
    event.stopPropagation();
    mediaResizeStart.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (mediaInteractionLayerRef.current === "primary") {
      setHeroMediaLayout((cur) => {
        const clamped = clampLayout(cur);
        void persistHeroVisualPatch({ layout: clamped });
        return clamped;
      });
    } else {
      setHeroOverlayLayer((prev) => {
        const clamped: HeroOverlayLayer = {
          ...prev,
          layout: clampLayout(prev.layout)
        };
        void persistHeroVisualPatch({ overlayLayer: clamped });
        return clamped;
      });
    }
  };

  const handleFloatingPanelPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("button, a, input, textarea, select, label")) {
      return;
    }
    floatingPanelDragStart.current = { x: event.clientX, y: event.clientY };
    floatingPanelBase.current = floatingPanelPos;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleFloatingPanelPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!floatingPanelDragStart.current) {
      return;
    }
    const dx = event.clientX - floatingPanelDragStart.current.x;
    const dy = event.clientY - floatingPanelDragStart.current.y;
    setFloatingPanelPos(clampFloatingPanelPos({
      x: floatingPanelBase.current.x + dx,
      y: floatingPanelBase.current.y + dy
    }));
  };

  const handleFloatingPanelPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!floatingPanelDragStart.current) {
      return;
    }
    const dx = event.clientX - floatingPanelDragStart.current.x;
    const dy = event.clientY - floatingPanelDragStart.current.y;
    const next = clampFloatingPanelPos({
      x: floatingPanelBase.current.x + dx,
      y: floatingPanelBase.current.y + dy
    });
    setFloatingPanelPos(next);
    floatingPanelDragStart.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    window.localStorage.setItem("maroma-floating-admin-pos", JSON.stringify(next));
  };

  const { hero, carousel, highlights, brand } = content;
  const hasHeroMedia = Boolean(hero.video.src || hero.video.poster);
  const hasOverlayMedia = Boolean(heroOverlayLayer.visible && heroOverlayLayer.src);
  const hasAnyHeroVisualLayer = hasHeroMedia || hasOverlayMedia;
  const primaryMediaPointerEvents =
    hasHeroMedia && adminDragEnabled && selectedHeroLayer === "overlay" ? "none" : "auto";
  const overlayMediaPointerEvents =
    adminDragEnabled && selectedHeroLayer === "overlay" ? "auto" : "none";

  return (
    <div className="page maroma">
      <section
        className={`hero ${hasAnyHeroVisualLayer ? "hero-bg" : ""}`}
        id="hero"
        ref={heroSectionRef}
        style={{ minHeight: `${heroSectionHeight}vh` }}
      >
        <div
          className="hero-background-layer"
          aria-hidden="true"
          style={{
            transform: `translate(${heroLayout.x}vw, ${heroLayout.y}vh)`,
            width: `${heroLayout.width}vw`,
            minHeight: `${heroLayout.height}vh`,
            background: `linear-gradient(${bgAngle}deg, ${bgColors.join(", ")})`
          }}
        />
        <div className="hero-copy" ref={heroCopyRef}>
          <div style={{ width: `${heroCopyWidthVw}vw`, maxWidth: "100%" }}>
          <span
            className="eyebrow hero-eyebrow scroll-zoom"
            style={{ transform: `translate(${eyebrowPos.x}px, ${eyebrowPos.y}px)` }}
          >
            {hero.eyebrow}
          </span>
          <h1
            className="hero-headline scroll-zoom"
            style={{
              transform: `translate(${headlinePos.x}px, ${headlinePos.y}px)`,
              fontSize: `${headlineSizeRem}rem`
            }}
          >
            {hero.headline}
          </h1>
          {hero.subhead ? <p className="scroll-zoom">{hero.subhead}</p> : null}
          <div
            className={`hero-actions${adminDragEnabled ? " hero-cta-drag" : ""}`}
            style={{ transform: `translate(${heroActionsPos.x}px, ${heroActionsPos.y}px)` }}
          >
            <Link href="/special" className="button primary button-gold">
              {hero.ctaPrimary}
            </Link>
            <Link href="/rituals" className="button primary button-sage">
              {hero.ctaSecondary}
            </Link>
            <Link href="#shop" className="button secondary">
              Search Products
            </Link>
          </div>
          {hero.phrases.length > 0 ? (
            <div className="phrase-cycle" aria-live="polite">
              {hero.phrases.map((phrase, index) => (
                <span
                  key={phrase}
                  className="phrase"
                  style={{ animationDelay: `${index * 3}s` }}
                >
                  {phrase}
                </span>
              ))}
            </div>
          ) : null}
          </div>
        </div>

        {/* Primary Media Layer (Video, Poster, or Fallback Graphic) */}
        {hasHeroMedia || adminDragEnabled || hasOverlayMedia ? (
          <div className="hero-media">
            {hasOverlayMedia ? (
              <div
                className={`hero-media-frame ${
                  adminDragEnabled && selectedHeroLayer === "overlay" ? "hero-media-editable" : ""
                }`}
                style={{
                  left: `${heroOverlayLayer.layout.x}%`,
                  top: `${heroOverlayLayer.layout.y}%`,
                  width: `${heroOverlayLayer.layout.width}%`,
                  height: `${heroOverlayLayer.layout.height}%`,
                  transform: `rotate(${heroOverlayLayer.rotateDeg}deg) scale(${heroOverlayLayer.scale || 1})`,
                  opacity: heroOverlayLayer.opacity,
                  zIndex: heroOverlayLayer.zIndex,
                  pointerEvents: overlayMediaPointerEvents
                }}
              >
                <img
                  className="hero-media-image"
                  src={heroOverlayLayer.src}
                  alt=""
                  aria-hidden="true"
                  style={{ objectFit: heroOverlayLayer.fit }}
                />
              </div>
            ) : null}

            <div
              className={`hero-media-frame ${adminDragEnabled && selectedHeroLayer === "primary" ? "hero-media-editable" : ""}`}
              style={{
                left: `${heroMediaLayout.x}%`,
                top: `${heroMediaLayout.y}%`,
                width: `${heroMediaLayout.width}%`,
                height: `${heroMediaLayout.height}%`,
                transform: `rotate(${heroPrimarySettings.rotateDeg}deg) scale(${heroPrimarySettings.scale || 1})`,
                opacity: heroPrimarySettings.opacity,
                zIndex: heroPrimarySettings.zIndex,
                display: heroPrimarySettings.visible ? "block" : "none",
                pointerEvents: primaryMediaPointerEvents
              }}
            >
              {hero.video.src ? (
                <video
                  className="hero-video"
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster={hero.video.poster}
                  style={{ objectFit: heroPrimarySettings.fit }}
                >
                  <source src={hero.video.src} />
                </video>
              ) : (
                <img
                  className="hero-media-image"
                  src={hero.video.poster || "/hero-right-product.png"}
                  alt=""
                  aria-hidden="true"
                  style={{ objectFit: heroPrimarySettings.fit }}
                />
              )}
            </div>
          </div>
        ) : null}

        <RitualFaceTeaser
          products={products}
          position={ritualCarouselPos}
          onPositionChange={handleRitualPositionChange}
        />
      </section>

      <ProductScroller
        className="scroller-loved-for-a-reason"
        title={carousel.title}
        subtitle={carousel.subtitle}
        items={carousel.slides.map((s) => {
          const product = products.find(p => p.name === s.label || p.id === s.id);
          return {
            label: s.label,
            description: s.description,
            image: s.image,
            color: s.color,
            href: `/product/${s.label.toLowerCase().replace(/\s+/g, "-")}`,
            product
          };
        })}
      />

      <section className="instagram-section">
        <div className="scroller-header">
          <h2 className="scroller-title">From the Maroma World!</h2>
        </div>
        <div className="instagram-feed-container">
          <div className="elfsight-app-3e9b8508-c159-4052-be08-dcc0f7f5a278" data-elfsight-app-lazy></div>
        </div>
      </section>

      <div className="ticker-top-banner">
        <img src="/staging-media/banners/care-banner.png" alt="" aria-hidden="true" />
      </div>

      <section className="scrolling-ticker-section">
        <div className="ticker-wrap">
          <div className="ticker">
            <span className="ticker__item">
              Vegan and Cruelty-free • No rabbits (or any other living thing was harmed or in any way even slightly inconvenienced by the creation of our products) • World Fair Trade Certified - everyone gets paid a fair wage and treated with respect • Naturally derived • Almost entirely locally-sourced • Palm-Oil Free • Good For You • Good for the Planet •
            </span>
            <span className="ticker__item">
              Vegan and Cruelty-free • No rabbits (or any other living thing was harmed or in any way even slightly inconvenienced by the creation of our products) • World Fair Trade Certified - everyone gets paid a fair wage and treated with respect • Naturally derived • Almost entirely locally-sourced • Palm-Oil Free • Good For You • Good for the Planet •
            </span>
          </div>
        </div>
      </section>

      <section className="product-database" id="shop" style={{ scrollMarginTop: "100px" }} aria-label="Searchable product database">
        <div className="product-database-head">
          <div>
            <span className="eyebrow scroll-zoom">Shop database</span>
            <h2 className="scroll-zoom">Find Your Product Here</h2>
          </div>
          <label className="product-search">
            <span>Search products</span>
            <input
              type="search"
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
              placeholder="Try soap, lavender, shampoo..."
            />
          </label>
        </div>
        <p className="product-status">{productStatus}</p>
        <div className="product-listing-section">
          <ProductListingWithFilters products={products} />
        </div>
      </section>

      <footer className="footer">
        <strong>{brand}</strong>
        <div>Preview only. Replace placeholders with real media.</div>
      </footer>

      <div
        ref={floatingPanelRef}
        className={`floating-admin-toggle${floatingPanelMinimized ? " is-minimized" : ""}`}
        role="complementary"
        aria-label="Admin controls"
        onPointerDown={handleFloatingPanelPointerDown}
        onPointerMove={handleFloatingPanelPointerMove}
        onPointerUp={handleFloatingPanelPointerUp}
        style={{ transform: `translate(${floatingPanelPos.x}px, ${floatingPanelPos.y}px)` }}
      >
        {floatingPanelMinimized ? (
          <button
            type="button"
            className="floating-admin-mini-btn"
            aria-label="Open admin controls"
            onClick={() => {
              setFloatingPanelMinimized(false);
              window.localStorage.setItem("maroma-floating-admin-minimized", "false");
            }}
          >
            Admin
          </button>
        ) : (
          <>
            <div className="floating-admin-head">
              <span className="floating-admin-label">
                {adminDragEnabled ? "Admin mode" : "Non-admin mode"}
              </span>
              <button
                type="button"
                className="floating-admin-collapse"
                aria-label="Minimize admin controls"
                onClick={() => {
                  setFloatingPanelMinimized(true);
                  window.localStorage.setItem("maroma-floating-admin-minimized", "true");
                }}
              >
                -
              </button>
            </div>
            <button
              type="button"
              className="button primary"
              style={{ width: "100%", marginBottom: "12px", background: saveStatus === "saved" ? "#10b981" : "" }}
              onClick={handleSaveAll}
              disabled={saveStatus === "saving"}
            >
              {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Changes Saved" : "SAVE ALL CHANGES"}
            </button>
            <button
              type="button"
              className="button secondary"
              style={{ width: "100%", marginBottom: "12px" }}
              onClick={handleCopyConfig}
            >
              COPY CONFIG JSON
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                const next = !adminDragEnabled;
                setAdminDragEnabled(next);
                window.localStorage.setItem("maroma-admin-drag", next ? "true" : "false");
                window.dispatchEvent(new Event("maroma-admin-changed"));
              }}
            >
              Switch to {adminDragEnabled ? "Non-admin" : "Admin"}
            </button>
            {adminDragEnabled ? (
              <>
            <label className="floating-admin-upload">
              Upload image/video for selected layer
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleHeroMediaUpload}
              />
            </label>
            <div className="floating-admin-grid">
              <label className="floating-admin-select-group">
                Layer
                <select
                  value={selectedHeroLayer}
                  onChange={(event) => setSelectedHeroLayer(event.target.value as HeroLayerId)}
                >
                  <option value="overlay">Overlay image (middle)</option>
                  <option value="primary">Primary media (front)</option>
                </select>
              </label>
              <span className="floating-admin-hint" style={{ color: "var(--soft-ink)" }}>
                Primary draws on top. If the scene looks zoomed full-width, open Primary and reduce W/H (it is often
                100% while Overlay is smaller).
              </span>
              <label>
                Visible
                <input
                  type="checkbox"
                  checked={activeLayerSettings.visible}
                  onChange={(event) => {
                    if (selectedHeroLayer === "primary") {
                      setPrimarySettingsAndSave({
                        ...heroPrimarySettings,
                        visible: event.target.checked
                      });
                    } else {
                      setOverlayLayerAndSave({
                        ...heroOverlayLayer,
                        visible: event.target.checked
                      });
                    }
                  }}
                />
              </label>
              <label className="floating-admin-select-group">
                Fit
                <select
                  value={activeLayerSettings.fit}
                  onChange={(event) => {
                    const fit = event.target.value as "cover" | "contain";
                    if (selectedHeroLayer === "primary") {
                      setPrimarySettingsAndSave({ ...heroPrimarySettings, fit });
                    } else {
                      setOverlayLayerAndSave({ ...heroOverlayLayer, fit });
                    }
                  }}
                  style={{ background: "#fff", border: "1px solid #ccc", borderRadius: "4px", padding: "2px 4px", fontSize: "0.8rem", color: "var(--ink)" }}
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                </select>
              </label>
            </div>

            <div className="floating-admin-grid">
              <label className="floating-admin-select-group">
                Select Layer
                <select
                  value={adminEditLayer}
                  onChange={(e) => setAdminEditLayer(e.target.value as AdminLayerId)}
                >
                  <option value="primary">Primary Media</option>
                  <option value="overlay">Overlay Media</option>
                  <option value="background">Background</option>
                  <option value="headline">Headline</option>
                  <option value="eyebrow">Eyebrow</option>
                  <option value="actions">Hero Actions</option>
                  <option value="rituals">Ritual Carousel</option>
                </select>
              </label>
            </div>

            {/* Focused Controls for Selected Layer */}
            <div className="floating-admin-grid">
              {adminEditLayer === "background" && (
                <>
                  <label>X <input type="range" min={-100} max={100} step={0.1} value={heroLayout.x} onChange={e => { const next = {...heroLayout, x: Number(e.target.value)}; setHeroLayout(next); void persistHeroVisualPatch({heroLayout: next}); }} /> <span>{heroLayout.x.toFixed(1)}vw</span></label>
                  <label>Y <input type="range" min={-100} max={100} step={0.1} value={heroLayout.y} onChange={e => { const next = {...heroLayout, y: Number(e.target.value)}; setHeroLayout(next); void persistHeroVisualPatch({heroLayout: next}); }} /> <span>{heroLayout.y.toFixed(1)}vh</span></label>
                  <label>Width <input type="range" min={30} max={200} step={1} value={heroLayout.width} onChange={e => { const next = {...heroLayout, width: Number(e.target.value)}; setHeroLayout(next); void persistHeroVisualPatch({heroLayout: next}); }} /> <span>{heroLayout.width.toFixed(0)}vw</span></label>
                  <label>Background Height <input type="range" min={30} max={500} step={1} value={heroLayout.height} onChange={e => { const next = {...heroLayout, height: Number(e.target.value)}; setHeroLayout(next); void persistHeroVisualPatch({heroLayout: next}); }} /> <span>{heroLayout.height.toFixed(0)}vh</span></label>
                  <label>Total Section Height <input type="range" min={50} max={500} step={1} value={heroSectionHeight} onChange={e => { const next = Number(e.target.value); setHeroSectionHeight(next); void persistHeroVisualPatch({heroSectionHeight: next}); }} /> <span>{heroSectionHeight}vh</span></label>
                  <label>Gradient Angle <input type="range" min={0} max={360} step={1} value={bgAngle} onChange={e => { const next = Number(e.target.value); setBgAngle(next); void persistHeroVisualPatch({bgAngle: next}); }} /> <span>{bgAngle.toFixed(0)}deg</span></label>
                  <label>
                    Background Colors
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      {bgColors.map((color, index) => (
                        <input
                          key={index}
                          type="color"
                          value={color}
                          onChange={(event) => {
                            const next = [...bgColors];
                            next[index] = event.target.value;
                            setBgColors(next);
                            void persistHeroVisualPatch({ bgColors: next });
                          }}
                          style={{ width: "40px", height: "40px", border: "1px solid #ddd", borderRadius: "4px", padding: 0, cursor: "pointer" }}
                        />
                      ))}
                    </div>
                  </label>
                </>
              )}
              {adminEditLayer === "primary" && (
                <>
                  <label>X <input type="range" min={-100} max={100} step={0.1} value={heroMediaLayout.x} onChange={e => setHeroMediaLayoutAndSave({...heroMediaLayout, x: Number(e.target.value)})} /> <span>{heroMediaLayout.x.toFixed(1)}%</span></label>
                  <label>Y <input type="range" min={-100} max={100} step={0.1} value={heroMediaLayout.y} onChange={e => setHeroMediaLayoutAndSave({...heroMediaLayout, y: Number(e.target.value)})} /> <span>{heroMediaLayout.y.toFixed(1)}%</span></label>
                  <label>Width <input type="range" min={5} max={200} step={1} value={heroMediaLayout.width} onChange={e => setHeroMediaLayoutAndSave({...heroMediaLayout, width: Number(e.target.value)})} /> <span>{heroMediaLayout.width.toFixed(0)}%</span></label>
                  <label>Height <input type="range" min={5} max={200} step={1} value={heroMediaLayout.height} onChange={e => setHeroMediaLayoutAndSave({...heroMediaLayout, height: Number(e.target.value)})} /> <span>{heroMediaLayout.height.toFixed(0)}%</span></label>
                  <label>Scale <input type="range" min={0.1} max={3} step={0.01} value={heroPrimarySettings.scale} onChange={e => setPrimarySettingsAndSave({...heroPrimarySettings, scale: Number(e.target.value)})} /> <span>{heroPrimarySettings.scale.toFixed(2)}x</span></label>
                  <label className="floating-admin-select-group">
                    Fit
                    <select
                      value={heroPrimarySettings.fit}
                      onChange={e => setPrimarySettingsAndSave({...heroPrimarySettings, fit: e.target.value as any})}
                    >
                      <option value="cover">Cover</option>
                      <option value="contain">Contain</option>
                    </select>
                  </label>
                </>
              )}
              {adminEditLayer === "overlay" && (
                <>
                  <label>X <input type="range" min={-100} max={100} step={0.1} value={heroOverlayLayer.layout.x} onChange={e => setOverlayLayerAndSave({...heroOverlayLayer, layout: {...heroOverlayLayer.layout, x: Number(e.target.value)}})} /> <span>{heroOverlayLayer.layout.x.toFixed(1)}%</span></label>
                  <label>Y <input type="range" min={-100} max={100} step={0.1} value={heroOverlayLayer.layout.y} onChange={e => setOverlayLayerAndSave({...heroOverlayLayer, layout: {...heroOverlayLayer.layout, y: Number(e.target.value)}})} /> <span>{heroOverlayLayer.layout.y.toFixed(1)}%</span></label>
                  <label>Width <input type="range" min={5} max={200} step={1} value={heroOverlayLayer.layout.width} onChange={e => setOverlayLayerAndSave({...heroOverlayLayer, layout: {...heroOverlayLayer.layout, width: Number(e.target.value)}})} /> <span>{heroOverlayLayer.layout.width.toFixed(0)}%</span></label>
                  <label>Height <input type="range" min={5} max={200} step={1} value={heroOverlayLayer.layout.height} onChange={e => setOverlayLayerAndSave({...heroOverlayLayer, layout: {...heroOverlayLayer.layout, height: Number(e.target.value)}})} /> <span>{heroOverlayLayer.layout.height.toFixed(0)}%</span></label>
                  <label>Scale <input type="range" min={0.1} max={3} step={0.01} value={heroOverlayLayer.scale} onChange={e => setOverlayLayerAndSave({...heroOverlayLayer, scale: Number(e.target.value)})} /> <span>{heroOverlayLayer.scale.toFixed(2)}x</span></label>
                  <label>
                    Visible
                    <input type="checkbox" checked={heroOverlayLayer.visible} onChange={e => setOverlayLayerAndSave({...heroOverlayLayer, visible: e.target.checked})} />
                  </label>
                </>
              )}
              {adminEditLayer === "headline" && (
                <>
                  <label>X <input type="range" min={-1000} max={1000} step={1} value={headlinePos.x} onChange={e => { const next = {...headlinePos, x: Number(e.target.value)}; setHeadlinePos(next); void persistHeroVisualPatch({headlinePos: next}); }} /> <span>{headlinePos.x}px</span></label>
                  <label>Y <input type="range" min={-1000} max={1000} step={1} value={headlinePos.y} onChange={e => { const next = {...headlinePos, y: Number(e.target.value)}; setHeadlinePos(next); void persistHeroVisualPatch({headlinePos: next}); }} /> <span>{headlinePos.y}px</span></label>
                  <label>Scale (Size) <input type="range" min={2.2} max={7} step={0.05} value={headlineSizeRem} onChange={e => { const next = Number(e.target.value); setHeadlineSizeRem(next); void persistHeroVisualPatch({headlineSizeRem: next}); }} /> <span>{headlineSizeRem.toFixed(2)}rem</span></label>
                  <label>Text Width <input type="range" min={24} max={92} step={1} value={heroCopyWidthVw} onChange={e => { const next = Number(e.target.value); setHeroCopyWidthVw(next); void persistHeroVisualPatch({heroCopyWidthVw: next}); }} /> <span>{heroCopyWidthVw}vw</span></label>
                </>
              )}
              {adminEditLayer === "eyebrow" && (
                <>
                  <label>X <input type="range" min={-1000} max={1000} step={1} value={eyebrowPos.x} onChange={e => { 
                    const nextX = Number(e.target.value);
                    const nextRatio = { ...eyebrowPosRatio, x: nextX / (heroCopySize.width || 1) };
                    setEyebrowPosRatio(nextRatio); 
                    void persistHeroVisualPatch({eyebrowPosRatio: nextRatio}); 
                  }} /> <span>{Math.round(eyebrowPos.x)}px</span></label>
                  <label>Y <input type="range" min={-1000} max={1000} step={1} value={eyebrowPos.y} onChange={e => { 
                    const nextY = Number(e.target.value);
                    const nextRatio = { ...eyebrowPosRatio, y: nextY / (heroCopySize.height || 1) };
                    setEyebrowPosRatio(nextRatio); 
                    void persistHeroVisualPatch({eyebrowPosRatio: nextRatio}); 
                  }} /> <span>{Math.round(eyebrowPos.y)}px</span></label>
                </>
              )}
              {adminEditLayer === "actions" && (
                <>
                  <label>X <input type="range" min={-1000} max={1000} step={1} value={heroActionsPos.x} onChange={e => { const next = {...heroActionsPos, x: Number(e.target.value)}; setHeroActionsPos(next); void persistHeroVisualPatch({heroActionsPos: next}); }} /> <span>{heroActionsPos.x}px</span></label>
                  <label>Y <input type="range" min={-1000} max={1000} step={1} value={heroActionsPos.y} onChange={e => { const next = {...heroActionsPos, y: Number(e.target.value)}; setHeroActionsPos(next); void persistHeroVisualPatch({heroActionsPos: next}); }} /> <span>{heroActionsPos.y}px</span></label>
                </>
              )}
              {adminEditLayer === "rituals" && (
                <>
                  <label>X <input type="range" min={-1000} max={1000} step={1} value={ritualCarouselPos.x} onChange={e => { const next = {...ritualCarouselPos, x: Number(e.target.value)}; setRitualCarouselPos(next); void persistHeroVisualPatch({ritualCarouselPos: next}); }} /> <span>{ritualCarouselPos.x}px</span></label>
                  <label>Y <input type="range" min={-1000} max={1000} step={1} value={ritualCarouselPos.y} onChange={e => { const next = {...ritualCarouselPos, y: Number(e.target.value)}; setRitualCarouselPos(next); void persistHeroVisualPatch({ritualCarouselPos: next}); }} /> <span>{ritualCarouselPos.y}px</span></label>
                </>
              )}
            </div>

              </>
            ) : null}
            <a href="/admin" className="floating-admin-link">
              Open Admin Page
            </a>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                const reset = { x: 0, y: 0 };
                setFloatingPanelPos(reset);
                window.localStorage.setItem("maroma-floating-admin-pos", JSON.stringify(reset));
              }}
            >
              Reset panel position
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                const reset = { x: 0, y: 0 };
                setRitualCarouselPos(reset);
                window.dispatchEvent(new Event("maroma-ritual-pos-reset"));
                void persistHeroVisualPatch({ ritualCarouselPos: reset });
              }}

            >
              Reset carousel position
            </button>
          </>
        )}
      </div>
    </div>
  );
}
