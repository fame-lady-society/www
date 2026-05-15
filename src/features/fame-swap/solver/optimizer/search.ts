import type {
  FameAsyncQuoteAdapter,
  FameQuoteAdapter,
} from "../quotes/adapters";
import type { FameRouteCandidate } from "../graph/routePlan";
import { rankRouteCandidatesAsync } from "../quotes/asyncRankRoutes";
import type { FameQuotedRoutePlan } from "../quotes/rankRoutes";
import {
  cloneOptimizerStats,
  consumeOptimizerTemplate,
  createFameOptimizerRunContext,
  markOptimizerFallback,
  optimizerTimeRemainingMs,
  optimizerTimedOut,
} from "./runContext";
import { createOptimizerQuoteAdapter } from "./quoteRunAdapter";
import { routeOptimizerTemplatesForPair, templatePoolIds } from "./templates";
import { evaluateAllocationTrial } from "./evaluate";
import type {
  FameAllocationTrialEvidence,
  FameAllocationTrialStatus,
  FameOptimizerAllocation,
  FameOptimizerBudgets,
  FameOptimizerEvidence,
  FameOptimizerFailureReason,
  FameOptimizerMode,
  FameOptimizerRouteTemplate,
  FameOptimizerSearchAlgorithm,
  FameOptimizerStopReason,
  FameRouteOptimizerResult,
} from "./types";

export const FAME_OPTIMIZER_COARSE_ALLOCATION_BPS = [
  0, 500, 1_000, 2_000, 3_500, 5_000, 6_500, 8_000, 9_000, 9_500, 10_000,
] as const;

const REFINE_WINDOW_BPS = 1_000;
const REFINE_STEP_BPS = 250;
const ADAPTIVE_MIN_INTERVAL_BPS = 250;
const ADAPTIVE_STEP_BPS = 50;
const COORDINATE_DESCENT_STEP_BPS = 1_000;
const MAX_COORDINATE_DESCENT_ROUNDS = 2;
const COMPLEX_ROUTE_MIN_WIN_BPS = 1n;
const MAX_CONCURRENT_OPTIMIZER_TEMPLATES = 2;
const MAX_CONCURRENT_OPTIMIZER_TRIALS = 4;
const STATUS_ORDER: Record<FameAllocationTrialStatus, number> = {
  selected: 0,
  rejected: 0,
  pruned: 0,
  budget_exhausted: 0,
  quote_failed: 0,
  unsupported_shape: 0,
  ineligible: 0,
};

function shapeRank(plan: FameQuotedRoutePlan): number {
  switch (plan.candidate.kind) {
    case "single_path":
      return 0;
    case "split":
      return 1;
    case "split_merge":
      return 2;
  }
}

function betterPlan(
  left: FameQuotedRoutePlan,
  right: FameQuotedRoutePlan | null,
): boolean {
  if (!right) return true;
  if (left.protectedAmountOut !== right.protectedAmountOut) {
    return left.protectedAmountOut > right.protectedAmountOut;
  }
  const leftShape = shapeRank(left);
  const rightShape = shapeRank(right);
  if (leftShape !== rightShape) return leftShape < rightShape;
  if (left.candidate.legs.length !== right.candidate.legs.length) {
    return left.candidate.legs.length < right.candidate.legs.length;
  }
  return left.candidate.id.localeCompare(right.candidate.id) < 0;
}

function winningMarginAmount(
  selected: bigint | null,
  baseline: bigint | null,
): bigint | null {
  if (selected === null || baseline === null) return null;
  return selected - baseline;
}

function winningMarginBps(
  selected: bigint | null,
  baseline: bigint | null,
): number | null {
  if (selected === null || baseline === null || baseline <= 0n) return null;
  return Number(((selected - baseline) * 10_000n) / baseline);
}

function complexWinThreshold(baseline: bigint): bigint {
  const bps = (baseline * COMPLEX_ROUTE_MIN_WIN_BPS) / 10_000n;
  return bps > 0n ? bps : 1n;
}

function clearsComplexThreshold(
  plan: FameQuotedRoutePlan,
  baseline: FameQuotedRoutePlan | null,
): boolean {
  if (plan.candidate.kind === "single_path" || !baseline) return true;
  return (
    plan.protectedAmountOut - baseline.protectedAmountOut >=
    complexWinThreshold(baseline.protectedAmountOut)
  );
}

function trialStatusCounts(
  trials: readonly FameAllocationTrialEvidence[],
): Record<FameAllocationTrialStatus, number> {
  const counts = { ...STATUS_ORDER };
  for (const trial of trials) {
    counts[trial.status] = (counts[trial.status] ?? 0) + 1;
  }
  return counts;
}

function selectedTrial(
  trials: readonly FameAllocationTrialEvidence[],
  selectedPlan: FameQuotedRoutePlan | null,
): FameAllocationTrialEvidence | null {
  if (!selectedPlan) return null;
  return (
    trials.find((trial) => trial.candidateId === selectedPlan.candidate.id) ??
    null
  );
}

function evidence(options: {
  mode: FameOptimizerMode;
  status: FameOptimizerEvidence["status"];
  run: ReturnType<typeof createFameOptimizerRunContext>;
  selectedPlan: FameQuotedRoutePlan | null;
  selectedTemplateId: string | null;
  selectedAllocationBps: number | null;
  baselinePlan: FameQuotedRoutePlan | null;
  trials: FameAllocationTrialEvidence[];
  fallbackReason: FameOptimizerFailureReason | null;
  templateEligibility: FameOptimizerEvidence["templateEligibility"];
}): FameOptimizerEvidence {
  const trial = selectedTrial(options.trials, options.selectedPlan);
  return {
    mode: options.mode,
    status: options.status,
    quoteContext: options.run.quoteContext,
    selectedTemplateId: options.selectedTemplateId,
    selectedAllocationBps: options.selectedAllocationBps,
    selectedAllocationVectorBps: trial?.allocationVectorBps ?? null,
    selectedAlgorithm: trial?.algorithm ?? null,
    selectedStopReason: trial?.stopReason ?? null,
    selectedCandidateId: options.selectedPlan?.candidate.id ?? null,
    objective: {
      baselineProtectedAmountOut:
        options.baselinePlan?.protectedAmountOut ?? null,
      selectedProtectedAmountOut:
        options.selectedPlan?.protectedAmountOut ?? null,
      winningMarginAmount: winningMarginAmount(
        options.selectedPlan?.protectedAmountOut ?? null,
        options.baselinePlan?.protectedAmountOut ?? null,
      ),
      winningMarginBps: winningMarginBps(
        options.selectedPlan?.protectedAmountOut ?? null,
        options.baselinePlan?.protectedAmountOut ?? null,
      ),
    },
    trialStatusCounts: trialStatusCounts(options.trials),
    allocationTrials: options.trials,
    templateEligibility: options.templateEligibility,
    quotePlanStats: cloneOptimizerStats(options.run),
    fallbackReason: options.fallbackReason,
  };
}

function allocationSequence(refineCenters: readonly number[]): number[] {
  const points = new Set<number>(FAME_OPTIMIZER_COARSE_ALLOCATION_BPS);
  for (const center of refineCenters) {
    const min = Math.max(0, center - REFINE_WINDOW_BPS);
    const max = Math.min(10_000, center + REFINE_WINDOW_BPS);
    for (let bps = min; bps <= max; bps += REFINE_STEP_BPS) {
      points.add(bps);
    }
  }
  return [...points].sort((left, right) => {
    const leftDistance = Math.min(
      ...refineCenters.map((center) => Math.abs(left - center)),
    );
    const rightDistance = Math.min(
      ...refineCenters.map((center) => Math.abs(right - center)),
    );
    if (leftDistance !== rightDistance) return leftDistance - rightDistance;
    return left - right;
  });
}

function allocationBps(allocation: FameOptimizerAllocation): number | null {
  if (typeof allocation === "number") return allocation;
  if (Array.isArray(allocation)) return allocation[0] ?? null;
  return null;
}

function allocationKey(allocation: FameOptimizerAllocation): string {
  if (allocation === null) return "null";
  return Array.isArray(allocation)
    ? allocation.join(":")
    : allocation.toString();
}

function equalAllocationVector(branchCount: number): number[] {
  const base = Math.floor(10_000 / branchCount);
  const vector = Array.from({ length: branchCount }, () => base);
  vector[0] += 10_000 - base * branchCount;
  return vector;
}

function vectorWithTransfer(
  vector: readonly number[],
  fromIndex: number,
  toIndex: number,
  amountBps: number,
): number[] | null {
  if ((vector[fromIndex] ?? 0) < amountBps) return null;
  return vector.map((value, index) => {
    if (index === fromIndex) return value - amountBps;
    if (index === toIndex) return value + amountBps;
    return value;
  });
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(concurrency, items.length || 1));

  async function worker() {
    for (;;) {
      const index = nextIndex;
      nextIndex += 1;
      const item = items[index];
      if (item === undefined) return;
      results[index] = await mapper(item, index);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

function rejectedCandidateFromTrial(
  evidence: FameAllocationTrialEvidence,
): FameRouteOptimizerResult["rejectedCandidates"][number] | null {
  if (!evidence.candidateId) return null;
  return {
    candidateId: evidence.candidateId,
    reason:
      evidence.status === "quote_failed"
        ? "adapter_failure"
        : "no_quote_evidence",
    message: evidence.reason,
  };
}

function prunedTrial(
  template: FameOptimizerRouteTemplate,
  allocation: FameOptimizerAllocation,
  maxTrials: number,
  algorithm: FameOptimizerSearchAlgorithm,
): FameAllocationTrialEvidence {
  return {
    templateId: template.id,
    allocationBps: allocationBps(allocation),
    allocationVectorBps: Array.isArray(allocation) ? allocation : undefined,
    algorithm,
    stopReason: "quote_budget",
    status: "pruned",
    reason: `Template trial budget ${maxTrials.toString()} reached.`,
    poolIds: template.branches.map((branch) => branch.edge.poolId),
  };
}

function splitTrialBudget(
  allocations: readonly FameOptimizerAllocation[],
  usedTrials: number,
  maxTrials: number,
): {
  runnable: FameOptimizerAllocation[];
  pruned: FameOptimizerAllocation[];
} {
  const remaining = Math.max(0, maxTrials - usedTrials);
  return {
    runnable: allocations.slice(0, remaining),
    pruned: allocations.slice(remaining),
  };
}

function consumedTemplateTrials(
  trials: readonly FameAllocationTrialEvidence[],
  templateId: string,
): number {
  return trials.filter(
    (trial) => trial.templateId === templateId && trial.status !== "ineligible",
  ).length;
}

async function settleUntilDeadline<T>(
  run: ReturnType<typeof createFameOptimizerRunContext>,
  promises: readonly Promise<T>[],
): Promise<Awaited<T>[] | null> {
  if (promises.length === 0) return [];
  if (optimizerTimedOut(run)) {
    markOptimizerFallback(run, "timeout");
    return null;
  }

  const safe = Promise.all(
    promises.map((promise) => promise.catch(() => null)),
  );
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const raced = await Promise.race([
      safe,
      new Promise<null>((resolve) => {
        timeout = setTimeout(() => {
          markOptimizerFallback(run, "timeout");
          resolve(null);
        }, optimizerTimeRemainingMs(run));
      }),
    ]);
    if (!raced) return null;
    return raced.filter((value): value is Awaited<T> => value !== null);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function evaluateAllocationBatch(options: {
  run: ReturnType<typeof createFameOptimizerRunContext>;
  allocations: readonly FameOptimizerAllocation[];
  evaluate: (
    allocation: FameOptimizerAllocation,
    algorithm: FameOptimizerSearchAlgorithm,
    stopReason?: FameOptimizerStopReason,
  ) => Promise<Awaited<ReturnType<typeof evaluateAllocationTrial>>>;
  algorithm: FameOptimizerSearchAlgorithm;
  stopReason?: FameOptimizerStopReason;
}): Promise<Awaited<ReturnType<typeof evaluateAllocationTrial>>[] | null> {
  const results: Awaited<ReturnType<typeof evaluateAllocationTrial>>[] = [];
  for (
    let index = 0;
    index < options.allocations.length;
    index += MAX_CONCURRENT_OPTIMIZER_TRIALS
  ) {
    const wave = options.allocations.slice(
      index,
      index + MAX_CONCURRENT_OPTIMIZER_TRIALS,
    );
    const settled = await settleUntilDeadline(
      options.run,
      wave.map((allocation) =>
        options.evaluate(allocation, options.algorithm, options.stopReason),
      ),
    );
    if (!settled) return results.length > 0 ? results : null;
    results.push(...settled);
    if (optimizerTimedOut(options.run)) return results;
  }
  return results;
}

function templateEdges(template: FameOptimizerRouteTemplate) {
  return [
    ...(template.prefix ?? []),
    ...template.branches.map((branch) => branch.edge),
    ...template.suffix,
  ];
}

function isAdaptiveSupportedEdge(
  edge: FameOptimizerRouteTemplate["branches"][number]["edge"],
): boolean {
  if (edge.venue === "NativeWrap") return true;
  const pool = edge.pool;
  if (pool.venue === "uniswap-v2") return true;
  if (pool.venue === "solidly" || pool.venue === "aerodrome-v2") {
    return pool.stable === false;
  }
  return false;
}

function unsupportedAdaptiveReason(
  template: FameOptimizerRouteTemplate,
): FameOptimizerStopReason | null {
  if (template.branches.length !== 2) return "unsupported_protocol";
  return templateEdges(template).every(isAdaptiveSupportedEdge)
    ? null
    : "unsupported_protocol";
}

function gridSamples(trials: readonly FameAllocationTrialEvidence[]) {
  return trials
    .filter(
      (trial) =>
        trial.algorithm === "grid" &&
        typeof trial.allocationBps === "number" &&
        trial.protectedAmountOut !== undefined,
    )
    .map((trial) => ({
      bps: trial.allocationBps as number,
      protectedAmountOut: trial.protectedAmountOut as bigint,
    }))
    .sort((left, right) => left.bps - right.bps);
}

function adaptiveFallbackReason(options: {
  template: FameOptimizerRouteTemplate;
  trials: readonly FameAllocationTrialEvidence[];
}): FameOptimizerStopReason | null {
  const unsupported = unsupportedAdaptiveReason(options.template);
  if (unsupported) return unsupported;
  if (
    options.trials.some(
      (trial) =>
        trial.status === "quote_failed" || trial.status === "unsupported_shape",
    )
  ) {
    return "quote_failure";
  }
  if (
    options.trials.some(
      (trial) =>
        trial.status === "budget_exhausted" || trial.status === "pruned",
    )
  ) {
    return "quote_budget";
  }

  const samples = gridSamples(options.trials);
  if (samples.length < 5) return "non_unimodal_samples";
  const bestIndex = samples.reduce(
    (best, sample, index) =>
      sample.protectedAmountOut > samples[best].protectedAmountOut
        ? index
        : best,
    0,
  );
  if (bestIndex === 0 || bestIndex === samples.length - 1) {
    return "no_improvement";
  }

  for (let index = 1; index <= bestIndex; index += 1) {
    if (
      samples[index].protectedAmountOut < samples[index - 1].protectedAmountOut
    ) {
      return "non_unimodal_samples";
    }
  }
  for (let index = bestIndex + 1; index < samples.length; index += 1) {
    if (
      samples[index].protectedAmountOut > samples[index - 1].protectedAmountOut
    ) {
      return "non_unimodal_samples";
    }
  }

  return null;
}

function roundBps(value: number): number {
  return Math.max(
    0,
    Math.min(10_000, Math.round(value / ADAPTIVE_STEP_BPS) * ADAPTIVE_STEP_BPS),
  );
}

function adaptiveBracket(
  trials: readonly FameAllocationTrialEvidence[],
): { left: number; right: number } | null {
  const samples = gridSamples(trials);
  if (samples.length < 3) return null;
  const bestIndex = samples.reduce(
    (best, sample, index) =>
      sample.protectedAmountOut > samples[best].protectedAmountOut
        ? index
        : best,
    0,
  );
  const left = samples[bestIndex - 1]?.bps;
  const right = samples[bestIndex + 1]?.bps;
  return left === undefined || right === undefined ? null : { left, right };
}

function localMathGateTrial(
  template: FameOptimizerRouteTemplate,
): FameAllocationTrialEvidence | null {
  if (template.kind === "single_path") return null;
  if (!templateEdges(template).every(isAdaptiveSupportedEdge)) return null;
  return {
    templateId: template.id,
    allocationBps: null,
    algorithm: "local_math",
    stopReason: "unsupported_protocol",
    status: "ineligible",
    reason:
      "Local marginal-price allocation requires an explicit adapter capability with complete pinned-block state.",
    poolIds: templatePoolIds(template),
  };
}

async function evaluateTemplate(options: {
  template: FameOptimizerRouteTemplate;
  amountIn: bigint;
  feePpm: bigint;
  slippageBps: number;
  adapter: FameAsyncQuoteAdapter;
  run: ReturnType<typeof createFameOptimizerRunContext>;
  baselinePlan: FameQuotedRoutePlan | null;
}): Promise<{
  bestPlan: FameQuotedRoutePlan | null;
  bestAllocationBps: number | null;
  bestAllocation: FameOptimizerAllocation;
  trials: FameAllocationTrialEvidence[];
  rejectedCandidates: FameRouteOptimizerResult["rejectedCandidates"];
}> {
  const trials: FameAllocationTrialEvidence[] = [];
  const rejectedCandidates: FameRouteOptimizerResult["rejectedCandidates"] = [];
  let bestPlan: FameQuotedRoutePlan | null = null;
  let bestAllocationBps: number | null = null;
  let bestAllocation: FameOptimizerAllocation = null;

  async function evaluate(
    allocation: FameOptimizerAllocation,
    algorithm: FameOptimizerSearchAlgorithm,
    stopReason?: FameOptimizerStopReason,
  ) {
    return evaluateAllocationTrial({
      ...options,
      allocation,
      algorithm,
      stopReason,
      baselineProtectedAmountOut:
        options.baselinePlan?.protectedAmountOut ?? null,
    });
  }

  function record(evaluated: Awaited<ReturnType<typeof evaluate>>) {
    trials.push(evaluated.evidence);
    if (evaluated.plan && betterPlan(evaluated.plan, bestPlan)) {
      bestPlan = evaluated.plan;
      bestAllocationBps = evaluated.evidence.allocationBps;
      bestAllocation = evaluated.evidence.allocationVectorBps
        ? [...evaluated.evidence.allocationVectorBps]
        : evaluated.evidence.allocationBps;
      return;
    }

    if (!evaluated.plan) {
      const rejection = rejectedCandidateFromTrial(evaluated.evidence);
      if (rejection) rejectedCandidates.push(rejection);
    }
  }

  const localMathTrial = localMathGateTrial(options.template);
  if (localMathTrial) trials.push(localMathTrial);

  if (options.template.branches.length > 2) {
    const seen = new Set<string>();
    let currentVector = equalAllocationVector(options.template.branches.length);
    let currentPlan: FameQuotedRoutePlan | null = null;

    async function evaluateVector(vector: readonly number[]) {
      const key = allocationKey(vector);
      if (seen.has(key)) return null;
      seen.add(key);
      const evaluated = await evaluate(
        vector,
        "coordinate_descent",
        "convergence",
      );
      record(evaluated);
      return evaluated;
    }

    const initial = await evaluateVector(currentVector);
    if (initial?.plan) currentPlan = initial.plan;

    for (
      let round = 0;
      round < MAX_COORDINATE_DESCENT_ROUNDS && currentPlan;
      round += 1
    ) {
      const candidates: number[][] = [];
      for (
        let fromIndex = 0;
        fromIndex < currentVector.length;
        fromIndex += 1
      ) {
        for (let toIndex = 0; toIndex < currentVector.length; toIndex += 1) {
          if (fromIndex === toIndex) continue;
          const moved = vectorWithTransfer(
            currentVector,
            fromIndex,
            toIndex,
            COORDINATE_DESCENT_STEP_BPS,
          );
          if (moved) {
            const key = allocationKey(moved);
            if (seen.has(key)) continue;
            seen.add(key);
            candidates.push(moved);
          }
        }
      }

      const budget = splitTrialBudget(
        candidates,
        consumedTemplateTrials(trials, options.template.id),
        options.run.budgets.maxTrialsPerTemplate,
      );
      const results = await evaluateAllocationBatch({
        run: options.run,
        allocations: budget.runnable,
        evaluate,
        algorithm: "coordinate_descent",
        stopReason: "convergence",
      });
      if (!results) break;
      const previousBest = bestPlan;
      for (const evaluated of results) record(evaluated);
      for (const allocation of budget.pruned) {
        trials.push(
          prunedTrial(
            options.template,
            allocation,
            options.run.budgets.maxTrialsPerTemplate,
            "coordinate_descent",
          ),
        );
      }

      if (!bestPlan || bestPlan === previousBest) {
        trials.push({
          templateId: options.template.id,
          allocationBps: currentVector[0] ?? null,
          allocationVectorBps: currentVector,
          algorithm: "coordinate_descent",
          stopReason: "no_improvement",
          status: "pruned",
          reason:
            "Coordinate descent stopped because no pairwise move improved the best allocation.",
          poolIds: options.template.branches.map(
            (branch) => branch.edge.poolId,
          ),
        });
        break;
      }

      const selected = trials.find(
        (trial) => trial.candidateId === bestPlan?.candidate.id,
      );
      if (selected?.allocationVectorBps) {
        currentVector = [...selected.allocationVectorBps];
        currentPlan = bestPlan;
      }
    }

    return {
      bestPlan,
      bestAllocationBps,
      bestAllocation,
      trials,
      rejectedCandidates,
    };
  }

  const firstPass =
    options.template.kind === "single_path"
      ? [null]
      : [...FAME_OPTIMIZER_COARSE_ALLOCATION_BPS];
  const firstPassBudget = splitTrialBudget(
    firstPass,
    consumedTemplateTrials(trials, options.template.id),
    options.run.budgets.maxTrialsPerTemplate,
  );

  const firstPassResults = await evaluateAllocationBatch({
    run: options.run,
    allocations: firstPassBudget.runnable,
    evaluate,
    algorithm: "grid",
    stopReason: "grid_complete",
  });
  if (!firstPassResults)
    return {
      bestPlan,
      bestAllocationBps,
      bestAllocation,
      trials,
      rejectedCandidates,
    };
  for (const evaluated of firstPassResults) record(evaluated);
  for (const allocationBps of firstPassBudget.pruned) {
    trials.push(
      prunedTrial(
        options.template,
        allocationBps,
        options.run.budgets.maxTrialsPerTemplate,
        "grid",
      ),
    );
  }

  if (options.template.kind !== "single_path" && bestAllocationBps !== null) {
    const fallbackReason = adaptiveFallbackReason({
      template: options.template,
      trials,
    });
    if (!fallbackReason) {
      let bracket = adaptiveBracket(trials);
      const seen = new Set(trials.map((trial) => trial.allocationBps));
      while (
        bracket &&
        bracket.right - bracket.left > ADAPTIVE_MIN_INTERVAL_BPS
      ) {
        const leftMid = roundBps(
          bracket.left + (bracket.right - bracket.left) / 3,
        );
        const rightMid = roundBps(
          bracket.right - (bracket.right - bracket.left) / 3,
        );
        const adaptiveAllocations = [leftMid, rightMid].filter(
          (allocationBps, index, values) =>
            allocationBps > bracket!.left &&
            allocationBps < bracket!.right &&
            !seen.has(allocationBps) &&
            values.indexOf(allocationBps) === index,
        );
        if (adaptiveAllocations.length === 0) break;
        for (const allocation of adaptiveAllocations) seen.add(allocation);
        const adaptiveResults = await evaluateAllocationBatch({
          run: options.run,
          allocations: adaptiveAllocations,
          evaluate,
          algorithm: "adaptive_2way",
          stopReason: "convergence",
        });
        if (!adaptiveResults) break;
        for (const evaluated of adaptiveResults) record(evaluated);

        const leftTrial = adaptiveResults.find(
          (result) => result.evidence.allocationBps === leftMid,
        );
        const rightTrial = adaptiveResults.find(
          (result) => result.evidence.allocationBps === rightMid,
        );
        if (!leftTrial?.plan || !rightTrial?.plan) break;
        if (
          leftTrial.plan.protectedAmountOut < rightTrial.plan.protectedAmountOut
        ) {
          bracket = { left: leftMid, right: bracket.right };
        } else {
          bracket = { left: bracket.left, right: rightMid };
        }
      }
    } else {
      const failedCoarseCenters = trials
        .filter(
          (trial) =>
            trial.status === "quote_failed" &&
            typeof trial.allocationBps === "number" &&
            Math.abs(trial.allocationBps - bestAllocationBps!) <=
              REFINE_WINDOW_BPS * 2,
        )
        .map((trial) => trial.allocationBps!);
      const refineAllocations = allocationSequence([
        bestAllocationBps,
        ...failedCoarseCenters,
      ]).filter(
        (allocationBps) =>
          !trials.some((trial) => trial.allocationBps === allocationBps),
      );
      const refineBudget = splitTrialBudget(
        refineAllocations,
        consumedTemplateTrials(trials, options.template.id),
        options.run.budgets.maxTrialsPerTemplate,
      );
      const refineResults = await evaluateAllocationBatch({
        run: options.run,
        allocations: refineBudget.runnable,
        evaluate,
        algorithm: "grid",
        stopReason: fallbackReason,
      });
      if (!refineResults)
        return {
          bestPlan,
          bestAllocationBps,
          bestAllocation,
          trials,
          rejectedCandidates,
        };
      for (const evaluated of refineResults) record(evaluated);
      for (const allocationBps of refineBudget.pruned) {
        trials.push(
          prunedTrial(
            options.template,
            allocationBps,
            options.run.budgets.maxTrialsPerTemplate,
            "grid",
          ),
        );
      }
    }
  }

  return {
    bestPlan,
    bestAllocationBps,
    bestAllocation,
    trials,
    rejectedCandidates,
  };
}

async function evaluateBaseline(options: {
  templates: readonly FameOptimizerRouteTemplate[];
  amountIn: bigint;
  feePpm: bigint;
  slippageBps: number;
  adapter: FameAsyncQuoteAdapter;
  run: ReturnType<typeof createFameOptimizerRunContext>;
}): Promise<{
  plan: FameQuotedRoutePlan | null;
  templateId: string | null;
  rejectedCandidates: FameRouteOptimizerResult["rejectedCandidates"];
}> {
  const baselineCandidates = options.templates
    .map((template) => template.baselineCandidate)
    .filter((candidate): candidate is FameRouteCandidate => Boolean(candidate));

  if (baselineCandidates.length === 0) {
    return {
      plan: null,
      templateId: null,
      rejectedCandidates: [],
    };
  }

  const ranked = await rankRouteCandidatesAsync({
    candidates: baselineCandidates,
    amountIn: options.amountIn,
    feePpm: options.feePpm,
    slippageBps: options.slippageBps,
    adapter: options.adapter,
    quoteContext: options.adapter.quoteContext ?? options.run.quoteContext,
  });

  if (ranked.status !== "selected") {
    return {
      plan: null,
      templateId: null,
      rejectedCandidates: ranked.rejectedCandidates,
    };
  }

  const template = options.templates.find(
    (entry) => entry.baselineCandidate?.id === ranked.plan.candidate.id,
  );
  return {
    plan: ranked.plan,
    templateId: template?.id ?? null,
    rejectedCandidates: ranked.rejectedCandidates,
  };
}

export async function optimizeRouteAllocations(options: {
  tokenIn: FameOptimizerRouteTemplate["tokenIn"];
  tokenOut: FameOptimizerRouteTemplate["tokenOut"];
  amountIn: bigint;
  feePpm: bigint;
  slippageBps: number;
  adapter: FameQuoteAdapter | FameAsyncQuoteAdapter;
  mode?: FameOptimizerMode;
  budgets?: Partial<FameOptimizerBudgets>;
}): Promise<FameRouteOptimizerResult> {
  const mode = options.mode ?? "select";
  const run = createFameOptimizerRunContext({
    quoteContext: options.adapter.quoteContext,
    budgets: options.budgets,
  });
  const adapter = createOptimizerQuoteAdapter({
    adapter: options.adapter,
    run,
    adapterId: "optimizer",
  });
  const templateSet = routeOptimizerTemplatesForPair(
    options.tokenIn,
    options.tokenOut,
  );
  const trials: FameAllocationTrialEvidence[] = [];
  const rejectedCandidates: FameRouteOptimizerResult["rejectedCandidates"] = [];
  let bestPlan: FameQuotedRoutePlan | null = null;
  let bestTemplateId: string | null = null;
  let bestAllocationBps: number | null = null;
  let bestAllocation: FameOptimizerAllocation = null;
  let baselinePlan: FameQuotedRoutePlan | null = null;
  let baselineTemplateId: string | null = null;
  let baselineAllocationBps: number | null = null;

  const splitTemplates = templateSet.templates.filter(
    (entry) => entry.kind !== "single_path",
  );
  const baselineTemplates = templateSet.templates.filter(
    (entry) => entry.kind === "single_path",
  );

  if (templateSet.templates.length === 0) {
    markOptimizerFallback(run, "no_templates");
    return {
      status: "fallback_required",
      reason: "no_templates",
      rejectedCandidates,
      evidence: evidence({
        mode,
        status: "fallback",
        run,
        selectedPlan: null,
        selectedTemplateId: null,
        selectedAllocationBps: null,
        baselinePlan: null,
        trials,
        fallbackReason: "no_templates",
        templateEligibility: templateSet.eligibility,
      }),
    };
  }

  const scheduledTemplates: FameOptimizerRouteTemplate[] = [];

  if (!optimizerTimedOut(run)) {
    const baselineResults = await settleUntilDeadline(run, [
      evaluateBaseline({
        templates: baselineTemplates,
        amountIn: options.amountIn,
        feePpm: options.feePpm,
        slippageBps: options.slippageBps,
        adapter,
        run,
      }),
    ]);
    const baseline = baselineResults?.[0];
    if (baseline) {
      baselinePlan = baseline.plan;
      baselineTemplateId = baseline.templateId;
      baselineAllocationBps = null;
      rejectedCandidates.push(...baseline.rejectedCandidates);
      if (baselinePlan) {
        bestPlan = baselinePlan;
        bestTemplateId = baselineTemplateId;
        bestAllocationBps = baselineAllocationBps;
        bestAllocation = baselineAllocationBps;
      }
    }
  } else {
    markOptimizerFallback(run, "timeout");
  }

  if (!optimizerTimedOut(run)) {
    for (const template of splitTemplates) {
      try {
        consumeOptimizerTemplate(run);
        scheduledTemplates.push(template);
      } catch {
        trials.push({
          templateId: template.id,
          allocationBps: null,
          algorithm: "grid",
          stopReason: "quote_budget",
          status: "budget_exhausted",
          reason: `Template budget ${run.budgets.maxTemplates.toString()} reached.`,
          poolIds: [],
        });
        break;
      }
    }
  } else {
    markOptimizerFallback(run, "timeout");
  }

  const templateResults = await mapWithConcurrency(
    scheduledTemplates,
    MAX_CONCURRENT_OPTIMIZER_TEMPLATES,
    async (template) => ({
      template,
      result: await evaluateTemplate({
        template,
        amountIn: options.amountIn,
        feePpm: options.feePpm,
        slippageBps: options.slippageBps,
        adapter,
        run,
        baselinePlan,
      }),
    }),
  );

  for (const { template, result } of templateResults) {
    trials.push(...result.trials);
    rejectedCandidates.push(...result.rejectedCandidates);

    if (result.bestPlan) {
      if (betterPlan(result.bestPlan, bestPlan)) {
        bestPlan = result.bestPlan;
        bestTemplateId = template.id;
        bestAllocationBps = result.bestAllocationBps;
        bestAllocation = result.bestAllocation;
      }
    }
  }

  if (optimizerTimedOut(run)) {
    markOptimizerFallback(run, "timeout");
  }

  if (!bestPlan) {
    const reason: FameOptimizerFailureReason =
      run.stats.fallbackReason ??
      (run.stats.budgetExhaustions > 0 ? "budget_exhausted" : "no_safe_route");
    markOptimizerFallback(run, reason);
    return {
      status: "fallback_required",
      reason,
      rejectedCandidates,
      evidence: evidence({
        mode,
        status: "fallback",
        run,
        selectedPlan: null,
        selectedTemplateId: null,
        selectedAllocationBps: null,
        baselinePlan,
        trials,
        fallbackReason: reason,
        templateEligibility: templateSet.eligibility,
      }),
    };
  }

  if (!clearsComplexThreshold(bestPlan, baselinePlan)) {
    bestPlan = baselinePlan ?? bestPlan;
    bestTemplateId = baselineTemplateId ?? bestTemplateId;
    bestAllocationBps = baselineAllocationBps;
    bestAllocation = baselineAllocationBps;
  }

  if (!optimizerTimedOut(run) && run.stats.budgetExhaustions === 0) {
    const validationResults = await settleUntilDeadline(run, [
      evaluateAllocationTrial({
        template:
          templateSet.templates.find(
            (template) => template.id === bestTemplateId,
          ) ?? templateSet.templates[0],
        allocation: bestAllocation,
        algorithm: "grid",
        stopReason: "grid_complete",
        amountIn: options.amountIn,
        feePpm: options.feePpm,
        slippageBps: options.slippageBps,
        adapter,
        run,
        baselineProtectedAmountOut: baselinePlan?.protectedAmountOut ?? null,
      }),
    ]);
    const validation = validationResults?.[0];
    if (!validation) {
      markOptimizerFallback(run, "timeout");
    } else if (
      !validation.plan ||
      validation.plan.protectedAmountOut < bestPlan.protectedAmountOut
    ) {
      markOptimizerFallback(run, "validation_failed");
      return {
        status: "fallback_required",
        reason: "validation_failed",
        rejectedCandidates,
        evidence: evidence({
          mode,
          status: "fallback",
          run,
          selectedPlan: null,
          selectedTemplateId: bestTemplateId,
          selectedAllocationBps: bestAllocationBps,
          baselinePlan,
          trials,
          fallbackReason: "validation_failed",
          templateEligibility: templateSet.eligibility,
        }),
      };
    }
  } else if (run.stats.budgetExhaustions > 0) {
    markOptimizerFallback(run, "budget_exhausted");
  } else {
    markOptimizerFallback(run, "timeout");
  }

  const selectedCandidateId = bestPlan.candidate.id;
  const markedTrials = trials.map((trial) =>
    trial.candidateId === selectedCandidateId
      ? {
          ...trial,
          status: "selected" as const,
          reason: "Selected by protected-output objective.",
        }
      : trial,
  );
  const selectedEvidence = evidence({
    mode,
    status: "selected",
    run,
    selectedPlan: bestPlan,
    selectedTemplateId: bestTemplateId,
    selectedAllocationBps: bestAllocationBps,
    baselinePlan,
    trials: markedTrials,
    fallbackReason: null,
    templateEligibility: templateSet.eligibility,
  });

  return {
    status: "selected",
    plan: bestPlan,
    evidence: selectedEvidence,
    rejectedCandidates,
  };
}
