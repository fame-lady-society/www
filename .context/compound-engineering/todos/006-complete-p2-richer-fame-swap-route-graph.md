---
status: complete
priority: p2
issue_id: "006"
tags: [fame-swap, ui, route-graph, pools]
dependencies: ["004"]
---

# Richer FAME Swap Route Graph

## Problem Statement

The FAME swap route display has moved out of hidden diagnostics, but it is still a first-pass graph. Users should learn how liquidity is routed through token hops and venue types without seeing raw addresses or implementation identifiers as primary copy. Pool IDs, targets, and contract addresses should be available for inspection or copying, not used as the main route story.

## Findings

- `src/features/fame-swap/ui/quoteView.ts` now maps known intermediate route tokens such as ZORA, basedflick, and frxUSD to symbols for route summaries.
- `src/features/fame-swap/components/RouteMap.tsx` displays route legs with token labels, venue names, pool names, and strength labels.
- The route graph does not yet show token images, reviewed pool fee rates, or copy/menu affordances for technical identifiers.
- Liquidity-fee metadata is tracked separately in todo `004`.

## Proposed Solutions

### Option 1: Token And Pool Metadata Layer

**Approach:** Add a reviewed metadata table for route-only tokens and pools, including token image URL/static asset, display symbol, pool venue, pair label, and fee label when known.

**Pros:**

- Makes the graph clearer without extra RPC latency.
- Gives tests a stable coverage target for every pinned route leg.

**Cons:**

- Metadata must be regenerated or reviewed when pinned route artifacts change.

**Effort:** 4-8 hours

**Risk:** Medium

### Option 2: Interactive Route Inspector

**Approach:** Add per-leg menu/copy affordances that reveal pool IDs, target addresses, route hashes, and explorer links while keeping the default graph focused on tokens and venues.

**Pros:**

- Preserves advanced diagnostics for power users.
- Keeps the primary view readable for normal swap users.

**Cons:**

- Requires careful mobile layout and keyboard/focus behavior.

**Effort:** 4-8 hours

**Risk:** Medium

## Recommended Action

Start with Option 1, then add the inspector affordances once metadata labels are stable. This depends on todo `004` for reviewed fee labels and should consume todo `007` outputs when price-impact/state evidence becomes available, without displaying raw addresses or fake route strength as primary copy.

## Acceptance Criteria

- [x] Route summary and graph use token symbols/images for every pinned route token.
- [x] Pool type and token pair are primary; raw addresses are hidden behind copy/menu affordances.
- [x] Fee labels appear only when backed by reviewed metadata or live reads.
- [x] Tests fail when a pinned route introduces an unmapped token or pool.
- [x] Mobile and desktop route views do not overlap or push the primary CTA below the intended fold.

## Work Log

### 2026-05-14 - Completed Richer Route Graph Metadata

**By:** Codex

**Actions:**

- Added shared route token metadata for every token referenced by pinned solver route artifacts, including stable app-local token badges.
- Expanded pool display metadata so route edges show reviewed venue label, pool type, and token pair as primary copy.
- Updated the route map view model and UI to render token badges, pool type, pair, venue, and reviewed fee labels while moving raw pool IDs behind a collapsed `Pool ID` inspector with an icon-only copy action.
- Added artifact-driven tests that fail when pinned route tokens or pools are missing display metadata, plus a route map render test for the badge and technical-detail affordance.
- Recorded plan and review artifacts:
  - `docs/plans/2026-05-14-008-fame-swap-richer-route-graph-plan.md`
  - `.context/compound-engineering/ce-review/20260514-006-route-graph-codex/summary.md`

**Verification:**

- `bun test src/features/fame-swap/ui/routeMetadata.test.ts src/features/fame-swap/ui/quoteView.test.ts src/features/fame-swap/components/RouteMap.test.tsx src/features/fame-swap/components/FameSwapWidget.test.ts src/features/fame-swap/solver/poolUniverse.test.ts src/features/fame-swap/solver/quotes/rankRoutes.test.ts`
- `yarn lint --file src/features/fame-swap/ui/routeMetadata.ts --file src/features/fame-swap/ui/routeMetadata.test.ts --file src/features/fame-swap/ui/poolDisplay.ts --file src/features/fame-swap/ui/quoteView.ts --file src/features/fame-swap/ui/quoteView.test.ts --file src/features/fame-swap/components/RouteMap.tsx --file src/features/fame-swap/components/RouteMap.test.tsx`
- `./node_modules/.bin/prettier --check src/features/fame-swap/ui/routeMetadata.ts src/features/fame-swap/ui/routeMetadata.test.ts src/features/fame-swap/ui/poolDisplay.ts src/features/fame-swap/ui/quoteView.ts src/features/fame-swap/ui/quoteView.test.ts src/features/fame-swap/components/RouteMap.tsx src/features/fame-swap/components/RouteMap.test.tsx docs/plans/2026-05-14-008-fame-swap-richer-route-graph-plan.md`
- `git diff --check -- src/features/fame-swap/ui/routeMetadata.ts src/features/fame-swap/ui/routeMetadata.test.ts src/features/fame-swap/ui/poolDisplay.ts src/features/fame-swap/ui/quoteView.ts src/features/fame-swap/ui/quoteView.test.ts src/features/fame-swap/components/RouteMap.tsx src/features/fame-swap/components/RouteMap.test.tsx docs/plans/2026-05-14-008-fame-swap-richer-route-graph-plan.md`

**Learnings:**

- The normal browser route graph state needs a connected wallet address, so the direct visual pass can only reach the widget shell in a headless session without wallet state. The route graph itself is covered by component render tests and artifact-driven quote-view tests.

### 2026-05-14 - Triage

**By:** Codex

**Actions:**

- Promoted from pending to ready.
- Clarified dependency on fee labels and protocol state-output evidence.

**Learnings:**

- The route graph should surface real leg evidence once available, but still needs to avoid implying precision from incomplete metadata.

### 2026-05-13 - Initial Discovery

**By:** Codex

**Actions:**

- Removed raw route token addresses from the route summary by adding known intermediate token symbol mappings.
- Captured richer graph requirements as follow-up work tied to liquidity-fee metadata.

**Learnings:**

- Pool identifiers and route implementation data are useful, but they should not compete with the token path as the primary display.
