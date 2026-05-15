import { quoteContextLabel, type FameQuoteContext } from "../quotes/quoteContext";
import type {
  FameOptimizerBudgets,
  FameOptimizerFailureReason,
  FameOptimizerQuotePlanStats,
  FameOptimizerRunContext,
} from "./types";

export const DEFAULT_FAME_OPTIMIZER_BUDGETS: FameOptimizerBudgets = {
  maxTemplates: 32,
  maxTrialsPerTemplate: 16,
  maxLogicalQuoteRequests: 320,
  maxUniqueExactQuoteReads: 180,
  maxUniqueStateReads: 80,
  maxUnderlyingRpcReads: 240,
  timeoutMs: 9_500,
};

export class FameOptimizerBudgetExceededError extends Error {
  readonly reason: FameOptimizerFailureReason = "budget_exhausted";

  constructor(readonly budget: keyof FameOptimizerBudgets) {
    super(`FAME optimizer ${budget} budget exhausted.`);
    this.name = "FameOptimizerBudgetExceededError";
  }
}

function emptyStats(): FameOptimizerQuotePlanStats {
  return {
    logicalQuoteRequests: 0,
    uniqueExactQuoteReads: 0,
    exactQuoteCacheHits: 0,
    inFlightExactQuoteCoalesces: 0,
    stateReadRequests: 0,
    uniqueStateReads: 0,
    stateReadCacheHits: 0,
    inFlightStateReadCoalesces: 0,
    underlyingRpcReads: 0,
    allocationTrials: 0,
    templatesConsidered: 0,
    budgetExhaustions: 0,
    timeout: false,
    fallbackReason: null,
  };
}

function normalizeBudgetValue(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}

export function normalizeOptimizerBudgets(
  budgets: Partial<FameOptimizerBudgets> = {},
): FameOptimizerBudgets {
  return {
    maxTemplates: normalizeBudgetValue(
      budgets.maxTemplates ?? DEFAULT_FAME_OPTIMIZER_BUDGETS.maxTemplates,
      DEFAULT_FAME_OPTIMIZER_BUDGETS.maxTemplates,
    ),
    maxTrialsPerTemplate: normalizeBudgetValue(
      budgets.maxTrialsPerTemplate ??
        DEFAULT_FAME_OPTIMIZER_BUDGETS.maxTrialsPerTemplate,
      DEFAULT_FAME_OPTIMIZER_BUDGETS.maxTrialsPerTemplate,
    ),
    maxLogicalQuoteRequests: normalizeBudgetValue(
      budgets.maxLogicalQuoteRequests ??
        DEFAULT_FAME_OPTIMIZER_BUDGETS.maxLogicalQuoteRequests,
      DEFAULT_FAME_OPTIMIZER_BUDGETS.maxLogicalQuoteRequests,
    ),
    maxUniqueExactQuoteReads: normalizeBudgetValue(
      budgets.maxUniqueExactQuoteReads ??
        DEFAULT_FAME_OPTIMIZER_BUDGETS.maxUniqueExactQuoteReads,
      DEFAULT_FAME_OPTIMIZER_BUDGETS.maxUniqueExactQuoteReads,
    ),
    maxUniqueStateReads: normalizeBudgetValue(
      budgets.maxUniqueStateReads ??
        DEFAULT_FAME_OPTIMIZER_BUDGETS.maxUniqueStateReads,
      DEFAULT_FAME_OPTIMIZER_BUDGETS.maxUniqueStateReads,
    ),
    maxUnderlyingRpcReads: normalizeBudgetValue(
      budgets.maxUnderlyingRpcReads ??
        DEFAULT_FAME_OPTIMIZER_BUDGETS.maxUnderlyingRpcReads,
      DEFAULT_FAME_OPTIMIZER_BUDGETS.maxUnderlyingRpcReads,
    ),
    timeoutMs: normalizeBudgetValue(
      budgets.timeoutMs ?? DEFAULT_FAME_OPTIMIZER_BUDGETS.timeoutMs,
      DEFAULT_FAME_OPTIMIZER_BUDGETS.timeoutMs,
    ),
  };
}

export function quoteContextCacheKey(context?: FameQuoteContext): string {
  return context ? quoteContextLabel(context) : "quote-context:none";
}

export function createFameOptimizerRunContext(options: {
  quoteContext?: FameQuoteContext;
  budgets?: Partial<FameOptimizerBudgets>;
  startedAtMs?: number;
} = {}): FameOptimizerRunContext {
  return {
    quoteContext: options.quoteContext,
    budgets: normalizeOptimizerBudgets(options.budgets),
    stats: emptyStats(),
    startedAtMs: options.startedAtMs ?? Date.now(),
    quoteContextKey: quoteContextCacheKey(options.quoteContext),
  };
}

export function markOptimizerFallback(
  run: FameOptimizerRunContext,
  reason: FameOptimizerFailureReason,
) {
  run.stats.fallbackReason = reason;
  if (reason === "timeout") run.stats.timeout = true;
}

export function optimizerTimedOut(
  run: FameOptimizerRunContext,
  nowMs = Date.now(),
): boolean {
  if (run.budgets.timeoutMs <= 0) return true;
  return nowMs - run.startedAtMs > run.budgets.timeoutMs;
}

export function optimizerTimeRemainingMs(
  run: FameOptimizerRunContext,
  nowMs = Date.now(),
): number {
  return Math.max(0, run.budgets.timeoutMs - (nowMs - run.startedAtMs));
}

function budgetExceeded(
  run: FameOptimizerRunContext,
  budget: keyof FameOptimizerBudgets,
): never {
  run.stats.budgetExhaustions += 1;
  throw new FameOptimizerBudgetExceededError(budget);
}

export function consumeOptimizerTemplate(run: FameOptimizerRunContext): void {
  if (run.stats.templatesConsidered >= run.budgets.maxTemplates) {
    budgetExceeded(run, "maxTemplates");
  }
  run.stats.templatesConsidered += 1;
}

export function consumeOptimizerTrial(run: FameOptimizerRunContext): void {
  run.stats.allocationTrials += 1;
}

export function consumeLogicalQuoteRequest(run: FameOptimizerRunContext): void {
  if (run.stats.logicalQuoteRequests >= run.budgets.maxLogicalQuoteRequests) {
    budgetExceeded(run, "maxLogicalQuoteRequests");
  }
  run.stats.logicalQuoteRequests += 1;
}

export function consumeUniqueExactQuoteRead(run: FameOptimizerRunContext): void {
  if (run.stats.uniqueExactQuoteReads >= run.budgets.maxUniqueExactQuoteReads) {
    budgetExceeded(run, "maxUniqueExactQuoteReads");
  }
  run.stats.uniqueExactQuoteReads += 1;
}

export function consumeStateReadRequest(run: FameOptimizerRunContext): void {
  run.stats.stateReadRequests += 1;
}

export function consumeUniqueStateRead(run: FameOptimizerRunContext): void {
  if (run.stats.uniqueStateReads >= run.budgets.maxUniqueStateReads) {
    budgetExceeded(run, "maxUniqueStateReads");
  }
  run.stats.uniqueStateReads += 1;
}

export function consumeUnderlyingRpcRead(run: FameOptimizerRunContext): void {
  if (run.stats.underlyingRpcReads >= run.budgets.maxUnderlyingRpcReads) {
    budgetExceeded(run, "maxUnderlyingRpcReads");
  }
  run.stats.underlyingRpcReads += 1;
}

export function cloneOptimizerStats(
  run: FameOptimizerRunContext,
): FameOptimizerQuotePlanStats {
  return { ...run.stats };
}
