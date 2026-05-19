import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import {
  FAME_SWAP_PREVIEW_RECIPIENT,
  quoteFameSwap,
} from "../../../../../features/fame-swap/solver/quote";
import { createDeterministicQuoteAdapter } from "../../../../../features/fame-swap/solver/quotes/deterministicAdapter";
import { createSnapshotQuoteAdapter } from "../../../../../features/fame-swap/solver/quotes/snapshotAdapter";
import { FAME, USDC, WETH } from "../../../../../features/fame-swap/tokens";
import { publicFeeBreakdown } from "../../../../../features/fame-swap/solver/quoteWire";
import { famePoolStateRegistrySourceId } from "../../../../../features/fame-swap/solver/poolStateRegistry";
import { handleFameSwapQuotePost } from "./handler";
import { POST } from "./route";

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/fame/swap/quote", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function parseWarnEvent(value: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function assertWarnLog(): {
  raw: string[];
  events: Record<string, unknown>[];
  restore(): void;
} {
  const originalWarn = console.warn;
  const raw: string[] = [];
  const events: Record<string, unknown>[] = [];
  console.warn = (...values: unknown[]) => {
    const line = values.map((value) => String(value)).join(" ");
    raw.push(line);
    const event = parseWarnEvent(line);
    if (event) events.push(event);
  };
  return {
    raw,
    events,
    restore() {
      console.warn = originalWarn;
    },
  };
}

describe("/api/fame/swap/quote", () => {
  it("strips route-lab-only protocol evidence from public fee breakdowns", () => {
    const feeBreakdown = publicFeeBreakdown({
      routerFeePpm: 2_222n,
      routerFeeAmount: 10n,
      venueFeesIncluded: true,
      legs: [
        {
          poolId: "uniswap-v4-zora-eth",
          tokenIn: USDC,
          tokenOut: FAME,
          venue: "UniswapV4",
          amountIn: 1_000_000n,
          amountOut: 2_000_000n,
          minAmountOut: 1_900_000n,
          fee: {
            status: "available",
            feeBps: 30,
            label: "0.30%",
            source: "pool-metadata",
          },
          feeAmount: null,
          feeIncludedInQuote: true,
          evidence: "live Uniswap V4 quoter",
          protocolEvidence: {
            quote: {
              status: "available",
              source: "quoter",
              value: "2000000",
            },
            prePrice: {
              status: "available",
              source: "StateView.getSlot0",
              value: "1",
            },
            postPrice: {
              status: "unavailable",
              source: "quoter",
              reason: "not returned",
            },
            marketImpact: {
              status: "available",
              source: "price impact",
              value: "1",
            },
            activeLiquidity: {
              status: "available",
              source: "StateView.getLiquidity",
              value: "123",
            },
          },
        },
      ],
      marketImpact: {
        routeExecutionPriceX18: 2n,
        maxLegMarketImpactBps: 1,
        computableLegs: 1,
      },
    });

    const [leg] = feeBreakdown.legs;
    assert.ok(leg);
    assert.equal("protocolEvidence" in leg, false);
    assert.doesNotMatch(
      JSON.stringify(feeBreakdown, (_key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
      /activeLiquidity/,
    );
  });

  it("serializes a deterministic ready executable quote through the shared wire contract", async () => {
    const fixedNow = new Date("2026-05-14T00:00:00Z");
    let capturedDeadlineSeconds: bigint | undefined;
    let capturedSlippageBps: number | undefined;
    let capturedOptimizerTimeoutMs: number | undefined;

    const response = await handleFameSwapQuotePost(
      request({
        tokenIn: USDC,
        tokenOut: FAME,
        amountIn: "1000000",
        recipient: "0x0000000000000000000000000000000000000abc",
        slippageBps: 321,
        deadlineMinutes: 7,
      }),
      {
        readinessForQuote: async (routerAddress) => ({
          status: "ready",
          routerAddress: routerAddress!,
          feePpm: 2_222n,
        }),
        quoteForRequest: (quoteRequest) => {
          capturedDeadlineSeconds = quoteRequest.deadlineSeconds;
          capturedSlippageBps = quoteRequest.config.defaultSlippageBps;
          capturedOptimizerTimeoutMs = quoteRequest.optimizerBudgets?.timeoutMs;
          const quote = quoteFameSwap({
            ...quoteRequest,
            now: fixedNow,
            adapter: createDeterministicQuoteAdapter(),
          });
          assert.equal(quote.status, "ready");
          return quote;
        },
      },
    );
    const json = await response.json();
    const expectedDeadline = Math.floor(fixedNow.getTime() / 1000) + 7 * 60;

    assert.equal(response.status, 200);
    assert.equal(capturedDeadlineSeconds, 420n);
    assert.equal(capturedSlippageBps, 321);
    assert.equal(typeof capturedOptimizerTimeoutMs, "number");
    assert.ok(capturedOptimizerTimeoutMs! <= 9_500);
    assert.equal(json.status, "ready");
    assert.equal(json.tokenIn.address, USDC);
    assert.equal(json.tokenOut.address, FAME);
    assert.equal(json.requestedAmountIn, "1000000");
    assert.equal(json.route.deadline, expectedDeadline.toString());
    assert.equal(
      json.expiresAt,
      new Date(expectedDeadline * 1000).toISOString(),
    );
    assert.equal(json.slippageBps, 321);
    assert.match(json.fixtureRouteHash, /^0x[a-fA-F0-9]{64}$/);
    assert.match(json.materializedRouteHash, /^0x[a-fA-F0-9]{64}$/);
    assert.equal(json.routeHash, json.materializedRouteHash);
    assert.equal(json.approval.kind, "approval");
    assert.equal(json.approval.contract.functionName, "approve");
    assert.equal(typeof json.approval.amount, "string");
    assert.equal(json.swap.kind, "swap");
    assert.equal(json.swap.fixtureRouteHash, json.fixtureRouteHash);
    assert.equal(json.swap.materializedRouteHash, json.materializedRouteHash);
    assert.equal(json.swap.contract.functionName, "executeRoute");
    assert.equal(typeof json.routerFeeAmount, "string");
    assert.doesNotMatch(
      JSON.stringify(json),
      /protocolEvidence|activeLiquidity/,
    );
  });

  it("serializes full non-ready quote fields without executable transaction data", async () => {
    const response = await handleFameSwapQuotePost(
      request({
        tokenIn: USDC,
        tokenOut: FAME,
        amountIn: "1000000",
        recipient: "0x0000000000000000000000000000000000000abc",
      }),
      {
        readinessForQuote: async (routerAddress) => ({
          status: "ready",
          routerAddress: routerAddress!,
          feePpm: 2_222n,
        }),
        quoteForRequest: (quoteRequest) => ({
          status: "unsupported",
          tokenIn: quoteRequest.tokenIn,
          tokenOut: quoteRequest.tokenOut,
          requestedAmountIn: quoteRequest.amountIn,
          availableDirections: ["FAME->USDC", "USDC->FAME"],
          message: "Unsupported test quote.",
          diagnosticsVisibleByDefault: true,
        }),
      },
    );
    const json = await response.json();

    assert.equal(response.status, 200);
    assert.equal(json.status, "unsupported");
    assert.equal(json.tokenIn.address, USDC);
    assert.equal(json.tokenOut.address, FAME);
    assert.equal(json.requestedAmountIn, "1000000");
    assert.deepEqual(json.availableDirections, ["FAME->USDC", "USDC->FAME"]);
    assert.equal("approval" in json, false);
    assert.equal("swap" in json, false);
    assert.equal("route" in json, false);
    assert.doesNotMatch(JSON.stringify(json), /executeRoute|approve|calldata/);
  });

  it("quotes a preview route when no wallet recipient is connected", async () => {
    const response = await handleFameSwapQuotePost(
      request({
        tokenIn: USDC,
        tokenOut: FAME,
        amountIn: "1000000",
        recipient: null,
      }),
      {
        readinessForQuote: async (routerAddress) => ({
          status: "ready",
          routerAddress: routerAddress!,
          feePpm: 2_222n,
        }),
        quoteForRequest: (quoteRequest) =>
          quoteFameSwap({
            ...quoteRequest,
            adapter: createDeterministicQuoteAdapter(),
            now: new Date("2026-05-14T00:00:00Z"),
          }),
      },
    );
    const json = await response.json();

    assert.equal(response.status, 200);
    assert.equal(json.status, "ready");
    assert.equal(json.route.recipient, FAME_SWAP_PREVIEW_RECIPIENT);
    assert.equal(json.approval.kind, "approval");
    assert.equal(json.swap.kind, "swap");
  });

  it("wraps server quotes with indexed pool-state when configured", async () => {
    const snapshot = createSnapshotQuoteAdapter();
    const requestedPoolIds: string[][] = [];
    const response = await handleFameSwapQuotePost(
      request({
        tokenIn: WETH,
        tokenOut: FAME,
        amountIn: "100000000000000",
        recipient: "0x0000000000000000000000000000000000000abc",
      }),
      {
        readinessForQuote: async (routerAddress) => ({
          status: "ready",
          routerAddress: routerAddress!,
          feePpm: 2_222n,
        }),
        quoteAdapterForRequest: async () => ({
          quoteContext: {
            source: "live",
            chainId: 8453,
            blockNumber: 125n,
          },
          async quoteEdge(edgeRequest) {
            const quote = snapshot.quoteEdge(edgeRequest);
            return quote.status === "quoted"
              ? {
                  ...quote,
                  context: {
                    source: "live" as const,
                    chainId: 8453,
                    blockNumber: 125n,
                  },
                }
              : quote;
          },
        }),
        indexedPoolStateClient: {
          async fetchPoolStates(indexedRequest) {
            requestedPoolIds.push([...indexedRequest.poolIds]);
            return {
              sourceRegistryId: famePoolStateRegistrySourceId(),
              currentBlock: indexedRequest.currentBlock,
              producerMaxFreshnessBlocks: 120,
              effectiveMaxFreshnessBlocks: 120,
              pools: indexedRequest.poolIds.map((poolId) =>
                poolId === "uniswap-v2-fame-direct" ||
                poolId === "scale-equalizer-weth-fame"
                  ? {
                      status: "fresh" as const,
                      poolId,
                      chainId: 8453,
                      poolAddress:
                        poolId === "uniswap-v2-fame-direct"
                          ? "0x3e2cab55bebf41719148b4e6b63f6644b18ae49c"
                          : "0x0db3a3228520fc31162c24f1b47177255cc1b82e",
                      token0: WETH,
                      token1: FAME,
                      reserve0: "1000000000000000000",
                      reserve1: "1000000000000000000000000000000000000",
                      k: "1000000000000000000000000000000000000000000000000000000",
                      observedThroughBlock: 124,
                      lastReserveChangeBlock: 123,
                      source: "sync-event" as const,
                      quoteModel: "constant-product-reserves" as const,
                      maxFreshnessBlocks: 120,
                    }
                  : {
                      status: "unknown" as const,
                      requested: { poolId },
                      reason: "unit-test",
                    },
              ),
            };
          },
        },
      },
    );
    const json = await response.json();

    assert.equal(response.status, 200);
    assert.equal(json.status, "ready");
    assert.equal(json.quoteContext.source, "indexed");
    assert.ok(requestedPoolIds[0]?.includes("uniswap-v2-fame-direct"));
    assert.doesNotMatch(JSON.stringify(json), /unit-token|protocolEvidence/);
  });

  it("falls back live and logs when indexed pool-state helper fails", async () => {
    const warnLog = assertWarnLog();
    const snapshot = createSnapshotQuoteAdapter();
    try {
      const response = await handleFameSwapQuotePost(
        request({
          tokenIn: WETH,
          tokenOut: FAME,
          amountIn: "100000000000000",
          recipient: "0x0000000000000000000000000000000000000abc",
        }),
        {
          readinessForQuote: async (routerAddress) => ({
            status: "ready",
            routerAddress: routerAddress!,
            feePpm: 2_222n,
          }),
          quoteAdapterForRequest: async () => ({
            quoteContext: {
              source: "live",
              chainId: 8453,
              blockNumber: 125n,
            },
            async quoteEdge(edgeRequest) {
              const quote = snapshot.quoteEdge(edgeRequest);
              return quote.status === "quoted"
                ? {
                    ...quote,
                    context: {
                      source: "live" as const,
                      chainId: 8453,
                      blockNumber: 125n,
                    },
                  }
                : quote;
            },
          }),
          indexedPoolStateClient: {
            async fetchPoolStates() {
              throw new Error(
                "FAME indexed pool-state request failed with status 503. https://unit.example/token",
              );
            },
          },
        },
      );
      const json = await response.json();

      assert.equal(response.status, 200);
      assert.equal(json.status, "ready");
      assert.equal(json.quoteContext.source, "live");
      assert.equal(
        warnLog.events[0]?.event,
        "fame-pool-state-helper-unavailable",
      );
      assert.equal(warnLog.events[0]?.reason, "http_error");
      assert.equal(warnLog.events[0]?.httpStatus, 503);
      assert.equal(warnLog.events[0]?.currentBlock, 125);
      assert.equal(typeof warnLog.events[0]?.poolCount, "number");
      assert.doesNotMatch(warnLog.raw.join("\n"), /unit\.example|token/);
    } finally {
      warnLog.restore();
    }
  });

  it("falls back live and logs when helper registry provenance does not match", async () => {
    const warnLog = assertWarnLog();
    const snapshot = createSnapshotQuoteAdapter();
    try {
      const response = await handleFameSwapQuotePost(
        request({
          tokenIn: WETH,
          tokenOut: FAME,
          amountIn: "100000000000000",
          recipient: "0x0000000000000000000000000000000000000abc",
        }),
        {
          readinessForQuote: async (routerAddress) => ({
            status: "ready",
            routerAddress: routerAddress!,
            feePpm: 2_222n,
          }),
          quoteAdapterForRequest: async () => ({
            quoteContext: {
              source: "live",
              chainId: 8453,
              blockNumber: 125n,
            },
            async quoteEdge(edgeRequest) {
              const quote = snapshot.quoteEdge(edgeRequest);
              return quote.status === "quoted"
                ? {
                    ...quote,
                    context: {
                      source: "live" as const,
                      chainId: 8453,
                      blockNumber: 125n,
                    },
                  }
                : quote;
            },
          }),
          indexedPoolStateClient: {
            async fetchPoolStates(indexedRequest) {
              return {
                sourceRegistryId: "other-registry",
                currentBlock: indexedRequest.currentBlock,
                producerMaxFreshnessBlocks: 120,
                effectiveMaxFreshnessBlocks: 120,
                pools: [],
              };
            },
          },
        },
      );
      const json = await response.json();

      assert.equal(response.status, 200);
      assert.equal(json.status, "ready");
      assert.equal(json.quoteContext.source, "live");
      assert.equal(warnLog.events[0]?.reason, "source_registry_mismatch");
      assert.equal(warnLog.events[0]?.actualSourceRegistryId, "other-registry");
    } finally {
      warnLog.restore();
    }
  });

  it("rejects arbitrary router address overrides", async () => {
    const response = await POST(
      request({
        tokenIn: USDC,
        tokenOut: FAME,
        amountIn: "5000000",
        recipient: "0x0000000000000000000000000000000000000abc",
        routerAddress: "0x0000000000000000000000000000000000000123",
      }),
    );
    const json = await response.json();

    assert.equal(response.status, 400);
    assert.match(json.error, /routerAddress overrides/);
  });

  it("rejects unbounded raw amounts before liquidity reads", async () => {
    const response = await POST(
      request({
        tokenIn: USDC,
        tokenOut: FAME,
        amountIn: "1".repeat(79),
        recipient: "0x0000000000000000000000000000000000000abc",
      }),
    );
    const json = await response.json();

    assert.equal(response.status, 400);
    assert.match(json.error, /amountIn/);
  });

  it("rejects non-object and numeric amount bodies before liquidity reads", async () => {
    const nullResponse = await POST(request(null));
    const nullJson = await nullResponse.json();

    assert.equal(nullResponse.status, 400);
    assert.match(nullJson.error, /object/);

    const numericResponse = await POST(
      request({
        tokenIn: USDC,
        tokenOut: FAME,
        amountIn: 5_000_000,
        recipient: "0x0000000000000000000000000000000000000abc",
      }),
    );
    const numericJson = await numericResponse.json();

    assert.equal(numericResponse.status, 400);
    assert.match(numericJson.error, /amountIn/);
  });

  it("rejects uint256-overflowing 78 digit amounts", async () => {
    const response = await POST(
      request({
        tokenIn: USDC,
        tokenOut: FAME,
        amountIn: "9".repeat(78),
        recipient: "0x0000000000000000000000000000000000000abc",
      }),
    );
    const json = await response.json();

    assert.equal(response.status, 400);
    assert.match(json.error, /uint256/);
  });

  it("does not fall back to deterministic caps when live liquidity quotes are unavailable", async () => {
    const previousRpc = process.env.NEXT_PUBLIC_BASE_RPC_URL_1;
    const previousServerRpc = process.env.BASE_RPC_URL;
    delete process.env.NEXT_PUBLIC_BASE_RPC_URL_1;
    delete process.env.BASE_RPC_URL;
    try {
      const response = await POST(
        request({
          tokenIn: FAME,
          tokenOut: USDC,
          amountIn: "31597600141347829000",
          recipient: "0x0000000000000000000000000000000000000abc",
        }),
      );
      const json = await response.json();

      assert.equal(json.status, "quote_adapter_failure");
      assert.equal("approval" in json, false);
      assert.equal("swap" in json, false);
      assert.ok(Array.isArray(json.rejectedCandidates));
      assert.doesNotMatch(
        JSON.stringify(json),
        /protocolEvidence|activeLiquidity/,
      );
      assert.match(
        json.rejectedCandidates[0]?.message ?? "",
        /Base RPC is not configured/,
      );
    } finally {
      if (previousRpc === undefined) {
        delete process.env.NEXT_PUBLIC_BASE_RPC_URL_1;
      } else {
        process.env.NEXT_PUBLIC_BASE_RPC_URL_1 = previousRpc;
      }
      if (previousServerRpc === undefined) {
        delete process.env.BASE_RPC_URL;
      } else {
        process.env.BASE_RPC_URL = previousServerRpc;
      }
    }
  });
});
