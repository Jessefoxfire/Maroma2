#!/usr/bin/env node
/**
 * Resolves product images from www.maroma.com (WooCommerce Store API), downloads
 * files under public/staging-media/wp-content/uploads/... (same paths as live),
 * and updates data/maroma-products.json.
 *
 * Resolution order per product:
 *   1) GET .../products?sku={sku}
 *   2) GET .../products?search={keywords from name}
 *      → pick exact SKU match, else closest name match, else first result
 *
 * Usage:
 *   node scripts/sync-product-images-from-maroma-store.mjs
 *   node scripts/sync-product-images-from-maroma-store.mjs --all
 *   node scripts/sync-product-images-from-maroma-store.mjs --dry-run
 *   node scripts/sync-product-images-from-maroma-store.mjs --limit=30
 */

import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { pipeline } from "stream/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PRODUCTS_PATH = join(ROOT, "data", "maroma-products.json");
const BACKUP_PATH = join(ROOT, "data", "maroma-products.pre-store-sync.json");
const PUBLIC = join(ROOT, "public");
const STORE_BASE = "https://www.maroma.com/wp-json/wc/store/v1/products";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const allSkus = args.has("--all");
const limitArg = [...args].find((a) => a.startsWith("--limit="));
const limit = limitArg ? Math.max(1, Number(limitArg.split("=")[1]) || 0) : 0;

function decodeHtml(text) {
  if (!text) {
    return "";
  }
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#0*39;/g, "'")
    .replace(/&#39;/g, "'");
}

function needsRefresh(product) {
  const u = (product.imageUrl || "").trim();
  const empty = !u && (!product.images || product.images.length === 0);
  if (empty) {
    return true;
  }
  if (u.includes("2013/04/large.jpg")) {
    return true;
  }
  if (u.toLowerCase().includes("woocommerce-placeholder")) {
    return true;
  }
  return false;
}

function searchQueryFromName(name) {
  const raw = decodeHtml(name).toLowerCase();
  const stop = new Set([
    "the",
    "a",
    "an",
    "for",
    "and",
    "or",
    "with",
    "ml",
    "gms",
    "gm",
    "g",
    "natural",
    "maromas",
    "maroma"
  ]);
  const words = raw
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !stop.has(w));
  return words.slice(0, 5).join(" ");
}

function pickBestStoreMatch(product, results) {
  if (!results?.length) {
    return null;
  }
  const sku = (product.sku || "").trim();
  if (sku) {
    const bySku = results.find((r) => (r.sku || "").trim() === sku);
    if (bySku) {
      return bySku;
    }
  }
  const want = decodeHtml(product.name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const prefix = want.slice(0, 18);
  const byName = results.find((r) => (r.name || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").includes(prefix));
  if (byName) {
    return byName;
  }
  return results[0];
}

function toLocalPathFromSrc(src) {
  const url = new URL(src);
  const pathname = url.pathname;
  if (!pathname.startsWith("/wp-content/uploads/")) {
    return null;
  }
  const relativeFromStaging = pathname.slice(1);
  const diskPath = join(PUBLIC, "staging-media", relativeFromStaging);
  const publicUrl = `/staging-media/${relativeFromStaging}`;
  return { diskPath, publicUrl };
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "MaromaStagingImageSync/1.0"
    }
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${url}`);
  }
  return res.json();
}

async function downloadFile(url, destPath) {
  if (dryRun) {
    return;
  }
  mkdirSync(dirname(destPath), { recursive: true });
  const res = await fetch(url, {
    headers: {
      "User-Agent": "MaromaStagingImageSync/1.0"
    }
  });
  if (!res.ok || !res.body) {
    throw new Error(`Download failed ${res.status} ${url}`);
  }
  const tmp = `${destPath}.part`;
  await pipeline(res.body, createWriteStream(tmp));
  renameSync(tmp, destPath);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function resolveStoreProduct(product) {
  const sku = (product.sku || "").trim();
  if (sku) {
    await sleep(140);
    const bySku = await fetchJson(`${STORE_BASE}?sku=${encodeURIComponent(sku)}`);
    if (Array.isArray(bySku) && bySku[0]) {
      return bySku[0];
    }
  }
  const q = searchQueryFromName(product.name || "");
  if (!q) {
    return null;
  }
  await sleep(160);
  const bySearch = await fetchJson(
    `${STORE_BASE}?search=${encodeURIComponent(q)}&per_page=20`
  );
  if (!Array.isArray(bySearch) || !bySearch.length) {
    return null;
  }
  return pickBestStoreMatch(product, bySearch);
}

async function main() {
  const raw = readFileSync(PRODUCTS_PATH, "utf8");
  /** @type {any[]} */
  const products = JSON.parse(raw);

  if (!dryRun && !existsSync(BACKUP_PATH)) {
    writeFileSync(BACKUP_PATH, raw, "utf8");
    console.log("Wrote backup:", BACKUP_PATH);
  }

  let updated = 0;
  let skipped = 0;
  let failed = 0;
  let processed = 0;

  for (const product of products) {
    if (limit && processed >= limit) {
      break;
    }
    if (!allSkus && !needsRefresh(product)) {
      skipped++;
      continue;
    }

    processed++;
    try {
      const item = await resolveStoreProduct(product);
      if (!item) {
        console.warn(`No store match (${product.sku || "no-sku"}) ${decodeHtml(product.name || "").slice(0, 52)}`);
        failed++;
        continue;
      }
      const imgs = Array.isArray(item.images) ? item.images : [];
      const srcs = imgs.map((i) => i?.src).filter(Boolean);
      if (srcs.length === 0) {
        failed++;
        continue;
      }

      const mapped = [];
      for (const src of srcs) {
        const m = toLocalPathFromSrc(src);
        if (!m) {
          continue;
        }
        if (!dryRun) {
          await downloadFile(src, m.diskPath);
        }
        mapped.push(m.publicUrl);
      }

      if (mapped.length === 0) {
        failed++;
        continue;
      }

      if (!dryRun) {
        product.imageUrl = mapped[0];
        product.images = [...mapped];
        updated++;
        if (updated % 15 === 0) {
          console.log(`Progress: updated ${updated} …`);
        }
      } else {
        console.log(`[dry-run] ${product.sku} -> ${mapped[0]} (${item.slug})`);
        updated++;
      }
    } catch (e) {
      console.error(`Row ${product.sku}:`, e.message || e);
      failed++;
    }
  }

  if (!dryRun && updated > 0) {
    writeFileSync(PRODUCTS_PATH, `${JSON.stringify(products, null, 2)}\n`, "utf8");
    console.log("Wrote", PRODUCTS_PATH);
  }

  console.log(
    JSON.stringify(
      { updated, skipped, failed, processed, dryRun, allSkus, limit: limit || null },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
