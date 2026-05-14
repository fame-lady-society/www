---
title: "feat: Show FAME swap venue fee labels"
type: feat
status: complete
date: 2026-05-14
source_todo: .context/compound-engineering/todos/004-ready-p2-estimate-liquidity-fees-for-fame-swap-routes.md
---

# feat: Show FAME Swap Venue Fee Labels

## Overview

Surface reviewed venue/pool fee labels in the FAME swap quote UI without pretending they are live fee reads. The solver already carries pool fee descriptors on quoted legs, so this pass should expose those labels in the quote panel and route graph while keeping the FLS router fee separate.

## Requirements Trace

- Todo `004`: every pinned FAME swap route leg has a reviewed liquidity-fee label or explicit unavailable reason.
- Todo `004`: quote panel distinguishes FLS router fee from venue liquidity fees.
- Todo `004`: route graph shows per-leg fee labels without implying unsupported precision.
- Todo `004`: tests cover all pinned route artifacts and fail when a new pool lacks fee metadata.
- Todo `004`: copy avoids presenting liquidity fees as live estimates unless they are actually read live.

## Current-State Findings

- `FamePoolEdge` already includes `fee: FamePoolFeeDescriptor`, derived from the checked-in pool universe metadata.
- `rankRoutes.ts` and `asyncRankRoutes.ts` carry `feeBreakdown.legs`, with each selected leg retaining the pool fee descriptor and `feeIncludedInQuote: true`.
- `quoteView.ts` only exposes the FLS router fee in `feeLabel`; it does not expose venue fee labels to `QuotePanel` or `RouteMap`.
- `poolUniverse.test.ts` verifies fee descriptors for known edges, but it does not explicitly fail when a pinned route references a pool without reviewed fee metadata.

## Scope Boundaries

- Do not add live pool metadata reads in this todo.
- Do not decode route payload fee fields; rely on reviewed pool metadata already used by the solver.
- Do not calculate exact paid fee amounts per leg unless adapters provide that data.
- Do not present a summed route-wide fee as a live total for split/multi-hop paths.

## Implementation Units

- [x] **Unit 1: Add Fee Labels To Quote View Model**

**Files:**

- Modify: `src/features/fame-swap/ui/quoteView.ts`
- Test: `src/features/fame-swap/ui/quoteView.test.ts`

**Approach:**

- Add `venueFeeLabel` and `venueFeeTooltip` to `FameSwapQuoteView`.
- Add `feeLabel` and `feeTooltip` to each `FameSwapRouteMapEdge`.
- Build labels from `quote.feeBreakdown.legs[index].fee`.
- For available fee metadata, use the reviewed pool fee label and explain that venue fees are already included in quoted outputs.
- For unavailable fee metadata, show an explicit unavailable label and reason.

- [x] **Unit 2: Render Venue Fee Labels**

**Files:**

- Modify: `src/features/fame-swap/components/QuotePanel.tsx`
- Modify: `src/features/fame-swap/components/RouteMap.tsx`

**Approach:**

- Render a separate `Venue fees` quote metric next to the existing `FLS fee` metric.
- Keep copy clear that the FLS fee is a router fee and venue fees are pool/venue fee tiers included in the quote.
- Show each route graph leg's fee label near the pool/venue label.

- [x] **Unit 3: Add Coverage Tests**

**Files:**

- Modify: `src/features/fame-swap/solver/poolUniverse.test.ts`
- Modify: `src/features/fame-swap/ui/quoteView.test.ts`

**Approach:**

- Assert every pool referenced by pinned route artifacts has an available fee descriptor.
- Assert quote-view output distinguishes the FLS fee from venue fees and uses non-live copy.
- Assert route graph edges expose per-leg fee labels.

- [x] **Unit 4: Review, Verify, And Close Todo**

**Files:**

- Modify: `.context/compound-engineering/todos/004-ready-p2-estimate-liquidity-fees-for-fame-swap-routes.md`
- Optional: this plan file completion notes.

**Approach:**

- Run focused pool-universe, quote-view, widget/component, route quote, and quote-wire tests.
- Run formatting/lint checks for touched files.
- Run a review pass and fix P1/P2 findings.
- Mark todo `004` complete only after verification passes.

## Verification Plan

- `bun test src/features/fame-swap/solver/poolUniverse.test.ts src/features/fame-swap/ui/quoteView.test.ts src/features/fame-swap/components/FameSwapWidget.test.ts src/features/fame-swap/solver/quotes/rankRoutes.test.ts src/features/fame-swap/solver/quoteWire.test.ts`
- `./node_modules/.bin/prettier --check src/features/fame-swap/ui/quoteView.ts src/features/fame-swap/ui/quoteView.test.ts src/features/fame-swap/components/QuotePanel.tsx src/features/fame-swap/components/RouteMap.tsx src/features/fame-swap/solver/poolUniverse.test.ts docs/plans/2026-05-14-006-fame-swap-liquidity-fee-labels-plan.md`
- `yarn lint --file src/features/fame-swap/ui/quoteView.ts --file src/features/fame-swap/ui/quoteView.test.ts --file src/features/fame-swap/components/QuotePanel.tsx --file src/features/fame-swap/components/RouteMap.tsx --file src/features/fame-swap/solver/poolUniverse.test.ts`

## Risks

| Risk                                            | Likelihood | Impact | Mitigation                                                                                                              |
| ----------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| Users read static fee tiers as live fee reads   | Medium     | Medium | Tooltip copy explicitly says labels come from reviewed pool metadata and are not live fee reads.                        |
| Split routes make a summed fee label misleading | Medium     | Medium | Do not sum tiers into one total; show per-leg route graph labels and a conservative panel summary.                      |
| API deserialization drops fee descriptors       | Low        | Medium | Existing quote-wire tests cover fee breakdown round trips; add UI tests from deserialized-style quote shapes if needed. |
| New pinned pool lacks metadata                  | Medium     | Medium | Add a pinned route artifact coverage test over all route `poolIds`.                                                     |

## Completion Notes

- Added `venueFeeLabel` / `venueFeeTooltip` to the quote view and per-edge `feeLabel` / `feeTooltip` to the route map view model.
- Rendered a separate `Venue fees` metric in `QuotePanel`, leaving `FLS fee` as the router fee.
- Rendered per-leg route graph fee labels next to the venue/pool identifier.
- Kept copy conservative: venue fees are described as included in quoted outputs and sourced from pinned/reviewed pool metadata, not live fee reads.
- Added a pinned route coverage test that fails when a referenced pool lacks available fee metadata.
- Review artifact: `.context/compound-engineering/ce-review/20260514-004-liquidity-fee-labels-codex/summary.md`; no P1/P2 findings.
- Verification passed with focused pool-universe, quote-view, widget, route-ranking, and quote-wire tests plus Prettier, lint, and diff whitespace checks.
