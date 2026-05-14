import { writeFile } from "node:fs/promises";
import { createPublicClient, http, type Address } from "viem";
import { base } from "viem/chains";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../src/features/fame-swap/artifacts/manifest";
import { getFameSwapConfig } from "../src/features/fame-swap/config";
import type { FameAsyncQuoteAdapter } from "../src/features/fame-swap/solver/quotes/adapters";
import {
  createLiveLiquidityQuoteAdapter,
  type FameLiveQuoteClient,
} from "../src/features/fame-swap/solver/quotes/liveAdapters";
import type {
  FamePoolStateSnapshotFile,
  FameSnapshotQuoteEntry,
  FameSnapshotReserveState,
} from "../src/features/fame-swap/solver/quotes/snapshotAdapter";
import {
  FAME_ROUTE_CORPUS,
  type FameRouteCorpusCase,
} from "../src/features/fame-swap/solver/routeCorpus";
import { quoteFameSwapAsync } from "../src/features/fame-swap/solver/quote";
import { DEFAULT_FAME_SWAP_SLIPPAGE_BPS } from "../src/features/fame-swap/solver/slippage";
import { famePoolUniverse } from "../src/features/fame-swap/solver/poolUniverse";
import { FAME, USDC, tokenForAddress } from "../src/features/fame-swap/tokens";

const SNAPSHOT_PATH =
  "src/features/fame-swap/artifacts/base-v1-pool-state-snapshot.json";
const ROUTER_ADDRESS =
  "0x0000000000000000000000000000000000000009" as const satisfies Address;
const RECIPIENT =
  "0x0000000000000000000000000000000000000abc" as const satisfies Address;

const getReservesAbi = [
  {
    type: "function",
    name: "getReserves",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "reserve0", type: "uint112" },
      { name: "reserve1", type: "uint112" },
      { name: "blockTimestampLast", type: "uint32" },
    ],
  },
] as const;

interface SnapshotReserveClient {
  readContract: (request: {
    address: Address;
    abi: typeof getReservesAbi;
    functionName: "getReserves";
    blockNumber: bigint;
  }) => Promise<unknown>;
}

const EXTRA_SNAPSHOT_CASES: readonly FameRouteCorpusCase[] = [
  {
    id: "usdc-fame-five-dollars-live-snapshot",
    tokenIn: USDC,
    tokenOut: FAME,
    amountIn: 5_000_000n,
    expectedStatus: "ready",
    note: "$5 USDC buy regression that must not be rejected by synthetic caps.",
  },
];

function token(address: Address) {
  const result = tokenForAddress(address);
  if (!result) throw new Error(`Unsupported snapshot token ${address}.`);
  return result;
}

function quoteEntryKey(entry: FameSnapshotQuoteEntry): string {
  return [
    entry.poolId,
    entry.tokenIn.toLowerCase(),
    entry.tokenOut.toLowerCase(),
    entry.amountIn,
  ].join(":");
}

function recordingAdapter(
  adapter: FameAsyncQuoteAdapter,
  entries: Map<string, FameSnapshotQuoteEntry>,
): FameAsyncQuoteAdapter {
  return {
    quoteContext: adapter.quoteContext,
    async quoteEdge(request) {
      const quote = await adapter.quoteEdge(request);
      if (quote.status === "quoted") {
        const entry: FameSnapshotQuoteEntry = {
          poolId: request.edge.poolId,
          tokenIn: request.edge.tokenIn,
          tokenOut: request.edge.tokenOut,
          amountIn: request.amountIn.toString(),
          amountOut: quote.amountOut.toString(),
          evidence: quote.evidence,
          priceImpact: quote.priceImpact
            ? {
                preSwapPriceX18: quote.priceImpact.preSwapPriceX18.toString(),
                postSwapPriceX18:
                  quote.priceImpact.postSwapPriceX18?.toString() ?? null,
                executionPriceX18:
                  quote.priceImpact.executionPriceX18.toString(),
                marketImpactBps: quote.priceImpact.marketImpactBps,
                method: quote.priceImpact.method,
              }
            : undefined,
        };
        entries.set(quoteEntryKey(entry), entry);
      }
      return quote;
    },
  };
}

async function readReserveStates(
  client: SnapshotReserveClient,
  blockNumber: bigint,
): Promise<FameSnapshotReserveState[]> {
  const states: FameSnapshotReserveState[] = [];

  for (const pool of famePoolUniverse().pools) {
    const reserveReplaySupported =
      pool.venue === "uniswap-v2" ||
      (pool.venue === "solidly" && pool.stable === false);
    if (!reserveReplaySupported) continue;
    const raw = await client.readContract({
      address: pool.pool,
      abi: getReservesAbi,
      functionName: "getReserves",
      blockNumber,
    });
    if (!Array.isArray(raw) || raw.length < 2) continue;
    const [reserve0, reserve1] = raw;
    if (typeof reserve0 !== "bigint" || typeof reserve1 !== "bigint") continue;

    states.push({
      poolId: pool.id,
      pool: pool.pool,
      token0: pool.token0,
      token1: pool.token1,
      reserve0: reserve0.toString(),
      reserve1: reserve1.toString(),
      source: "getReserves",
    });
  }

  return states.sort((left, right) => left.poolId.localeCompare(right.poolId));
}

export async function buildFamePoolStateSnapshot(): Promise<FamePoolStateSnapshotFile> {
  const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL_1 ?? process.env.BASE_RPC_URL;
  if (!rpcUrl) {
    throw new Error("Base RPC is not configured for snapshot generation.");
  }

  const client = createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  });
  const liveClient: FameLiveQuoteClient = {
    getBlockNumber: () => client.getBlockNumber(),
    readContract: (request) =>
      client.readContract(
        request as Parameters<typeof client.readContract>[0],
      ) as Promise<unknown>,
  };
  const liveAdapter = await createLiveLiquidityQuoteAdapter({
    client: liveClient,
    chainId: base.id,
  });
  if (!liveAdapter.quoteContext || liveAdapter.quoteContext.source !== "live") {
    throw new Error("Live quote adapter did not capture a Base block context.");
  }

  const quoteEntries = new Map<string, FameSnapshotQuoteEntry>();
  const adapter = recordingAdapter(liveAdapter, quoteEntries);
  const config = getFameSwapConfig();
  const routerAddress = config.routerAddress ?? ROUTER_ADDRESS;
  const cases = [...FAME_ROUTE_CORPUS, ...EXTRA_SNAPSHOT_CASES];

  for (const entry of cases) {
    await quoteFameSwapAsync({
      tokenIn: token(entry.tokenIn),
      tokenOut: token(entry.tokenOut),
      amountIn: entry.amountIn,
      recipient: RECIPIENT,
      config: {
        ...config,
        routerAddress,
        defaultSlippageBps:
          config.defaultSlippageBps ?? DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
      },
      readiness: {
        status: "ready",
        routerAddress,
        feePpm: 2_222n,
      },
      now: new Date("2026-05-13T00:00:00Z"),
      adapter,
    });
  }

  return {
    schemaVersion: FAME_SWAP_ARTIFACT_MANIFEST.schemaVersion,
    status: "generated-live-liquidity-snapshot",
    snapshotId: `base-v1-live-${liveAdapter.quoteContext.blockNumber.toString()}`,
    pinnedBaseBlock: FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock,
    capturedBaseBlock: Number(liveAdapter.quoteContext.blockNumber),
    generatedAt: new Date().toISOString(),
    source: "scripts/fame-swap-pool-snapshot.ts live Base read-only quote capture",
    reserveStates: await readReserveStates(
      client,
      liveAdapter.quoteContext.blockNumber,
    ),
    quoteTable: [...quoteEntries.values()].sort((left, right) =>
      quoteEntryKey(left).localeCompare(quoteEntryKey(right)),
    ),
    unsupportedQuotePools: [
      {
        poolId: "aerodrome-slipstream2",
        reason: "No validated live Slipstream2 quoter is configured.",
      },
    ],
  };
}

function shouldRunCli(): boolean {
  return process.argv[1]?.endsWith("fame-swap-pool-snapshot.ts") ?? false;
}

if (shouldRunCli()) {
  buildFamePoolStateSnapshot()
    .then(async (snapshot) => {
      const payload = `${JSON.stringify(snapshot, null, 2)}\n`;
      if (process.argv.includes("--stdout")) {
        console.log(payload);
        return;
      }
      await writeFile(SNAPSHOT_PATH, payload, "utf8");
      console.log(
        JSON.stringify(
          {
            path: SNAPSHOT_PATH,
            snapshotId: snapshot.snapshotId,
            capturedBaseBlock: snapshot.capturedBaseBlock,
            quoteEntries: snapshot.quoteTable.length,
            reserveStates: snapshot.reserveStates.length,
          },
          null,
          2,
        ),
      );
    })
    .catch((error) => {
      const message =
        error instanceof Error ? error.message : "Unknown snapshot error.";
      console.error(`FAME pool snapshot failed: ${message.split(/\r?\n/)[0]}`);
      process.exit(1);
    });
}
