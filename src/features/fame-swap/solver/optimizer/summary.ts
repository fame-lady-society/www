import type { FameSwapOptimizerSummary } from "../types";
import type { FameOptimizerEvidence } from "./types";

export function optimizerSummaryFromEvidence(
  evidence: FameOptimizerEvidence | undefined,
): FameSwapOptimizerSummary | undefined {
  if (!evidence) return undefined;

  return {
    mode: evidence.mode,
    status: evidence.status,
    selectedTemplateId: evidence.selectedTemplateId,
    selectedAllocationBps: evidence.selectedAllocationBps,
    selectedCandidateId: evidence.selectedCandidateId,
    winningMarginBps: evidence.objective.winningMarginBps,
    trialStatusCounts: evidence.trialStatusCounts,
    fallbackReason: evidence.fallbackReason,
    runStats: {
      logicalQuoteRequests: evidence.quotePlanStats.logicalQuoteRequests,
      uniqueExactQuoteReads: evidence.quotePlanStats.uniqueExactQuoteReads,
      exactQuoteCacheHits: evidence.quotePlanStats.exactQuoteCacheHits,
      trials: evidence.quotePlanStats.allocationTrials,
      templatesConsidered: evidence.quotePlanStats.templatesConsidered,
      budgetExhaustions: evidence.quotePlanStats.budgetExhaustions,
      timeout: evidence.quotePlanStats.timeout,
    },
  };
}
