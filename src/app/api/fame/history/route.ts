import "server-only";
import { historyResponse } from "./handler";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return historyResponse(request, {
    baseUrl: process.env.FAME_POOL_API_URL,
    token: process.env.FAME_POOL_STATE_SERVICE_TOKEN,
  });
}
