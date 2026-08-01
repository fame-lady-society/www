import type { Address } from "viem";
import type { FameSwapToken } from "../tokens";
import {
  materializeFameLockedCandidate,
  quoteFameLockedCandidate,
  type FameAmountSolverResult,
} from "./amountSolver";
import type { FameRouteCandidate } from "./graph/routePlan";
import type { FameAsyncQuoteAdapter } from "./quotes/adapters";
import {
  quoteContextLabel,
  type FameQuoteContext,
} from "./quotes/quoteContext";
import type { FameQuotedRoutePlan } from "./quotes/rankRoutes";

export type TargetOutputUnavailableReason =
  | "invalid_topology"
  | "liquidity_exhausted"
  | "rpc_unavailable"
  | "stale_context"
  | "timeout";

export type TargetOutputEvaluation =
  | Readonly<{
      status: "available";
      protectedOutput: bigint;
    }>
  | Readonly<{
      status: "unavailable";
      reason: TargetOutputUnavailableReason;
      message: string;
    }>;

export type TargetOutputMaterialization<TQuote> =
  | Readonly<{
      status: "ready";
      protectedOutput: bigint;
      quote: TQuote;
    }>
  | Readonly<{
      status: "unavailable";
      reason: TargetOutputUnavailableReason;
      message: string;
    }>;

export type TargetOutputStopReason =
  | "precision_reached"
  | "minimum_sufficient"
  | "evaluation_budget"
  | "rpc_budget"
  | "time_budget"
  | "unavailable_refinement";

export type TargetOutputSolverResult<TTopology, TQuote> =
  | Readonly<{
      status: "ready";
      topology: TTopology;
      amountIn: bigint;
      protectedOutput: bigint;
      targetOutput: bigint;
      quote: TQuote;
      stopReason: TargetOutputStopReason;
      stats: TargetOutputSolverStats;
    }>
  | Readonly<{
      status: "cancelled";
      message: string;
      stats: TargetOutputSolverStats;
    }>
  | Readonly<{
      status: "insufficient_maximum_input";
      message: string;
      stats: TargetOutputSolverStats;
    }>
  | Readonly<{
      status:
        | "budget_exhausted"
        | "route_unavailable"
        | "final_materialization_unavailable"
        | "final_materialization_below_target";
      message: string;
      stats: TargetOutputSolverStats;
    }>;

export type TargetOutputSolverStats = Readonly<{
  evaluations: number;
  evaluationLimit: number;
  unavailableEvaluations: number;
  topologyAttempts: number;
  rpcReads: number;
  elapsedMs: number;
  retainedWitness: boolean;
}>;

export type TargetOutputEvaluationRequest<TTopology> = Readonly<{
  topology: TTopology;
  amountIn: bigint;
  signal: AbortSignal;
  remainingTimeMs: number;
}>;

export interface TargetOutputSolverOptions<TTopology, TQuote> {
  topologies: readonly TTopology[];
  targetOutput: bigint;
  minimumInput: bigint;
  maximumInput: bigint;
  precision: bigint;
  timeoutMs: number;
  materializationReserveMs?: number;
  maxEvaluations?: number;
  maxRpcReads?: number;
  signal?: AbortSignal;
  startedAtMs?: number;
  now?: () => number;
  rpcReads?: () => number;
  evaluate: (
    request: TargetOutputEvaluationRequest<TTopology>,
  ) => Promise<TargetOutputEvaluation>;
  materialize: (
    request: TargetOutputEvaluationRequest<TTopology>,
  ) => Promise<TargetOutputMaterialization<TQuote>>;
}

export interface FameTargetOutputSolverOptions {
  tokenIn: FameSwapToken;
  tokenOut: FameSwapToken;
  selectedTopology: FameRouteCandidate;
  fallbackTopologies?: readonly FameRouteCandidate[];
  targetOutput: bigint;
  minimumInput: bigint;
  maximumInput: bigint;
  precision: bigint;
  routerAddress: Address;
  recipient: Address;
  deadline: bigint;
  feePpm: bigint;
  slippageBps: number;
  adapter: FameAsyncQuoteAdapter;
  expectedContext: Extract<FameQuoteContext, { source: "fork" }>;
  timeoutMs: number;
  materializationReserveMs?: number;
  maxEvaluations?: number;
  maxRpcReads?: number;
  rpcReads?: () => number;
  signal?: AbortSignal;
  startedAtMs?: number;
  now?: () => number;
}

export type FameTargetOutputSolverResult = TargetOutputSolverResult<
  FameRouteCandidate,
  Extract<FameAmountSolverResult, { status: "ready" }>
>;

export type TargetOutputDiscoveryResult<TTopology> =
  | Readonly<{ status: "ready"; topology: TTopology }>
  | Readonly<{ status: "cancelled" }>
  | Readonly<{ status: "unavailable"; message: string }>;

type BoundedResult<T> =
  | { status: "complete"; value: T }
  | { status: "cancelled" }
  | { status: "timeout" };

function binaryRefinementSteps(range: bigint, precision: bigint): number {
  if (range <= precision) return 0;
  let intervals = (range + precision - 1n) / precision;
  let steps = 0;
  while (intervals > 1n) {
    intervals = (intervals + 1n) / 2n;
    steps += 1;
  }
  return steps;
}

export function targetOutputEvaluationLimit(options: {
  topologyCount: number;
  minimumInput: bigint;
  maximumInput: bigint;
  precision: bigint;
}): number {
  if (options.topologyCount <= 0) return 0;
  if (options.minimumInput <= 0n) {
    throw new Error("Target-output minimum input must be positive.");
  }
  if (options.maximumInput < options.minimumInput) {
    throw new Error("Target-output maximum input must cover the minimum.");
  }
  if (options.precision <= 0n) {
    throw new Error("Target-output precision must be positive.");
  }
  return (
    options.topologyCount +
    (options.maximumInput === options.minimumInput ? 0 : 1) +
    binaryRefinementSteps(
      options.maximumInput - options.minimumInput,
      options.precision,
    )
  );
}

function fallbackEligible(reason: TargetOutputUnavailableReason): boolean {
  return reason === "invalid_topology" || reason === "liquidity_exhausted";
}

function midpoint(lower: bigint, upper: bigint, precision: bigint) {
  const raw = lower + (upper - lower) / 2n;
  let aligned = (raw / precision) * precision;
  if (aligned <= lower) aligned = lower + precision;
  return aligned < upper ? aligned : null;
}

export async function discoverTargetOutputTopology<TTopology>(options: {
  signal: AbortSignal;
  discover: (signal: AbortSignal) => Promise<TTopology | null>;
}): Promise<TargetOutputDiscoveryResult<TTopology>> {
  if (options.signal.aborted) return { status: "cancelled" };
  try {
    const topology = await options.discover(options.signal);
    if (options.signal.aborted) return { status: "cancelled" };
    return topology
      ? { status: "ready", topology }
      : { status: "unavailable", message: "No route topology was discovered." };
  } catch (error) {
    if (options.signal.aborted) return { status: "cancelled" };
    return {
      status: "unavailable",
      message:
        error instanceof Error ? error.message : "Route discovery failed.",
    };
  }
}

export async function solveTargetOutput<TTopology, TQuote>(
  options: TargetOutputSolverOptions<TTopology, TQuote>,
): Promise<TargetOutputSolverResult<TTopology, TQuote>> {
  if (options.topologies.length === 0) {
    throw new Error("Target-output solving requires at least one topology.");
  }
  if (options.targetOutput <= 0n) {
    throw new Error("Target-output amount must be positive.");
  }
  const mathematicalLimit = targetOutputEvaluationLimit({
    topologyCount: options.topologies.length,
    minimumInput: options.minimumInput,
    maximumInput: options.maximumInput,
    precision: options.precision,
  });
  const evaluationLimit = Math.min(
    mathematicalLimit,
    Math.max(0, Math.floor(options.maxEvaluations ?? mathematicalLimit)),
  );
  const now = options.now ?? Date.now;
  const startedAtMs = options.startedAtMs ?? now();
  const materializationReserveMs = Math.max(
    0,
    Math.floor(options.materializationReserveMs ?? 500),
  );
  let evaluations = 0;
  let unavailableEvaluations = 0;
  let topologyAttempts = 0;
  let retainedWitness = false;

  const rpcReads = () => Math.max(0, options.rpcReads?.() ?? 0);
  const elapsedMs = () => Math.max(0, now() - startedAtMs);
  const remainingTimeMs = () =>
    Math.max(0, Math.floor(options.timeoutMs - elapsedMs()));
  const stats = (): TargetOutputSolverStats => ({
    evaluations,
    evaluationLimit,
    unavailableEvaluations,
    topologyAttempts,
    rpcReads: rpcReads(),
    elapsedMs: elapsedMs(),
    retainedWitness,
  });
  const cancelled = () => options.signal?.aborted === true;
  const rpcExhausted = () =>
    options.maxRpcReads !== undefined && rpcReads() >= options.maxRpcReads;

  async function runBounded<T>(
    operation: (signal: AbortSignal, remaining: number) => Promise<T>,
    reserveMs: number,
  ): Promise<BoundedResult<T>> {
    if (cancelled()) return { status: "cancelled" };
    const remaining = remainingTimeMs() - reserveMs;
    if (remaining <= 0) return { status: "timeout" };

    const controller = new AbortController();
    const abort = () => controller.abort();
    options.signal?.addEventListener("abort", abort, { once: true });
    const timeout = setTimeout(abort, remaining);
    try {
      const value = await operation(controller.signal, remaining);
      if (cancelled()) return { status: "cancelled" };
      if (controller.signal.aborted) return { status: "timeout" };
      return { status: "complete", value };
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener("abort", abort);
    }
  }

  async function evaluate(
    topology: TTopology,
    amountIn: bigint,
  ): Promise<BoundedResult<TargetOutputEvaluation> | null> {
    if (evaluations >= evaluationLimit || rpcExhausted()) return null;
    let result: BoundedResult<TargetOutputEvaluation>;
    try {
      result = await runBounded(
        (signal, remaining) =>
          options.evaluate({
            topology,
            amountIn,
            signal,
            remainingTimeMs: remaining,
          }),
        materializationReserveMs,
      );
    } catch (error) {
      if (cancelled()) return { status: "cancelled" } as const;
      result = {
        status: "complete",
        value: {
          status: "unavailable",
          reason: "rpc_unavailable",
          message:
            error instanceof Error
              ? error.message
              : "The route evaluation failed.",
        },
      };
    }
    if (result.status !== "complete") return result;
    evaluations += 1;
    if (result.value.status === "unavailable") unavailableEvaluations += 1;
    return result;
  }

  let witness:
    | {
        topology: TTopology;
        amountIn: bigint;
        protectedOutput: bigint;
      }
    | undefined;
  let allMaximumsInsufficient = true;

  for (const topology of options.topologies) {
    topologyAttempts += 1;
    const upper = await evaluate(topology, options.maximumInput);
    if (!upper) break;
    if (upper.status === "cancelled") {
      return {
        status: "cancelled",
        message: "Route sizing was cancelled.",
        stats: stats(),
      };
    }
    if (upper.status === "timeout") {
      return {
        status: "budget_exhausted",
        message:
          "Route sizing ran out of time before finding a sufficient input.",
        stats: stats(),
      };
    }
    if (upper.value.status === "unavailable") {
      allMaximumsInsufficient = false;
      if (fallbackEligible(upper.value.reason)) continue;
      return {
        status: "route_unavailable",
        message: upper.value.message,
        stats: stats(),
      };
    }
    if (upper.value.protectedOutput < options.targetOutput) continue;

    witness = {
      topology,
      amountIn: options.maximumInput,
      protectedOutput: upper.value.protectedOutput,
    };
    retainedWitness = true;
    break;
  }

  if (!witness) {
    if (cancelled()) {
      return {
        status: "cancelled",
        message: "Route sizing was cancelled.",
        stats: stats(),
      };
    }
    if (
      allMaximumsInsufficient &&
      topologyAttempts === options.topologies.length
    ) {
      return {
        status: "insufficient_maximum_input",
        message:
          "No route topology can reach the FAME target within the approved maximum input.",
        stats: stats(),
      };
    }
    return {
      status: "budget_exhausted",
      message:
        "Route sizing exhausted its budget before finding a sufficient input.",
      stats: stats(),
    };
  }

  let lower = options.minimumInput;
  let stopReason: TargetOutputStopReason = "precision_reached";
  if (witness.amountIn !== lower) {
    const lowerResult = await evaluate(witness.topology, lower);
    if (!lowerResult) {
      stopReason = rpcExhausted() ? "rpc_budget" : "evaluation_budget";
    } else if (lowerResult.status === "cancelled") {
      return {
        status: "cancelled",
        message: "Route sizing was cancelled.",
        stats: stats(),
      };
    } else if (lowerResult.status === "timeout") {
      stopReason = "time_budget";
    } else if (lowerResult.value.status === "unavailable") {
      stopReason = "unavailable_refinement";
    } else if (lowerResult.value.protectedOutput >= options.targetOutput) {
      witness = {
        ...witness,
        amountIn: lower,
        protectedOutput: lowerResult.value.protectedOutput,
      };
      stopReason = "minimum_sufficient";
    } else {
      while (witness.amountIn - lower > options.precision) {
        if (evaluations >= evaluationLimit) {
          stopReason = "evaluation_budget";
          break;
        }
        if (rpcExhausted()) {
          stopReason = "rpc_budget";
          break;
        }
        const next = midpoint(lower, witness.amountIn, options.precision);
        if (next === null) break;
        const refinement = await evaluate(witness.topology, next);
        if (!refinement) {
          stopReason = rpcExhausted() ? "rpc_budget" : "evaluation_budget";
          break;
        }
        if (refinement.status === "cancelled") {
          return {
            status: "cancelled",
            message: "Route sizing was cancelled.",
            stats: stats(),
          };
        }
        if (refinement.status === "timeout") {
          stopReason = "time_budget";
          break;
        }
        if (refinement.value.status === "unavailable") {
          stopReason = "unavailable_refinement";
          break;
        }
        if (refinement.value.protectedOutput >= options.targetOutput) {
          witness = {
            ...witness,
            amountIn: next,
            protectedOutput: refinement.value.protectedOutput,
          };
        } else {
          lower = next;
        }
      }
    }
  } else {
    stopReason = "minimum_sufficient";
  }

  let materialized: BoundedResult<TargetOutputMaterialization<TQuote>>;
  try {
    materialized = await runBounded(
      (signal, remaining) =>
        options.materialize({
          topology: witness.topology,
          amountIn: witness.amountIn,
          signal,
          remainingTimeMs: remaining,
        }),
      0,
    );
  } catch (error) {
    materialized = {
      status: "complete",
      value: {
        status: "unavailable",
        reason: "rpc_unavailable",
        message:
          error instanceof Error
            ? error.message
            : "The retained route could not be materialized.",
      },
    };
  }
  if (materialized.status === "cancelled") {
    return {
      status: "cancelled",
      message: "Route sizing was cancelled.",
      stats: stats(),
    };
  }
  if (materialized.status === "timeout") {
    return {
      status: "final_materialization_unavailable",
      message:
        "The retained route could not be materialized before the quote deadline.",
      stats: stats(),
    };
  }
  if (materialized.value.status === "unavailable") {
    return {
      status: "final_materialization_unavailable",
      message: materialized.value.message,
      stats: stats(),
    };
  }
  if (materialized.value.protectedOutput < options.targetOutput) {
    return {
      status: "final_materialization_below_target",
      message:
        "The retained route no longer protects the required FAME output.",
      stats: stats(),
    };
  }

  return {
    status: "ready",
    topology: witness.topology,
    amountIn: witness.amountIn,
    protectedOutput: materialized.value.protectedOutput,
    targetOutput: options.targetOutput,
    quote: materialized.value.quote,
    stopReason,
    stats: stats(),
  };
}

function sameQuoteContext(
  actual: FameQuoteContext | undefined,
  expected: FameQuoteContext,
) {
  return actual && quoteContextLabel(actual) === quoteContextLabel(expected);
}

function unavailableFromCandidateRejection(
  rejection: Extract<
    Awaited<ReturnType<typeof quoteFameLockedCandidate>>,
    { status: "unavailable" }
  >,
): Extract<TargetOutputEvaluation, { status: "unavailable" }> {
  const reason = rejection.rejection.reason;
  return {
    status: "unavailable",
    reason:
      reason === "amount_exceeds_capacity" || reason === "zero_output"
        ? "liquidity_exhausted"
        : reason === "unsafe_output"
          ? "invalid_topology"
          : "rpc_unavailable",
    message: rejection.rejection.message,
  };
}

export async function solveFameTargetOutput(
  options: FameTargetOutputSolverOptions,
): Promise<FameTargetOutputSolverResult> {
  const seen = new Set<string>();
  const topologies = [
    options.selectedTopology,
    ...(options.fallbackTopologies ?? []),
  ].filter((topology) => {
    if (seen.has(topology.id)) return false;
    seen.add(topology.id);
    return true;
  });

  const quote = async (
    topology: FameRouteCandidate,
    amountIn: bigint,
  ): Promise<
    | Readonly<{
        status: "ready";
        protectedOutput: bigint;
        plan: FameQuotedRoutePlan;
      }>
    | Extract<TargetOutputEvaluation, { status: "unavailable" }>
  > => {
    if (
      !sameQuoteContext(options.adapter.quoteContext, options.expectedContext)
    ) {
      return {
        status: "unavailable",
        reason: "stale_context",
        message:
          "The browser quote adapter is not pinned to the locked fork block.",
      };
    }
    const result = await quoteFameLockedCandidate({
      candidate: topology,
      amountIn,
      feePpm: options.feePpm,
      slippageBps: options.slippageBps,
      adapter: options.adapter,
    });
    if (result.status === "unavailable") {
      return unavailableFromCandidateRejection(result);
    }
    if (
      !sameQuoteContext(result.plan.quoteContext, options.expectedContext) ||
      result.plan.legQuotes.some(
        (leg) => !sameQuoteContext(leg.quoteContext, options.expectedContext),
      )
    ) {
      return {
        status: "unavailable",
        reason: "stale_context",
        message: "The selected route mixed quote evidence from another block.",
      };
    }
    return {
      status: "ready",
      protectedOutput: result.plan.protectedAmountOut,
      plan: result.plan,
    };
  };

  return solveTargetOutput({
    topologies,
    targetOutput: options.targetOutput,
    minimumInput: options.minimumInput,
    maximumInput: options.maximumInput,
    precision: options.precision,
    timeoutMs: options.timeoutMs,
    materializationReserveMs: options.materializationReserveMs,
    maxEvaluations: options.maxEvaluations,
    maxRpcReads: options.maxRpcReads,
    rpcReads: options.rpcReads,
    signal: options.signal,
    startedAtMs: options.startedAtMs,
    now: options.now,
    evaluate: async ({ topology, amountIn }) => {
      const result = await quote(topology, amountIn);
      return result.status === "ready"
        ? { status: "available", protectedOutput: result.protectedOutput }
        : result;
    },
    materialize: async ({ topology, amountIn }) => {
      const result = await quote(topology, amountIn);
      if (result.status !== "ready") return result;
      return {
        status: "ready",
        protectedOutput: result.protectedOutput,
        quote: materializeFameLockedCandidate(
          {
            tokenIn: options.tokenIn,
            tokenOut: options.tokenOut,
            amountIn,
            routerAddress: options.routerAddress,
            recipient: options.recipient,
            deadline: options.deadline,
            feePpm: options.feePpm,
            slippageBps: options.slippageBps,
          },
          result.plan,
        ),
      };
    },
  });
}
