export const FAME_LANDING_SNAPSHOT_SCHEMA_VERSION =
  "fame-landing-defi-snapshot-v1" as const;
export const FAME_LANDING_SNAPSHOT_MAX_AGE_SECONDS = 300;
export const FAME_LANDING_SNAPSHOT_FUTURE_TOLERANCE_SECONDS = 30;
export const FAME_LANDING_CONSUMER_REVALIDATE_SECONDS = 30;
// Bound the one-shot server fetch so a non-settling Society Bots request fails closed.
export const FAME_LANDING_SNAPSHOT_REQUEST_TIMEOUT_MS = 10_000;

const FAME_LANDING_SOURCE_REGISTRY_ID =
  "pool-state-registry-v4:0x582b48fdaeb3c88bfc40415ba5a86d1cfd1bd4fe208fa6533f3681c02700f1c7:0x44cd1807a871080e02630714058ccd2545746712c9b382ffe4411223feeaf218:0x4212d61e225b7504c307c9ea60783147d485ea16e59bd8e0254257b5e6d59842";
const FAME_LANDING_ROUTE_AUTHORITY_REVISION =
  "fame-landing-route-authority-v1:0x44cd1807a871080e02630714058ccd2545746712c9b382ffe4411223feeaf218:0xe12b694540180d42f640c9b660379eab7e38caef92f24e22c629f6b6da4c427e";

export const FAME_LANDING_COUNTER_ASSETS = [
  {
    address: "0x15e012abf9d32cd67fc6cf480ea0e318e9ed5926",
    symbol: "basedflick",
    decimals: 18,
  },
  {
    address: "0x4200000000000000000000000000000000000006",
    symbol: "WETH",
    decimals: 18,
  },
  {
    address: "0x54016a4848a38f257b6e96331f7404073fd9c32c",
    symbol: "SCALE",
    decimals: 18,
  },
  {
    address: "0xe5020a6d073a794b6e7f05678707de47986fb0b6",
    symbol: "frxUSD",
    decimals: 18,
  },
] as const;

const QUOTE_FIELDS = [
  "defiBuyUsdc",
  "defiBuyEth",
  "defiSellUsdc",
  "defiSellEth",
  "nftBuyUsdc",
  "nftBuyEth",
] as const;

export type FameLandingQuoteField = (typeof QUOTE_FIELDS)[number];
export type FameLandingUnavailableReason =
  | "captured-state-missing"
  | "deadline-exceeded"
  | "dependency-unavailable"
  | "invalid-marketplace-state"
  | "invalid-pool-state"
  | "no-safe-route"
  | "runtime-quote-mismatch"
  | "solver-limit-reached";

const UNAVAILABLE_REASONS = new Set<FameLandingUnavailableReason>([
  "captured-state-missing",
  "deadline-exceeded",
  "dependency-unavailable",
  "invalid-marketplace-state",
  "invalid-pool-state",
  "no-safe-route",
  "runtime-quote-mismatch",
  "solver-limit-reached",
]);

const QUOTE_AUTHORITY = {
  defiBuyUsdc: {
    definitionId: "defi-buy-usdc-v1",
    routeIds: [
      "solver-single_path-aerodrome-v2-usdc-weth--scale-equalizer-weth-fame",
    ],
  },
  defiBuyEth: {
    definitionId: "defi-buy-eth-v1",
    routeIds: [
      "defi-buy-eth-scale",
      "defi-buy-eth-uniswap-v2",
      "defi-buy-eth-split-25-75",
      "defi-buy-eth-split-50-50",
      "defi-buy-eth-split-75-25",
    ],
  },
  defiSellUsdc: {
    definitionId: "defi-sell-usdc-v1",
    routeIds: [
      "solver-single_path-scale-equalizer-weth-fame--aerodrome-v2-usdc-weth",
    ],
  },
  defiSellEth: {
    definitionId: "defi-sell-eth-v1",
    routeIds: [
      "defi-sell-eth-scale",
      "defi-sell-eth-uniswap-v2",
      "defi-sell-eth-split-25-75",
      "defi-sell-eth-split-50-50",
      "defi-sell-eth-split-75-25",
    ],
  },
  nftBuyUsdc: {
    definitionId: "nft-buy-usdc-v1",
    routeIds: [
      "solver-single_path-aerodrome-v2-usdc-weth--scale-equalizer-weth-fame",
    ],
  },
  nftBuyEth: {
    definitionId: "nft-buy-eth-v1",
    routeIds: [
      "nft-buy-eth-scale",
      "nft-buy-eth-uniswap-v2",
      "nft-buy-eth-split-25-75",
      "nft-buy-eth-split-50-50",
      "nft-buy-eth-split-75-25",
    ],
  },
} as const satisfies Record<
  FameLandingQuoteField,
  { definitionId: string; routeIds: readonly string[] }
>;

export type FameLandingFieldState<T> =
  | { status: "available"; value: T }
  | { status: "unavailable"; reason: FameLandingUnavailableReason };

export type FameLandingMarketplaceValue = {
  unit: string;
  premium: string;
  totalSupply: string;
  decimals: number;
};

export type FameLandingQuoteValue = {
  amount: string;
  quoteDefinitionId: (typeof QUOTE_AUTHORITY)[FameLandingQuoteField]["definitionId"];
  routeId: string;
};

export type FameLandingLiquidityValue = {
  fameAmount: string;
  counterAssets: Array<{
    address: string;
    amount: string;
    decimals: number;
    symbol: string;
  }>;
};

export type FameLandingSnapshot = {
  schemaVersion: typeof FAME_LANDING_SNAPSHOT_SCHEMA_VERSION;
  provenance: {
    chainId: 8453;
    safeBlockNumber: number;
    safeBlockHash: string;
    capturedAt: string;
    sourceRegistryId: typeof FAME_LANDING_SOURCE_REGISTRY_ID;
    routeAuthorityRevision: typeof FAME_LANDING_ROUTE_AUTHORITY_REVISION;
    snapshotId: string;
  };
  fields: {
    marketplace: FameLandingFieldState<FameLandingMarketplaceValue>;
    quotes: Record<
      FameLandingQuoteField,
      FameLandingFieldState<FameLandingQuoteValue>
    >;
    liquidity: FameLandingFieldState<FameLandingLiquidityValue>;
  };
};

export type FameLandingSnapshotResult =
  | { status: "available"; snapshot: FameLandingSnapshot }
  | { status: "unavailable" };

type SnapshotRequestInit = RequestInit & {
  next?: { revalidate: number };
};

export type FameLandingSnapshotFetcher = (
  url: string,
  init: SnapshotRequestInit,
) => Promise<Response>;

function invalid(path: string): never {
  throw new Error(`FAME landing snapshot is invalid at ${path}.`);
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    invalid(path);
  }
  return value as Record<string, unknown>;
}

function exactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  path: string,
): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (
    actual.length !== wanted.length ||
    actual.some((key, index) => key !== wanted[index])
  ) {
    invalid(path);
  }
}

function nonEmptyString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.length === 0) invalid(path);
  return value;
}

function literal<const T extends string | number>(
  value: unknown,
  expected: T,
  path: string,
): T {
  if (value !== expected) invalid(path);
  return expected;
}

function integer(value: unknown, path: string, maximum?: number): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    (maximum !== undefined && value > maximum)
  ) {
    invalid(path);
  }
  return value;
}

function decimal(value: unknown, path: string): string {
  const parsed = nonEmptyString(value, path);
  if (!/^(0|[1-9][0-9]*)$/u.test(parsed)) invalid(path);
  return parsed;
}

function address(value: unknown, path: string): string {
  const parsed = nonEmptyString(value, path);
  if (!/^0x[0-9a-fA-F]{40}$/u.test(parsed)) invalid(path);
  return parsed;
}

function bytes32(value: unknown, path: string): string {
  const parsed = nonEmptyString(value, path);
  if (!/^0x[0-9a-fA-F]{64}$/u.test(parsed)) invalid(path);
  return parsed;
}

function array(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) invalid(path);
  return value;
}

function unavailableReason(
  value: unknown,
  path: string,
): FameLandingUnavailableReason {
  const parsed = nonEmptyString(value, path) as FameLandingUnavailableReason;
  if (!UNAVAILABLE_REASONS.has(parsed)) invalid(path);
  return parsed;
}

function fieldState<T>(
  value: unknown,
  path: string,
  parseValue: (value: unknown, path: string) => T,
): FameLandingFieldState<T> {
  const state = record(value, path);
  if (state.status === "unavailable") {
    exactKeys(state, ["status", "reason"], path);
    return {
      status: "unavailable",
      reason: unavailableReason(state.reason, `${path}.reason`),
    };
  }
  literal(state.status, "available", `${path}.status`);
  exactKeys(state, ["status", "value"], path);
  return {
    status: "available",
    value: parseValue(state.value, `${path}.value`),
  };
}

function marketplaceValue(
  value: unknown,
  path: string,
): FameLandingMarketplaceValue {
  const market = record(value, path);
  exactKeys(market, ["unit", "premium", "totalSupply", "decimals"], path);
  return {
    unit: decimal(market.unit, `${path}.unit`),
    premium: decimal(market.premium, `${path}.premium`),
    totalSupply: decimal(market.totalSupply, `${path}.totalSupply`),
    decimals: integer(market.decimals, `${path}.decimals`, 255),
  };
}

function quoteState(
  value: unknown,
  field: FameLandingQuoteField,
): FameLandingFieldState<FameLandingQuoteValue> {
  const path = `$.fields.quotes.${field}`;
  const authority = QUOTE_AUTHORITY[field];
  const parsed = fieldState(value, path, (rawValue, valuePath) => {
    const quote = record(rawValue, valuePath);
    exactKeys(quote, ["amount", "quoteDefinitionId", "routeId"], valuePath);
    const routeId = nonEmptyString(quote.routeId, `${valuePath}.routeId`);
    if (!authority.routeIds.some((allowed) => allowed === routeId)) {
      invalid(`${valuePath}.routeId`);
    }
    return {
      amount: decimal(quote.amount, `${valuePath}.amount`),
      quoteDefinitionId: literal(
        quote.quoteDefinitionId,
        authority.definitionId,
        `${valuePath}.quoteDefinitionId`,
      ),
      routeId,
    };
  });
  if (
    parsed.status === "unavailable" &&
    parsed.reason === "captured-state-missing"
  ) {
    invalid(`${path}.reason`);
  }
  return parsed;
}

function liquidityValue(
  value: unknown,
  path: string,
): FameLandingLiquidityValue {
  const liquidity = record(value, path);
  exactKeys(liquidity, ["fameAmount", "counterAssets"], path);
  const metadataByAddress = new Map(
    FAME_LANDING_COUNTER_ASSETS.map((asset) => [
      asset.address.toLowerCase(),
      asset,
    ]),
  );
  const counterAssets = array(
    liquidity.counterAssets,
    `${path}.counterAssets`,
  ).map((rawAsset, index) => {
    const assetPath = `${path}.counterAssets[${index.toString()}]`;
    const asset = record(rawAsset, assetPath);
    exactKeys(asset, ["address", "amount", "decimals", "symbol"], assetPath);
    const parsedAddress = address(asset.address, `${assetPath}.address`);
    const expected = metadataByAddress.get(parsedAddress.toLowerCase());
    if (!expected) invalid(`${assetPath}.address`);
    const decimals = integer(asset.decimals, `${assetPath}.decimals`, 255);
    const symbol = nonEmptyString(asset.symbol, `${assetPath}.symbol`);
    if (decimals !== expected.decimals || symbol !== expected.symbol) {
      invalid(assetPath);
    }
    return {
      address: parsedAddress,
      amount: decimal(asset.amount, `${assetPath}.amount`),
      decimals,
      symbol,
    };
  });
  const addresses = counterAssets.map(({ address }) => address.toLowerCase());
  if (
    counterAssets.length !== FAME_LANDING_COUNTER_ASSETS.length ||
    new Set(addresses).size !== counterAssets.length ||
    FAME_LANDING_COUNTER_ASSETS.some(
      ({ address }) => !addresses.includes(address.toLowerCase()),
    )
  ) {
    invalid(`${path}.counterAssets`);
  }
  return {
    fameAmount: decimal(liquidity.fameAmount, `${path}.fameAmount`),
    counterAssets,
  };
}

export function parseFameLandingSnapshot(
  value: unknown,
  now = Date.now(),
): FameLandingSnapshot {
  const snapshot = record(value, "$.");
  exactKeys(snapshot, ["schemaVersion", "provenance", "fields"], "$.");
  const schemaVersion = literal(
    snapshot.schemaVersion,
    FAME_LANDING_SNAPSHOT_SCHEMA_VERSION,
    "$.schemaVersion",
  );

  const provenance = record(snapshot.provenance, "$.provenance");
  exactKeys(
    provenance,
    [
      "chainId",
      "safeBlockNumber",
      "safeBlockHash",
      "capturedAt",
      "sourceRegistryId",
      "routeAuthorityRevision",
      "snapshotId",
    ],
    "$.provenance",
  );
  const chainId = literal(provenance.chainId, 8453, "$.provenance.chainId");
  const safeBlockNumber = integer(
    provenance.safeBlockNumber,
    "$.provenance.safeBlockNumber",
  );
  const safeBlockHash = bytes32(
    provenance.safeBlockHash,
    "$.provenance.safeBlockHash",
  );
  const capturedAt = nonEmptyString(
    provenance.capturedAt,
    "$.provenance.capturedAt",
  );
  const capturedAtMs = Date.parse(capturedAt);
  if (
    !Number.isFinite(now) ||
    !Number.isFinite(capturedAtMs) ||
    new Date(capturedAtMs).toISOString() !== capturedAt
  ) {
    invalid("$.provenance.capturedAt");
  }
  const ageMs = now - capturedAtMs;
  if (
    ageMs < -FAME_LANDING_SNAPSHOT_FUTURE_TOLERANCE_SECONDS * 1_000 ||
    ageMs >= FAME_LANDING_SNAPSHOT_MAX_AGE_SECONDS * 1_000
  ) {
    invalid("$.provenance.capturedAt");
  }
  const sourceRegistryId = literal(
    provenance.sourceRegistryId,
    FAME_LANDING_SOURCE_REGISTRY_ID,
    "$.provenance.sourceRegistryId",
  );
  const routeAuthorityRevision = literal(
    provenance.routeAuthorityRevision,
    FAME_LANDING_ROUTE_AUTHORITY_REVISION,
    "$.provenance.routeAuthorityRevision",
  );
  const expectedSnapshotId = `${schemaVersion}:${safeBlockNumber.toString()}:${safeBlockHash}:${capturedAt}`;
  const snapshotId = literal(
    provenance.snapshotId,
    expectedSnapshotId,
    "$.provenance.snapshotId",
  );

  const fields = record(snapshot.fields, "$.fields");
  exactKeys(fields, ["marketplace", "quotes", "liquidity"], "$.fields");
  const rawQuotes = record(fields.quotes, "$.fields.quotes");
  exactKeys(rawQuotes, QUOTE_FIELDS, "$.fields.quotes");
  const quotes = Object.fromEntries(
    QUOTE_FIELDS.map((field) => [field, quoteState(rawQuotes[field], field)]),
  ) as FameLandingSnapshot["fields"]["quotes"];

  return {
    schemaVersion,
    provenance: {
      chainId,
      safeBlockNumber,
      safeBlockHash,
      capturedAt,
      sourceRegistryId,
      routeAuthorityRevision,
      snapshotId,
    },
    fields: {
      marketplace: fieldState(
        fields.marketplace,
        "$.fields.marketplace",
        marketplaceValue,
      ),
      quotes,
      liquidity: fieldState(
        fields.liquidity,
        "$.fields.liquidity",
        liquidityValue,
      ),
    },
  };
}

function localEndpoint(url: URL): boolean {
  return (
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "::1"
  );
}

function fameLandingSnapshotEndpointUrl(rawBaseUrl: string): string {
  let url: URL;
  try {
    url = new URL(rawBaseUrl);
  } catch {
    throw new Error("FAME pool API base URL is invalid.");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      "FAME pool API base URL must not include credentials, query, or hash.",
    );
  }
  const basePath = url.pathname.replace(/\/+$/u, "");
  if (
    basePath.endsWith("/fame/pool-state") ||
    basePath.endsWith("/fame/pool-quotes") ||
    basePath.endsWith("/fame/landing-defi-snapshot")
  ) {
    throw new Error("FAME_POOL_API_URL must be a base URL.");
  }
  if (url.protocol !== "https:" && !localEndpoint(url)) {
    throw new Error("FAME pool API base URL must use HTTPS outside loopback.");
  }
  url.pathname = `${basePath}/fame/landing-defi-snapshot`;
  return url.toString();
}

export async function readFameLandingSnapshot({
  baseUrl = process.env.FAME_POOL_API_URL,
  fetcher = fetch,
  now,
}: {
  baseUrl?: string;
  fetcher?: FameLandingSnapshotFetcher;
  now?: number;
} = {}): Promise<FameLandingSnapshotResult> {
  if (!baseUrl) return { status: "unavailable" };
  try {
    const response = await fetcher(fameLandingSnapshotEndpointUrl(baseUrl), {
      method: "GET",
      next: { revalidate: FAME_LANDING_CONSUMER_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(FAME_LANDING_SNAPSHOT_REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return { status: "unavailable" };
    const snapshot = parseFameLandingSnapshot(
      (await response.json()) as unknown,
      now ?? Date.now(),
    );
    return { status: "available", snapshot };
  } catch {
    return { status: "unavailable" };
  }
}
