import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FAME, WETH } from "../../tokens";
import { routeCandidatesForPair } from "../graph/candidates";
import type { FameAsyncQuoteAdapter } from "../quotes/adapters";
import { createFameOptimizerRunContext } from "./runContext";
import {
  createCachedLiveQuoteClient,
  createOptimizerQuoteAdapter,
} from "./quoteRunAdapter";

function wethFameEdge() {
  const candidate = routeCandidatesForPair(WETH, FAME).candidates.find(
    (entry) =>
      entry.legs.length === 1 &&
      entry.legs[0]?.edge.poolId === "scale-equalizer-weth-fame",
  );
  const edge = candidate?.legs[0]?.edge;
  assert.ok(edge);
  return edge;
}

describe("FAME optimizer run context", () => {
  it("keys exact quote cache by context, pool direction, and amount", async () => {
    const edge = wethFameEdge();
    let quoteCalls = 0;
    const adapter: FameAsyncQuoteAdapter = {
      async quoteEdge(request) {
        quoteCalls += 1;
        return {
          status: "quoted",
          amountIn: request.amountIn,
          amountOut: request.amountIn * 2n,
          capacityIn: null,
          fee: request.edge.fee,
          evidence: "unit test optimizer cache",
        };
      },
    };
    const run = createFameOptimizerRunContext({
      quoteContext: {
        source: "deterministic_test",
        profileId: "cache-a",
      },
    });
    const cached = createOptimizerQuoteAdapter({ adapter, run });

    await cached.quoteEdge({ edge, amountIn: 100n });
    await cached.quoteEdge({ edge, amountIn: 100n });
    await cached.quoteEdge({ edge, amountIn: 101n });

    assert.equal(quoteCalls, 2);
    assert.equal(run.stats.logicalQuoteRequests, 3);
    assert.equal(run.stats.uniqueExactQuoteReads, 2);
    assert.equal(run.stats.exactQuoteCacheHits, 1);

    const secondRun = createFameOptimizerRunContext({
      quoteContext: {
        source: "deterministic_test",
        profileId: "cache-b",
      },
    });
    const secondCached = createOptimizerQuoteAdapter({
      adapter,
      run: secondRun,
    });
    await secondCached.quoteEdge({ edge, amountIn: 100n });
    assert.equal(quoteCalls, 3);
  });

  it("coalesces concurrent duplicate exact quote reads", async () => {
    const edge = wethFameEdge();
    let quoteCalls = 0;
    const run = createFameOptimizerRunContext();
    const adapter = createOptimizerQuoteAdapter({
      run,
      adapter: {
        async quoteEdge(request) {
          quoteCalls += 1;
          await new Promise((resolve) => setTimeout(resolve, 10));
          return {
            status: "quoted",
            amountIn: request.amountIn,
            amountOut: request.amountIn * 2n,
            capacityIn: null,
            fee: request.edge.fee,
            evidence: "unit test optimizer in-flight cache",
          };
        },
      },
    });

    await Promise.all([
      adapter.quoteEdge({ edge, amountIn: 100n }),
      adapter.quoteEdge({ edge, amountIn: 100n }),
      adapter.quoteEdge({ edge, amountIn: 100n }),
    ]);

    assert.equal(quoteCalls, 1);
    assert.equal(run.stats.logicalQuoteRequests, 3);
    assert.equal(run.stats.uniqueExactQuoteReads, 1);
    assert.equal(run.stats.inFlightExactQuoteCoalesces, 2);
  });

  it("keys live state reads by context, target, function, args, and block", async () => {
    let readCalls = 0;
    const run = createFameOptimizerRunContext({
      quoteContext: {
        source: "live",
        chainId: 8453,
        blockNumber: 123n,
      },
    });
    const client = createCachedLiveQuoteClient({
      run,
      client: {
        async readContract() {
          readCalls += 1;
          return 42n;
        },
      },
    });
    const request = {
      address: "0x0000000000000000000000000000000000000001" as const,
      abi: [],
      functionName: "slot0",
      args: [1n],
      blockNumber: 123n,
    };

    await client.readContract(request);
    await client.readContract(request);
    await client.readContract({ ...request, args: [2n] });

    assert.equal(readCalls, 2);
    assert.equal(run.stats.stateReadRequests, 3);
    assert.equal(run.stats.uniqueStateReads, 2);
    assert.equal(run.stats.stateReadCacheHits, 1);
    assert.equal(run.stats.underlyingRpcReads, 2);
  });

  it("reports quote budget exhaustion as failed quote evidence", async () => {
    const edge = wethFameEdge();
    let quoteCalls = 0;
    const run = createFameOptimizerRunContext({
      budgets: {
        maxLogicalQuoteRequests: 1,
      },
    });
    const adapter = createOptimizerQuoteAdapter({
      run,
      adapter: {
        async quoteEdge(request) {
          quoteCalls += 1;
          return {
            status: "quoted",
            amountIn: request.amountIn,
            amountOut: request.amountIn,
            capacityIn: null,
            fee: request.edge.fee,
            evidence: "unit test budget",
          };
        },
      },
    });

    assert.equal((await adapter.quoteEdge({ edge, amountIn: 1n })).status, "quoted");
    const exhausted = await adapter.quoteEdge({ edge, amountIn: 2n });

    assert.equal(exhausted.status, "failed");
    if (exhausted.status === "failed") {
      assert.match(exhausted.message, /maxLogicalQuoteRequests/);
    }
    assert.equal(quoteCalls, 1);
    assert.equal(run.stats.budgetExhaustions, 1);
  });
});

