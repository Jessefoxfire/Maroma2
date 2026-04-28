"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { defaultWideBannerLayout } from "../../lib/category-banner-defaults";
import type { ResolvedCategoryBanner } from "../../lib/category-banner-types";

const ADMIN_STORAGE_KEY = "maroma-admin-drag";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function parseObjectPosition(value: string): { x: number; y: number } {
  const trimmed = value.trim();
  const match = trimmed.match(/([\d.]+)%\s+([\d.]+)%/);
  if (match) {
    return {
      x: clamp(parseFloat(match[1]), 0, 100),
      y: clamp(parseFloat(match[2]), 0, 100)
    };
  }
  return { x: 82, y: 38 };
}

const minHeightPresets: { label: string; value: string }[] = [
  { label: "Compact", value: "clamp(180px, 26vw, 300px)" },
  { label: "Default", value: defaultWideBannerLayout.minHeight },
  { label: "Tall", value: "clamp(280px, 40vw, 480px)" }
];

const maxHeightPresets: { label: string; value: string }[] = [
  { label: "Shallow", value: "min(36vh, 360px)" },
  { label: "Default", value: defaultWideBannerLayout.maxHeight },
  { label: "Deep", value: "min(58vh, 520px)" }
];

export type CategoryHeroWithAdminProps = {
  slug: string;
  categoryLabel: string;
  productCount: number;
  wideCover: boolean;
  splitThumb: boolean;
  resolved: ResolvedCategoryBanner;
  /** When true, tagline uses italic “hero” styling (matches catalog `heroTagline` categories). */
  italicTagline?: boolean;
};

export function CategoryHeroWithAdmin({
  slug,
  categoryLabel,
  productCount,
  wideCover,
  splitThumb,
  resolved,
  italicTagline = false
}: CategoryHeroWithAdminProps) {
  const router = useRouter();
  const [admin, setAdmin] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState(resolved.imageUrl);
  const [heroTitle, setHeroTitle] = useState(resolved.heroTitle);
  const [heroTagline, setHeroTagline] = useState(resolved.heroTagline);
  const [objectPosition, setObjectPosition] = useState(resolved.objectPosition);
  const [minHeight, setMinHeight] = useState(resolved.minHeight);
  const [maxHeight, setMaxHeight] = useState(resolved.maxHeight);
  const [thumbMaxWidth, setThumbMaxWidth] = useState(resolved.thumbMaxWidth);
  const [posX, setPosX] = useState(() => parseObjectPosition(resolved.objectPosition).x);
  const [posY, setPosY] = useState(() => parseObjectPosition(resolved.objectPosition).y);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const readAdmin = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    setAdmin(window.localStorage.getItem(ADMIN_STORAGE_KEY) === "true");
  }, []);

  useEffect(() => {
    readAdmin();
    window.addEventListener("storage", readAdmin);
    window.addEventListener("focus", readAdmin);
    window.addEventListener("maroma-admin-changed", readAdmin);
    return () => {
      window.removeEventListener("storage", readAdmin);
      window.removeEventListener("focus", readAdmin);
      window.removeEventListener("maroma-admin-changed", readAdmin);
    };
  }, [readAdmin]);

  useEffect(() => {
    setImageUrl(resolved.imageUrl);
    setHeroTitle(resolved.heroTitle);
    setHeroTagline(resolved.heroTagline);
    setObjectPosition(resolved.objectPosition);
    setMinHeight(resolved.minHeight);
    setMaxHeight(resolved.maxHeight);
    setThumbMaxWidth(resolved.thumbMaxWidth);
    const p = parseObjectPosition(resolved.objectPosition);
    setPosX(p.x);
    setPosY(p.y);
  }, [resolved]);

  useEffect(() => {
    setObjectPosition(`${Math.round(posX)}% ${Math.round(posY)}%`);
  }, [posX, posY]);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const showEditor = admin && Boolean(imageUrl);
  const heroMods = `${wideCover ? "category-hero--wide" : ""} ${splitThumb ? "category-hero--split" : ""}`.trim();

  const heroCopy = useMemo(
    () => (
      <>
        <Link href="/" className={`category-back ${wideCover ? "category-back--on-photo" : ""}`}>
          Back to Home
        </Link>
        <span className={`eyebrow ${wideCover ? "eyebrow--on-photo" : ""}`}>Maroma Collection</span>
        <h1>{heroTitle}</h1>
        <p className={wideCover || italicTagline ? "category-hero-tagline" : undefined}>{heroTagline}</p>
      </>
    ),
    [heroTagline, heroTitle, italicTagline, wideCover]
  );

  const savePatch = async (patch: Record<string, string | number>) => {
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/category-banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, patch })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Save failed");
      }
      setStatus("Saved.");
      router.refresh();
    } catch (error) {
      setStatus((error as Error).message ?? "Save failed.");
    } finally {
      setBusy(false);
      window.setTimeout(() => setStatus(""), 3200);
    }
  };

  const onUpload = async (file: File | null) => {
    if (!file) {
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const formData = new FormData();
      formData.set("slug", slug);
      formData.set("image", file);
      const response = await fetch("/api/category-banners/upload", {
        method: "POST",
        body: formData
      });
      const data = (await response.json()) as { imageUrl?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Upload failed");
      }
      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
      }
      setStatus("Image uploaded.");
      router.refresh();
    } catch (error) {
      setStatus((error as Error).message ?? "Upload failed.");
    } finally {
      setBusy(false);
      window.setTimeout(() => setStatus(""), 3200);
    }
  };

  const resetOverrides = async () => {
    if (!window.confirm("Reset this category banner to catalog defaults?")) {
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/category-banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, reset: true })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Reset failed");
      }
      setStatus("Reset to defaults.");
      setDrawerOpen(false);
      router.refresh();
    } catch (error) {
      setStatus((error as Error).message ?? "Reset failed.");
    } finally {
      setBusy(false);
      window.setTimeout(() => setStatus(""), 3200);
    }
  };

  const openDrawer = () => {
    readAdmin();
    if (window.localStorage.getItem(ADMIN_STORAGE_KEY) !== "true") {
      window.alert(
        'Turn on admin mode from the homepage using the floating "Admin" control, then return here.'
      );
      return;
    }
    setDrawerOpen(true);
  };

  if (!imageUrl) {
    return (
      <header className={`category-hero ${heroMods}`}>
        <div className="category-hero-copy">{heroCopy}</div>
      </header>
    );
  }

  return (
    <>
      <header className={`category-hero ${heroMods}`}>
        {wideCover ? (
          <div
            className="category-hero-wide-media category-banner-admin-target"
            style={{ minHeight, maxHeight }}
          >
            {showEditor ? (
              <button
                type="button"
                className="category-banner-edit-trigger"
                onClick={openDrawer}
                aria-expanded={drawerOpen}
              >
                Edit banner
              </button>
            ) : null}
            <img
              className="category-hero-wide-img"
              src={imageUrl}
              alt="Category hero photograph"
              style={{ objectPosition }}
            />
            <div className="category-hero-wide-scrim" aria-hidden />
            <div className="category-hero-copy category-hero-copy--overlay">{heroCopy}</div>
          </div>
        ) : (
          <>
            <div className="category-hero-copy">{heroCopy}</div>
            <div className={`category-hero-banner ${showEditor ? "category-banner-admin-target" : ""}`}>
              {showEditor ? (
                <button
                  type="button"
                  className="category-banner-edit-trigger category-banner-edit-trigger--thumb"
                  onClick={openDrawer}
                  aria-expanded={drawerOpen}
                >
                  Edit banner
                </button>
              ) : null}
              <img
                src={imageUrl}
                alt={`${categoryLabel} — Maroma Collection`}
                style={splitThumb ? { maxWidth: thumbMaxWidth } : undefined}
              />
            </div>
          </>
        )}
      </header>

      {drawerOpen && showEditor ? (
        <div className="category-banner-drawer-root" role="presentation">
          <button
            type="button"
            className="category-banner-drawer-backdrop"
            aria-label="Close banner editor"
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            className="category-banner-drawer"
            role="dialog"
            aria-label="Category banner editor"
            aria-modal="true"
          >
            <div className="category-banner-drawer-head">
              <h2 className="category-banner-drawer-title">Banner · {categoryLabel}</h2>
              <button type="button" className="category-banner-drawer-close" onClick={() => setDrawerOpen(false)}>
                Close
              </button>
            </div>

            <div className="category-banner-drawer-body">
              <label className="category-banner-field">
                <span>Hero image</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={busy}
                  onChange={(event) => void onUpload(event.target.files?.[0] ?? null)}
                />
              </label>

              <label className="category-banner-field">
                <span>Headline</span>
                <input value={heroTitle} onChange={(event) => setHeroTitle(event.target.value)} disabled={busy} />
              </label>

              <label className="category-banner-field">
                <span>Tagline</span>
                <textarea
                  value={heroTagline}
                  onChange={(event) => setHeroTagline(event.target.value)}
                  disabled={busy}
                  rows={3}
                />
              </label>

              {wideCover ? (
                <>
                  <div className="category-banner-field">
                    <span>Focal point (crop)</span>
                    <div className="category-banner-slider-row">
                      <label>
                        Horizontal
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={posX}
                          onChange={(event) => setPosX(Number(event.target.value))}
                          disabled={busy}
                        />
                      </label>
                      <label>
                        Vertical
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={posY}
                          onChange={(event) => setPosY(Number(event.target.value))}
                          disabled={busy}
                        />
                      </label>
                    </div>
                    <code className="category-banner-code">{objectPosition}</code>
                  </div>

                  <label className="category-banner-field">
                    <span>Min height</span>
                    <select
                      value={minHeightPresets.some((preset) => preset.value === minHeight) ? minHeight : "__custom__"}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (value !== "__custom__") {
                          setMinHeight(value);
                        }
                      }}
                      disabled={busy}
                    >
                      {minHeightPresets.map((preset) => (
                        <option key={preset.label} value={preset.value}>
                          {preset.label}
                        </option>
                      ))}
                      <option value="__custom__">Custom (use field below)</option>
                    </select>
                    <input
                      className="category-banner-custom-css"
                      value={minHeight}
                      onChange={(event) => setMinHeight(event.target.value)}
                      disabled={busy}
                      placeholder="CSS min-height"
                    />
                  </label>

                  <label className="category-banner-field">
                    <span>Max height</span>
                    <select
                      value={maxHeightPresets.some((preset) => preset.value === maxHeight) ? maxHeight : "__custom__"}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (value !== "__custom__") {
                          setMaxHeight(value);
                        }
                      }}
                      disabled={busy}
                    >
                      {maxHeightPresets.map((preset) => (
                        <option key={preset.label} value={preset.value}>
                          {preset.label}
                        </option>
                      ))}
                      <option value="__custom__">Custom</option>
                    </select>
                    <input
                      className="category-banner-custom-css"
                      value={maxHeight}
                      onChange={(event) => setMaxHeight(event.target.value)}
                      disabled={busy}
                      placeholder="CSS max-height"
                    />
                  </label>
                </>
              ) : null}

              {splitThumb ? (
                <label className="category-banner-field">
                  <span>Thumbnail width ({thumbMaxWidth}px)</span>
                  <input
                    type="range"
                    min={120}
                    max={480}
                    value={thumbMaxWidth}
                    onChange={(event) => setThumbMaxWidth(Number(event.target.value))}
                    disabled={busy}
                  />
                </label>
              ) : null}

              {status ? <p className="category-banner-status">{status}</p> : null}

              <div className="category-banner-actions">
                <button
                  type="button"
                  className="category-banner-btn primary"
                  disabled={busy}
                  onClick={() =>
                    void savePatch({
                      heroTitle,
                      heroTagline,
                      ...(wideCover
                        ? { objectPosition, minHeight, maxHeight }
                        : { thumbMaxWidth })
                    })
                  }
                >
                  {busy ? "Saving…" : "Save text & layout"}
                </button>
                <button type="button" className="category-banner-btn" disabled={busy} onClick={() => void resetOverrides()}>
                  Reset all overrides
                </button>
              </div>
              <p className="category-banner-hint">
                Admin mode uses the same toggle as the homepage (`{ADMIN_STORAGE_KEY}` in local storage). API routes
                are open on this staging build—do not expose publicly without authentication.
              </p>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
