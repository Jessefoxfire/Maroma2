import { promises as fs } from "fs";
import path from "path";
import type { SiteContent } from "../app/content";
import { mergeWithDefaults } from "./site-content-api";

const storagePath = path.join(process.cwd(), "data", "site-content.json");

export async function readSiteContentFromDisk(): Promise<SiteContent> {
  try {
    const raw = await fs.readFile(storagePath, "utf8");
    return mergeWithDefaults(JSON.parse(raw) as unknown);
  } catch {
    return mergeWithDefaults(null);
  }
}
