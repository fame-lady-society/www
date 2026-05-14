---
status: complete
priority: p1
issue_id: "001"
tags: [fame-swap, router, slippage, safety]
dependencies: []
---

# Add Live Slippage-Backed FAME Swap Quotes

## Problem Statement

The FAME swap beta currently executes only exact pinned route amounts and gates swap submission behind wallet-side simulation, but the copied router artifacts have very low route minimums. A live public swap should recompute current output and apply a real slippage policy before submitting user funds.

## Findings

- `src/features/fame-swap/solver/quote.ts` materializes exact artifact routes with fixture `minAmountOutAfterFee`.
- The checked-in solver route artifacts currently contain `minAmountOutAfterFee: "1"` for launch routes.
- `src/features/fame-swap/hooks/useFameSwapTransaction.ts` now requires current-chain simulation before enabling submit, but it does not rewrite final and per-leg minimums from a slippage policy.

## Proposed Solutions

### Option 1: Simulation-Based Final Minimum

**Approach:** Simulate the materialized route, compute final minimum from the simulated net output and a configured slippage tolerance, then submit a route whose final minimum is updated immediately before wallet submission.

**Pros:**

- Prevents submissions with a `1` wei final minimum.
- Keeps the existing exact-artifact route compiler as the source of path structure.

**Cons:**

- Per-leg minimums remain weak unless the router exposes per-leg quote data or the solver can recompute each leg.

**Effort:** 1 day

**Risk:** Medium

### Option 2: Live Solver Service

**Approach:** Add a server-side quote endpoint that recomputes leg quotes, per-leg minimums, final minimum, route hash, and transaction request from live RPC state.

**Pros:**

- Produces complete slippage protection across split and multi-hop routes.
- Gives the UI an explicit quote freshness boundary.

**Cons:**

- Larger surface area and needs rate limiting, caching, and RPC failure design.

**Effort:** 2-4 days

**Risk:** Medium

## Recommended Action

Implemented in `src/features/fame-swap`: arbitrary amounts now materialize from pinned route templates, submit is default-live behind router readiness, wallet-side probe simulation computes a slippage-backed final minimum, and the exact protected transaction is simulated before submission.

## Acceptance Criteria

- [x] Live executable quotes never submit with `minAmountOutAfterFee` equal to `1` unless the simulated output is also within that bound.
- [x] The UI shows quote freshness and disables submit after expiry.
- [x] Current-chain simulation is tied to the exact transaction request that is sent.
- [x] Unit tests cover slippage minimum computation and expired quote blocking.
- [x] Fork smoke covers at least one rewritten-minimum route.

## Completion Notes

- [x] Removed `NEXT_PUBLIC_FAME_SWAP_MODE` gating; router availability is controlled by configured address plus live policy reads.
- [x] Removed exact-fixture-only amount blocking; route templates scale to arbitrary positive user amounts.
- [x] Added slippage-backed protected transaction simulation in `useFameSwapTransaction`.
- [x] Added `/api/fame/swap/quote` for backend quote/route materialization.
- [x] Verified fork smoke against a local Anvil Base fork and locally deployed router with a non-fixture native ETH route.

## Work Log

### 2026-05-14 - Completion Review

**By:** Codex

**Actions:**

- Confirmed production quotes now use live or recorded quote evidence instead of arbitrary deterministic caps.
- Confirmed non-ready quotes do not expose executable approval or swap requests.
- Left follow-up route coverage, wire-contract tests, and protocol-state gaps as separate ready todos instead of keeping this P1 open.

**Learnings:**

- Slippage-backed quote protection is complete enough to close this item, but per-protocol leg evidence and route display work still need their own backlog entries.

### 2026-05-13 - Initial Discovery

**By:** Codex

**Actions:**

- Built exact-artifact route materialization and transaction submission.
- Added current-chain wallet simulation gating before swap submission.
- Captured remaining slippage-policy gap from subagent review.

**Learnings:**

- The launch artifacts are good path evidence but not sufficient live slippage policy by themselves.
