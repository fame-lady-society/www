import { stringify } from "csv-stringify/sync";

// EVM chains from OpenSea's get_nfts_by_account schema. Solana uses a different address format.
export const holdingsChains = [
  "ethereum",
  "base",
  "polygon",
  "arbitrum",
  "optimism",
  "blast",
  "zora",
  "sei",
  "avalanche",
  "ape_chain",
  "flow",
  "b3",
  "soneium",
  "ronin",
  "bera_chain",
  "shape",
  "unichain",
  "gunzilla",
  "abstract",
  "animechain",
  "hyperevm",
  "somnia",
  "monad",
  "hyperliquid",
  "megaeth",
  "ink",
  "robinhood",
  "stablechain",
] as const;

export type Holding = {
  chain: string;
  contract: string;
  identifier: string;
  collection: string;
  token_standard: string;
  name?: string;
  [key: string]: unknown;
};

export type HoldingsPage = {
  walletAddress: string;
  chain: string;
  chains: readonly string[];
  nfts: Holding[];
  next: string | null;
  complete: boolean;
};

export function holdingsCsv(nfts: Holding[]) {
  return stringify(nfts, {
    header: true,
    columns: [
      "chain",
      "contract",
      "identifier",
      "collection",
      "name",
      "token_standard",
      "opensea_url",
      "metadata_url",
      "image_url",
    ],
    escape_formulas: true,
  });
}
