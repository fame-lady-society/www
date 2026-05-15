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
import { routeOptimizerTemplatesForPair } from "./templates";
import { evaluateAllocationTrial } from "./evaluate";
import type {
  FameAllocationTrialEvidence,
  FameAllocationTrialStatus,
  FameOptimizerBudgets,
  FameOptimizerEvidence,
  FameOptimizerFailureReason,
  FameOptimizerMode,
  FameOptimizerRouteTemplate,
  FameRouteOptimizerResult,
} from "./types";

export const FAME_OPTIMIZER_COARSE_ALLOCATION_BPS = [
  0,
  500,
  1_000,
  2_000,
  3_500,
  5_000,
  6_500,
  8_000,
  9_000,
  9_500,
  10_000,
] as const;

const REFINE_WINDOW_BPS = 1_000;
const REFINE_STEP_BPS = 250;
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
  return {
    mode: options.mode,
    status: options.status,
    quoteContext: options.run.quoteContext,
    selectedTemplateId: options.selectedTemplateId,
    selectedAllocationBps: options.selectedAllocationBps,
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
  allocationBps: number | null,
  maxTrials: number,
): FameAllocationTrialEvidence {
  return {
    templateId: template.id,
    allocationBps,
    status: "pruned",
    reason: `Template trial budget ${maxTrials.toString()} reached.`,
    poolIds: template.branches.map((branch) => branch.edge.poolId),
  };
}

function splitTrialBudget(
  allocations: readonly (number | null)[],
  usedTrials: number,
  maxTrials: number,
): {
  runnable: (number | null)[];
  pruned: (number | null)[];
} {
  const remaining = Math.max(0, maxTrials - usedTrials);
  return {
    runnable: allocations.slice(0, remaining),
    pruned: allocations.slice(remaining),
  };
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

  const safe = Promise.all(promises.map((promise) => promise.catch(() => null)));
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
  allocations: readonly (number | null)[];
  evaluate: (allocationBps: number | null) => Promise<Awaited<ReturnType<typeof evaluateAllocationTrial>>>;
}): Promise<Awaited<ReturnType<typeof evaluateAllocationTrial>>[] | null> {
  const results: Awaited<ReturnType<typeof evaluateAllocationTrial>>[] = [];
  for (let index = 0; index < options.allocations.length; index += MAX_CONCURRENT_OPTIMIZER_TRIALS) {
    const wave = options.allocations.slice(
      index,
      index + MAX_CONCURRENT_OPTIMIZER_TRIALS,
    );
    const settled = await settleUntilDeadline(
      options.run,
      wave.map((allocationBps) => options.evaluate(allocationBps)),
    );
    if (!settled) return results.length > 0 ? results : null;
    results.push(...settled);
    if (optimizerTimedOut(options.run)) return results;
  }
  return results;
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
  trials: FameAllocationTrialEvidence[];
  rejectedCandidates: FameRouteOptimizerResult["rejectedCandidates"];
}> {
  const trials: FameAllocationTrialEvidence[] = [];
  const rejectedCandidates: FameRouteOptimizerResult["rejectedCandidates"] = [];
  let bestPlan: FameQuotedRoutePlan | null = null;
  let bestAllocationBps: number | null = null;

  async function evaluate(allocationBps: number | null) {
    return evaluateAllocationTrial({
      ...options,
      allocationBps,
      baselineProtectedAmountOut:
        options.baselinePlan?.protectedAmountOut ?? null,
    });
  }

  function record(evaluated: Awaited<ReturnType<typeof evaluate>>) {
    trials.push(evaluated.evidence);
    if (evaluated.plan && betterPlan(evaluated.plan, bestPlan)) {
      bestPlan = evaluated.plan;
      bestAllocationBps = evaluated.evidence.allocationBps;
      return;
    }

    if (!evaluated.plan) {
      const rejection = rejectedCandidateFromTrial(evaluated.evidence);
      if (rejection) rejectedCandidates.push(rejection);
    }
  }

  const firstPass =
    options.template.kind === "single_path"
      ? [null]
      : [...FAME_OPTIMIZER_COARSE_ALLOCATION_BPS];
  const firstPassBudget = splitTrialBudget(
    firstPass,
    trials.length,
    options.run.budgets.maxTrialsPerTemplate,
  );

  const firstPassResults = await evaluateAllocationBatch({
    run: options.run,
    allocations: firstPassBudget.runnable,
    evaluate,
  });
  if (!firstPassResults) return {
    bestPlan,
    bestAllocationBps,
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
      ),
    );
  }

  if (options.template.kind !== "single_path" && bestAllocationBps !== null) {
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
      trials.filter((trial) => trial.templateId === options.template.id).length,
      options.run.budgets.maxTrialsPerTemplate,
    );
    const refineResults = await evaluateAllocationBatch({
      run: options.run,
      allocations: refineBudget.runnable,
      evaluate,
    });
    if (!refineResults) return {
      bestPlan,
      bestAllocationBps,
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
        ),
      );
    }
  }

  return {
    bestPlan,
    bestAllocationBps,
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
    for (const template of splitTemplates) {
      try {
        consumeOptimizerTemplate(run);
        scheduledTemplates.push(template);
      } catch {
        trials.push({
          templateId: template.id,
          allocationBps: null,
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
      }
    }
  }

  if (optimizerTimedOut(run)) {
    markOptimizerFallback(run, "timeout");
  }

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
      if (baselinePlan && betterPlan(baselinePlan, bestPlan)) {
        bestPlan = baselinePlan;
        bestTemplateId = baselineTemplateId;
        bestAllocationBps = baselineAllocationBps;
      }
    }
  } else {
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
  }

  if (!optimizerTimedOut(run) && run.stats.budgetExhaustions === 0) {
    const validationResults = await settleUntilDeadline(run, [
      evaluateAllocationTrial({
        template:
          templateSet.templates.find((template) => template.id === bestTemplateId) ??
          templateSet.templates[0],
        allocationBps: bestAllocationBps,
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
