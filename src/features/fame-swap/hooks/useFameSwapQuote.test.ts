import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { QueryClient } from "@tanstack/react-query";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../artifacts/manifest";
import type { FameSwapConfig } from "../config";
import { routeArtifactById } from "../solver/artifacts";
import { quoteWithReadyReadiness } from "../solver/quote";
import {
  deserializeFameSwapQuoteResponse,
  serializeFameSwapQuoteResponse,
} from "../solver/quoteWire";
import { createDeterministicQuoteAdapter } from "../solver/quotes/deterministicAdapter";
import { DEFAULT_FAME_SWAP_SLIPPAGE_BPS } from "../solver/slippage";
import type { FameSwapReadiness } from "../solver/types";
import { FAME, USDC, tokenForAddress } from "../tokens";
import {
  FAME_SWAP_QUOTE_DEBOUNCE_MS,
  fameSwapQuoteInputKey,
  fameSwapQuoteQueryKey,
  fameSwapRemoteQuoteEnabled,
  fameSwapRemoteQuoteInput,
  fetchFameSwapRemoteQuote,
  type UseFameSwapQuoteInput,
} from "./useFameSwapQuote";

const routerAddress = "0x0000000000000000000000000000000000000009";
const recipient = "0x0000000000000000000000000000000000000abc";

function config(): FameSwapConfig {
  return {
    routerAddress,
    defaultSlippageBps: DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
    expectedSchemaVersion: FAME_SWAP_ARTIFACT_MANIFEST.schemaVersion,
    expectedPinnedBaseBlock: FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock,
    expectedSolverRoutesHash: FAME_SWAP_ARTIFACT_MANIFEST.solverRoutesJsonHash,
    expectedGapMatrixHash: FAME_SWAP_ARTIFACT_MANIFEST.gapMatrixJsonHash,
    expectedParityVectorsHash:
      FAME_SWAP_ARTIFACT_MANIFEST.parityVectorsJsonHash,
    expectedPoolsHash: FAME_SWAP_ARTIFACT_MANIFEST.poolsJsonHash,
    expectedPoolStateSnapshotHash:
      FAME_SWAP_ARTIFACT_MANIFEST.poolStateSnapshotJsonHash,
  };
}

function readyReadiness(): Extract<FameSwapReadiness, { status: "ready" }> {
  return {
    status: "ready",
    routerAddress,
    feePpm: 2222n,
  };
}

function blockedReadiness(): Extract<
  FameSwapReadiness,
  { status: "not_live_ready" }
> {
  return {
    status: "not_live_ready",
    reason: "read_error",
    message: "Router readiness is still loading.",
    routerAddress,
  };
}

function quoteInput(
  overrides: Partial<UseFameSwapQuoteInput> = {},
): UseFameSwapQuoteInput {
  const tokenIn = tokenForAddress(USDC);
  const tokenOut = tokenForAddress(FAME);
  assert.ok(tokenIn);
  assert.ok(tokenOut);

  return {
    tokenIn,
    tokenOut,
    amountIn: 1_000_000n,
    recipient,
    config: config(),
    readiness: readyReadiness(),
    deadlineMinutes: 20,
    ...overrides,
  };
}

function jsonRoundTrip(value: unknown): unknown {
  return JSON.parse(
    JSON.stringify(value, (_key, entry) =>
      typeof entry === "bigint" ? entry.toString() : entry,
    ),
  );
}

describe("useFameSwapQuote", () => {
  it("builds a React Query key from every quote-affecting input", () => {
    const input = quoteInput();
    const key = fameSwapQuoteQueryKey(input, 7);

    assert.equal(key[0], "fame-swap-quote");
    assert.equal(key[1].tokenIn, USDC);
    assert.equal(key[1].tokenOut, FAME);
    assert.equal(key[1].amountIn, "1000000");
    assert.equal(key[1].recipient, recipient);
    assert.equal(key[1].routerAddress, routerAddress);
    assert.equal(key[1].slippageBps, DEFAULT_FAME_SWAP_SLIPPAGE_BPS);
    assert.equal(key[1].deadlineMinutes, 20);
    assert.equal(key[1].readiness, `ready:${routerAddress}:2222`);
    assert.equal(key[1].refreshNonce, 7);
  });

  it("uses a bounded debounce window for quote-affecting input changes", () => {
    const input = quoteInput();
    const changedAmount = quoteInput({ amountIn: 2_000_000n });
    const identity = fameSwapQuoteInputKey(input);

    assert.equal(FAME_SWAP_QUOTE_DEBOUNCE_MS, 350);
    assert.ok(identity);
    assert.equal(identity.endsWith(":0"), false);
    assert.notDeepEqual(
      fameSwapQuoteQueryKey(input, 0),
      fameSwapQuoteQueryKey(input, 1),
    );
    assert.notEqual(identity, fameSwapQuoteInputKey(changedAmount));
    assert.equal(fameSwapQuoteInputKey(quoteInput({ amountIn: null })), null);
  });

  it("disables remote fetches for empty amount and local blocked states", () => {
    assert.equal(
      fameSwapRemoteQuoteEnabled(quoteInput({ amountIn: null })),
      false,
    );
    assert.equal(
      fameSwapRemoteQuoteEnabled(quoteInput({ recipient: null })),
      true,
    );
    assert.equal(
      fameSwapRemoteQuoteEnabled(quoteInput({ readiness: blockedReadiness() })),
      false,
    );
    assert.equal(fameSwapRemoteQuoteEnabled(quoteInput()), true);
  });

  it("posts remote quote requests with React Query's abort signal and request identity fields", async () => {
    const tokenIn = tokenForAddress(USDC);
    const tokenOut = tokenForAddress(FAME);
    assert.ok(tokenIn);
    assert.ok(tokenOut);
    const artifact = routeArtifactById("solver-usdc-split-frxusd-merge-fame");
    assert.ok(artifact);
    const sourceQuote = quoteWithReadyReadiness({
      tokenIn,
      tokenOut,
      amountIn: BigInt(artifact.route.amountIn),
      recipient,
      routerAddress,
      now: new Date("2026-05-13T00:00:00Z"),
      adapter: createDeterministicQuoteAdapter(),
    });
    assert.equal(sourceQuote.status, "ready");
    if (sourceQuote.status !== "ready") return;
    const input = fameSwapRemoteQuoteInput(
      quoteInput({
        amountIn: sourceQuote.requestedAmountIn,
        config: {
          ...config(),
          defaultSlippageBps: 175,
        },
        deadlineMinutes: 17,
      }),
    );
    assert.ok(input);
    const requests: { url: string; init?: RequestInit }[] = [];
    const signal = new AbortController().signal;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
      requests.push({
        url: String(url),
        init,
      });
      return new Response(
        JSON.stringify(serializeFameSwapQuoteResponse(sourceQuote)),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }) as typeof fetch;

    try {
      const parsed = await fetchFameSwapRemoteQuote(input, signal);
      const request = requests[0];
      assert.ok(request);

      assert.equal(parsed.status, "ready");
      if (parsed.status === "ready") {
        assert.equal(parsed.approval?.spender, routerAddress);
        assert.equal(parsed.approval?.amount, sourceQuote.route.amountIn);
        assert.equal(
          parsed.materializedRouteHash,
          sourceQuote.materializedRouteHash,
        );
        assert.equal(parsed.callValue, sourceQuote.callValue);
        assert.deepEqual(parsed.rejectedCandidates, []);
        assert.equal(parsed.optimizerSummary, undefined);
      }
      assert.equal(request.url, "/api/fame/swap/quote");
      assert.equal(request.init?.method, "POST");
      assert.equal(request.init?.signal, signal);
      const body = JSON.parse(String(request.init?.body));
      assert.equal(body.tokenIn, USDC);
      assert.equal(body.tokenOut, FAME);
      assert.equal(body.amountIn, sourceQuote.requestedAmountIn.toString());
      assert.equal(body.recipient, recipient);
      assert.equal(body.slippageBps, 175);
      assert.equal(body.deadlineMinutes, 17);
      assert.equal("includeDebug" in body, false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("posts remote quote preview requests without a connected recipient", async () => {
    const input = fameSwapRemoteQuoteInput(quoteInput({ recipient: null }));
    assert.ok(input);
    const requestBodies: Record<string, unknown>[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (_url: RequestInfo | URL, init?: RequestInit) => {
      requestBodies.push(JSON.parse(String(init?.body)));
      return new Response(
        JSON.stringify({
          status: "quote_adapter_failure",
          message: "preview response",
          rejectedCandidates: [],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }) as typeof fetch;

    try {
      const parsed = await fetchFameSwapRemoteQuote(
        input,
        new AbortController().signal,
      );

      assert.equal(parsed.status, "quote_adapter_failure");
      assert.equal(requestBodies[0]?.recipient, null);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("executes the remote quote query through a fresh QueryClient", async () => {
    const tokenIn = tokenForAddress(USDC);
    const tokenOut = tokenForAddress(FAME);
    assert.ok(tokenIn);
    assert.ok(tokenOut);
    const artifact = routeArtifactById("solver-usdc-split-frxusd-merge-fame");
    assert.ok(artifact);
    const sourceQuote = quoteWithReadyReadiness({
      tokenIn,
      tokenOut,
      amountIn: BigInt(artifact.route.amountIn),
      recipient,
      routerAddress,
      now: new Date("2026-05-13T00:00:00Z"),
      adapter: createDeterministicQuoteAdapter(),
    });
    assert.equal(sourceQuote.status, "ready");
    if (sourceQuote.status !== "ready") return;
    const input = fameSwapRemoteQuoteInput(
      quoteInput({
        amountIn: sourceQuote.requestedAmountIn,
      }),
    );
    assert.ok(input);
    let receivedSignal: AbortSignal | null = null;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (_url: RequestInfo | URL, init?: RequestInit) => {
      receivedSignal = init?.signal ?? null;
      return new Response(
        JSON.stringify(serializeFameSwapQuoteResponse(sourceQuote)),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }) as typeof fetch;
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    try {
      const parsed = await queryClient.fetchQuery({
        queryKey: fameSwapQuoteQueryKey(input, 0),
        queryFn: ({ signal }) => fetchFameSwapRemoteQuote(input, signal),
      });

      assert.equal(parsed.status, "ready");
      assert.ok(receivedSignal);
    } finally {
      queryClient.clear();
      globalThis.fetch = originalFetch;
    }
  });

  it("throws display-safe errors for non-OK remote quote responses", async () => {
    const input = fameSwapRemoteQuoteInput(quoteInput());
    assert.ok(input);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          error:
            "request body calldata 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef leaked",
        }),
        {
          status: 502,
          headers: { "content-type": "application/json" },
        },
      )) as typeof fetch;

    try {
      await assert.rejects(
        fetchFameSwapRemoteQuote(input, new AbortController().signal),
        (error) => {
          assert.ok(error instanceof Error);
          assert.doesNotMatch(error.message, /calldata/i);
          assert.doesNotMatch(error.message, /0x[0-9a-f]{64}/i);
          return true;
        },
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("rebuilds a compact ready API quote into the shared executable quote shape", () => {
    const tokenIn = tokenForAddress(USDC);
    const tokenOut = tokenForAddress(FAME);
    assert.ok(tokenIn);
    assert.ok(tokenOut);
    const artifact = routeArtifactById("solver-usdc-split-frxusd-merge-fame");
    assert.ok(artifact);
    const sourceQuote = quoteWithReadyReadiness({
      tokenIn,
      tokenOut,
      amountIn: BigInt(artifact.route.amountIn),
      recipient,
      routerAddress,
      now: new Date("2026-05-13T00:00:00Z"),
      adapter: createDeterministicQuoteAdapter(),
    });
    assert.equal(sourceQuote.status, "ready");
    if (sourceQuote.status !== "ready") return;

    const apiResponse = jsonRoundTrip({
      status: "ready",
      message: sourceQuote.message,
      routeArtifactId: sourceQuote.routeArtifactId,
      routeSource: sourceQuote.routeSource,
      routerAddress: sourceQuote.routerAddress,
      requestedAmountIn: sourceQuote.requestedAmountIn,
      grossEstimatedOutput: sourceQuote.grossEstimatedOutput,
      estimatedOutput: sourceQuote.estimatedOutput,
      routerFeeAmount: sourceQuote.routerFeeAmount,
      minAmountOutAfterFee: sourceQuote.minAmountOutAfterFee,
      feeBreakdown: sourceQuote.feeBreakdown,
      quoteContext: sourceQuote.quoteContext,
      feePpm: sourceQuote.feePpm,
      capabilities: sourceQuote.capabilities,
      callValue: sourceQuote.callValue,
      slippageBps: sourceQuote.slippageBps,
      expiresAt: sourceQuote.expiresAt.toISOString(),
      routeHash: sourceQuote.materializedRouteHash,
      poolIds: sourceQuote.poolIds,
      route: sourceQuote.route,
      routeDisplay: sourceQuote.routeDisplay,
    });

    const parsed = deserializeFameSwapQuoteResponse(apiResponse, {
      tokenIn,
      tokenOut,
      amountIn: sourceQuote.requestedAmountIn,
      config: config(),
    });

    assert.equal(parsed.status, "ready");
    if (parsed.status === "ready") {
      assert.equal(parsed.route.amountIn, sourceQuote.route.amountIn);
      assert.equal(parsed.approval?.amount, sourceQuote.route.amountIn);
      assert.equal(
        parsed.materializedRouteHash,
        sourceQuote.materializedRouteHash,
      );
      assert.equal(parsed.feePpm, sourceQuote.feePpm);
      assert.equal(parsed.capabilities.splitThenMerge, true);
      assert.equal(parsed.feeBreakdown.legs[0]?.amountIn > 0n, true);
      assert.deepEqual(parsed.rejectedCandidates, []);
      assert.equal(parsed.optimizerSummary, undefined);
    }
  });

  it("rebuilds optional debug fields when a developer quote response includes them", () => {
    const tokenIn = tokenForAddress(USDC);
    const tokenOut = tokenForAddress(FAME);
    assert.ok(tokenIn);
    assert.ok(tokenOut);
    const artifact = routeArtifactById("solver-usdc-split-frxusd-merge-fame");
    assert.ok(artifact);
    const sourceQuote = quoteWithReadyReadiness({
      tokenIn,
      tokenOut,
      amountIn: BigInt(artifact.route.amountIn),
      recipient,
      routerAddress,
      now: new Date("2026-05-13T00:00:00Z"),
      adapter: createDeterministicQuoteAdapter(),
    });
    assert.equal(sourceQuote.status, "ready");
    if (sourceQuote.status !== "ready") return;

    const apiResponse = jsonRoundTrip(
      serializeFameSwapQuoteResponse(
        {
          ...sourceQuote,
          optimizerSummary: {
            mode: "select",
            status: "selected",
            selectedTemplateId: "debug-template",
            selectedAllocationBps: 5_000,
            selectedCandidateId: "debug-candidate",
            winningMarginBps: 25,
            trialStatusCounts: {
              selected: 1,
              rejected: 1,
              pruned: 0,
              budget_exhausted: 0,
              quote_failed: 0,
              unsupported_shape: 0,
              ineligible: 0,
            },
            fallbackReason: null,
            runStats: {
              logicalQuoteRequests: 2,
              uniqueExactQuoteReads: 1,
              exactQuoteCacheHits: 1,
              trials: 2,
              templatesConsidered: 1,
              budgetExhaustions: 0,
              timeout: false,
            },
          },
        },
        { includeDebug: true },
      ),
    );

    const parsed = deserializeFameSwapQuoteResponse(apiResponse, {
      tokenIn,
      tokenOut,
      amountIn: sourceQuote.requestedAmountIn,
      config: config(),
    });

    assert.equal(parsed.status, "ready");
    if (parsed.status === "ready") {
      assert.equal(parsed.optimizerSummary?.selectedTemplateId, "debug-template");
      assert.equal(parsed.optimizerSummary?.selectedAllocationBps, 5_000);
      assert.ok(parsed.rejectedCandidates.length > 0);
    }
  });

  it("keeps non-ready API responses structurally non-executable", () => {
    const tokenIn = tokenForAddress(USDC);
    const tokenOut = tokenForAddress(FAME);
    assert.ok(tokenIn);
    assert.ok(tokenOut);

    const parsed = deserializeFameSwapQuoteResponse(
      {
        status: "quote_adapter_failure",
        message: "Base RPC is not configured for live liquidity quotes.",
      },
      {
        tokenIn,
        tokenOut,
        amountIn: 5_000_000n,
        config: config(),
      },
    );

    assert.equal(parsed.status, "quote_adapter_failure");
    assert.equal("route" in parsed, false);
    assert.equal("approval" in parsed, false);
    if (parsed.status === "quote_adapter_failure") {
      assert.deepEqual(parsed.rejectedCandidates, []);
    }
  });
});
