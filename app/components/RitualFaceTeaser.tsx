"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { decodeBasicHtmlEntities } from "../../lib/decode-html-entities";
import { selectFaceCareProducts } from "../../lib/face-products";
import {
  parseRitualTeaserPos,
  RITUAL_TEASER_POS_STORAGE_KEY,
  type RitualTeaserPos
} from "../../lib/ritual-teaser-pos";
import { getDisplayImageUrl, hasDisplayImage } from "../../lib/product-image";
import type { ProductRecord } from "../../lib/product-types";

type Props = {
  products: ProductRecord[];
  position?: { x: number; y: number };
  onPositionChange?: (next: { x: number; y: number }) => void;
};


const isDragExempt = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) {
    return false;
  }
  return Boolean(target.closest("a, button, input, select, textarea, label"));
};

const clampOnce = (panel: HTMLElement, pos: RitualTeaserPos): RitualTeaserPos => {
  if (typeof window === "undefined") {
    return pos;
  }
  const strip = panel.querySelector(".ritual-face-triple-stage");
  const boundsEl = strip instanceof HTMLElement ? strip : panel;
  const pr = boundsEl.getBoundingClientRect();
  const m = 0;
  const nav = document.querySelector(".nav");
  const navBottom =
    nav instanceof HTMLElement ? Math.max(nav.getBoundingClientRect().bottom, 0) : 0;
  const topMin = navBottom > 0 ? navBottom + 8 : m;
  let { x, y } = pos;
  if (pr.left < m) {
    x += m - pr.left;
  }
  if (pr.right > window.innerWidth - m) {
    x += window.innerWidth - m - pr.right;
  }
  if (pr.top < topMin) {
    y += topMin - pr.top;
  }
  if (pr.bottom > window.innerHeight - m) {
    y += window.innerHeight - m - pr.bottom;
  }
  return { x, y };
};

export function RitualFaceTeaser({ products, position, onPositionChange }: Props) {

  const visibleTiles = 6;
  const rotationMs = 3800;
  const scrollMs = 1800;
  const pool = useMemo(() => {
    const face = selectFaceCareProducts(products);
    if (face.length >= 3) {
      return face;
    }
    const merged: ProductRecord[] = [...face];
    for (const p of products) {
      if (merged.length >= 18) {
        break;
      }
      if (!hasDisplayImage(p) || merged.some((x) => x.id === p.id)) {
        continue;
      }
      merged.push(p);
    }
    return merged;
  }, [products]);

  const [start, setStart] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [pos, setPos] = useState<RitualTeaserPos>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem(RITUAL_TEASER_POS_STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch {}
    }
    return position ?? { x: 0, y: 0 };
  });

  const [focusMap, setFocusMap] = useState<Record<string, number>>({});
  const panelRef = useRef<HTMLDivElement | null>(null);
  const posRef = useRef<RitualTeaserPos>({ x: 0, y: 0 });
  const dragStart = useRef<{ clientX: number; clientY: number } | null>(null);
  const posAtDrag = useRef<RitualTeaserPos>({ x: 0, y: 0 });
  const resetSlideTimer = useRef<number | null>(null);

  useEffect(() => {
    posRef.current = pos;
    // Persist to localStorage on every change
    try {
      window.localStorage.setItem(RITUAL_TEASER_POS_STORAGE_KEY, JSON.stringify(pos));
    } catch {}
  }, [pos]);

  useEffect(() => {
    if (position) {
      posRef.current = position;
      setPos(position);
    }
  }, [position]);


  const persistPos = useCallback((next: RitualTeaserPos) => {
    onPositionChange?.({ x: Math.round(next.x), y: Math.round(next.y) });
  }, [onPositionChange]);


  const runClampChain = useCallback(() => {
    const resolve = (iter: number) => {
      const el = panelRef.current;
      if (!el || iter > 14) {
        persistPos(posRef.current);
        return;
      }
      const cur = posRef.current;
      const next = clampOnce(el, cur);
      const delta = Math.hypot(next.x - cur.x, next.y - cur.y);
      if (delta < 0.25) {
        persistPos(cur);
        return;
      }
      posRef.current = next;
      setPos(next);
      requestAnimationFrame(() => resolve(iter + 1));
    };
    requestAnimationFrame(() => resolve(0));
  }, [persistPos]);

  // Remove mount-time clamping to prevent scroll jumps

  useEffect(() => {
    const onReset = () => {
      const reset = { x: 0, y: 0 };
      posRef.current = reset;
      setPos(reset);
      requestAnimationFrame(() => runClampChain());
    };
    window.addEventListener("maroma-ritual-pos-reset", onReset);
    return () => {
      window.removeEventListener("maroma-ritual-pos-reset", onReset);
    };
  }, [runClampChain]);



  useEffect(() => {
    const onResize = () => {
      runClampChain();
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [runClampChain]);

  useEffect(() => {
    if (pool.length === 0) {
      return undefined;
    }
    const id = window.setInterval(() => {
      setIsSliding(true);
      if (resetSlideTimer.current !== null) {
        window.clearTimeout(resetSlideTimer.current);
      }
      resetSlideTimer.current = window.setTimeout(() => {
        setStart((s) => (s - 1 + pool.length) % pool.length);
        setIsSliding(false);
        resetSlideTimer.current = null;
      }, scrollMs);
    }, rotationMs);
    return () => {
      window.clearInterval(id);
      if (resetSlideTimer.current !== null) {
        window.clearTimeout(resetSlideTimer.current);
      }
    };
  }, [pool.length, rotationMs, scrollMs]);

  const buildStrip = useCallback(
    (offset: number | null): ProductRecord[] => {
      if (offset === null || pool.length === 0) {
        return [];
      }
      return Array.from({ length: visibleTiles + 1 }, (_, i) => {
        const idx = (offset - 1 + i + pool.length) % pool.length;
        return pool[idx];
      });
    },
    [pool, visibleTiles]
  );

  const strip = useMemo(() => {
    return buildStrip(start);
  }, [buildStrip, start]);

  const renderStrip = (items: ProductRecord[], keyPrefix: string) => {
    if (pool.length === 0) {
      return null;
    }
    return items.map((product, index) => {
      const src = getDisplayImageUrl(product);
      if (!src) {
        return null;
      }
      return (
        <Link
          key={`${keyPrefix}-${index}-${product.id}`}
          href={`/product/${product.id}`}
          className="ritual-face-frame"
        >
          <img
            src={src}
            alt={decodeBasicHtmlEntities(product.name)}
            loading="lazy"
            onLoad={(event) => {
              const img = event.currentTarget;
              const key = img.currentSrc || img.src;
              if (!key || focusMap[key] !== undefined || img.naturalWidth <= 0 || img.naturalHeight <= 0) {
                return;
              }
              try {
                const targetMax = 260;
                const scale = Math.min(1, targetMax / Math.max(img.naturalWidth, img.naturalHeight));
                const w = Math.max(16, Math.round(img.naturalWidth * scale));
                const h = Math.max(16, Math.round(img.naturalHeight * scale));
                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                  return;
                }
                ctx.drawImage(img, 0, 0, w, h);
                const pixels = ctx.getImageData(0, 0, w, h).data;
                // Estimate image background from border pixels, then find "non-background" rows.
                let sumR = 0;
                let sumG = 0;
                let sumB = 0;
                let samples = 0;
                const samplePixel = (x: number, y: number) => {
                  const i = (y * w + x) * 4;
                  sumR += pixels[i];
                  sumG += pixels[i + 1];
                  sumB += pixels[i + 2];
                  samples += 1;
                };
                for (let x = 0; x < w; x++) {
                  samplePixel(x, 0);
                  samplePixel(x, h - 1);
                }
                for (let y = 1; y < h - 1; y++) {
                  samplePixel(0, y);
                  samplePixel(w - 1, y);
                }
                const bgR = sumR / Math.max(samples, 1);
                const bgG = sumG / Math.max(samples, 1);
                const bgB = sumB / Math.max(samples, 1);
                const threshold = 22;
                const rowHasContent = (row: number): boolean => {
                  const base = row * w * 4;
                  for (let x = 0; x < w; x++) {
                    const i = base + x * 4;
                    const a = pixels[i + 3];
                    if (a < 12) {
                      continue;
                    }
                    const dr = Math.abs(pixels[i] - bgR);
                    const dg = Math.abs(pixels[i + 1] - bgG);
                    const db = Math.abs(pixels[i + 2] - bgB);
                    if (dr + dg + db > threshold) {
                      return true;
                    }
                  }
                  return false;
                };
                let top = -1;
                let bottom = -1;
                for (let y = 0; y < h; y++) {
                  if (rowHasContent(y)) {
                    top = y;
                    break;
                  }
                }
                for (let y = h - 1; y >= 0; y--) {
                  if (rowHasContent(y)) {
                    bottom = y;
                    break;
                  }
                }
                if (top < 0 || bottom < 0 || bottom <= top) {
                  setFocusMap((prev) => ({ ...prev, [key]: 50 }));
                  return;
                }
                const centerPct = ((top + bottom) * 0.5 * 100) / Math.max(h - 1, 1);
                const clamped = Math.max(36, Math.min(64, centerPct));
                setFocusMap((prev) => ({ ...prev, [key]: clamped }));
              } catch {
                setFocusMap((prev) => ({ ...prev, [key]: 50 }));
              }
            }}
            style={{ objectPosition: `50% ${focusMap[src] ?? 50}%` }}
          />
        </Link>
      );
    });
  };

  const handlePanelPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // Ignore if clicking inside the track itself or on any interactive element (Link/button)
    // to allow scrolling without moving the base panel.
    const target = event.target as HTMLElement;
    if (target.closest(".ritual-face-track") || target.closest("a") || target.closest("button")) {
      return;
    }
    
    event.preventDefault();
    event.stopPropagation();
    dragStart.current = { clientX: event.clientX, clientY: event.clientY };
    posAtDrag.current = { ...posRef.current };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePanelPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) {
      return;
    }
    const dx = event.clientX - dragStart.current.clientX;
    const dy = event.clientY - dragStart.current.clientY;
    const next = {
      x: posAtDrag.current.x + dx,
      y: posAtDrag.current.y + dy
    };
    posRef.current = next;
    setPos(next);
  };

  const handlePanelPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) {
      return;
    }
    dragStart.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
    runClampChain();
  };

  return (
    <div
      ref={panelRef}
      className="hero-ritual-panel"
      role="group"
      aria-label="Face care — drag from the grip or empty space to move"
      style={{
        transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px - 5vh))`
      }}
      onPointerDown={handlePanelPointerDown}
      onPointerMove={handlePanelPointerMove}
      onPointerUp={handlePanelPointerUp}
      onPointerCancel={handlePanelPointerUp}
    >
      <div className="ritual-face-teaser">
        <div className="hero-ritual-drag-handle" aria-hidden="true">
          <span className="hero-ritual-drag-grip" />
        </div>
        <div className="ritual-face-teaser-inner">
          {strip.length > 0 ? (
            <div
              className="carousel-fade-wrapper ritual-face-triple-stage"
              style={{ "--ritual-visible-tiles": String(visibleTiles) } as CSSProperties}
              aria-live="polite"
            >
              {/* Permanent carousel edge fade — do not remove. */}
              <div className="carousel-edge-fade carousel-edge-fade-left" />
              <div className="carousel-edge-fade carousel-edge-fade-right" />
              <div className={`ritual-face-track${isSliding ? " is-sliding" : ""}`}>
                {renderStrip(strip, `strip-${start}`)}
              </div>
            </div>
          ) : (
            <p className="ritual-face-empty">Face care products will appear here when the catalog loads.</p>
          )}
        </div>
      </div>
    </div>
  );
}
