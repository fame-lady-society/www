import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  discoverTargetOutputTopology,
  solveFameTargetOutput,
  solveTargetOutput,
  targetOutputEvaluationLimit,
  type TargetOutputEvaluation,
  type TargetOutputSolverOptions,
} from "./targetOutput";
import type { FamePoolEdge } from "./poolUniverse";
import type { FameAsyncQuoteAdapter } from "./quotes/adapters";
import { routeCandidatesForPair } from "./graph/candidates";
import { FAME, NATIVE_ETH, USDC, WETH, tokenForAddress } from "../tokens";

type Topology = Readonly<{
  id: string;
  multiplier: bigint;
}>;

const first = { id: "first", multiplier: 10n } satisfies Topology;
const second = { id: "second", multiplier: 20n } satisfies Topology;

function available(topology: Topology, amountIn: bigint) {
  return {
    status: "available",
    protectedOutput: topology.multiplier * amountIn,
  } as const satisfies TargetOutputEvaluation;
}

function baseOptions(
  overrides: Partial<TargetOutputSolverOptions<Topology, string>> = {},
): TargetOutputSolverOptions<Topology, string> {
  return {
    topologies: [first],
    targetOutput: 500n,
    minimumInput: 1n,
    maximumInput: 100n,
    precision: 1n,
    timeoutMs: 10_000,
    materializationReserveMs: 0,
    evaluate: async ({ topology, amountIn }) => available(topology, amountIn),
    materialize: async ({ topology, amountIn }) => ({
      status: "ready" as const,
      protectedOutput: topology.multiplier * amountIn,
      quote: `${topology.id}:${amountIn.toString()}`,
    }),
    ...overrides,
  };
}

describe("target-output solver", () => {
  it("derives a finite evaluation cap from topology count, range, and precision", () => {
    assert.equal(
      targetOutputEvaluationLimit({
        topologyCount: 2,
        minimumInput: 1n,
        maximumInput: 100n,
        precision: 1n,
      }),
      10,
    );
    assert.equal(
      targetOutputEvaluationLimit({
        topologyCount: 1,
        minimumInput: 5n,
        maximumInput: 5n,
        precision: 1n,
      }),
      1,
    );
  });

  it("tests the approved cap first, retains it, and refines the same topology", async () => {
    const calls: string[] = [];
    let materializations = 0;
    const result = await solveTargetOutput(
      baseOptions({
        evaluate: async ({ topology, amountIn }) => {
          calls.push(`${topology.id}:${amountIn.toString()}`);
          return available(topology, amountIn);
        },
        materialize: async ({ topology, amountIn }) => {
          materializations += 1;
          return {
            status: "ready",
            protectedOutput: topology.multiplier * amountIn,
            quote: `${topology.id}:${amountIn.toString()}`,
          };
        },
      }),
    );

    assert.equal(result.status, "ready");
    if (result.status === "ready") {
      assert.equal(result.amountIn, 50n);
      assert.equal(result.protectedOutput, 500n);
      assert.equal(result.quote, "first:50");
      assert.equal(result.stats.retainedWitness, true);
    }
    assert.equal(calls[0], "first:100");
    assert.ok(calls.every((call) => call.startsWith("first:")));
    assert.equal(materializations, 1);
  });

  it("returns the first sufficient witness when the optional refinement budget is spent", async () => {
    const result = await solveTargetOutput(
      baseOptions({
        maxEvaluations: 1,
      }),
    );

    assert.equal(result.status, "ready");
    if (result.status === "ready") {
      assert.equal(result.amountIn, 100n);
      assert.equal(result.stopReason, "evaluation_budget");
      assert.equal(result.stats.evaluations, 1);
    }
  });

  it("tries another topology only after the selected route is insufficient at the cap", async () => {
    const weak = { id: "weak", multiplier: 4n } satisfies Topology;
    const calls: string[] = [];
    const result = await solveTargetOutput(
      baseOptions({
        topologies: [weak, second],
        evaluate: async ({ topology, amountIn }) => {
          calls.push(`${topology.id}:${amountIn.toString()}`);
          return available(topology, amountIn);
        },
      }),
    );

    assert.equal(result.status, "ready");
    if (result.status === "ready") {
      assert.equal(result.topology.id, "second");
      assert.equal(result.amountIn, 25n);
    }
    assert.deepEqual(calls.slice(0, 2), ["weak:100", "second:100"]);
    assert.ok(calls.slice(2).every((call) => call.startsWith("second:")));
  });

  it("permits fallback for invalidity but not for an ordinary RPC outage", async () => {
    const invalidCalls: string[] = [];
    const invalid = await solveTargetOutput(
      baseOptions({
        topologies: [first, second],
        evaluate: async ({ topology, amountIn }) => {
          invalidCalls.push(topology.id);
          return topology === first
            ? {
                status: "unavailable",
                reason: "invalid_topology",
                message: "route invalid",
              }
            : available(topology, amountIn);
        },
      }),
    );
    assert.equal(invalid.status, "ready");
    assert.deepEqual(invalidCalls.slice(0, 2), ["first", "second"]);

    const outageCalls: string[] = [];
    const outage = await solveTargetOutput(
      baseOptions({
        topologies: [first, second],
        evaluate: async ({ topology }) => {
          outageCalls.push(topology.id);
          return {
            status: "unavailable",
            reason: "rpc_unavailable",
            message: "local RPC unavailable",
          };
        },
      }),
    );
    assert.equal(outage.status, "route_unavailable");
    assert.deepEqual(outageCalls, ["first"]);
  });

  it("does not turn an unavailable refinement into a numeric bound", async () => {
    const calls: bigint[] = [];
    const result = await solveTargetOutput(
      baseOptions({
        evaluate: async ({ topology, amountIn }) => {
          calls.push(amountIn);
          if (amountIn !== 100n && amountIn !== 1n) {
            return {
              status: "unavailable",
              reason: "rpc_unavailable",
              message: "one refinement read failed",
            };
          }
          return available(topology, amountIn);
        },
      }),
    );

    assert.equal(result.status, "ready");
    if (result.status === "ready") {
      assert.equal(result.amountIn, 100n);
      assert.equal(result.stopReason, "unavailable_refinement");
      assert.equal(result.stats.unavailableEvaluations, 1);
    }
    assert.deepEqual(calls, [100n, 1n, 50n]);
  });

  it("returns a typed insufficient result when every topology misses at the cap", async () => {
    const result = await solveTargetOutput(
      baseOptions({
        topologies: [
          { id: "one", multiplier: 1n },
          { id: "two", multiplier: 2n },
        ],
      }),
    );

    assert.equal(result.status, "insufficient_maximum_input");
    assert.equal(result.stats.topologyAttempts, 2);
    assert.equal(result.stats.retainedWitness, false);
  });

  it("respects a cumulative RPC budget without discarding a witness", async () => {
    let reads = 0;
    const result = await solveTargetOutput(
      baseOptions({
        maxRpcReads: 1,
        rpcReads: () => reads,
        evaluate: async ({ topology, amountIn }) => {
          reads += 1;
          return available(topology, amountIn);
        },
      }),
    );

    assert.equal(result.status, "ready");
    if (result.status === "ready") {
      assert.equal(result.amountIn, 100n);
      assert.equal(result.stopReason, "rpc_budget");
      assert.equal(result.stats.rpcReads, 1);
    }
  });

  it("keeps one elapsed-time budget from selection lock through refinement", async () => {
    let now = 0;
    const result = await solveTargetOutput(
      baseOptions({
        startedAtMs: 0,
        timeoutMs: 100,
        materializationReserveMs: 20,
        now: () => now,
        evaluate: async ({ topology, amountIn }) => {
          now = 90;
          return available(topology, amountIn);
        },
      }),
    );

    assert.equal(result.status, "ready");
    if (result.status === "ready") {
      assert.equal(result.amountIn, 100n);
      assert.equal(result.stopReason, "time_budget");
      assert.equal(result.stats.elapsedMs, 90);
    }
  });

  it("times out even when an evaluator ignores its abort signal", async () => {
    const startedAt = Date.now();
    const result = await solveTargetOutput(
      baseOptions({
        timeoutMs: 25,
        evaluate: () => new Promise<TargetOutputEvaluation>(() => undefined),
      }),
    );

    assert.equal(result.status, "budget_exhausted");
    assert.ok(Date.now() - startedAt < 500);
  });

  it("fails closed when fresh materialization drops below the target", async () => {
    const result = await solveTargetOutput(
      baseOptions({
        maxEvaluations: 1,
        materialize: async () => ({
          status: "ready",
          protectedOutput: 499n,
          quote: "stale",
        }),
      }),
    );

    assert.equal(result.status, "final_materialization_below_target");
    assert.equal(result.stats.retainedWitness, true);
  });

  it("cancels speculative discovery without retaining block-dependent output", async () => {
    const controller = new AbortController();
    controller.abort();
    const result = await discoverTargetOutputTopology({
      signal: controller.signal,
      discover: async () => first,
    });
    assert.deepEqual(result, { status: "cancelled" });
  });

  it("cancels locked sizing without materializing a route", async () => {
    const controller = new AbortController();
    let materialized = false;
    const resultPromise = solveTargetOutput(
      baseOptions({
        signal: controller.signal,
        evaluate: async ({ signal }) => {
          controller.abort();
          assert.equal(signal.aborted, true);
          return available(first, 100n);
        },
        materialize: async () => {
          materialized = true;
          return { status: "ready", protectedOutput: 1_000n, quote: "no" };
        },
      }),
    );

    const result = await resultPromise;
    assert.equal(result.status, "cancelled");
    assert.equal(materialized, false);
  });

  it("converts evaluator exceptions into a typed unavailable result", async () => {
    const result = await solveTargetOutput(
      baseOptions({
        evaluate: async () => {
          throw new Error("local fork read failed");
        },
      }),
    );

    assert.equal(result.status, "route_unavailable");
    if (result.status === "route_unavailable") {
      assert.equal(result.message, "local fork read failed");
    }
    assert.equal(result.stats.unavailableEvaluations, 1);
  });
});

function requiredToken(address: typeof NATIVE_ETH | typeof USDC | typeof WETH) {
  const token = tokenForAddress(address);
  assert.ok(token);
  return token;
}

function candidateForPools(
  tokenIn: typeof NATIVE_ETH | typeof USDC | typeof WETH,
  poolIds: readonly string[],
) {
  const candidate = routeCandidatesForPair(tokenIn, FAME).candidates.find(
    (entry) =>
      entry.legs.length === poolIds.length &&
      entry.legs.every((leg, index) => leg.edge.poolId === poolIds[index]),
  );
  assert.ok(candidate, `missing candidate ${poolIds.join(" -> ")}`);
  return candidate;
}

const forkContext = {
  source: "fork",
  chainId: 8453,
  blockNumber: 49_000_000n,
  forkUrlLabel: "localhost",
} as const;

function outputMultiplier(edge: FamePoolEdge) {
  if (edge.poolId === "native-wrap-weth") return 1n;
  if (edge.poolId === "aerodrome-v2-usdc-weth") return 1_000_000_000_000n;
  return 1_000_000n;
}

function forkAdapter(): FameAsyncQuoteAdapter {
  return {
    quoteContext: forkContext,
    async quoteEdge({ edge, amountIn }) {
      return {
        status: "quoted",
        amountIn,
        amountOut: amountIn * outputMultiplier(edge),
        capacityIn: null,
        fee: edge.fee,
        evidence: `local fork block ${forkContext.blockNumber.toString()}`,
        context: forkContext,
      };
    },
  };
}

describe("FAME fork target-output solver", () => {
  const cases = [
    {
      tokenIn: NATIVE_ETH,
      pools: ["native-wrap-weth", "scale-equalizer-weth-fame"],
    },
    {
      tokenIn: USDC,
      pools: ["aerodrome-v2-usdc-weth", "scale-equalizer-weth-fame"],
    },
    {
      tokenIn: WETH,
      pools: ["scale-equalizer-weth-fame"],
    },
  ] as const;

  for (const testCase of cases) {
    it(`materializes a protected ${requiredToken(testCase.tokenIn).symbol} route at one fork block`, async () => {
      const tokenIn = requiredToken(testCase.tokenIn);
      const fame = tokenForAddress(FAME);
      assert.ok(fame);
      const selectedTopology = candidateForPools(
        testCase.tokenIn,
        testCase.pools,
      );
      const result = await solveFameTargetOutput({
        tokenIn,
        tokenOut: fame,
        selectedTopology,
        targetOutput: 1_000_000n,
        minimumInput: 1n,
        maximumInput: 100n,
        precision: 1n,
        routerAddress: "0x0000000000000000000000000000000000000009",
        recipient: "0x0000000000000000000000000000000000000010",
        deadline: 1_800_000_000n,
        feePpm: 0n,
        slippageBps: 0,
        adapter: forkAdapter(),
        expectedContext: forkContext,
        timeoutMs: 10_000,
        materializationReserveMs: 0,
      });

      assert.equal(result.status, "ready");
      if (result.status === "ready") {
        assert.ok(result.protectedOutput >= result.targetOutput);
        assert.equal(result.quote.route.recipient.endsWith("10"), true);
        assert.equal(result.quote.route.amountIn, result.amountIn);
        assert.deepEqual(result.quote.poolIds, testCase.pools);
        assert.equal(result.quote.plan.quoteContext?.source, "fork");
        assert.equal(
          result.quote.plan.quoteContext?.source === "fork"
            ? result.quote.plan.quoteContext.blockNumber
            : null,
          forkContext.blockNumber,
        );
      }
    });
  }

  it("rejects an adapter pinned to another fork block", async () => {
    const tokenIn = requiredToken(WETH);
    const fame = tokenForAddress(FAME);
    assert.ok(fame);
    const adapter = forkAdapter();
    adapter.quoteContext = { ...forkContext, blockNumber: 49_000_001n };
    const result = await solveFameTargetOutput({
      tokenIn,
      tokenOut: fame,
      selectedTopology: candidateForPools(WETH, ["scale-equalizer-weth-fame"]),
      targetOutput: 1_000_000n,
      minimumInput: 1n,
      maximumInput: 100n,
      precision: 1n,
      routerAddress: "0x0000000000000000000000000000000000000009",
      recipient: "0x0000000000000000000000000000000000000010",
      deadline: 1_800_000_000n,
      feePpm: 0n,
      slippageBps: 0,
      adapter,
      expectedContext: forkContext,
      timeoutMs: 10_000,
      materializationReserveMs: 0,
    });

    assert.equal(result.status, "route_unavailable");
    if (result.status === "route_unavailable") {
      assert.match(result.message, /not pinned to the locked fork block/u);
    }
  });

  it("rejects selected-route evidence that changes block inside the adapter", async () => {
    const tokenIn = requiredToken(WETH);
    const fame = tokenForAddress(FAME);
    assert.ok(fame);
    const adapter = forkAdapter();
    const quoteEdge = adapter.quoteEdge.bind(adapter);
    adapter.quoteEdge = async (request) => {
      const result = await quoteEdge(request);
      return result.status === "quoted"
        ? {
            ...result,
            context: { ...forkContext, blockNumber: 49_000_001n },
          }
        : result;
    };
    const result = await solveFameTargetOutput({
      tokenIn,
      tokenOut: fame,
      selectedTopology: candidateForPools(WETH, ["scale-equalizer-weth-fame"]),
      targetOutput: 1_000_000n,
      minimumInput: 1n,
      maximumInput: 100n,
      precision: 1n,
      routerAddress: "0x0000000000000000000000000000000000000009",
      recipient: "0x0000000000000000000000000000000000000010",
      deadline: 1_800_000_000n,
      feePpm: 0n,
      slippageBps: 0,
      adapter,
      expectedContext: forkContext,
      timeoutMs: 10_000,
      materializationReserveMs: 0,
    });

    assert.equal(result.status, "route_unavailable");
    if (result.status === "route_unavailable") {
      assert.match(result.message, /mixed quote evidence/u);
    }
  });
});
