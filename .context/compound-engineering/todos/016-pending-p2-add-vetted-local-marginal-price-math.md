---
status: pending
priority: p2
issue_id: "016"
tags: [fame-swap, solver, optimizer, local-math, route-lab]
dependencies: ["013"]
---

# Add Vetted Local Marginal-Price Math

## Problem Statement

Todo `013` added an explicit local-math optimizer gate, but local marginal-price allocation still cannot select routes because the quote adapter boundary does not expose complete pinned-block pool state and exact local quote semantics to the optimizer.

This matters because adaptive and coordinate-descent search still sample through quote adapters. For vetted constant-product pools, a future optimizer can allocate more cheaply and precisely by using local reserves and marginal prices once the state source is complete and parity-tested.

## Findings

- `src/features/fame-swap/solver/optimizer/search.ts` now records `local_math` trials as `ineligible` unless an explicit complete local-math capability exists.
- `src/features/fame-swap/solver/quotes/snapshotAdapter.ts` can replay reserve quotes for Uniswap V2, volatile Solidly, and Aerodrome V2 pools, but that capability is not exposed as optimizer-owned marginal-price state.
- Live local math requires pinned reserves, fee metadata, exact rounding, and a proof that the state belongs to the optimizer's quote context.
- Concentrated liquidity, stable curves, migrated factories, and V4 hooks must remain quoter-backed until separately proven.

## Proposed Solutions

### Option 1: Adapter Local-Curve Capability

**Approach:** Add an optional adapter capability that returns vetted local curve state for a pool at the current quote context. Use it first for Uniswap V2 and volatile constant-product pools.

**Pros:**
- Keeps local math explicit and testable.
- Lets optimizer code reject unsupported pools without venue-name inference.

**Cons:**
- Requires adapter API changes and parity tests across snapshot and live modes.

**Effort:** 1-2 days

**Risk:** Medium

---

### Option 2: Snapshot-Only Local Math First

**Approach:** Implement local marginal-price allocation only for recorded snapshot route-lab and deterministic tests, then extend live adapters later.

**Pros:**
- Lower risk and easier parity testing.
- Produces route-lab evidence before live use.

**Cons:**
- Does not reduce production live quote calls until a later pass.

**Effort:** 1 day

**Risk:** Low-medium

## Recommended Action

To be filled during triage. Prefer Option 1 if live quote-call reduction is the next bottleneck; otherwise start with Option 2 to prove the math and evidence shape safely.

## Technical Details

Affected files:
- `src/features/fame-swap/solver/optimizer/search.ts`
- `src/features/fame-swap/solver/optimizer/types.ts`
- `src/features/fame-swap/solver/quotes/snapshotAdapter.ts`
- `src/features/fame-swap/solver/quotes/liveAdapters.ts`
- `src/features/fame-swap/solver/optimizer/search.test.ts`
- `scripts/fame-swap-route-lab.test.ts`

Constraints:
- Preserve `maxTemplates: 32`.
- Do not infer local-math safety from `venue` alone.
- Do not enable local math for V4 hooks, stable curves, migrated factories, or concentrated liquidity without complete state and parity tests.

## Resources

- Origin todo: `.context/compound-engineering/todos/013-complete-p2-add-adaptive-route-search-algorithms.md`
- Plan: `docs/plans/2026-05-15-013-fame-swap-adaptive-route-search-plan.md`

## Acceptance Criteria

- [ ] Optimizer local-math selection requires an explicit adapter capability with complete pinned-block state.
- [ ] Constant-product local quote math has parity tests against snapshot quote evidence.
- [ ] Live local math, if enabled, proves reserve reads, fee metadata, rounding, and quote context consistency.
- [ ] Unsupported pools continue to emit `local_math` ineligible or `unsupported_protocol` evidence.
- [ ] Route-lab shows local-math algorithm selection only for vetted pools.
- [ ] Public quote responses still omit raw optimizer traces.

## Work Log

### 2026-05-15 - Created From Todo 013

**By:** Codex

**Actions:**
- Captured the remaining local marginal-price work after adding the fail-closed local-math gate in todo `013`.
- Kept this as pending P2 because the current adaptive and coordinate-descent implementation is safe without speculative local math.

**Learnings:**
- Local marginal-price allocation needs an adapter capability, not a venue-name check.
- Snapshot reserve replay is the safest first proof surface before live local math.
