import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import {
  parseHeroVisualState,
  readHeroVisualState,
  type HeroVisualState
} from "../../../lib/hero-media-layout-state";

const storageDir = path.join(process.cwd(), "data");
const storagePath = path.join(storageDir, "hero-media-layout.json");

export async function GET() {
  const state = await readHeroVisualState();
  return NextResponse.json({ ...state, layout: state.layout });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const current = await readHeroVisualState();
    const next = parseHeroVisualState(body, current);
    
    await fs.mkdir(storageDir, { recursive: true });
    await fs.writeFile(storagePath, JSON.stringify(next, null, 2), "utf8");
    return NextResponse.json({ ...next, layout: next.layout });
  } catch {
    return NextResponse.json(
      { error: "Unable to save hero media layout." },
      { status: 500 }
    );
  }
}

