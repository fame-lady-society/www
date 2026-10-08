import "server-only";
import { activityResponse } from "./handler";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return activityResponse(request, {
    baseUrl: process.env.FAME_POOL_API_URL,
    token: process.env.FAME_POOL_STATE_SERVICE_TOKEN,
  });
}
