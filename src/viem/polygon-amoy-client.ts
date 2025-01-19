import { createPublicClient, http, fallback } from "viem";
import { polygonAmoy } from "viem/chains";

export const client = createPublicClient({
  transport: fallback([
    ...JSON.parse(process.env.NEXT_PUBLIC_POLYGON_AMOY_RPCS_JSON ?? "[]").map(
      (rpc) => http(rpc, { batch: true }),
    ),
  ]),
  chain: polygonAmoy,
});
