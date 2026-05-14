---
title: "feat: Add FAME swap pre-approval quote fallback"
type: feat
status: complete
date: 2026-05-14
source_todo: .context/compound-engineering/todos/005-ready-p2-add-pre-approval-quote-fallback-for-fame-swap.md
---

# feat: Add FAME Swap Pre-Approval Quote Fallback

## Overview

Use the ready server quote output as the display fallback when browser bundled approval-plus-swap simulation cannot produce a pre-approval estimate. This should improve Receive / Min receive display while preserving the protected post-approval wallet simulation as the only swap submission gate.

## Requirements Trace

- Todo `005`: widget can show Receive and Min receive before approval on supported routes even when bundled browser simulation is unsupported.
- Todo `005`: fallback quote has a clear freshness timestamp and does not enable swap submission by itself.
- Todo `005`: protected post-approval simulation remains the final transaction gate.
- Todo `005`: errors distinguish unsupported RPC simulation from route execution failures.
- Todo `005`: tests cover browser-simulation success, browser-simulation failure with server fallback, and total estimate unavailability.

## Current-State Findings

- `FameSwapExecutableQuote` already carries `estimatedOutput`, `minAmountOutAfterFee`, `slippageBps`, and `expiresAt` from the server quote path.
- `useFameSwapTransaction()` uses wallet/RPC simulation output for display and protected-route construction; `canSwap` already depends on protected simulation success.
- `quoteView.ts` currently shows `Estimate unavailable` for ready quotes when wallet simulation output is absent and pending is false.
- `useFameSwapTransaction()` suppresses bundled simulation errors, so unsupported RPC simulation is not distinguished from route execution simulation failures in returned state.

## Scope Boundaries

- Do not let server quote fallback set `canSwap` or construct the protected transaction request.
- Do not change approval or swap submission flows.
- Do not add a new server endpoint; consume fields already present in the ready quote wire contract.
- Do not present fallback values as wallet-simulated outputs.

## Implementation Units

- [x] **Unit 1: Expose Bundled Simulation Failure Reason**

**Files:**

- Modify: `src/features/fame-swap/hooks/useFameSwapTransaction.ts`

**Approach:**

- Add a non-blocking `preApprovalSimulationError` state with `unsupported_rpc` vs `simulation_failed` reasons.
- Classify unsupported browser/RPC simulation errors separately from bundled route execution failures.
- Keep `error` reserved for protected route simulation, receipt, approval, and swap failures that can affect transaction safety.

- [x] **Unit 2: Use Server Quote Outputs As Display Fallback**

**Files:**

- Modify: `src/features/fame-swap/ui/quoteView.ts`
- Test: `src/features/fame-swap/ui/quoteView.test.ts`

**Approach:**

- Prefer wallet/RPC simulation output when available.
- While browser simulation is pending, keep the existing `Estimating` labels.
- When pending is false and wallet simulation has no output, display `quote.estimatedOutput` and `quote.minAmountOutAfterFee` with a source label tied to the quote expiry.
- Make fallback copy explicit that submission still depends on protected wallet simulation.

- [x] **Unit 3: Review, Verify, And Close Todo**

**Files:**

- Modify: `.context/compound-engineering/todos/005-ready-p2-add-pre-approval-quote-fallback-for-fame-swap.md`
- Optional: this plan file completion notes.

**Approach:**

- Run quote-view, widget, transaction-adjacent quote, and quote-wire tests.
- Run formatting/lint checks for touched files.
- Run a review pass and fix P1/P2 findings.
- Mark todo `005` complete only after verification passes.

## Verification Plan

- `bun test src/features/fame-swap/ui/quoteView.test.ts src/features/fame-swap/components/FameSwapWidget.test.ts src/features/fame-swap/solver/quoteWire.test.ts src/features/fame-swap/solver/quote.test.ts`
- `./node_modules/.bin/prettier --check src/features/fame-swap/hooks/useFameSwapTransaction.ts src/features/fame-swap/ui/quoteView.ts src/features/fame-swap/ui/quoteView.test.ts docs/plans/2026-05-14-007-fame-swap-pre-approval-fallback-plan.md`
- `yarn lint --file src/features/fame-swap/hooks/useFameSwapTransaction.ts --file src/features/fame-swap/ui/quoteView.ts --file src/features/fame-swap/ui/quoteView.test.ts`

## Risks

| Risk                                                       | Likelihood | Impact | Mitigation                                                                                                 |
| ---------------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| Fallback display is mistaken for a submit gate             | Medium     | High   | Keep `canSwap` unchanged and source copy explicit that protected wallet simulation still gates submission. |
| Fallback values become stale                               | Medium     | Medium | Tie fallback source label to the existing quote expiry/freshness label.                                    |
| Unsupported RPC simulation errors create alarming UI noise | Medium     | Low    | Keep the failure reason non-blocking and use it to explain fallback source, not as a blocking error.       |
| Route execution simulation failure gets hidden by fallback | Low        | High   | Keep protected simulation errors flowing through `transaction.error` and blocked reason.                   |

## Completion Notes

- Added non-blocking `preApprovalSimulationError` state to `useFameSwapTransaction()` so unsupported bundled simulation is distinguishable from bundled simulation failure.
- Updated quote view display logic to prefer wallet/RPC simulation, keep `Estimating` while pending, and fall back to server quote `estimatedOutput` / `minAmountOutAfterFee` when wallet simulation returns no output.
- Added a quote estimate source label with the quote expiry time and tooltip copy stating the fallback does not enable submission.
- Preserved protected post-approval wallet simulation as the `canSwap` gate; fallback values do not construct protected transaction requests.
- Review artifact: `.context/compound-engineering/ce-review/20260514-005-pre-approval-fallback-codex/summary.md`; no P1/P2 findings.
- Verification passed with quote-view, widget, quote-wire, and quote tests plus Prettier, lint, and diff whitespace checks.
