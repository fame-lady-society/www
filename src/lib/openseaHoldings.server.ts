import {
  holdingsChains,
  type Holding,
  type HoldingsPage,
} from "./openseaHoldings";

export class HoldingsError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function fetchHoldingsPage(
  walletAddress: string,
  query: URLSearchParams,
): Promise<HoldingsPage> {
  if (!/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
    throw new HoldingsError("Enter a valid 0x EVM wallet address.", 400);
  }
  const chain = query.get("chain") ?? holdingsChains[0];
  const index = holdingsChains.findIndex((value) => value === chain);
  const cursor = query.get("next");
  if (index < 0 || (cursor && cursor.length > 4096)) {
    throw new HoldingsError("Invalid chain or pagination cursor.", 400);
  }
  const key = process.env.OPENSEA_API_KEY;
  if (!key)
    throw new HoldingsError(
      "OpenSea access is not configured on this server (OPENSEA_API_KEY).",
      503,
    );
  const params = new URLSearchParams({
    limit: "200",
    include_auto_hidden: "true",
  });
  if (cursor) params.set("next", cursor);
  let response: Response;
  try {
    response = await fetch(
      `https://api.opensea.io/api/v2/chain/${chain}/account/${walletAddress}/nfts?${params}`,
      {
        headers: { accept: "application/json", "x-api-key": key },
        signal: AbortSignal.timeout(20000),
        next: { revalidate: 60 },
      },
    );
  } catch {
    throw new HoldingsError(
      `OpenSea could not be reached for ${chain}. Retry this page.`,
      502,
    );
  }
  if (!response.ok) {
    throw new HoldingsError(
      `OpenSea returned ${response.status} for ${chain}. Retry this page.`,
      response.status === 429 ? 429 : 502,
    );
  }
  const data = await response.json();
  if (
    !Array.isArray(data.nfts) ||
    (data.next != null && typeof data.next !== "string") ||
    !data.nfts.every(
      (nft: Holding) =>
        nft &&
        typeof nft.contract === "string" &&
        typeof nft.identifier === "string",
    )
  ) {
    throw new HoldingsError(
      "OpenSea returned an invalid holdings response.",
      502,
    );
  }
  if (cursor && data.next === cursor)
    throw new HoldingsError(
      "OpenSea repeated its pagination cursor. Retry later.",
      502,
    );
  let next: string | null = null;
  const nextChain = data.next ? chain : holdingsChains[index + 1];
  if (nextChain) {
    const nextQuery = new URLSearchParams({ chain: nextChain });
    if (data.next) nextQuery.set("next", data.next);
    next = `/opensea/address/${walletAddress}/export?${nextQuery}`;
  }
  return {
    walletAddress,
    chain,
    chains: holdingsChains,
    nfts: data.nfts.map((nft: Holding) => ({ ...nft, chain })),
    next,
    complete: next === null,
  };
}
