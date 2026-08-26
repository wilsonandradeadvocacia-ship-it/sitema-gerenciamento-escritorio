import { NextRequest, NextResponse } from "next/server";
import { buildAuthUrl, META_CONFIGURED } from "@/lib/meta";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!META_CONFIGURED) {
    return NextResponse.json(
      { error: "Configure META_APP_ID e META_APP_SECRET no .env para habilitar a integração com Facebook/Instagram." },
      { status: 400 }
    );
  }
  return NextResponse.redirect(buildAuthUrl(req.nextUrl.origin));
}
