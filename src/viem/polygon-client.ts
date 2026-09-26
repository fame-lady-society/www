import { createPublicClient, http, fallback } from "viem";
import { polygon } from "viem/chains";
import { rpcUrls } from "./rpcUrls";

function transport() {
  return fallback(
    rpcUrls(polygon).map((url) =>
      http(url, {
        batch: true,
        fetchOptions: { next: { revalidate: 60 } },
      }),
    ),
  );
}

export const client = createPublicClient({
  chain: polygon,
  transport: transport(),
});
