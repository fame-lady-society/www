---
date: 2026-05-14
topic: fame-swap-quoter-solver-audit
focus: "Audit current quoter solver performance, efficiency, and coverage; generate grounded improvements"
status: active
inputs:
  - docs/ideation/2026-05-12-fame-swap-router-solver-ideation.md
  - docs/ideation/2026-05-14-fame-swap-open-connector-graph-ideation.md
  - docs/plans/2026-05-13-001-fame-swap-router-solver-plan.md
  - docs/plans/2026-05-13-003-feat-fame-amount-aware-solver-plan.md
  - docs/plans/2026-05-14-001-fame-swap-open-connector-graph-plan.md
  - docs/plans/2026-05-14-002-fame-swap-protocol-quoter-coverage-plan.md
---

# Ideation: FAME Swap Quoter Solver Audit

## Codebase Context

The current FAME swap quoter is no longer the original fixed-artifact scaler. It has a bounded graph candidate generator, split and split-merge route shapes, async live quote adapters, a recorded pool-state snapshot adapter, public API quote serialization, widget quote fetching, route-lab diagnostics, edge gap reporting, and protocol coverage output.

Important current paths:

- `src/features/fame-swap/solver/amountSolver.ts` owns candidate generation, ranking, and generated route materialization.
- `src/features/fame-swap/solver/graph/candidates.ts` generates public FAME-facing candidates only, with default budgets of 3 simple-path legs, 96 candidates, 40 split candidates, and 1000 graph work units.
- `src/features/fame-swap/solver/quotes/rankRoutes.ts` and `asyncRankRoutes.ts` quote candidates leg-by-leg and rank by protected net output.
- `src/features/fame-swap/solver/quotes/liveAdapters.ts` quotes Solidly, Uniswap V2, Slipstream V1, Slipstream2 Gauge Caps, Uniswap V3, and Uniswap V4 with block-scoped quote context.
- `src/features/fame-swap/solver/quotes/snapshotAdapter.ts` replays recorded quote-table rows and constant-product reserves from `base-v1-pool-state-snapshot.json`.
- `scripts/fame-swap-route-lab.ts` is the main operator evidence surface for selected pools, rejections, edge matrix rows, protocol coverage, and optional simulation.

Grounding checks run during this audit:

- `bun test src/features/fame-swap/solver/graph/candidates.test.ts src/features/fame-swap/solver/quotes/rankRoutes.test.ts src/features/fame-swap/solver/amountSolver.test.ts src/features/fame-swap/solver/quotes/snapshotAdapter.test.ts scripts/fame-swap-route-lab.test.ts`
- Result: 45 pass, 0 fail.
- Recorded route lab selected direct `uniswap-v2-fame-direct` for both `weth-fame-split` and `weth-fame-large-closed`; the best Scale/V2 split was close but lower-output under the recorded snapshot.
- Candidate enumeration showed zero candidates containing `msusd` or `mseth` pools for USDC/FAME, WETH/FAME, FAME/USDC, FAME/WETH, ETH/FAME, and FAME/ETH.

## Review Findings

| Severity | Dimension | Finding | Evidence | Suggested Fix |
| --- | --- | --- | --- | --- |
| P1 | Coverage | The solver cannot select an msUSD/msETH route because candidate generation never emits one. | `routeCandidatesForPair` produced zero `msusd`/`mseth` candidates for every supported public FAME pair. With `maxSimplePathLegs: 3`, connector chains that need USDC -> msUSD -> msETH -> WETH -> FAME are unreachable. | Add a dedicated bounded connector corridor for stable/ETH bridge routes, or raise depth only for reviewed corridor tokens with strict candidate budgets and route-lab evidence. |
| P1 | Coverage | There is still no direct reviewed USDC/WETH pool in the pool universe, so USDC routes naturally prefer ZORA/USDC plus ZORA/WETH connectors. | Pool universe contains ZORA/USDC, ZORA/WETH, USDC/frxUSD, WETH/msETH, and msUSD/msETH, but no WETH/USDC edge. Edge matrix already emits WETH/USDC as missing. | Add one or two reviewed USDC/WETH connector pools, then require route-lab and fork evidence before executable use. |
| P2 | Efficiency | Split search is static and sparse, so it only wins when sampled ratios happen to beat direct routes. | WETH split candidates are fixed at 10/90, 25/75, 50/50, 75/25, and 90/10 across direct WETH/FAME pools. Recorded 0.8m and 2.0m WETH buckets ranked direct V2 above every sampled split. | Add local split refinement around promising two-pool combinations using marginal-output probes, while keeping the existing sampled grid as the first pass. |
| P2 | Performance | Async ranking quotes whole candidates independently, which repeats identical edge quotes across overlapping candidates. | USDC -> FAME candidates share edges such as ZORA/USDC, ZORA/WETH, and WETH/FAME. The async ranker calls `quoteEdge` per candidate leg with no memoization. | Add a per-request quote cache keyed by `poolId`, direction, amount, block/snapshot context, and adapter identity. Include rejected quote evidence in route-lab diagnostics. |
| P2 | Efficiency | Rank ordering only optimizes protected output, with market impact only emitted as diagnostics. | `rankRouteCandidates` sorts by protected amount, then shorter route, then id. It does not enforce max market impact or penalize output wins with unacceptable leg impact. | Add a policy layer: hard fail above a configurable impact threshold, soft score output versus impact below the threshold, and expose both in route-lab. |
| P2 | Coverage | Route-lab coverage retains selected-leg evidence only; considered and rejected edges lose quote outputs unless they are the failed leg. | Protocol coverage for considered rows says selected-leg quote evidence is not retained. This makes it hard to explain why close alternatives lost. | Keep compact per-candidate quote summaries for top N alternatives and all candidates within a small output delta from the winner. |
| P3 | Performance | Live quote adapter creates per-leg sequential reads inside each candidate, and the API relies on viem batching rather than an explicit route quote plan. | V3/V4/Slipstream legs read slot/liquidity and quoter output per leg; candidate workers run concurrently, but shared state reads are not planned or deduped. | Add a quote-plan stage that precomputes unique state reads and edge quote calls for the candidate set, then ranks from resolved results. |

## Ranked Ideas

### 1. Reviewed Connector Corridor Expansion

**Description:** Add explicit support for reviewed connector corridors that are not reachable under the default three-leg graph, starting with USDC -> msUSD -> msETH -> WETH -> FAME and reverse variants where router semantics allow them. This should be a narrow corridor list, not arbitrary depth search.

**Rationale:** It directly explains the missing msUSD/msETH evidence. The pool universe and live adapter have Slipstream2 msUSD/msETH coverage, but candidate generation never reaches those edges for supported public pairs.

**Downsides:** More route shapes increase quote calls and route-lab output size. The corridor must be bounded by token allowlists, max quote calls, and fork/simulation evidence.

**Confidence:** 93%

**Complexity:** Medium

**Status:** Unexplored

### 2. Add Reviewed USDC/WETH Connector Liquidity

**Description:** Add one or two reviewed USDC/WETH pools to `base-v1-pools.json` and manifest readiness, beginning with the largest credible Base pools for the supported router venue families. Keep public USDC/WETH unsupported; use the edge only internally for FAME routes.

**Rationale:** Current USDC routes route through ZORA/USDC because the graph has no direct USDC/WETH edge. This is a coverage gap, not a ranking bug.

**Downsides:** Requires contract-side readiness, artifact/manifest updates, quoter validation, and route-lab/fork evidence. Adding a large pool without router readiness would only improve diagnostics, not executable routes.

**Confidence:** 91%

**Complexity:** Medium

**Status:** Unexplored

### 3. Adaptive Split Optimizer

**Description:** Keep the current fixed split samples as a cheap first pass, then refine promising two-branch splits by probing neighboring allocations or using marginal-output search. Start with direct WETH -> FAME Scale/V2 splits.

**Rationale:** The solver already creates split candidates, but the current grid is too coarse to prove whether splitting truly helps. Recorded evidence says direct V2 currently wins for the audited WETH buckets; adaptive refinement would let the system prove that rather than rely on user intuition or static ratios.

**Downsides:** More quote calls and more complexity in route-lab explanations. It should be limited to a small number of branch pairs and only run when both branches quote successfully.

**Confidence:** 88%

**Complexity:** Medium

**Status:** Unexplored

### 4. Per-Request Quote Memoization And Quote Planning

**Description:** Introduce a quote planning layer that dedupes identical edge quotes and state reads across candidates before ranking. For live mode, key by pool, direction, amount, block number, and adapter family; for snapshot mode, key by snapshot id.

**Rationale:** Current async ranking is bounded and concurrent, but overlapping paths still re-quote the same leg amounts. This is the highest-leverage performance improvement before adding deeper connector corridors or adaptive split search.

**Downsides:** Requires careful cache key design to avoid reusing quotes across different block contexts or slippage/request settings. It also changes route-lab evidence collection.

**Confidence:** 86%

**Complexity:** Medium

**Status:** Unexplored

### 5. Top-Alternative Evidence In Route Lab

**Description:** Persist compact quote summaries for top losing candidates and near-tie candidates: pool set, protected output, max impact, first failed leg, and quote source. Surface this in JSON and optionally Markdown.

**Rationale:** User testing is currently interpreting absence of a selected split route as absence of split search. Route lab can prove whether a split was generated, quoted, and lost by a measurable margin.

**Downsides:** Larger route-lab output. Public API should continue stripping this operator-only evidence.

**Confidence:** 90%

**Complexity:** Low

**Status:** Unexplored

### 6. Market-Impact-Aware Route Policy

**Description:** Add a route policy layer that rejects routes above a max leg/route market-impact threshold, then ranks safe routes by protected output. Optionally add a soft penalty for high impact below the threshold.

**Rationale:** Output-only ranking can select a high-output route that users perceive as inefficient or too concentrated. This also gives a principled reason to split even when direct output is narrowly higher.

**Downsides:** Threshold selection is product/risk-sensitive. Too strict a threshold can create false `no_safe_route` states for thin FAME liquidity.

**Confidence:** 82%

**Complexity:** Medium

**Status:** Unexplored

### 7. Live Evidence Freshness And Drift Checks

**Description:** Add an operator check that compares recorded snapshot selections against fresh live route-lab selections for the same amount corpus, then flags route flips, missing quotes, and impact drift.

**Rationale:** User reports may come from current live pool state differing from the recorded snapshot. A drift check would separate stale evidence from algorithmic gaps.

**Downsides:** Requires authenticated Base RPC in operator environments and may be noisy if pool state changes frequently.

**Confidence:** 79%

**Complexity:** Low

**Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
| --- | --- | --- |
| 1 | Raise `maxSimplePathLegs` globally to 4 or 5 | Too broad for public quote latency and candidate explosion; a reviewed corridor is safer. |
| 2 | Add arbitrary Base pool discovery | Out of scope and contradicts the bounded FAME-router design. |
| 3 | Force WETH splits whenever amount is large | Would knowingly pick worse quotes under current recorded evidence; use policy thresholds or adaptive proof instead. |
| 4 | Make ZORA/USDC routes ineligible | Removes working liquidity without adding the missing USDC/WETH connector. |
| 5 | Re-enable deterministic capacity profiles for faster production quotes | Already rejected by prior solver work; not production quote evidence. |
| 6 | Add public USDC/WETH swaps to test connector quality | Public pairs must stay FAME-facing; connector quality belongs in route lab and internal search. |
| 7 | Treat active liquidity reads as route capacity | Active liquidity is useful evidence but not complete capacity or post-swap proof for concentrated-liquidity venues. |
| 8 | Store full per-candidate protocol evidence in public API responses | Operator evidence would bloat and risk leaking internal diagnostics; route-lab is the right surface. |
| 9 | Make route simulation mandatory for every quote API response | Strong safety signal, but likely too expensive for normal quote latency; better as route-lab/fork proof and final wallet gate. |
| 10 | Add a formal route promotion pipeline | Previously rejected as too heavy; exact follow-up todos are enough. |

## Suggested Next Brainstorm Seeds

1. Reviewed connector corridor expansion for msUSD/msETH.
2. Adaptive split optimizer for WETH -> FAME Scale/V2.
3. Quote memoization and top-alternative route-lab evidence.

## Session Log

- 2026-05-14: Initial audit ideation. Grounded in current solver code, route-lab output, recent plans, and focused tests. Generated 17 candidate improvements; kept 7 survivors.
