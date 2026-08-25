import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient, GOOGLE_CONFIGURED } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!GOOGLE_CONFIGURED) {
    return NextResponse.json(
      { error: "Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env para habilitar a integração com o Google Calendar." },
      { status: 400 }
    );
  }
  const redirectUri = `${req.nextUrl.origin}/api/integrations/google/callback`;
  const client = getOAuthClient(redirectUri);
  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
  });
  return NextResponse.redirect(url);
}
