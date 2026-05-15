---
status: ready
priority: p1
issue_id: "012"
tags: [fame-swap, solver, optimizer, routing, quotes]
dependencies: []
---

# Add Route Allocation Optimizer

Replace the current first-pass route candidate ranker with a bounded allocation optimizer that can explain and select liquidity-aware splits, merges, and multi-pool corridors.

## Problem Statement

The FAME swap solver can now enumerate route candidates, quote live liquidity, report protocol coverage, and surface missing or disabled edges. It still behaves more like a candidate generator plus final-output ranker than an optimizer.

User testing shows the practical gaps:

- Split routes appear fixed or coarse, often behaving like 50/50 templates rather than fee/depth/impact-optimized allocations.
- Merge routes do not show up where expected, especially when an input could be serviced mid-leg by two or more pools before merging back into the route.
- No observed 3+ pool split evidence exists, even when several reviewed pools connect the same token pair or corridor.
- Per-hop fee, output, liquidity depth, and price-impact evidence exists in pieces but is not yet used as a first-class allocation model.
- Route-lab can report selected and rejected whole-route candidates, but it does not yet prove why a specific split ratio, merge point, or N-way allocation was selected or rejected.

This is now the main backend quote-builder problem. Contract work such as ETH/WETH wrap legs and Aerodrome V2 support expands the executable universe, but this todo owns making the solver allocate size intelligently across that universe.

## Findings

- Completed todo `011` expanded the graph and edge matrix, so the solver can see more connector routes and report reviewed/missing/disabled edges.
- Completed todo `007` added protocol quote/state evidence, but that evidence is not yet normalized into marginal route depth or allocation decisions.
- Completed todo `004` added reviewed venue fee labels for display, but that is not a live fee/depth optimization model.
- Current route ranking primarily selects by protected output after quoting generated candidates. It does not perform amount allocation search across parallel pools or corridors.
- Current split/merge support is bounded and useful, but it appears to be route-shape driven rather than derived from pool marginal prices.
- Native ETH/WETH wrap support is being handled in `../fame-contracts` and should later add zero-price-impact pseudo-edges, but that will increase the need for a real optimizer rather than replace it.
- Aerodrome V2 and migrated Slipstream pool support are contract-side blockers for some high-value pools. Once those pools are executable, a fixed split model will leave value on the table.

## Proposed Solutions

### Option 1: Bounded Corridor Allocation Optimizer

**Approach:** Build optimizer corridors for reviewed FAME-facing pairs. A corridor is a token path where one or more segments can be served by multiple executable pools or subroutes. For each corridor, search allocation weights across alternatives using live/snapshot quotes, then select the allocation with the best protected output after router fee, venue fees, and market-impact policy.

**Pros:**
- Directly targets observed failures: 50/50 splits, missing merge opportunities, and absent 3+ pool allocations.
- Keeps search bounded to reviewed corridors instead of becoming a full DEX aggregator.
- Produces explainable route-lab evidence for each allocation choice.

**Cons:**
- More quote calls and more complex quote budgeting.
- Requires careful memoization and deterministic snapshot behavior.

**Effort:** 2-4 days for a first production-grade 2-way version; 4-7 days including N-way support and route-lab evidence.

**Risk:** Medium-high.

---

### Option 2: Incremental Split Ratio Search For Existing Split Shapes

**Approach:** Keep current candidate generation mostly intact, but replace fixed/coarse split amounts with a ratio search. Start with a grid such as 5/95 through 95/5, refine around the best ratio, and record quote evidence for selected and rejected ratios.

**Pros:**
- Smaller change set.
- Quickly proves whether current route shapes are leaving output behind.
- Easier to bound quote calls and tests.

**Cons:**
- Does not solve mid-route merge allocation cleanly.
- Still depends on route-shape enumeration to find the right split location.
- 3+ pool allocation remains awkward.

**Effort:** 1-3 days.

**Risk:** Medium.

---

### Option 3: General Min-Cost Flow Style Router

**Approach:** Model pools and route legs as a flow network with marginal quote curves, then solve allocation with a constrained optimizer.

**Pros:**
- Most theoretically complete.
- Naturally represents parallel edges, multi-hop splits, and merges.

**Cons:**
- Too much surface area for the current launch path.
- Harder to keep deterministic, explainable, and executable under route encoding constraints.
- Quote-call and state consistency risks are high.

**Effort:** 1-3 weeks.

**Risk:** High.

## Recommended Action

Approved for immediate P1 backend solver work. Implement Option 1 as a bounded corridor optimizer, with Option 2 as the first implementation slice. Do not jump to a general aggregator. Start with the exact corridors where route-lab and user testing expose value:

- `WETH -> FAME`
- `USDC -> FAME`
- `FAME -> USDC`
- `FAME -> WETH`
- Native ETH corridors after `../fame-contracts` lands explicit wrap/unwrap support

The first shippable milestone must prove 2-way allocation search with quote/state memoization and route-lab explanations. The second milestone should add N-way allocation over 3+ pools or corridors only where the reviewed universe contains enough executable alternatives. Keep the public quote API concise and treat route-lab as the detailed optimizer evidence surface.

## Technical Details

Likely affected areas:

- `src/features/fame-swap/solver/quotes/asyncRankRoutes.ts`
- `src/features/fame-swap/solver/quotes/rankRoutes.ts`
- `src/features/fame-swap/solver/graph/candidates.ts`
- `src/features/fame-swap/solver/graph/split.ts`
- `src/features/fame-swap/solver/graph/routePlan.ts`
- `src/features/fame-swap/solver/quotes/adapters.ts`
- `src/features/fame-swap/solver/quotes/routeMath.ts`
- `scripts/fame-swap-route-lab.ts`
- `src/features/fame-swap/solver/amountSolver.test.ts`
- `src/features/fame-swap/solver/quotes/rankRoutes.test.ts`
- `src/features/fame-swap/solver/graph/candidates.test.ts`
- `scripts/fame-swap-route-lab.test.ts`

Implementation requirements:

- Add a per-request quote cache keyed by quote context, pool id, direction, amount in, adapter identity, and any venue-specific quoter parameters.
- Normalize selected-leg evidence into allocation inputs: output, fee tier or fee label, pre-state, post-state when available, active liquidity when available, market impact, and quote source.
- Keep one block or one snapshot context per optimization run.
- Treat split/merge allocations as quoteable route candidates only when every branch is executable under the current router manifest.
- Support route-local amount modes safely when materializing optimized allocations.
- Bound quote calls with explicit budgets and route-lab diagnostics when the optimizer prunes or stops early.
- Keep public quote API responses concise; detailed allocation search evidence belongs in route-lab/operator diagnostics unless the UI explicitly asks for summarized route reasoning.

Suggested first algorithm:

1. Generate existing executable candidates for the pair.
2. Identify corridor groups where two or more candidates share the same source token and final target, or where one segment has parallel executable pools between the same tokens.
3. Quote coarse allocations across two alternatives: 0/100, 5/95, 10/90, 20/80, 35/65, 50/50, 65/35, 80/20, 90/10, 95/5, 100/0.
4. Refine around the best coarse point with smaller nearby steps.
5. Compare the best split/merge allocation against the best unsplit route after router fee, slippage protection, and market-impact policy.
6. Record selected and rejected allocation evidence in route-lab.
7. Generalize to 3+ alternatives only after the 2-way path is stable and memoized.

## Resources

- Current solver audit: `docs/ideation/2026-05-14-fame-swap-quoter-solver-audit-ideation.md`
- Current route-lab docs: `docs/fame-swap-route-lab.md`
- Completed graph expansion todo: `.context/compound-engineering/todos/011-complete-p1-expand-route-solver-graph-and-liquidity-gap-matrix.md`
- Completed protocol evidence todo: `.context/compound-engineering/todos/007-complete-p1-validate-protocol-quoter-coverage-and-state-outputs.md`
- Contract wrap/unwrap todo: `../fame-contracts/.context/compound-engineering/todos/009-pending-p2-add-native-weth-wrap-unwrap-route-legs.md`
- Contract Aerodrome support todo: `../fame-contracts/.context/compound-engineering/todos/010-pending-p2-add-aerodrome-v2-and-migrated-slipstream-pools.md`

## Acceptance Criteria

- [ ] Solver can optimize 2-way split ratios for at least one representative FAME-facing pair using live or snapshot quote evidence, not fixed 50/50 assumptions.
- [ ] Route-lab shows selected allocation ratio, per-branch input amount, per-branch output amount, and why nearby ratios were rejected.
- [ ] Solver can select a merge route where two or more branches produce the same intermediate or final token before continuing through a shared downstream leg.
- [ ] Route-lab includes at least one recorded or live example where a merge candidate is considered, with selected/rejected reasoning.
- [ ] Solver can consider 3+ pool or 3+ corridor allocations under an explicit quote-call budget, even if no 3-way route wins in the first corpus.
- [ ] Per-hop fee/depth/impact evidence is available to the optimizer or explicitly marked unavailable with a fail-closed policy where required.
- [ ] Quote memoization prevents repeated identical pool/direction/amount reads inside one optimization run.
- [ ] Optimizer diagnostics include quote budget exhaustion, pruned corridors, disabled pools, unsupported router shapes, worse-output rejections, and unsafe-impact rejections.
- [ ] Public quote API does not leak verbose route-lab allocation traces or private RPC diagnostics.
- [ ] Snapshot tests prove deterministic allocation decisions for representative amount buckets.
- [ ] Live route-lab through Doppler RPC proves the optimizer on current Base liquidity for representative USDC, WETH, and FAME sell buckets.
- [ ] Existing protected route materialization and router simulation paths still pass for optimized routes.

## Work Log

### 2026-05-14 - Initial Discovery

**By:** Codex

**Actions:**
- Reviewed the pending todo queues after user feedback about solver behavior.
- Confirmed no pending `www` todo owns route allocation optimization; existing pending work is contract-side execution support.
- Captured user-observed gaps around fixed-looking splits, missing mid-route merges, no observed 3+ pool split, and missing optimizer use of per-hop fee/liquidity depth.
- Created this P1 todo to focus future backend quote-builder work on allocation quality rather than more route enumeration alone.

**Learnings:**
- The solver has enough graph and quote infrastructure to start optimizing allocations, but the allocator itself is now the bottleneck.
- Additional executable pools from wrap/unwrap and Aerodrome support will increase route universe value only if allocation logic can make intelligent use of them.

### 2026-05-14 - Triage

**By:** Codex

**Actions:**
- Approved as ready P1 work after user confirmed this is the immediate backend quote-builder priority.
- Clarified that the first implementation should establish a debuggable coarse-grid baseline before adaptive algorithms.

**Learnings:**
- Route allocation quality is now more important than additional candidate enumeration alone.

### 2026-05-14 - Implementation Pass

**By:** Codex

**Actions:**
- Added a request-scoped optimizer run context with logical quote, exact quote, state read, cache-hit, coalescing, budget, timeout, and fallback stats.
- Added optimizer templates and safe materialization for two-branch direct splits and same-intermediate split-then-merge routes while preserving current flat `FameRoute.legs` execution.
- Added a coarse-grid plus refinement optimizer over executable templates, including endpoint baselines, near-capacity refinement, simpler-route thresholds, final validation, and `disabled` / `shadow` / `select` modes.
- Wired async public quote solving to default `select` mode with fallback to legacy-compatible ranking on optimizer failure; public wire serialization still omits raw optimizer evidence.
- Extended route-lab rows and Markdown with selected allocation bps, trial statuses, quote-plan stats, template eligibility, and NativeWrap/Aerodrome-style gating evidence.
- Verified deterministic `weth-fame-split` now selects a non-static `6250` bps direct split between `scale-equalizer-weth-fame` and `uniswap-v2-fame-direct`.

**Verification:**
- `bun test src/features/fame-swap scripts/fame-swap-route-lab.test.ts src/app/api/fame/swap/quote/route.test.ts` passed with 201 tests.
- `doppler run -- bun run build` passed. A sandboxed non-Doppler build failed earlier because env-backed JSON and Google font/network access were unavailable.

**Remaining Closure Evidence:**
- Run live route-lab through Doppler RPC before marking this todo complete.
- Decide whether remaining 3+ pool/corridor value is sufficiently classified or needs a topology follow-up after reviewing live optimizer evidence.
