---
date: 2026-05-14
topic: fame-swap-route-allocation-optimizer
focus: "Raw algorithm ideation for todo 012: route allocation optimizer"
source_todo: .context/compound-engineering/todos/012-ready-p1-add-route-allocation-optimizer.md
---

# Ideation: FAME Swap Route Allocation Optimizer

## Codebase Context

The FAME swap quote builder now has a real solver skeleton, but the allocation layer is still early.

- `src/features/fame-swap/solver/graph/candidates.ts` generates `single_path`, `split`, and `split_merge` candidates.
- Current split samples are fixed in `src/features/fame-swap/solver/graph/split.ts`: `1000`, `2500`, `5000`, `7500`, and `9000` bps.
- `splitCandidates` only splits direct same-input/same-output pools.
- `splitMergeCandidates` only handles the narrow case where two first-hop edges produce the same intermediate token, then one merge edge continues to the final output.
- `rankRouteCandidates.ts` and `asyncRankRoutes.ts` quote whole generated candidates leg-by-leg and sort by protected output, then shorter route, then id.
- `routeMath.spendAmount` can spend an exact allocation bps or the route-local token balance, which is enough to materialize split and merge routes once an allocation is chosen.
- `createLiveLiquidityQuoteAdapter` pins one block when created, but individual quote calls still reread state such as reserves, `slot0`, active liquidity, and quoter output per quoted edge.
- `snapshotAdapter.ts` already replays constant-product reserve math for Uniswap V2 and volatile Solidly pools, and quote-table evidence for other protocols.
- Route-lab already reports selected routes, rejected candidates, edge matrix rows, protocol coverage, and sanitized diagnostics. It does not yet report allocation trials or why a nearby split ratio lost.
- No `docs/solutions/` corpus exists in this repo, so there is no separate implementation-learning source.

The algorithm problem is therefore not "discover every route." It is: given a bounded executable route universe, choose amount allocations across pools and corridors in a way that is efficient, explainable, and cheap enough for the backend quote boundary.

## Raw Candidate Pool

Generated candidate directions before filtering:

1. Define an explicit optimizer objective function before adding any search algorithm.
2. Add a request-scoped quote/state planner that dedupes pool state and exact quote reads.
3. Split route templates from allocation plans so the same route shape can be evaluated at many allocations.
4. Add coarse-grid plus local-refinement search for two-branch allocations.
5. Add segment-level parallel-edge optimization so splits can happen in the middle of a route.
6. Add merge-aware corridor decomposition with prefix, branch, merge token, and suffix.
7. Add N-way bounded simplex allocation for 3+ pools or corridors.
8. Add a local constant-product curve oracle for V2 and volatile Solidly pools.
9. Add route-lab allocation trial output with selected, rejected, pruned, and budget-exhausted records.
10. Add route-lab curve-shape classification to decide whether adaptive search is safe later.
11. Penalize high-impact routes even when protected output is slightly higher.
12. Add gas and wrap/unwrap costs to the objective once those route legs exist.
13. Add top-K corridor preselection using small marginal probes before running full allocation search.
14. Use final live quoter or route simulation as a validation gate after local or cached optimization.
15. Cache whole final quote responses at the edge by pinned block.
16. Increase `maxSimplePathLegs` to 5 globally.
17. Jump directly to min-cost-flow routing.
18. Use ternary or golden-section search immediately.
19. Implement full local Uniswap V3 tick math before any grid search.
20. Force large trades to split even if output is worse.
21. Add more static split ratios and call it solved.
22. Move route optimization into `../fame-contracts/router-ts`.
23. Display 3+ split routes even when they were only considered, not selected.
24. Use venue fee labels as if they were a complete dynamic fee/depth model.
25. Rely on wallet simulation to decide whether a selected allocation was good.

## Ranked Ideas

### 1. Optimizer Objective And Evidence Contract

**Description:** Define the exact objective the optimizer is allowed to maximize before adding more search. At minimum: protected net output after router fee, all venue fees already included in leg quotes, route-local minimums, quote context consistency, and a market-impact policy. Add an operator-only allocation evidence shape for route-lab: trial id, route template id, allocation vector, branch inputs, branch outputs, net/protected output, max impact, quote-call count, selected/rejected/pruned status, and reason.

**Rationale:** Without a stable objective, every search algorithm is optimizing an informal feeling. This also creates the explanation layer users are asking for: "we tried 25/75, 50/50, 75/25; 35/65 won by X; 3-way was pruned by budget."

**Downsides:** Adds types and diagnostics before the selected route quality changes. It can feel like overhead unless kept tightly scoped.

**Confidence:** 93%

**Complexity:** Medium

**Status:** Unexplored

### 2. Request-Scoped Quote And State Planner

**Description:** Insert a quote-plan stage between candidate generation and ranking. The planner dedupes block-scoped state reads and exact quote reads across candidates and allocation trials. It should cache pool state by `quoteContext + poolId + stateField` and exact quote results by `quoteContext + poolId + tokenIn + tokenOut + amountIn + adapter`. For allocation search, state memoization is the larger win; exact quote memoization still helps shared prefixes and repeated trial points.

**Rationale:** `liveAdapters.ts` currently rereads reserves, `slot0`, active liquidity, and quoter output inside each quote. Grid search will multiply that. A planner lets the first optimizer be honest without turning route-lab into an RPC stress test.

**Downsides:** Requires threading a cache through sync, async, live, snapshot, and test adapters. Concurrency has to avoid duplicate in-flight reads.

**Confidence:** 91%

**Complexity:** Medium

**Status:** Unexplored

### 3. Route Template And Allocation Plan Separation

**Description:** Replace "one generated candidate per static allocation" with two concepts: a route template and an allocation plan. A template describes executable topology: serial path, direct parallel split, segment split, split-then-merge, or N-way corridor. Allocation plans instantiate that template with exact amounts or bps. Ranking then evaluates allocated plans rather than pretending every bps sample is a distinct route family.

**Rationale:** The current candidate id bakes `allocationBps` into the route shape, which made sense for fixed samples. Optimizer work needs to evaluate many allocations for the same shape and attach evidence to the shape. This also makes adaptive search later much cleaner.

**Downsides:** This touches core types and tests. It needs compatibility glue so existing route display and materialization still receive ordered legs with concrete amounts.

**Confidence:** 88%

**Complexity:** High

**Status:** Unexplored

### 4. Two-Branch Coarse Grid With Local Refinement

**Description:** Implement the first allocation algorithm as a coarse grid plus local refinement for two-branch templates. Keep the coarse samples simple and auditable, then refine around the best point with nearby bps steps. Compare the best allocation against the unsplit alternatives using the explicit objective. Emit every trial to route-lab.

**Rationale:** This is the right baseline. It directly addresses fixed 50/50-looking behavior, gives deterministic evidence, and becomes the oracle that later adaptive algorithms must match.

**Downsides:** It does not solve 3+ allocation by itself and can be quote-call heavy without idea 2.

**Confidence:** 90%

**Complexity:** Medium

**Status:** Unexplored

### 5. Segment-Level Parallel Edge Optimizer

**Description:** Detect serial route segments where the same `tokenIn -> tokenOut` segment has multiple executable pools, then replace that segment with a split subplan. Example shape: `A -> X`, then split `X -> Y` across two or more pools, then continue `Y -> FAME`. This is different from current direct split and current first-hop split-then-merge generation.

**Rationale:** This is the missing "service input in the middle of a leg with 2+ pools" behavior. It lets the solver optimize liquidity where the route actually gets thin instead of only at the route entry.

**Downsides:** Requires the route plan model to represent nested or expanded leg groups while still materializing to the router's flat leg list.

**Confidence:** 86%

**Complexity:** High

**Status:** Unexplored

### 6. Bounded N-Way Allocation Over Top-K Alternatives

**Description:** Add 3+ pool or corridor consideration by first selecting a small top-K set of alternatives using cheap probes or route-lab-proven corridors, then run bounded simplex samples or greedy pairwise improvement under a strict quote-call budget. It is acceptable for 3-way routes to be considered and lose; route-lab should prove they were evaluated or pruned.

**Rationale:** User testing has never seen a 3+ pool split. The solver needs explicit machinery for it, but naive exhaustive grids explode quickly. Top-K plus budgeted samples gives coverage without becoming a full aggregator.

**Downsides:** Search quality depends on the top-K preselection heuristic. Bad preselection can hide a strong third route.

**Confidence:** 80%

**Complexity:** High

**Status:** Unexplored

### 7. Constant-Product Local Curve Oracle

**Description:** For Uniswap V2 and volatile Solidly-style pools, use cached reserves and fee metadata to evaluate allocation points locally. Keep live quoter paths for concentrated liquidity and V4 at first. Add parity tests that compare local reserve replay with existing snapshot/live evidence for representative amounts.

**Rationale:** Allocation search over simple constant-product pools does not need repeated RPC quotes once reserves are pinned. This creates the first pool class where the optimizer can cheaply sample many allocations and later support marginal-price methods.

**Downsides:** Only helps simple pools at first. Stable curves, concentrated liquidity, and hooked V4 still need quote reads or deeper state caches.

**Confidence:** 84%

**Complexity:** Medium

**Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Cache whole final quote responses at the edge first | Infrastructure-before-algorithm. Amounts, recipients, deadlines, and route state make primitive pool-state caching more useful than final quote caching at this stage. |
| 2 | Increase `maxSimplePathLegs` to 5 globally | Expands search but does not solve allocation quality; likely increases quote calls and noisy diagnostics. |
| 3 | Jump directly to min-cost-flow routing | Theoretically attractive but too expensive and opaque for the current launch path. |
| 4 | Use ternary or golden-section search immediately | Needs a coarse-grid baseline and curve-shape evidence first; otherwise it can optimize through discontinuities or failed quote regions. |
| 5 | Implement full local Uniswap V3 tick math first | Too much complexity before the optimizer has proven value on simpler pool classes. |
| 6 | Force large trades to split | Can knowingly pick worse output; policy should be encoded as objective/impact thresholds, not hard forcing. |
| 7 | Add more static split ratios only | A small improvement, but it keeps allocation as candidate enumeration rather than optimization. |
| 8 | Move route optimization into `../fame-contracts/router-ts` | `router-ts` is deterministic artifact generation and contract parity, not a live liquidity optimizer. |
| 9 | Display 3+ split routes that were only considered | Misleading. UI can summarize selected routes; route-lab can show considered/pruned optimizer evidence. |
| 10 | Use venue fee labels as the dynamic fee/depth model | Fee labels are display metadata. They do not encode marginal depth or current pool state. |
| 11 | Rely on wallet simulation to decide allocation quality | Too late in the UX and too expensive as the primary optimizer; simulation should remain final validation. |
| 12 | Treat adaptive algorithms as todo `012`'s first step | Already split into todo `013`; adaptive search should follow the baseline grid optimizer. |

## Recommended Sequence

1. Implement the optimizer objective/evidence contract.
2. Add request-scoped quote/state planning and memoization.
3. Introduce route templates versus allocation plans with compatibility output for current materialization.
4. Ship two-branch coarse grid plus local refinement for one or two corridors.
5. Extend the template model to segment-level parallel-edge splits.
6. Add bounded N-way consideration and route-lab proof.
7. Add constant-product local curve optimization for simple pools.

## Handoff Candidate

The strongest `ce:brainstorm` seed is idea 3 plus idea 4:

> Define the route template/allocation plan model and implement the first two-branch coarse-grid optimizer in a way that preserves current route materialization and exposes route-lab allocation evidence.

That seed is narrower than "build the optimizer" and broad enough to settle the core architecture.

## Session Log

- 2026-05-14: Fresh algorithm ideation for todo `012`. Grounded in current solver candidate generation, route ranking, route math, live/snapshot adapters, and the ready todo. Generated 25 raw candidates; kept 7 survivors and rejected 12 explicit alternatives.
