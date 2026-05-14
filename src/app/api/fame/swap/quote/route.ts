import { NextRequest } from "next/server";
import { handleFameSwapQuotePost } from "./handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  return handleFameSwapQuotePost(request);
}
