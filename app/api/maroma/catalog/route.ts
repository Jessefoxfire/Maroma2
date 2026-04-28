import { NextResponse } from "next/server";
import {
  assertInboundReadonlyRequest,
  maromaReadonlyFetch
} from "../../../../lib/maroma-readonly";

export async function GET(request: Request) {
  try {
    assertInboundReadonlyRequest(request.method);
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    const response = await maromaReadonlyFetch(`/products?search=${encodeURIComponent(q)}`);
    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "application/json",
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Readonly proxy request failed."
      },
      { status: 400 }
    );
  }
}
