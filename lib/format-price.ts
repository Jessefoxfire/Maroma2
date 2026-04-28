/** Parse catalog price strings (digits, optional commas) to a non-negative number, or null. */
export function parseInrPriceNumber(priceRaw: string): number | null {
  const cleaned = priceRaw.replace(/,/g, "").trim();
  if (!cleaned) {
    return null;
  }
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num < 0) {
    return null;
  }
  return num;
}

/** Format catalog price strings (often digits only) as Indian Rupees. */
export function formatInrPrice(priceRaw: string): string | null {
  const num = parseInrPriceNumber(priceRaw);
  if (num === null) {
    return null;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}
