import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import {
  parseHeroVisualState,
  readHeroVisualState,
  type HeroVisualState
} from "../../../lib/hero-media-layout-state";

const storageDir = path.join(process.cwd(), "data");
const storagePath = path.join(storageDir, "hero-media-layout.json");
const heroLayoutKvKey = "maroma:hero-media-layout";

const hasKvConfig = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

const readPersistedHeroVisualState = async (): Promise<HeroVisualState> => {
  if (hasKvConfig) {
    try {
      const stored = await kv.get<HeroVisualState>(heroLayoutKvKey);
      if (stored && typeof stored === "object") {
        return parseHeroVisualState(stored);
      }
    } catch {
      // Fall back to file-based state when KV is unavailable.
    }
  }
  return readHeroVisualState();
};

const writePersistedHeroVisualState = async (next: HeroVisualState): Promise<void> => {
  if (hasKvConfig) {
    try {
      await kv.set(heroLayoutKvKey, next);
      return;
    } catch {
      // Fall back to file-based state when KV write fails.
    }
  }
  await fs.mkdir(storageDir, { recursive: true });
  await fs.writeFile(storagePath, JSON.stringify(next, null, 2), "utf8");
};

export async function GET() {
  const state = await readPersistedHeroVisualState();
  return NextResponse.json({ ...state, layout: state.layout });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const current = await readPersistedHeroVisualState();
    const next = parseHeroVisualState(body, current);

    await writePersistedHeroVisualState(next);
    return NextResponse.json({ ...next, layout: next.layout });
  } catch {
    return NextResponse.json(
      { error: "Unable to save hero media layout." },
      { status: 500 }
    );
  }
}

