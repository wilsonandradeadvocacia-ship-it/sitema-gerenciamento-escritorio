import { NextResponse } from "next/server";
import { GOOGLE_CONFIGURED, isGoogleConnected } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ configured: GOOGLE_CONFIGURED, connected: await isGoogleConnected() });
}
