---
title: "feat: Add richer FAME swap route graph metadata"
type: feat
status: complete
date: 2026-05-14
source_todo: .context/compound-engineering/todos/006-ready-p2-richer-fame-swap-route-graph.md
---

# feat: Add Richer FAME Swap Route Graph Metadata

## Overview

Make the swap route graph explain the selected liquidity path through human-readable token and pool metadata. The primary route story should be token symbols, token badges, pool type, pair, venue, and reviewed fee tiers. Raw pool IDs and technical identifiers remain available for inspection and copy, but they should not be the main visible route copy.

## Requirements Trace

- Todo `006`: route summary and graph use token symbols/images for every pinned route token.
- Todo `006`: pool type and token pair are primary; raw addresses and implementation IDs are hidden behind copy/menu affordances.
- Todo `006`: fee labels appear only when backed by reviewed metadata or live reads.
- Todo `006`: tests fail when pinned routes introduce unmapped tokens or pools.
- Todo `006`: mobile and desktop route views avoid overlap and keep the primary swap CTA from being pushed below the intended fold.

## Current-State Findings

- `quoteView.ts` already maps known route-only tokens to symbols, but token metadata is local to that file and does not carry an icon/badge contract.
- `poolDisplay.ts` provides a flat display name for pinned pools but does not expose pool type, pair, venue, or reviewed metadata coverage for tests.
- `RouteMap.tsx` currently shows the pool name and strength label, then renders the raw pool ID directly in the technical line.
- Todo `004` added reviewed fee metadata through `feeBreakdown`; this todo should consume those labels and avoid inventing fee values.

## Scope Boundaries

- Do not change route selection, quote math, fee math, or transaction submission behavior.
- Do not add live token metadata fetching or external image dependencies.
- Do not expose raw addresses as primary route copy.
- Do not fabricate split percentages or fee tiers beyond reviewed metadata already available on selected quote legs.

## Implementation Units

- [x] **Unit 1: Add Route Metadata Coverage**

**Files:**

- Add: `src/features/fame-swap/ui/routeMetadata.ts`
- Test: `src/features/fame-swap/ui/routeMetadata.test.ts`
- Modify: `src/features/fame-swap/ui/poolDisplay.ts`

**Approach:**

- Centralize route token metadata with a symbol, label, badge text, and stable badge color for every token referenced by pinned solver route artifacts.
- Expand pool display metadata to expose reviewed venue label, pool type label, token pair label, and display name for each pinned route pool.
- Keep fallback helpers for defensive rendering, but add tests that assert pinned route artifacts never use those fallbacks.

- [x] **Unit 2: Enrich Quote View Route Model**

**Files:**

- Modify: `src/features/fame-swap/ui/quoteView.ts`
- Test: `src/features/fame-swap/ui/quoteView.test.ts`

**Approach:**

- Replace local route token symbol mapping with the shared route metadata helper.
- Add structured token and pool metadata fields to each route map edge.
- Keep reviewed fee labels tied to `quote.feeBreakdown`, preserving the existing unavailable-fee state when metadata is absent.

- [x] **Unit 3: Update Route Graph UI**

**Files:**

- Modify: `src/features/fame-swap/components/RouteMap.tsx`

**Approach:**

- Render token badges next to symbols in node boxes using stable dimensions that work on narrow screens.
- Make pool type and pair the primary edge label, with venue and fee tier as supporting copy.
- Move raw pool ID behind an inspector disclosure and provide an icon-only copy affordance.

- [x] **Unit 4: Review, Verify, And Close Todo**

**Files:**

- Modify: `.context/compound-engineering/todos/006-ready-p2-richer-fame-swap-route-graph.md`
- Optional: this plan file completion notes.

**Approach:**

- Run route metadata, quote view, widget, pool universe, and route ranking tests.
- Run formatting/lint checks for touched files.
- Run a review pass and fix P1/P2 findings.
- Mark todo `006` complete only after verification passes.

## Verification Plan

- `bun test src/features/fame-swap/ui/routeMetadata.test.ts src/features/fame-swap/ui/quoteView.test.ts src/features/fame-swap/components/RouteMap.test.tsx src/features/fame-swap/components/FameSwapWidget.test.ts src/features/fame-swap/solver/poolUniverse.test.ts src/features/fame-swap/solver/quotes/rankRoutes.test.ts`
- `yarn lint --file src/features/fame-swap/ui/routeMetadata.ts --file src/features/fame-swap/ui/routeMetadata.test.ts --file src/features/fame-swap/ui/poolDisplay.ts --file src/features/fame-swap/ui/quoteView.ts --file src/features/fame-swap/ui/quoteView.test.ts --file src/features/fame-swap/components/RouteMap.tsx --file src/features/fame-swap/components/RouteMap.test.tsx`
- `./node_modules/.bin/prettier --check src/features/fame-swap/ui/routeMetadata.ts src/features/fame-swap/ui/routeMetadata.test.ts src/features/fame-swap/ui/poolDisplay.ts src/features/fame-swap/ui/quoteView.ts src/features/fame-swap/ui/quoteView.test.ts src/features/fame-swap/components/RouteMap.tsx src/features/fame-swap/components/RouteMap.test.tsx docs/plans/2026-05-14-008-fame-swap-richer-route-graph-plan.md`

## Risks

| Risk                                                    | Likelihood | Impact | Mitigation                                                                                 |
| ------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------ |
| Token badges are mistaken for externally verified logos | Low        | Low    | Use simple app-local badges, not token logos or external image claims.                     |
| Metadata falls out of sync with copied artifacts        | Medium     | Medium | Add artifact-driven coverage tests for every pinned route token and pool.                  |
| Inspector details crowd the swap widget                 | Medium     | Medium | Keep technical IDs collapsed by default and use compact icon-only copy controls.           |
| Fee labels imply live reads                             | Low        | Medium | Continue using reviewed fee metadata copy and preserve unavailable labels when not backed. |

## Completion Notes

- Added shared route token metadata for every token referenced by pinned solver route artifacts, including app-local token badges with stable colors.
- Expanded pool display metadata so route edges can show reviewed venue label, pool type, and token pair as primary copy.
- Updated the quote-view route map model to carry token badges, pool type, pair, venue label, and reviewed fee labels per edge.
- Updated the route graph UI to render token badges and hide raw pool IDs behind a collapsed `Pool ID` inspector with an icon-only copy button.
- Added artifact-driven coverage tests for pinned route token and pool metadata plus a route map render test for token badges and technical-detail affordances.
- Review artifact: `.context/compound-engineering/ce-review/20260514-006-route-graph-codex/summary.md`; no P1/P2 findings.
- Verification passed with route metadata, quote view, route map, widget, pool universe, and route ranking tests plus Prettier, lint, and diff whitespace checks.
