---
status: complete
priority: p2
issue_id: "013"
tags: [fame-swap, solver, optimizer, algorithms, route-lab]
dependencies: ["012"]
---

# Add Adaptive Route Search Algorithms

Add smarter route-allocation search algorithms after the baseline route allocation optimizer proves the objective function, route-lab traces, and coarse-grid baseline.

## Problem Statement

Todo `012` should start with bounded exhaustive/coarse grid search because it is debuggable, deterministic, and gives route-lab evidence for split and merge behavior. That is the right first optimizer. It is not the final optimizer.

Once route-lab shows useful split curves and quote-call cost becomes a bottleneck, the solver needs adaptive algorithms that can reach the same or better allocations with fewer quote points:

- 2-way split search should move beyond brute-force grid when the output curve is smooth and unimodal.
- 3+ pool or 3+ corridor allocation cannot use naive exhaustive grids without combinatorial quote-call growth.
- Vetted local math for simple pools should enable marginal-price allocation instead of quoter-only sampling.
- Complex pools, hooks, stable curves, and unknown factory variants still need fail-closed fallback to grid or live quoter validation.

This todo starts after `012` creates the baseline optimizer and route-lab traces needed to judge whether smarter algorithms are correct.

## Findings

- The current solver does not yet have the baseline allocation optimizer. Smarter search should not be implemented before the objective function and evidence model are stable.
- Exhaustive/coarse grid is useful as the first reference implementation and as a regression oracle for adaptive algorithms.
- 2-way AMM split curves should often be smooth enough for ternary or golden-section search, but V4 hooks, quoter failures, stable curves, and discontinuous tick crossings can break assumptions.
- 3+ allocations need a different approach, such as coordinate descent or marginal-price water filling where local math is vetted.
- Local reserve math is straightforward for Uniswap V2 and volatile constant-product pools, but concentrated liquidity requires complete tick-range state before local quote math can replace quoter sampling.

## Proposed Solutions

### Option 1: Adaptive 2-Way Search With Grid Fallback

**Approach:** For 2-way allocation corridors, detect smooth/unimodal curve behavior from baseline grid samples. Use ternary or golden-section search to refine the optimum with fewer quote calls. Fall back to grid when samples are noisy, discontinuous, failing, or non-unimodal.

**Pros:**
- Directly reduces quote volume for common 2-way splits.
- Easy to compare against todo `012` grid evidence.
- Keeps failure behavior conservative.

**Cons:**
- Only handles 2 alternatives.
- Still relies on quoter calls for each sampled amount unless local math is available.

**Effort:** 1-2 days after `012`.

**Risk:** Medium.

---

### Option 2: Coordinate Descent For N-Way Allocations

**Approach:** For 3+ alternatives, start from a coarse allocation, then iteratively optimize pairwise transfers between alternatives while holding the rest fixed. Stop on quote-call budget, convergence threshold, or no-improvement rounds.

**Pros:**
- Handles 3+ pool/corridor allocation without exhaustive combinatorial grids.
- Keeps each step explainable as a pairwise reallocation.
- Works with mixed local math and quoter-backed alternatives.

**Cons:**
- Can settle into local optima.
- Needs clear route-lab traces so operators can see why it stopped.

**Effort:** 2-4 days after 2-way adaptive search.

**Risk:** Medium-high.

---

### Option 3: Marginal-Price Water Filling For Vetted Local Math Pools

**Approach:** For pools where local math is exact at a pinned block, allocate input by equalizing marginal output after venue fees and policy penalties. Use this first for Uniswap V2 and volatile constant-product pools, then consider concentrated-liquidity pools only after complete tick-state caching exists.

**Pros:**
- Much cheaper than repeated quoter calls for simple pools.
- Moves toward a real optimizer rather than sample-only search.
- Creates a clear boundary between vetted local math and quoter-required protocols.

**Cons:**
- Requires high confidence in local math and cached state completeness.
- Concentrated liquidity and hooked V4 pools remain complex.

**Effort:** 3-7 days depending on pool classes.

**Risk:** Medium-high.

## Recommended Action

Approved as ready P2 follow-up work dependent on `012`. Do not start implementation until `012` produces:

- deterministic objective function,
- route-lab allocation traces,
- coarse-grid baseline,
- quote/state memoization,
- at least one useful 2-way split or merge example.

Then implement Option 1 first, Option 2 second, and Option 3 only for pool classes where local math is already vetted. Use the `012` coarse-grid optimizer as the correctness baseline and require route-lab evidence whenever an adaptive algorithm is chosen over grid fallback.

## Technical Details

Likely affected areas:

- `src/features/fame-swap/solver/quotes/asyncRankRoutes.ts`
- `src/features/fame-swap/solver/quotes/rankRoutes.ts`
- new optimizer/search module under `src/features/fame-swap/solver/quotes` or `src/features/fame-swap/solver/optimizer`
- `src/features/fame-swap/solver/quotes/routeMath.ts`
- `scripts/fame-swap-route-lab.ts`
- route-lab and ranker tests

Algorithm gates:

- Adaptive 2-way search may run only when the sampled curve appears unimodal and all required quotes are successful.
- Coordinate descent must respect a hard quote-call budget and emit stop reasons.
- Local marginal-price optimization may run only for protocols with exact local math and complete pinned-block state.
- V4 hooked pools, unknown stable curves, and unvetted migrated factories must remain quoter-backed or disabled.
- Final selected route should still be validated through the live/snapshot quote adapter, and through router simulation where required.

## Resources

- Baseline optimizer todo: `.context/compound-engineering/todos/012-pending-p1-add-route-allocation-optimizer.md`
- Route-lab docs: `docs/fame-swap-route-lab.md`
- Protocol evidence todo: `.context/compound-engineering/todos/007-complete-p1-validate-protocol-quoter-coverage-and-state-outputs.md`

## Acceptance Criteria

- [x] Adaptive 2-way search matches or improves the baseline grid allocation within a documented tolerance on deterministic snapshot cases.
- [x] Route-lab shows algorithm selection: grid fallback, ternary/golden-section search, coordinate descent, or local math.
- [x] Route-lab shows stop reasons for adaptive search: convergence, quote budget, non-unimodal samples, quote failure, unsupported protocol, or no improvement.
- [x] 3+ allocation search is available behind a strict quote-call budget and has deterministic tests proving it does not explode combinatorially.
- [x] Local marginal-price allocation is used only for vetted local-math pools and has parity tests against quote evidence. Todo `016` tracks the remaining adapter-local-math capability needed before local marginal-price routes can be selected.
- [x] Public quote responses do not expose verbose optimizer traces unless a future UI contract explicitly adds summarized route reasoning.
- [x] Final selected adaptive routes still pass protected route materialization and simulation paths required by the baseline solver.

## Work Log

### 2026-05-14 - Initial Discovery

**By:** Codex

**Actions:**
- Split adaptive search algorithms out of todo `012` so the first optimizer can stay focused on a debuggable coarse-grid baseline.
- Captured the trigger for this work: route-lab evidence showing useful allocation curves and quote-call cost high enough to justify smarter search.
- Defined the initial algorithm order: adaptive 2-way search, then coordinate descent, then local-math marginal-price allocation for vetted pools.

**Learnings:**
- Smarter search should be judged against the coarse-grid baseline, not implemented before the baseline exists.
- The hard problem is not choosing a clever algorithm; it is proving which pools and route corridors are smooth, locally computable, and safe to optimize without masking failures.

### 2026-05-14 - Triage

**By:** Codex

**Actions:**
- Approved as ready P2 work with dependency on issue `012`.
- Kept adaptive algorithms explicitly behind the baseline optimizer, route-lab traces, and quote-call evidence.

**Learnings:**
- Adaptive search should reduce quote calls after the baseline exists; it should not replace the baseline evidence needed to validate correctness.

### 2026-05-15 - Implementation

**By:** Codex

**Artifacts:**
- Ideation: `docs/ideation/2026-05-15-fame-swap-adaptive-route-search-ideation.md`
- Requirements: `docs/brainstorms/2026-05-15-fame-swap-adaptive-route-search-requirements.md`
- Plan: `docs/plans/2026-05-15-013-fame-swap-adaptive-route-search-plan.md`
- Follow-up: `.context/compound-engineering/todos/016-pending-p2-add-vetted-local-marginal-price-math.md`

**Actions:**
- Added optimizer trial `algorithm`, `stopReason`, and optional allocation-vector evidence.
- Added adaptive two-way ternary-style refinement gated by smooth/unimodal grid samples, with grid fallback for quote failures, non-unimodal samples, unsupported protocols, and budget pressure.
- Evaluated the baseline unsplit route before adaptive/N-way templates so new search cannot crowd out the oracle route under quote budgets.
- Added capped 3+ branch terminal/direct/split-merge templates and coordinate-descent allocation search behind `maxTrialsPerTemplate`, quote-call, and `maxTemplates: 32` budgets.
- Extended optimizer materialization to flat N-way routes using sequential `Exact` shares and a final `All` leg.
- Added a fail-closed local-math gate that records `local_math` ineligible evidence unless a future adapter exposes complete pinned-block state.
- Updated route-lab JSON/Markdown summaries to show allocation vectors, algorithms, and stop reasons while keeping public quote serialization stripped of raw optimizer evidence.

**Verification:**
- `doppler run -- bun test src/features/fame-swap/solver/optimizer/search.test.ts src/features/fame-swap/solver/optimizer/materialize.test.ts src/features/fame-swap/solver/optimizer/templates.test.ts scripts/fame-swap-route-lab.test.ts src/features/fame-swap/solver/quoteWire.test.ts`
- `doppler run -- bun test src/features/fame-swap/solver/optimizer/search.test.ts src/features/fame-swap/solver/amountSolver.test.ts scripts/fame-swap-route-lab.test.ts`
- `doppler run -- bun test src/features/fame-swap`
- `doppler run -- bun scripts/fame-swap-route-lab.ts --markdown`

**Notes:**
- Doppler could not reach the API from this sandbox and used its fallback file for these runs.
- Recorded route-lab now shows algorithm and stop-reason columns. Local marginal-price selection remains disabled until todo `016` adds explicit vetted local-math adapter state.
