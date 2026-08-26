import { NextResponse } from "next/server";
import { META_CONFIGURED, getStoredMetaTokens } from "@/lib/meta";

export const dynamic = "force-dynamic";

export async function GET() {
  const tokens = await getStoredMetaTokens();
  return NextResponse.json({
    configured: META_CONFIGURED,
    connected: !!tokens,
    pageName: tokens?.pageName ?? null,
    hasInstagram: !!tokens?.igBusinessId,
    hasAdAccount: !!tokens?.adAccountId,
  });
}
