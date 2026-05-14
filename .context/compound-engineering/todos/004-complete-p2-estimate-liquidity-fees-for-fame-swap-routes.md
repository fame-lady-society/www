---
status: complete
priority: p2
issue_id: "004"
tags: [fame-swap, solver, fees, ui]
dependencies: []
---

# Estimate Liquidity Fees For FAME Swap Routes

## Problem Statement

The FAME swap widget now displays the router fee as `0.2222% to the FLS Society`, but it does not estimate venue-level liquidity fees paid across the underlying route legs. Users can see the FLS fee and max slippage, but cannot yet learn the total expected protocol/pool fee load across Uniswap, Aerodrome Slipstream, Scale Equalizer, or other venues.

## Findings

- `src/features/fame-swap/ui/quoteView.ts` formats `quote.feePpm` as the FLS router fee.
- Route artifacts in `src/features/fame-swap/artifacts/base-v1-solver-routes.json` include `poolIds`, `venue`, and route leg data, but do not include a normalized liquidity-fee estimate per leg.
- Some venue payloads encode fee-like parameters, but deriving reliable user-facing fees requires venue-specific decoding and validation against pool metadata.
- The current UI should not imply total trading fees are known when only the router fee is available.

## Proposed Solutions

### Option 1: Static Pool Fee Metadata

**Approach:** Add a versioned pool metadata table keyed by `poolId` with known fee tiers and display those in the route graph and quote summary.

**Pros:**

- Low runtime cost
- Easy to review against pinned route artifacts
- Works without extra RPC calls

**Cons:**

- Must be regenerated when routes or pools change
- Can drift from live pool configuration if not verified

**Effort:** 2-4 hours

**Risk:** Medium

---

### Option 2: Decode Fees From Route Payloads

**Approach:** Add venue-specific payload decoders that extract fee tier or pool config from each leg where possible, falling back to metadata when payloads are ambiguous.

**Pros:**

- Keeps fee display tied to executable route data
- Helps catch mismatches between route artifacts and labels

**Cons:**

- More code and tests per venue family
- Not every venue exposes a comparable fee in payload data

**Effort:** 4-8 hours

**Risk:** Medium

---

### Option 3: Live Pool Metadata Reads

**Approach:** Query pool contracts or registry contracts for fee settings while preparing the quote.

**Pros:**

- Highest live accuracy
- Can detect drift after artifact generation

**Cons:**

- Adds latency and RPC failure modes to quote UX
- Requires careful caching and fallback copy

**Effort:** 1-2 days

**Risk:** Medium to high

## Recommended Action

A practical first pass is Option 1 backed by tests that every pinned route leg has either a known fee label or an explicit "fee unavailable" fallback. Keep this separate from price-impact/state-output work: this todo is for user-facing venue fee labels, while todo `007` owns per-protocol quote evidence and computable state outputs.

## Technical Details

Affected files:

- `src/features/fame-swap/artifacts/base-v1-solver-routes.json`
- `src/features/fame-swap/ui/quoteView.ts`
- `src/features/fame-swap/components/QuotePanel.tsx`
- `src/features/fame-swap/components/RouteMap.tsx`

Related components:

- Route artifact generation and manifest validation
- FAME swap quote UI
- Route graph display

Database changes: No.

## Resources

- Live user feedback from 2026-05-13: FLS fee should show as `0.2222% to the FLS Society`; liquidity fee estimation would be valuable but is not currently implemented.
- Existing route artifacts contain `poolIds` and per-leg venue data.

## Acceptance Criteria

- [x] Every pinned FAME swap route leg has a reviewed liquidity-fee label or an explicit unavailable reason.
- [x] The quote panel distinguishes FLS router fee from venue liquidity fees.
- [x] The route graph shows per-leg fee labels without implying unsupported precision.
- [x] Tests cover all pinned route artifacts and fail when a new pool lacks fee metadata.
- [x] Copy avoids presenting liquidity fees as live estimates unless they are actually read live.

## Work Log

### 2026-05-14 - Completed

**By:** Codex

**Actions:**

- Added quote-view fields for venue fee summary labels and per-route-leg fee labels/tooltips.
- Rendered a separate `Venue fees` quote metric so users can distinguish venue/pool fees from the FLS router fee.
- Added per-leg fee labels to the route graph next to the venue/pool identifier.
- Kept venue fee copy tied to reviewed pinned pool metadata and explicitly not live fee reads.
- Added a pinned route pool coverage test that fails when a referenced pool lacks available fee metadata.

**Verification:**

- `bun test src/features/fame-swap/solver/poolUniverse.test.ts src/features/fame-swap/ui/quoteView.test.ts src/features/fame-swap/components/FameSwapWidget.test.ts src/features/fame-swap/solver/quotes/rankRoutes.test.ts src/features/fame-swap/solver/quoteWire.test.ts`
- `yarn lint --file src/features/fame-swap/ui/quoteView.ts --file src/features/fame-swap/ui/quoteView.test.ts --file src/features/fame-swap/components/QuotePanel.tsx --file src/features/fame-swap/components/RouteMap.tsx --file src/features/fame-swap/solver/poolUniverse.test.ts`
- Prettier and `git diff --check` on touched files.

**Learnings:**

- Existing pool metadata was already strong enough for reviewed fee-tier labels; the missing piece was conservative UI exposure and route-artifact coverage.

### 2026-05-14 - Triage

**By:** Codex

**Actions:**

- Promoted from pending to ready.
- Split protocol state-output requirements into new P1 todo `007` so this item can stay focused on venue fee labels.

**Learnings:**

- Fee display and price-impact evidence share pool metadata, but conflating them would hide the protocol-specific quoter work that still needs validation.

### 2026-05-13 - Initial Discovery

**By:** Codex

**Actions:**

- Confirmed the widget only has a reliable router fee through `quote.feePpm`.
- Added a durable todo instead of adding unverified liquidity-fee estimates to the UI.
- Added separate pool-name mapping work in the current UI pass.

**Learnings:**

- FLS router fee and venue liquidity fees need separate labels.
- Pinned route artifacts are a good starting point for static metadata coverage.

## Notes

- Keep this separate from CTA/layout hardening; it needs solver/pool metadata review.
