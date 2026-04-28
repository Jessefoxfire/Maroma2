import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { mergeWithDefaults, parseSiteContent } from "../../../lib/site-content-api";

const storageDir = path.join(process.cwd(), "data");
const storagePath = path.join(storageDir, "site-content.json");

export async function GET() {
  try {
    const raw = await fs.readFile(storagePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    const content = parseSiteContent(parsed);
    if (!content) {
      return NextResponse.json({ content: null });
    }
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ content: null });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const next = mergeWithDefaults(record.content ?? body);
    await fs.mkdir(storageDir, { recursive: true });
    await fs.writeFile(storagePath, JSON.stringify(next, null, 2), "utf8");
    return NextResponse.json({ content: next });
  } catch {
    return NextResponse.json({ error: "Unable to save site content." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await fs.unlink(storagePath);
    return NextResponse.json({ content: null });
  } catch {
    return NextResponse.json({ content: null });
  }
}
