import { NextRequest, NextResponse } from "next/server";
import { completeOAuth } from "@/lib/meta";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(`${req.nextUrl.origin}/marketing?meta=erro`);

  try {
    await completeOAuth(code, req.nextUrl.origin);
    return NextResponse.redirect(`${req.nextUrl.origin}/marketing?meta=conectado`);
  } catch (e) {
    console.error("Meta OAuth callback error", e);
    return NextResponse.redirect(`${req.nextUrl.origin}/marketing?meta=erro`);
  }
}
