import { createPublicClient, http, fallback } from "viem";
import { polygonAmoy } from "viem/chains";
import { rpcUrls } from "./rpcUrls";

function transport() {
  return fallback(
    rpcUrls(polygonAmoy).map((url) =>
      http(url, {
        batch: true,
        fetchOptions: { next: { revalidate: 60 } },
      }),
    ),
  );
}

export const client = createPublicClient({
  chain: polygonAmoy,
  transport: transport(),
});
