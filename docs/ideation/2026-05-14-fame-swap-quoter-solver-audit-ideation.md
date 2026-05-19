---
date: 2026-05-14
updated: 2026-05-17
topic: fame-swap-quoter-solver-audit
focus: "Audit current quoter solver performance, efficiency, and coverage; generate grounded improvements"
status: active
inputs:
  - docs/ideation/2026-05-12-fame-swap-router-solver-ideation.md
  - docs/ideation/2026-05-14-fame-swap-open-connector-graph-ideation.md
  - docs/solutions/performance-issues/fame-swap-quote-solver-timeouts-native-wrap-routing-2026-05-15.md
  - docs/plans/2026-05-13-001-fame-swap-router-solver-plan.md
  - docs/plans/2026-05-13-003-feat-fame-amount-aware-solver-plan.md
  - docs/plans/2026-05-14-001-fame-swap-open-connector-graph-plan.md
  - docs/plans/2026-05-14-002-fame-swap-protocol-quoter-coverage-plan.md
  - ../society-bots
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

## 2026-05-17 Market-Memory Delta: Event-Fed Pool-State Index

### Grounding Context

The prior solver ideation already covers bounded graph search, request-scoped quote/state memoization, split allocation, adaptive search, and route-lab evidence. The new delta is not another in-process optimizer pass; it is a durable market-memory layer that lets quote requests start from warmed, versioned pool state and route hints.

Relevant current assets:

- `www` already has a 15 second quote API cap, bounded optimizer budgets, request-scoped exact quote/state read coalescing, live adapters, and a recorded snapshot adapter.
- `src/features/fame-swap/solver/optimizer/quoteRunAdapter.ts` proves the current optimization boundary can consume a cached state source without changing the solver's public contract.
- `src/features/fame-swap/solver/quotes/snapshotAdapter.ts` proves the solver can quote from pre-captured state where the math is safe.
- `../society-bots` already deploys Lambda, EventBridge schedules, SNS/SQS, API Gateway, and DynamoDB, and already decodes or watches some Base V2/V3 swap events.
- `../society-bots` currently tracks only narrow FAME/WETH pool coverage and cursor-like last indexed blocks; it does not yet store pool-state snapshots keyed by pool, block, and event version.

External grounding:

- AWS DynamoDB guidance favors access-pattern-first modeling and direct `GetItem`/`BatchGetItem` or `Query` access over scans for hot paths: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-general-nosql-design.html
- DynamoDB secondary indexes are useful alternate access paths, but global secondary indexes are eventually consistent and should not be the authoritative latest-state read path for quote-critical pool state: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/SecondaryIndexes.html
- DynamoDB TTL is cleanup, not a freshness guarantee, because expired items can remain readable until background deletion: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html
- DynamoDB Streams plus Lambda is useful for secondary effects such as invalidation and archival, but processing is event-driven and should be treated as at-least-once: https://docs.aws.amazon.com/lambda/latest/dg/with-ddb.html

### Topic Axes

- Pool-state ingestion and coverage.
- DynamoDB access/index design.
- Quote-path integration and latency budgets.
- Route samples/liquidity approximations.
- Freshness, invalidation, and external solver readiness.

### Ranked Ideas: Market-Memory Delta

#### 1. Pool Coverage Registry From `www` Artifacts

**Description:** Generate a `society-bots` pool coverage registry from the reviewed `www` FAME pool universe: chain, pool id/address, venue family, token pair, fee/tick spacing, event source, state fields available, math capability, freshness policy, and route role. Every solver pool should be classified as `event_fed`, `rpc_only`, `state_hint_only`, or `unsupported_for_local_math`.

**Axis:** Pool-state ingestion and coverage.

**Basis:** direct: `www` already owns the bounded pool universe, while `society-bots` currently hardcodes narrow Base FAME/WETH event coverage. reasoned: acceleration only helps if it covers pools the optimizer actually considers.

**Rationale:** This is the bridge between the solver and the event infrastructure. It prevents a generic Base index that is impressive but irrelevant, and it prevents hidden gaps where the quote path assumes a pool is warmed when the bot never subscribed to it.

**Downsides:** Requires a shared artifact or export path between repos. The registry is not quote evidence by itself; it only defines what can be indexed and how each pool may be used.

**Confidence:** 92%

**Complexity:** Medium

**Status:** Unexplored

#### 2. `PoolStateLatest` Table With Base-Key Hot Lane And Versioned Writes

**Description:** Add a DynamoDB latest-state table keyed for quote-time batch reads, for example `PK = POOL#8453#<poolId>` and `SK = STATE#latest`. Store compact typed state plus `blockNumber`, `transactionIndex`, `logIndex`, `sourceVersion`, `updatedAt`, and `expiresAt`. Use conditional writes so only newer `(blockNumber, transactionIndex, logIndex)` updates can replace the latest row. Add GSIs only for secondary views such as pair coverage, stale-pool scans, or operator dashboards.

**Axis:** DynamoDB access/index design.

**Basis:** external: AWS guidance says DynamoDB design should start from access patterns and that secondary indexes are alternate query structures with different consistency/capacity behavior. direct: the quote optimizer already knows candidate pool ids before edge evaluation, so it can address latest rows directly.

**Rationale:** The hot quote path should not discover latest state through broad scans or eventual-consistent GSI queries. Direct base-key reads make the critical path predictable, while conditional versioning protects the table from duplicate or out-of-order event delivery.

**Downsides:** Reorg/finality handling still needs a policy. A very hot pool can become a hot key if external solver usage grows, so DAX/read replicas or sharded latest rows may become a later scaling concern.

**Confidence:** 90%

**Complexity:** Medium

**Status:** Unexplored

#### 3. DynamoDB Snapshot Adapter And Batch State Planner In `www`

**Description:** Add a quote-state hydration step that gathers candidate pool ids, `BatchGetItem`s latest pool rows once, and builds a request-scoped immutable state snapshot. Feed that snapshot into a new adapter beside the existing live and snapshot adapters. V2/volatile constant-product pools can use validated local reserve math; concentrated-liquidity pools can use event-fed state as planning evidence unless exact local math is later proven.

**Axis:** Quote-path integration and latency budgets.

**Basis:** direct: `quoteRunAdapter.ts` already coalesces request-local state reads, and `snapshotAdapter.ts` already proves the solver can consume captured state. reasoned: doing one bounded prefetch before optimizer trials turns many repeated RPC state reads into local reads without expanding the search budget.

**Rationale:** This is where the market-memory service actually makes quotes faster. It preserves the existing adapter boundary and public quote response contract instead of threading AWS reads through solver internals.

**Downsides:** Adds a cross-service dependency to the quote API. Missing, stale, or unsupported pool rows must be explicit inputs to solver policy, not silent reasons to stretch the API timeout.

**Confidence:** 88%

**Complexity:** Medium

**Status:** Unexplored

#### 4. Typed Freshness And Invalidation Policy

**Description:** Treat event-fed state as one of `fresh`, `soft_stale`, `hard_stale`, `missing`, `invalidated`, or `unsupported_math`. Use protocol-specific max block age/event age policies. Swap/sync/mint/burn events bump a monotonic pool version and invalidate derived route samples for every route that depends on that pool. TTL may clean old samples, but quote correctness must check freshness directly.

**Axis:** Freshness, invalidation, and external solver readiness.

**Basis:** external: DynamoDB TTL deletes are delayed background cleanup, and Streams/Lambda are event-driven rather than a synchronous correctness gate. direct: prior solver timeout learnings require stale-state rules and fail-fast API behavior rather than silent fallback.

**Rationale:** Faster stale quotes are worse than slow honest quotes. A typed freshness policy lets route-lab explain state quality, lets the public API stay sanitized, and gives future external solvers a clear contract for when indexed data is executable versus advisory.

**Downsides:** Thresholds are product/risk decisions and will need route-lab evidence. Too strict a policy can erase acceleration benefits; too loose a policy can choose routes from stale liquidity.

**Confidence:** 89%

**Complexity:** Medium

**Status:** Unexplored

#### 5. Planning-Only Route Samples And Liquidity Hints

**Description:** Store bounded planning rows for common FAME pairs and route templates: amount buckets, last successful probes, reserve-derived depth, rough slippage bands, active-liquidity/tick observations, and top-K candidate hints. Mark these rows `planning_only`, never `quote_evidence`. They can reorder candidates, seed adaptive search, or prune obviously weak routes, but final executable quotes still require exact local math or live/quoter validation.

**Axis:** Route samples/liquidity approximations.

**Basis:** direct: the optimizer already has bounded candidate/template budgets and benefits from better ordering. reasoned: samples reduce wasted trials, but concentrated-liquidity event state is not enough to compute exact amount-out without tick traversal or trusted quoter evidence.

**Rationale:** This captures the user's linear-approximation instinct without smuggling approximations into executable quote output. The solver gets smarter starting guesses while the final quote boundary remains honest.

**Downsides:** Requires dependency tracking from route samples to pool versions. Bad hints can bias pruning, so early use should be top-K ordering only, not hard elimination.

**Confidence:** 84%

**Complexity:** Medium

**Status:** Unexplored

#### 6. Minimal One-Table / One-Projector Proving Slice

**Description:** Build the smallest deployable proof first: one `PoolStateLatest` table, one `society-bots` projector for a small reviewed pool subset, and one `www` route-lab/quote mode that reads indexed V2/volatile state before live RPC. Acceptance should be measured by selected-route parity and reduced unique RPC/state reads, not by new route coverage.

**Axis:** Quote-path integration and latency budgets.

**Basis:** direct: `society-bots` already has Lambda/DynamoDB deployment patterns and `www` route-lab already exposes quote-plan stats. reasoned: proving latency and parity on simple pools is safer than building a full multi-protocol market-data platform first.

**Rationale:** This gives the idea a concrete first rung. It also prevents the market-memory work from ballooning into infrastructure theater before it has proven quote-path value.

**Downsides:** The first slice will not solve V3/V4 exact amount-out by itself. It may look modest unless route-lab clearly shows fewer RPC reads or faster large quotes.

**Confidence:** 87%

**Complexity:** Low-Medium

**Status:** Unexplored

#### 7. External Solver Readiness Contract

**Description:** Shape the internal state service as if future solvers will consume it: batch pool-state fetch, route/sample hint fetch, freshness/capability flags, and a pool invalidation stream. Keep it internal first, but design payloads around safe capability states such as `exact_amount_out_capable`, `state_hint_only`, `live_validation_required`, and `publicly_executable`.

**Axis:** Freshness, invalidation, and external solver readiness.

**Basis:** direct: public quote responses already strip raw diagnostics, and `society-bots` already has SNS/SQS/EventBridge/API Gateway primitives. reasoned: the long-term `$FAME` solver opportunity needs a clean readiness contract before it becomes a public solver product.

**Rationale:** This turns a one-off cache into a control plane for efficient solving. It also preserves the current `www` solver as the authority until external solvers can prove they respect freshness, capabilities, and validation gates.

**Downsides:** Public productization should wait. Exposing the contract too early can invite consumers to rely on advisory data as if it were quote evidence.

**Confidence:** 81%

**Complexity:** Medium

**Status:** Unexplored

### Rejection Summary: Market-Memory Delta

| # | Idea | Reason Rejected |
| --- | --- | --- |
| 1 | No-RPC quote fast lane as the first goal | Useful later, but too strict for the first integration because concentrated-liquidity routes still need validated quoter/live evidence. |
| 2 | Public solver product shell immediately | Long-term aligned, but too early before the internal freshness and readiness contract exists. |
| 3 | Search-index postings for candidate edges as a separate system | Valuable variant of the pool coverage registry, but weaker than first making coverage and freshness authoritative. |
| 4 | Telemetry budget governor as a top idea | Helpful observability, but it measures acceleration rather than creating the acceleration. |
| 5 | All-data-stale mode | Covered by planning-only samples plus typed freshness; as a standalone mode it risks normalizing stale data. |
| 6 | Concentrated-liquidity event snapshots as executable quote evidence | Rejected as final amount-out evidence. Keep them as `state_hint_only` until local tick math or trusted quoter parity is validated. |
| 7 | Whole final quote response caching | Still rejected from prior optimizer work. Amount, slippage, recipient, block context, and route state make primitive pool-state memory more useful and safer. |

### Suggested Next Brainstorm Seed

The strongest next seed is the first deployable slice:

> Define a `PoolStateLatest` registry/table and `www` DynamoDB snapshot adapter that accelerates V2/volatile FAME quote state reads while preserving existing optimizer budgets, route-lab evidence, and fail-closed freshness policy.

## Session Log

- 2026-05-14: Initial audit ideation. Grounded in current solver code, route-lab output, recent plans, and focused tests. Generated 17 candidate improvements; kept 7 survivors.
- 2026-05-17: Continued from this audit to cover the market-memory delta: using `../society-bots` AWS/DynamoDB/event infrastructure as an event-fed pool-state and route-hint service. Generated 48 raw candidates across six frames; kept 7 survivors focused on pool coverage, latest-state indexing, DynamoDB snapshot integration, freshness/invalidation, planning-only route samples, a minimal proving slice, and an external solver readiness contract.
- 2026-05-17: Implemented the first pool-state proving slice across `www` and `society-bots`: registry export, typed society-bots parser, DynamoDB latest-state indexer/API, indexed reserve replay adapter, route-lab indexed mode, and quote API fallback wiring. V1 stays limited to quote-model V2/volatile pools; stable and concentrated pools remain tracked-only or live-fallback.
