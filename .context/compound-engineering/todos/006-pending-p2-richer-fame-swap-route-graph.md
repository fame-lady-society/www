---
status: pending
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

To be filled during triage. Start with Option 1, then add the inspector affordances once metadata labels are stable.

## Acceptance Criteria

- [ ] Route summary and graph use token symbols/images for every pinned route token.
- [ ] Pool type and token pair are primary; raw addresses are hidden behind copy/menu affordances.
- [ ] Fee labels appear only when backed by reviewed metadata or live reads.
- [ ] Tests fail when a pinned route introduces an unmapped token or pool.
- [ ] Mobile and desktop route views do not overlap or push the primary CTA below the intended fold.

## Work Log

### 2026-05-13 - Initial Discovery

**By:** Codex

**Actions:**
- Removed raw route token addresses from the route summary by adding known intermediate token symbol mappings.
- Captured richer graph requirements as follow-up work tied to liquidity-fee metadata.

**Learnings:**
- Pool identifiers and route implementation data are useful, but they should not compete with the token path as the primary display.
