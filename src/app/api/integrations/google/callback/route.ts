import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient, storeTokens } from "@/lib/google";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(`${req.nextUrl.origin}/agenda?google=erro`);

  const redirectUri = `${req.nextUrl.origin}/api/integrations/google/callback`;
  const client = getOAuthClient(redirectUri);
  const { tokens } = await client.getToken(code);
  await storeTokens(tokens);

  return NextResponse.redirect(`${req.nextUrl.origin}/agenda?google=conectado`);
}
