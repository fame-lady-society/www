import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import { isAddress, type Address } from "viem";
import {
  FAME_SWAP_PREVIEW_RECIPIENT,
  quoteFameSwap,
} from "../../../../../features/fame-swap/solver/quote";
import { createDeterministicQuoteAdapter } from "../../../../../features/fame-swap/solver/quotes/deterministicAdapter";
import { createSnapshotQuoteAdapter } from "../../../../../features/fame-swap/solver/quotes/snapshotAdapter";
import { FAME, USDC, WETH } from "../../../../../features/fame-swap/tokens";
import { publicFeeBreakdown } from "../../../../../features/fame-swap/solver/quoteWire";
import { famePoolStateRegistrySourceId } from "../../../../../features/fame-swap/solver/poolStateRegistry";
import type {
  FamePoolQuoteBatchRequest,
  FamePoolQuoteBatchResponse,
} from "../../../../../features/fame-swap/solver/quotes/indexedQuoteApiClient";
import { handleFameSwapQuotePost } from "./handler";
import { POST } from "./route";

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/fame/swap/quote", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertAddress(value: unknown, path: string): asserts value is Address {
  if (typeof value !== "string" || !isAddress(value, { strict: false })) {
    throw new Error(`Expected address at ${path}.`);
  }
}

function quoteRequestEntryFromValue(
  value: unknown,
  path: string,
): FamePoolQuoteBatchRequest["quotes"][number] {
  assert.ok(isRecord(value), `Expected object at ${path}.`);
  const { poolId, tokenIn, tokenOut, amountIn } = value;
  if (typeof poolId !== "string") {
    throw new Error(`Expected string at ${path}.poolId.`);
  }
  assertAddress(tokenIn, `${path}.tokenIn`);
  assertAddress(tokenOut, `${path}.tokenOut`);
  if (typeof amountIn !== "string") {
    throw new Error(`Expected string at ${path}.amountIn.`);
  }
  return { poolId, tokenIn, tokenOut, amountIn };
}

function quoteBatchRequestFromBody(body: unknown): FamePoolQuoteBatchRequest {
  const parsed: unknown = JSON.parse(String(body));
  assert.ok(isRecord(parsed), "Expected quote batch request object.");
  const { currentBlock, maxFreshnessBlocks, quotes } = parsed;
  if (typeof currentBlock !== "number" || !Number.isSafeInteger(currentBlock)) {
    throw new Error("Expected safe integer currentBlock.");
  }
  if (maxFreshnessBlocks !== undefined) {
    if (
      typeof maxFreshnessBlocks !== "number" ||
      !Number.isSafeInteger(maxFreshnessBlocks)
    ) {
      throw new Error("Expected safe integer maxFreshnessBlocks.");
    }
  }
  assert.ok(Array.isArray(quotes), "Expected quote batch request quotes.");
  return {
    currentBlock,
    ...(maxFreshnessBlocks === undefined ? {} : { maxFreshnessBlocks }),
    quotes: quotes.map((quote, index) =>
      quoteRequestEntryFromValue(quote, `quotes[${index.toString()}]`),
    ),
  };
}

function parseWarnEvent(value: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
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
    assert.equal("approval" in json, false);
    assert.equal("swap" in json, false);
    assert.equal("rejectedCandidates" in json, false);
    assert.equal("optimizerSummary" in json, false);
    assert.equal("warnings" in json, false);
    assert.equal("debug" in json, false);
    assert.equal(typeof json.routerFeeAmount, "string");
    assert.doesNotMatch(
      JSON.stringify(json),
      /protocolEvidence|activeLiquidity/,
    );
  });

  it("serializes ready debug fields only when requested", async () => {
    const response = await handleFameSwapQuotePost(
      request({
        tokenIn: USDC,
        tokenOut: FAME,
        amountIn: "1000000",
        recipient: "0x0000000000000000000000000000000000000abc",
        includeDebug: true,
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
            now: new Date("2026-05-14T00:00:00Z"),
            adapter: createDeterministicQuoteAdapter(),
          }),
      },
    );
    const json: unknown = await response.json();

    assert.equal(response.status, 200);
    assert.ok(isRecord(json));
    assert.equal(json.status, "ready");
    assert.equal("approval" in json, false);
    assert.equal("swap" in json, false);
    const debug = json.debug;
    assert.ok(isRecord(debug));
    const approval = debug.approval;
    const swap = debug.swap;
    assert.ok(isRecord(approval));
    assert.ok(isRecord(swap));
    const approvalContract = approval.contract;
    const swapContract = swap.contract;
    assert.ok(isRecord(approvalContract));
    assert.ok(isRecord(swapContract));
    assert.equal(approval.kind, "approval");
    assert.equal(approvalContract.functionName, "approve");
    assert.equal(swap.kind, "swap");
    assert.equal(swapContract.functionName, "executeRoute");
    assert.ok(Array.isArray(debug.rejectedCandidates));
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
    assert.equal("rejectedCandidates" in json, false);
    assert.equal("debug" in json, false);
    assert.doesNotMatch(JSON.stringify(json), /executeRoute|approve|calldata/);
  });

  it("serializes non-ready rejected candidates only in debug responses", async () => {
    const response = await handleFameSwapQuotePost(
      request({
        tokenIn: USDC,
        tokenOut: FAME,
        amountIn: "1000000",
        recipient: "0x0000000000000000000000000000000000000abc",
        includeDebug: true,
      }),
      {
        readinessForQuote: async (routerAddress) => ({
          status: "ready",
          routerAddress: routerAddress!,
          feePpm: 2_222n,
        }),
        quoteForRequest: (quoteRequest) => ({
          status: "quote_adapter_failure",
          tokenIn: quoteRequest.tokenIn,
          tokenOut: quoteRequest.tokenOut,
          requestedAmountIn: quoteRequest.amountIn,
          rejectedCandidates: [
            {
              candidateId: "api-runner",
              reason: "adapter_failure",
              message: "Base RPC is not configured for live liquidity quotes.",
            },
          ],
          message: "Base RPC is not configured for live liquidity quotes.",
          diagnosticsVisibleByDefault: true,
        }),
      },
    );
    const json: unknown = await response.json();

    assert.equal(response.status, 200);
    assert.ok(isRecord(json));
    assert.equal(json.status, "quote_adapter_failure");
    assert.equal("rejectedCandidates" in json, false);
    const debug = json.debug;
    assert.ok(isRecord(debug));
    const rejectedCandidates = debug.rejectedCandidates;
    assert.ok(Array.isArray(rejectedCandidates));
    const [firstRejection] = rejectedCandidates;
    assert.ok(isRecord(firstRejection));
    assert.equal(firstRejection.candidateId, "api-runner");
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
    assert.equal("approval" in json, false);
    assert.equal("swap" in json, false);
  });

  it("uses FAME_POOL_API_URL-derived pool quotes and never calls pool-state in normal execution", async () => {
    const snapshot = createSnapshotQuoteAdapter();
    const previousPoolApiUrl = process.env.FAME_POOL_API_URL;
    const previousPoolStateUrl = process.env.FAME_POOL_STATE_API_URL;
    const previousPoolQuoteUrl = process.env.FAME_POOL_QUOTE_API_URL;
    const previousServiceToken = process.env.FAME_POOL_STATE_SERVICE_TOKEN;
    const previousFetch = globalThis.fetch;
    const fetchRequests: Request[] = [];
    let poolStateFetches = 0;

    process.env.FAME_POOL_API_URL = "https://society.example";
    process.env.FAME_POOL_STATE_API_URL =
      "https://trap.example/fame/pool-state";
    process.env.FAME_POOL_QUOTE_API_URL =
      "https://trap.example/fame/pool-quotes";
    process.env.FAME_POOL_STATE_SERVICE_TOKEN = "unit-token";
    globalThis.fetch = async (input, init) => {
      const fetchRequest = new Request(input, init);
      fetchRequests.push(fetchRequest);
      if (fetchRequest.url.includes("/fame/pool-state")) poolStateFetches += 1;
      const quoteRequest = quoteBatchRequestFromBody(init?.body);
      return new Response(
        JSON.stringify({
          sourceRegistryId: famePoolStateRegistrySourceId(),
          currentBlock: quoteRequest.currentBlock,
          producerMaxFreshnessBlocks: 120,
          effectiveMaxFreshnessBlocks: 120,
          quotes: quoteRequest.quotes.map((quote) => ({
            status: "unavailable",
            requested: quote,
            reason: "missing-indexed-state",
          })),
        } satisfies FamePoolQuoteBatchResponse),
      );
    };

    try {
      const response = await handleFameSwapQuotePost(
        request({
          tokenIn: WETH,
          tokenOut: FAME,
          amountIn: "100000000000000",
          recipient: "0x0000000000000000000000000000000000000abc",
          includeDebug: true,
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
        },
      );
      const json: unknown = await response.json();

      assert.equal(response.status, 200);
      assert.ok(isRecord(json));
      assert.equal(json.status, "ready");
      assert.equal(poolStateFetches, 0);
      assert.ok(fetchRequests.length > 0);
      assert.equal(
        fetchRequests[0]?.url,
        "https://society.example/fame/pool-quotes",
      );
      assert.equal(
        fetchRequests[0]?.headers.get("authorization"),
        "Bearer unit-token",
      );
      const debug = json.debug;
      assert.ok(isRecord(debug));
      assert.equal("indexedPoolState" in debug, false);
      const quoteApi = debug.quoteApi;
      assert.ok(isRecord(quoteApi));
      assert.equal(quoteApi.configured, true);
      assert.equal(quoteApi.attempted, true);
      assert.equal(quoteApi.reason, "wrapped");
      const timing = quoteApi.timing;
      assert.ok(isRecord(timing));
      assert.ok(
        typeof timing.batchRequestCount === "number" &&
          timing.batchRequestCount > 0,
      );
      assert.equal(typeof timing.totalBatchDurationMs, "number");
      assert.equal(typeof timing.maxBatchDurationMs, "number");
      assert.equal(typeof quoteApi.poolCount, "number");
      assert.doesNotMatch(JSON.stringify(json), /society\.example/);
      assert.doesNotMatch(JSON.stringify(json), /unit-token|protocolEvidence/);
    } finally {
      globalThis.fetch = previousFetch;
      if (previousPoolApiUrl === undefined)
        delete process.env.FAME_POOL_API_URL;
      else process.env.FAME_POOL_API_URL = previousPoolApiUrl;
      if (previousPoolStateUrl === undefined)
        delete process.env.FAME_POOL_STATE_API_URL;
      else process.env.FAME_POOL_STATE_API_URL = previousPoolStateUrl;
      if (previousPoolQuoteUrl === undefined)
        delete process.env.FAME_POOL_QUOTE_API_URL;
      else process.env.FAME_POOL_QUOTE_API_URL = previousPoolQuoteUrl;
      if (previousServiceToken === undefined)
        delete process.env.FAME_POOL_STATE_SERVICE_TOKEN;
      else process.env.FAME_POOL_STATE_SERVICE_TOKEN = previousServiceToken;
    }
  });

  it("reports when the quote API helper is not configured", async () => {
    const snapshot = createSnapshotQuoteAdapter();
    const response = await handleFameSwapQuotePost(
      request({
        tokenIn: WETH,
        tokenOut: FAME,
        amountIn: "100000000000000",
        recipient: "0x0000000000000000000000000000000000000abc",
        includeDebug: true,
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
        quoteApiClient: null,
      },
    );
    const json: unknown = await response.json();

    assert.equal(response.status, 200);
    assert.ok(isRecord(json));
    assert.equal(json.status, "ready");
    assert.ok(isRecord(json.quoteContext));
    assert.equal(json.quoteContext.source, "live");
    const debug = json.debug;
    assert.ok(isRecord(debug));
    const quoteApi = debug.quoteApi;
    assert.ok(isRecord(quoteApi));
    assert.equal(quoteApi.configured, false);
    assert.equal(quoteApi.attempted, false);
    assert.equal(quoteApi.reason, "not_configured");
  });

  for (const testCase of [
    {
      name: "timeout",
      envName: "FAME_POOL_QUOTE_TIMEOUT_MS",
      envValue: "1.5",
    },
    {
      name: "freshness",
      envName: "FAME_POOL_QUOTE_MAX_FRESHNESS_BLOCKS",
      envValue: "-1",
    },
  ] as const) {
    it(`rejects invalid quote API ${testCase.name} integer env before sending bearer auth`, async () => {
      const warnLog = assertWarnLog();
      const snapshot = createSnapshotQuoteAdapter();
      const previousPoolApiUrl = process.env.FAME_POOL_API_URL;
      const previousServiceToken = process.env.FAME_POOL_STATE_SERVICE_TOKEN;
      const previousQuoteTimeout = process.env.FAME_POOL_QUOTE_TIMEOUT_MS;
      const previousMaxFreshness =
        process.env.FAME_POOL_QUOTE_MAX_FRESHNESS_BLOCKS;
      const previousFetch = globalThis.fetch;
      let fetchCalls = 0;

      process.env.FAME_POOL_API_URL = "https://society.example";
      process.env.FAME_POOL_STATE_SERVICE_TOKEN = "unit-token";
      process.env.FAME_POOL_QUOTE_TIMEOUT_MS = "2500";
      delete process.env.FAME_POOL_QUOTE_MAX_FRESHNESS_BLOCKS;
      process.env[testCase.envName] = testCase.envValue;
      globalThis.fetch = async () => {
        fetchCalls += 1;
        throw new Error("helper fetch should not receive bearer auth");
      };

      try {
        const response = await handleFameSwapQuotePost(
          request({
            tokenIn: WETH,
            tokenOut: FAME,
            amountIn: "100000000000000",
            recipient: "0x0000000000000000000000000000000000000abc",
            includeDebug: true,
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
          },
        );
        const json: unknown = await response.json();

        assert.equal(response.status, 200);
        assert.ok(isRecord(json));
        assert.equal(json.status, "ready");
        assert.equal(fetchCalls, 0);
        assert.equal(
          warnLog.events[0]?.event,
          "fame-pool-quote-api-unavailable",
        );
        assert.equal(warnLog.events[0]?.reason, "invalid_config");
        const debug = json.debug;
        assert.ok(isRecord(debug));
        const quoteApi = debug.quoteApi;
        assert.ok(isRecord(quoteApi));
        assert.equal(quoteApi.configured, true);
        assert.equal(quoteApi.attempted, false);
        assert.equal(quoteApi.reason, "invalid_config");
        assert.doesNotMatch(
          JSON.stringify(json),
          /unit-token|society\.example/,
        );
      } finally {
        globalThis.fetch = previousFetch;
        warnLog.restore();
        if (previousPoolApiUrl === undefined)
          delete process.env.FAME_POOL_API_URL;
        else process.env.FAME_POOL_API_URL = previousPoolApiUrl;
        if (previousServiceToken === undefined)
          delete process.env.FAME_POOL_STATE_SERVICE_TOKEN;
        else process.env.FAME_POOL_STATE_SERVICE_TOKEN = previousServiceToken;
        if (previousQuoteTimeout === undefined)
          delete process.env.FAME_POOL_QUOTE_TIMEOUT_MS;
        else process.env.FAME_POOL_QUOTE_TIMEOUT_MS = previousQuoteTimeout;
        if (previousMaxFreshness === undefined)
          delete process.env.FAME_POOL_QUOTE_MAX_FRESHNESS_BLOCKS;
        else
          process.env.FAME_POOL_QUOTE_MAX_FRESHNESS_BLOCKS =
            previousMaxFreshness;
      }
    });
  }

  it("reports selected compact quote attribution only in debug output", async () => {
    const snapshot = createSnapshotQuoteAdapter();
    const response = await handleFameSwapQuotePost(
      request({
        tokenIn: WETH,
        tokenOut: FAME,
        amountIn: "100000000000000",
        recipient: "0x0000000000000000000000000000000000000abc",
        includeDebug: true,
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
        quoteApiClient: {
          async fetchQuotes(quoteRequest) {
            return {
              sourceRegistryId: famePoolStateRegistrySourceId(),
              currentBlock: quoteRequest.currentBlock,
              producerMaxFreshnessBlocks: 120,
              effectiveMaxFreshnessBlocks: 120,
              quotes: quoteRequest.quotes.map((quote) =>
                quote.poolId === "uniswap-v2-fame-direct"
                  ? {
                      status: "quoted" as const,
                      quoteKind: "constant-product-quote-v1" as const,
                      poolId: "uniswap-v2-fame-direct",
                      chainId: 8453,
                      poolAddress: "0x3e2cab55bebf41719148b4e6b63f6644b18ae49c",
                      token0: WETH,
                      token1: FAME,
                      tokenIn: quote.tokenIn,
                      tokenOut: quote.tokenOut,
                      venueFamily: "UniswapV2",
                      amountIn: quote.amountIn,
                      amountOut: "999999999999999999999999",
                      observedThroughBlock: 124,
                      sourceRegistryId: famePoolStateRegistrySourceId(),
                      maxFreshnessBlocks: 120,
                      quoteModel: "constant-product-reserves" as const,
                      quoteModelVersion: 1 as const,
                      feeBps: 30,
                      feeSource: "registry-fee" as const,
                      source: "reserve-pool-state" as const,
                      stateSource: "sync-event" as const,
                      priceImpact: {
                        preSwapPriceX18: "2000000000000000000",
                        postSwapPriceX18: "1990000000000000000",
                        executionPriceX18: "9999999999999999999",
                        marketImpactBps: 0,
                        method: "constant-product-reserves" as const,
                      },
                      protocolEvidence: {
                        quote: {
                          status: "available" as const,
                          source: "indexed reserve quote",
                          value: "999999999999999999999999",
                        },
                        prePrice: {
                          status: "available" as const,
                          source: "indexed reserve quote",
                          value: "2000000000000000000",
                        },
                        postPrice: {
                          status: "available" as const,
                          source: "indexed reserve quote",
                          value: "1990000000000000000",
                        },
                        marketImpact: {
                          status: "available" as const,
                          source: "indexed reserve quote",
                          value: "0",
                        },
                        activeLiquidity: {
                          status: "not_applicable" as const,
                          source: "indexed reserve quote",
                          reason:
                            "Constant-product reserve quotes use reserves.",
                        },
                      },
                    }
                  : {
                      status: "unavailable" as const,
                      requested: quote,
                      reason: "missing-indexed-state" as const,
                    },
              ),
            };
          },
        },
      },
    );
    const json: unknown = await response.json();

    assert.equal(response.status, 200);
    assert.ok(isRecord(json));
    assert.equal(json.status, "ready");
    const debug = json.debug;
    assert.ok(isRecord(debug));
    const quoteApi = debug.quoteApi;
    assert.ok(isRecord(quoteApi));
    assert.ok(typeof quoteApi.usedCount === "number" && quoteApi.usedCount > 0);
    const selectedRoute = quoteApi.selectedRoute;
    assert.ok(isRecord(selectedRoute));
    assert.equal(selectedRoute.compactQuoteLegs, 1);
    assert.equal(selectedRoute.liveLegs, 1);
    assert.match(JSON.stringify(selectedRoute), /compact_quote/);
    assert.doesNotMatch(
      JSON.stringify(json),
      /protocolEvidence|reserve0|reserve1/,
    );
  });

  it("does not attribute losing compact quotes to the selected route", async () => {
    const snapshot = createSnapshotQuoteAdapter();
    const response = await handleFameSwapQuotePost(
      request({
        tokenIn: WETH,
        tokenOut: FAME,
        amountIn: "100000000000000",
        recipient: "0x0000000000000000000000000000000000000abc",
        includeDebug: true,
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
        quoteApiClient: {
          async fetchQuotes(quoteRequest) {
            return {
              sourceRegistryId: famePoolStateRegistrySourceId(),
              currentBlock: quoteRequest.currentBlock,
              producerMaxFreshnessBlocks: 120,
              effectiveMaxFreshnessBlocks: 120,
              quotes: quoteRequest.quotes.map((quote) =>
                quote.poolId === "uniswap-v2-fame-direct"
                  ? {
                      status: "quoted" as const,
                      quoteKind: "constant-product-quote-v1" as const,
                      poolId: "uniswap-v2-fame-direct",
                      chainId: 8453,
                      poolAddress: "0x3e2cab55bebf41719148b4e6b63f6644b18ae49c",
                      token0: WETH,
                      token1: FAME,
                      tokenIn: quote.tokenIn,
                      tokenOut: quote.tokenOut,
                      venueFamily: "UniswapV2",
                      amountIn: quote.amountIn,
                      amountOut: "1",
                      observedThroughBlock: 124,
                      sourceRegistryId: famePoolStateRegistrySourceId(),
                      maxFreshnessBlocks: 120,
                      quoteModel: "constant-product-reserves" as const,
                      quoteModelVersion: 1 as const,
                      feeBps: 30,
                      feeSource: "registry-fee" as const,
                      source: "reserve-pool-state" as const,
                      stateSource: "sync-event" as const,
                      priceImpact: {
                        preSwapPriceX18: "2000000000000000000",
                        postSwapPriceX18: "1990000000000000000",
                        executionPriceX18: "1",
                        marketImpactBps: 9999,
                        method: "constant-product-reserves" as const,
                      },
                      protocolEvidence: {
                        quote: {
                          status: "available" as const,
                          source: "indexed reserve quote",
                          value: "1",
                        },
                        prePrice: {
                          status: "available" as const,
                          source: "indexed reserve quote",
                          value: "2000000000000000000",
                        },
                        postPrice: {
                          status: "available" as const,
                          source: "indexed reserve quote",
                          value: "1990000000000000000",
                        },
                        marketImpact: {
                          status: "available" as const,
                          source: "indexed reserve quote",
                          value: "9999",
                        },
                        activeLiquidity: {
                          status: "not_applicable" as const,
                          source: "indexed reserve quote",
                          reason:
                            "Constant-product reserve quotes use reserves.",
                        },
                      },
                    }
                  : {
                      status: "unavailable" as const,
                      requested: quote,
                      reason: "missing-indexed-state" as const,
                    },
              ),
            };
          },
        },
      },
    );
    const json: unknown = await response.json();

    assert.equal(response.status, 200);
    assert.ok(isRecord(json));
    assert.equal(json.status, "ready");
    const debug = json.debug;
    assert.ok(isRecord(debug));
    const quoteApi = debug.quoteApi;
    assert.ok(isRecord(quoteApi));
    assert.ok(typeof quoteApi.usedCount === "number" && quoteApi.usedCount > 0);
    const selectedRoute = quoteApi.selectedRoute;
    assert.ok(isRecord(selectedRoute));
    assert.equal(selectedRoute.compactQuoteLegs, 0);
    assert.ok(
      typeof selectedRoute.liveLegs === "number" && selectedRoute.liveLegs > 0,
    );
    assert.doesNotMatch(JSON.stringify(selectedRoute), /compact_quote/);
  });

  it("rejects unsafe FAME_POOL_API_URL before sending bearer auth", async () => {
    const warnLog = assertWarnLog();
    const snapshot = createSnapshotQuoteAdapter();
    const previousPoolApiUrl = process.env.FAME_POOL_API_URL;
    const previousServiceToken = process.env.FAME_POOL_STATE_SERVICE_TOKEN;
    const previousFetch = globalThis.fetch;
    let fetchCalls = 0;

    process.env.FAME_POOL_API_URL =
      "https://unit:secret@society.example/fame/pool-quotes?debug=1";
    process.env.FAME_POOL_STATE_SERVICE_TOKEN = "unit-token";
    globalThis.fetch = async () => {
      fetchCalls += 1;
      throw new Error("helper fetch should not receive bearer auth");
    };

    try {
      const response = await handleFameSwapQuotePost(
        request({
          tokenIn: WETH,
          tokenOut: FAME,
          amountIn: "100000000000000",
          recipient: "0x0000000000000000000000000000000000000abc",
          includeDebug: true,
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
              return {
                status: "quoted",
                amountIn: edgeRequest.amountIn,
                amountOut: edgeRequest.amountIn,
                capacityIn: null,
                fee: edgeRequest.edge.fee,
                evidence: "fallback live quote",
                context: {
                  source: "live" as const,
                  chainId: 8453,
                  blockNumber: 125n,
                },
              };
            },
          }),
        },
      );
      const json: unknown = await response.json();

      assert.equal(response.status, 200);
      assert.ok(isRecord(json));
      assert.equal(json.status, "ready");
      assert.equal(fetchCalls, 0);
      assert.equal(warnLog.events[0]?.event, "fame-pool-quote-api-unavailable");
      assert.equal(warnLog.events[0]?.reason, "invalid_config");
      assert.doesNotMatch(
        JSON.stringify(json),
        /unit-token|unit:secret|debug=1/,
      );
    } finally {
      globalThis.fetch = previousFetch;
      warnLog.restore();
      if (previousPoolApiUrl === undefined)
        delete process.env.FAME_POOL_API_URL;
      else process.env.FAME_POOL_API_URL = previousPoolApiUrl;
      if (previousServiceToken === undefined)
        delete process.env.FAME_POOL_STATE_SERVICE_TOKEN;
      else process.env.FAME_POOL_STATE_SERVICE_TOKEN = previousServiceToken;
    }
  });

  it("uses quote-specific timeout env and falls back live on helper timeout", async () => {
    const warnLog = assertWarnLog();
    const snapshot = createSnapshotQuoteAdapter();
    const previousPoolApiUrl = process.env.FAME_POOL_API_URL;
    const previousServiceToken = process.env.FAME_POOL_STATE_SERVICE_TOKEN;
    const previousQuoteTimeout = process.env.FAME_POOL_QUOTE_TIMEOUT_MS;
    const previousStateTimeout = process.env.FAME_POOL_STATE_TIMEOUT_MS;
    const previousFetch = globalThis.fetch;
    let observedAbort = false;

    process.env.FAME_POOL_API_URL = "https://society.example";
    process.env.FAME_POOL_STATE_SERVICE_TOKEN = "unit-token";
    process.env.FAME_POOL_QUOTE_TIMEOUT_MS = "1";
    process.env.FAME_POOL_STATE_TIMEOUT_MS = "60000";
    globalThis.fetch = async (_input, init) =>
      await new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          observedAbort = true;
          reject(new DOMException("Aborted", "AbortError"));
        });
      });

    try {
      const response = await handleFameSwapQuotePost(
        request({
          tokenIn: WETH,
          tokenOut: FAME,
          amountIn: "100000000000000",
          recipient: "0x0000000000000000000000000000000000000abc",
          includeDebug: true,
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
        },
      );
      const json = await response.json();

      assert.equal(response.status, 200);
      assert.equal(json.status, "ready");
      assert.equal(json.quoteContext.source, "live");
      assert.equal(observedAbort, true);
      const debug = json.debug;
      assert.ok(isRecord(debug));
      const quoteApi = debug.quoteApi;
      assert.ok(isRecord(quoteApi));
      assert.equal(quoteApi.configured, true);
      assert.equal(quoteApi.batchFailureCount, quoteApi.edgeCount);
      const timing = quoteApi.timing;
      assert.ok(isRecord(timing));
      assert.ok(
        typeof timing.batchRequestCount === "number" &&
          timing.batchRequestCount > 0,
      );
      assert.match(
        JSON.stringify(quoteApi),
        /"batchFailureCategory":"timeout"/,
      );
      assert.equal(warnLog.events[0]?.event, "fame-pool-quote-api-unavailable");
      assert.equal(warnLog.events[0]?.reason, "quote_api_batch_failed");
      assert.doesNotMatch(JSON.stringify(json), /unit-token|society\.example/);
    } finally {
      globalThis.fetch = previousFetch;
      warnLog.restore();
      if (previousPoolApiUrl === undefined)
        delete process.env.FAME_POOL_API_URL;
      else process.env.FAME_POOL_API_URL = previousPoolApiUrl;
      if (previousServiceToken === undefined)
        delete process.env.FAME_POOL_STATE_SERVICE_TOKEN;
      else process.env.FAME_POOL_STATE_SERVICE_TOKEN = previousServiceToken;
      if (previousQuoteTimeout === undefined)
        delete process.env.FAME_POOL_QUOTE_TIMEOUT_MS;
      else process.env.FAME_POOL_QUOTE_TIMEOUT_MS = previousQuoteTimeout;
      if (previousStateTimeout === undefined)
        delete process.env.FAME_POOL_STATE_TIMEOUT_MS;
      else process.env.FAME_POOL_STATE_TIMEOUT_MS = previousStateTimeout;
    }
  });

  it("caps high quote API timeouts to leave live fallback budget", async () => {
    const warnLog = assertWarnLog();
    const snapshot = createSnapshotQuoteAdapter();
    const previousPoolApiUrl = process.env.FAME_POOL_API_URL;
    const previousServiceToken = process.env.FAME_POOL_STATE_SERVICE_TOKEN;
    const previousQuoteTimeout = process.env.FAME_POOL_QUOTE_TIMEOUT_MS;
    const previousFetch = globalThis.fetch;
    const previousNow = Date.now;
    let nowCalls = 0;
    let observedAbort = false;
    const quotePostRequest = request({
      tokenIn: WETH,
      tokenOut: FAME,
      amountIn: "100000000000000",
      recipient: "0x0000000000000000000000000000000000000abc",
      includeDebug: true,
    });

    process.env.FAME_POOL_API_URL = "https://society.example";
    process.env.FAME_POOL_STATE_SERVICE_TOKEN = "unit-token";
    process.env.FAME_POOL_QUOTE_TIMEOUT_MS = "60000";
    Date.now = () => {
      nowCalls += 1;
      return nowCalls === 1 ? 1_000_000 : 1_009_500;
    };
    globalThis.fetch = async (_input, init) =>
      await new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          observedAbort = true;
          reject(new DOMException("Aborted", "AbortError"));
        });
      });

    try {
      const response = await handleFameSwapQuotePost(quotePostRequest, {
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
      });
      const json = await response.json();

      assert.equal(response.status, 200);
      assert.equal(json.status, "ready");
      assert.equal(json.quoteContext.source, "live");
      assert.equal(observedAbort, true);
      const debug = json.debug;
      assert.ok(isRecord(debug));
      const quoteApi = debug.quoteApi;
      assert.ok(isRecord(quoteApi));
      assert.equal(quoteApi.configured, true);
      assert.equal(quoteApi.batchFailureCount, quoteApi.edgeCount);
      assert.match(
        JSON.stringify(quoteApi),
        /"batchFailureCategory":"timeout"/,
      );
      assert.equal(warnLog.events[0]?.event, "fame-pool-quote-api-unavailable");
      assert.equal(warnLog.events[0]?.reason, "quote_api_batch_failed");
    } finally {
      Date.now = previousNow;
      globalThis.fetch = previousFetch;
      warnLog.restore();
      if (previousPoolApiUrl === undefined)
        delete process.env.FAME_POOL_API_URL;
      else process.env.FAME_POOL_API_URL = previousPoolApiUrl;
      if (previousServiceToken === undefined)
        delete process.env.FAME_POOL_STATE_SERVICE_TOKEN;
      else process.env.FAME_POOL_STATE_SERVICE_TOKEN = previousServiceToken;
      if (previousQuoteTimeout === undefined)
        delete process.env.FAME_POOL_QUOTE_TIMEOUT_MS;
      else process.env.FAME_POOL_QUOTE_TIMEOUT_MS = previousQuoteTimeout;
    }
  });

  it("falls back live and reports quote API batch failures", async () => {
    const warnLog = assertWarnLog();
    const snapshot = createSnapshotQuoteAdapter();
    try {
      const response = await handleFameSwapQuotePost(
        request({
          tokenIn: WETH,
          tokenOut: FAME,
          amountIn: "100000000000000",
          recipient: "0x0000000000000000000000000000000000000abc",
          includeDebug: true,
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
          quoteApiClient: {
            async fetchQuotes() {
              throw new Error(
                "FAME pool quote request failed with status 503. https://unit.example/super-secret",
              );
            },
          },
        },
      );
      const json = await response.json();

      assert.equal(response.status, 200);
      assert.equal(json.status, "ready");
      assert.equal(json.quoteContext.source, "live");
      const debug = json.debug;
      assert.ok(isRecord(debug));
      const quoteApi = debug.quoteApi;
      assert.ok(isRecord(quoteApi));
      assert.equal(quoteApi.configured, true);
      assert.equal(quoteApi.attempted, true);
      assert.equal(quoteApi.batchFailureCount, quoteApi.edgeCount);
      assert.equal(warnLog.events[0]?.event, "fame-pool-quote-api-unavailable");
      assert.equal(warnLog.events[0]?.reason, "quote_api_batch_failed");
      assert.doesNotMatch(JSON.stringify(json), /unit\.example|super-secret/);
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
      assert.equal("rejectedCandidates" in json, false);
      assert.equal("debug" in json, false);
      assert.doesNotMatch(
        JSON.stringify(json),
        /protocolEvidence|activeLiquidity/,
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
