---
date: 2026-05-12
updated: 2026-05-13
topic: fame-swap-router-solver-www
focus: "Finish the FAME swap solver so routes are amount-aware, user-safe, testable, and liquidity-derived"
status: active
source_branch: feat/fame-swap-router-solver
split_ui_doc: docs/ideation/2026-05-13-fame-swap-widget-ui-ux-hardening-ideation.md
---

# Ideation: FAME Swap Router Solver Finish

## Purpose

This document is the solver/backend half of the FAME swap ideation split. The original 2026-05-12 ideation covered both route solving and the first `/fame/swap` widget. Commit `6c07283 feat(fame-swap): enable live router swaps` implemented the first `www` slice: copied route artifacts, manifest metadata, ABI/hash parity checks, live readiness checks, arbitrary-amount route materialization, slippage-backed wallet simulation, transaction request generation, the first widget, and fork scripts.

The 2026-05-13 re-ideation changes the finish line. The current UI works as a route exercise surface, but the solver is not release-safe: it selects one preferred pinned route per pair, scales old fixture amounts, and depends on wallet simulation to discover that larger user amounts drain the chosen route. Small amounts can work; larger amounts routinely produce routes that fail simulation because the solver does not discover, split into, or rank alternative pools as liquidity is consumed.

The remaining question is therefore narrower and more urgent: how do we turn the current artifact-backed beta into an amount-aware swap solver with a testable route library, an evidence corpus, and a contract-repo feedback loop before release?

Widget presentation and interaction work remains in `docs/ideation/2026-05-13-fame-swap-widget-ui-ux-hardening-ideation.md`.

The 2026-05-13 implementation pass added a bounded graph solver, generated route plans, fee breakdowns, no-safe-route statuses, route-lab output, and a deterministic quote adapter. That uncovered a new release blocker: the adapter's per-pool `capacityIn` values are still hard caps, not liquidity calculations. A user entering `$5` USDC can receive `no_safe_route` because the deterministic profile only allows `$0.50` per USDC -> frxUSD branch. The next solver iteration must remove those caps and quote from pool liquidity or venue quote reads.

## Codebase Context

### Current `www` Implementation

- `src/features/fame-swap/artifacts/` contains copied Base v1 solver routes, gap matrix, parity vectors, and a TypeScript manifest.
- `src/features/fame-swap/router/` owns route typing, ABI encoding, route hashing, payload patching, minimal router ABI, and ERC-20 approval ABI.
- `src/features/fame-swap/solver/` owns artifact loading, integrity checks, quote construction, route materialization, live readiness, slippage math, and display formatting.
- `src/features/fame-swap/solver/quote.ts` selects the gap-matrix preferred route or first matching route for a token pair. It does not search a graph or compare routes by current amount.
- `src/features/fame-swap/solver/materializeRoute.ts` scales fixture `Exact` amounts and per-leg minimums from the selected artifact. This is useful for payload patching, but it is not a real market quote or capacity model.
- `src/app/api/fame/swap/quote/route.ts` exposes a node runtime quote endpoint, but it returns the same selected/materialized route rather than an independently solved route.
- `src/features/fame-swap/hooks/useFameSwapTransaction.ts` runs wallet-side probe simulation, computes a slippage-protected final minimum, simulates the exact protected route, then submits through wagmi. This protects submission, but it is too late in the UX to be the primary route solver.
- `scripts/fame-swap-fork-smoke.ts`, `scripts/fame-swap-fork.ts`, and `scripts/fame-swap-local-dev.ts` provide local fork, local router deployment, smoke validation, and local development loops.
- `src/features/fame-swap/solver/graph/` now builds bounded route candidates from the pinned pool universe.
- `src/features/fame-swap/solver/quotes/deterministicAdapter.ts` currently returns output from synthetic rates and hard `capacityIn` values. This is useful for unit tests but is not acceptable as production quote evidence.
- `src/features/fame-swap/artifacts/base-v1-pools.json` contains topology and venue metadata only: pool addresses, token endpoints, routers, fee tiers, tick spacing, V4 pool ids, hooks, and hook data. It does not contain reserves, sqrt prices, ticks, active liquidity, or pinned pool-state snapshots.
- `src/features/fame-swap/components/FameSwapWidget.tsx` still builds quotes synchronously in `useMemo` by calling `quoteFameSwap`. Live liquidity reads are async and therefore need either an API-backed quote hook or a pinned synchronous snapshot adapter for local-only previews.
- `src/app/api/fame/swap/quote/route.ts` already runs in the Node runtime, has RPC configuration, and is the natural home for async live-liquidity quote adapters.

### Contract Repo Grounding

- `../fame-contracts/router-ts/src/compiler/compileRoute.ts` hardcodes seven solver artifacts. It is deterministic and intentionally does not discover pools, rank prices, or call RPC.
- `../fame-contracts/router-ts/README.md` says `router-ts` compiles known Base pool config into exact route artifacts and does not discover or rank liquidity.
- `../fame-contracts/test/router/fixtures/base-v1-pools.json` currently has more pool metadata than `www` imports, but the generated solver artifact set only exposes the small curated route table.
- `../fame-contracts/test/router/FameRouterForkBase.t.sol` proves every generated solver route executes at the pinned block, but it does not sweep user amount sizes, learn route capacity, or validate dynamic split optimization.
- `../fame-contracts/.context/compound-engineering/todos/004-complete-p3-add-live-pool-metadata-and-route-simulation-validation.md` closed live pool metadata validation for the current launch goal while leaving deterministic route execution in the pinned fork matrix.

### Recent Verification

Focused FAME swap tests passed on 2026-05-13:

- `bun test src/features/fame-swap/router/encodeRoute.test.ts src/features/fame-swap/solver/quote.test.ts src/features/fame-swap/solver/readiness.test.ts src/features/fame-swap/solver/materializeRoute.test.ts src/features/fame-swap/state.test.ts src/features/fame-swap/transactions.test.ts src/features/fame-swap/components/FameSwapWidget.test.ts`
- Result: 24 pass, 0 fail.

`yarn lint` also passed, with pre-existing warnings in `src/app/[network]/profile/image/[tokenId]/route.tsx` about raw `<img>` usage.

Those checks prove current encoding and widget mechanics. They do not prove that arbitrary user amounts get safe, natural, or optimal routes.

### Current Todo State

- `001` live slippage-backed FAME swap quotes: front matter says completed, and submission is now protected by simulation, but this re-ideation supersedes the claim that arbitrary amount scaling is solver-complete.
- `002` pinned archive RPC validation: pending. Latest-state fork smoke has passed, but default manifest-block validation still needs an archive-capable RPC path.
- `003` typed FAME swap artifacts: pending. Runtime integrity checks exist, but JSON imports still rely on TypeScript assertions.
- `004` estimate liquidity fees, `005` pre-approval quote fallback, and `006` richer route graph are useful follow-ups, but they do not solve route construction safety.
- No `docs/solutions/` directory exists in this repo, so there were no local solution notes to reuse.

### 2026-05-13 Liquidity Pivot Context

- Hard caps are now explicitly rejected. They can remain only as diagnostic fallback in tests, not as the quote model for user-facing amounts.
- The correct quote input is pool liquidity/state at a known block, not copied route fixture amounts.
- The safest implementation boundary is likely two adapters: an async live adapter for the API and route lab, plus a deterministic pinned pool-state adapter for pure tests.
- The UI should not keep treating synchronous local quote construction as authoritative once quote evidence depends on RPC reads.
- Every route candidate should be quoted against a consistent block tag or snapshot so ranking does not compare mixed pool states.

### Release-Blocking Interpretation

The current route flow should be treated as a simulation-gated prototype, not a release-ready swap router. Before release, quote construction needs to fail closed unless it can produce a route selected for the requested amount, with current output estimates and split decisions backed by a testable solver component. Wallet simulation should remain the final gate, but it cannot be the first place the system learns that the route was bad.

## Raw Candidate Pool

The 2026-05-13 re-ideation generated candidates from four frames: user/operator pain, removal of painful manual route testing, assumption-breaking around pinned route artifacts, and compounding leverage for future route learning.

- Stop treating linearly scaled fixture routes as executable arbitrary-amount quotes.
- Add an explicit quote status for "no safe route found for this amount" before approval.
- Add temporary amount caps per route family based on proven simulation envelopes.
- Build a pure `www` route graph model from pinned pool metadata and route adapters.
- Import pool metadata from `../fame-contracts/test/router/fixtures/base-v1-pools.json` into a typed solver bundle.
- Add venue quote adapters for Solidly, Uniswap V2, Slipstream, Uniswap V3, and Uniswap V4.
- Add candidate route generation over the known pool universe instead of selecting one artifact ID.
- Add bounded path search with token/pool allowlists and route shape constraints.
- Add dynamic split allocation across same-input/same-output pools.
- Add split-then-merge allocation where two venues feed an intermediate token before final output.
- Add amount sweep tests for every supported pair and route family.
- Add a failing-route regression corpus captured from UI/API attempts.
- Add fork replay tests for candidate routes at representative amount buckets.
- Add quote API contract tests that assert no transaction data is returned for failed simulation.
- Add a solver telemetry envelope: selected pools, rejected candidates, failure reasons, simulated output, and protected minimum.
- Add route promotion stages: discovered, pure-quoted, fork-simulated, fork-executed, artifact-pinned, UI-enabled.
- Add a contract-repo todo loop for interesting routes found in `www` to become `router-ts` fixtures and Foundry fork tests.
- Add a "route lab" script that evaluates amount grids against local fork router without going through React.
- Add route artifact sync that includes pool metadata and not only route artifacts.
- Add an operator safety switch to disable arbitrary amounts and allow only proven fixture/corpus buckets.
- Add route capacity metadata to the manifest.
- Add per-leg minimum policy based on live quote outputs rather than copied fixture minimums.
- Add server-side simulation fallback when wallet RPC cannot run bundled simulation.
- Add liquidity fee estimation only after pool metadata and quote adapters exist.
- Add a public route metadata endpoint for visualization, excluding executable calldata.
- Add archive RPC lane for deterministic pinned fork validation.
- Add typed `.ts` artifact generation or runtime schema parsing.
- Add browser E2E against a local fork after solver route selection is safe.
- Remove deterministic hard caps from user-facing quote selection.
- Add a pool-state snapshot artifact containing reserves for constant-product pools and current sqrt price/tick/liquidity for concentrated liquidity pools.
- Add a snapshot generator that reads known pool state from Base RPC at the pinned block or current block.
- Add async live quote adapters for the API that quote exact-input legs from venue liquidity.
- Add synchronous snapshot quote adapters for pure tests and route-lab offline replay.
- Change the widget from local synchronous quote construction to API-backed async quote fetching.
- Keep local `quoteFameSwap` as a pure test helper or snapshot-only preview, not the production executable quote source.
- Quote every candidate at one block tag to avoid ranking routes from mixed pool states.
- Fail closed on quote-read failure, zero output, or protected minimum failure, not on arbitrary profile capacity.
- Prefer venue quote/read methods over hand-rolled invariant math unless the venue has no reliable quote method.
- Use pool reserves/liquidity to estimate venue fee amounts where derivable; otherwise emit rate-only fee diagnostics.

## Ranked Ideas

### 1. Amount-Aware Solver Gate Before Release

**Description:** Change the release criterion from "a materialized preferred route simulates eventually" to "the quote boundary only returns executable transaction data after an amount-aware solver has selected a route for the requested input and current liquidity." Until that exists, arbitrary amounts should fail closed or be restricted to a proven envelope.

**Rationale:** This directly addresses the user-safety failure. The current `quoteFameSwap` and `materializeFameRoute` path can create plausible calldata for amounts that the chosen route cannot support. Wallet simulation prevents submission, but users should not be guided through approval and swap states for routes that the solver should have rejected or split earlier.

**Downsides:** It may temporarily reduce the set of enabled amounts and make the beta look less capable. That is preferable to presenting unsafe quotes.

**Confidence:** 96%

**Complexity:** Medium

**Status:** Unexplored

### 2. Testable Route Graph Solver Library

**Description:** Build a pure solver library under `src/features/fame-swap/solver/graph/` or equivalent that models tokens, pools, venues, allowed edges, route shapes, candidate generation, quoting, ranking, and rejection reasons. React and API routes consume its result rather than selecting artifact IDs directly.

**Rationale:** The missing system is not another UI pass; it is a reusable route engine. A pure library gives `bun test` a stable target for search, ranking, split math, rounding, and failure cases without needing wallet automation.

**Downsides:** This is a real architecture addition. It should stay bounded to known FAME-facing pools and route families rather than becoming a general aggregator.

**Confidence:** 92%

**Complexity:** High

**Status:** Unexplored

### 3. Dynamic Split And Capacity Search

**Description:** Add bounded dynamic splitting so the solver can distribute input across compatible route branches when one pool path starts to drain. Start with same-token split routes such as WETH -> FAME, then extend to split-then-merge routes such as USDC -> frxUSD -> FAME where the router can execute a merge after branch outputs accumulate.

**Rationale:** The observed failure mode is liquidity exhaustion after one route is picked. A product-grade FAME router must compare direct, multi-hop, split, and merge candidates for the requested amount instead of scaling a single fixture.

**Downsides:** Split optimization can become expensive and easy to overfit. Keep the search bounded, deterministic, and explainable: sampled allocations first, smarter optimization only after the test corpus proves value.

**Confidence:** 88%

**Complexity:** High

**Status:** Unexplored

### 4. Solver Corpus And Route Lab

**Description:** Add a route-lab script and regression corpus that runs amount grids through the solver, records selected candidates, rejected candidates, simulation outcomes, outputs, protected minimums, and failure reasons. Promote observed failures from UI/API testing into permanent fixtures.

**Rationale:** We need a way to build, test, and optimize routes as we learn more. A corpus turns every failed larger-amount attempt into a durable test instead of a one-off debugging note.

**Downsides:** Requires discipline around fixture size and naming. Fork-backed cases need an archive/latest-state strategy to avoid nondeterministic failures.

**Confidence:** 90%

**Complexity:** Medium

**Status:** Unexplored

### 5. `../fame-contracts` Route Feedback Loop

**Description:** Create follow-up todos in `../fame-contracts` for route families discovered by the `www` solver: new pool fixtures, candidate route artifacts, amount-sweep fork tests, dynamic split examples, route-capacity metadata, and failing routes that need router or `router-ts` support.

**Rationale:** `www` can experiment with route search, but executable launch evidence still belongs in the contract repo. Interesting routes should be pushed back into `router-ts` and Foundry fork tests so the artifact set becomes more complete over time.

**Downsides:** Cross-repo workflow adds coordination overhead. The todo format should separate "promising route to test" from "approved launch artifact" so experimental candidates do not become implicit production evidence.

**Confidence:** 87%

**Complexity:** Medium

**Status:** Unexplored

### 6. Canonical Quote API Contract With Failure Taxonomy

**Description:** Make `/api/fame/swap/quote` the canonical quote boundary with typed success and failure states: unsupported pair, no safe route for amount, quote adapter failure, simulation failure, stale artifacts, not-live-ready, and ready. The client should never infer transaction safety from route diagnostics.

**Rationale:** The current API materializes routes but does not express solver-quality failure states. A crisp contract lets UI, tests, route lab scripts, and future embeds share the same safety semantics.

**Downsides:** More contract surface to maintain. Keep response types narrow and generated from the solver library rather than duplicating logic.

**Confidence:** 84%

**Complexity:** Medium

**Status:** Unexplored

### 7. Route Promotion Pipeline

**USER REVIEW**: Rejected. Too heavy. Focus on the pools that exist.

**Description:** Define a route's lifecycle from discovered candidate to production-enabled route: graph candidate, pure-quoted candidate, local simulation pass, fork simulation pass, fork execution pass, contract artifact generated, manifest synced, UI enabled.

**Rationale:** The project needs a repeatable way to learn more routes without confusing exploratory evidence with launch evidence. This also clarifies how `www` route lab findings should become `../fame-contracts` todos.

**Downsides:** Process can become busywork if too heavy. Keep it as a small checklist and artifact metadata, not a new governance system.

**Confidence:** 80%

**Complexity:** Low

**Status:** Rejected by user

## Liquidity-Derived Quoting Pivot

### 1. API-Backed Live Liquidity Solver

**Description:** Move production executable quotes to an async solver path behind `/api/fame/swap/quote`. The API reads known pool state or venue quote functions through viem, quotes each candidate leg for the requested amount, ranks by protected net output, and returns transaction data only for a route with current liquidity evidence.

**Rationale:** Calculating from liquidity is inherently async because the current artifact does not include pool state. The API already has Node runtime, RPC configuration, and live readiness reads. This avoids pretending the client-side synchronous deterministic adapter can know liquidity.

**Downsides:** Requires a client quote hook, loading states, cancellation/debounce, and stricter API tests. It also means local widget quotes cannot be authoritative while offline.

**Confidence:** 94%

**Complexity:** High

**Status:** Unexplored

### 2. Pinned Pool-State Snapshot Artifact

**Description:** Add a generated pool-state artifact beside `base-v1-pools.json` that records liquidity inputs at a specific Base block: reserves for Solidly/Uniswap V2 style pools, sqrt price/tick/liquidity for V3/V4 style pools, and any venue-specific metadata needed for deterministic exact-input quote replay.

**Rationale:** Pure solver tests still need deterministic quote evidence without live RPC. A topology-only pool file can build a graph, but it cannot calculate outputs from liquidity. A snapshot artifact gives tests and route-lab replay real liquidity-derived inputs while keeping production free to use live reads.

**Downsides:** Snapshot generation and manifest hashing add another artifact lifecycle. Concentrated-liquidity quotes may need tick data beyond slot0/liquidity for accurate large swaps.

**Confidence:** 89%

**Complexity:** Medium

**Status:** Unexplored

### 3. Venue Quote Adapter Boundary

**Description:** Replace `capacityIn` profile checks with quote adapters that derive exact-input output from venue liquidity. Prefer reliable venue/router/quoter reads where available; use local math from pool-state snapshots only where the invariant is simple and covered by tests.

**Rationale:** Reimplementing every AMM invariant in `www` is risky, especially for stable pools and concentrated liquidity. The adapter boundary lets Solidly, Uniswap V2, Slipstream, Uniswap V3, and Uniswap V4 each choose the safest quote source while the route ranker stays venue-agnostic.

**Downsides:** Adapter behavior will vary by venue. Some quote functions may revert for edge amounts, and snapshot parity must prove that local deterministic tests match live quote semantics closely enough.

**Confidence:** 87%

**Complexity:** High

**Status:** Unexplored

### 4. Consistent Block Quote Context

**Description:** Make every quote request carry a quote context: `blockNumber`, `quoteSource`, `readAt`, and pool-state evidence. All candidate leg quotes in one ranking pass must come from the same block or the same pinned snapshot.

**Rationale:** A route optimizer can make bad choices if one candidate is quoted from older pool state than another. A consistent block context also makes route-lab findings and contract-repo follow-ups reproducible.

**Downsides:** Some RPC providers may not support archive reads for the pinned block. Latest-block quotes are easier but less reproducible unless the response records the block used.

**Confidence:** 84%

**Complexity:** Medium

**Status:** Unexplored

### 5. Widget Quote Fetch Boundary

**Description:** Replace synchronous widget calls to `quoteFameSwap` with an API-backed quote hook that debounces amount changes, cancels stale requests, displays quote loading/error states, and consumes the same typed quote response used by route lab and tests.

**Rationale:** The production quote is no longer a pure local calculation once it reads liquidity. Keeping the widget on a local deterministic adapter will keep creating false `no_safe_route` or false-ready states.

**Downsides:** More UI state and more opportunities for stale responses. The hook must preserve current wallet-simulation gates and avoid exposing tx data from outdated quotes.

**Confidence:** 82%

**Complexity:** Medium

**Status:** Unexplored

### 6. Liquidity Route Lab And Contract Follow-Ups

**Description:** Extend route lab to run amount sweeps against the live adapter or pinned pool-state snapshots, recording selected pools, block number, quoted output, router fee, final protected minimum, and failure reason. Emit targeted `fame-contracts` todo text only for concrete routes or regressions.

**Rationale:** The user asked for a way to build, test, and optimize routes as we learn more. Liquidity-derived route lab output turns `$5 no_safe_route` style failures into reproducible evidence instead of hard-cap artifacts.

**Downsides:** Fork/live sweeps can be noisy unless the block context and RPC source are recorded. Keep output display-safe and avoid executable calldata for failed routes.

**Confidence:** 86%

**Complexity:** Medium

**Status:** Unexplored

## Contract Repo Follow-Up Todo Seeds

These are not written to `../fame-contracts` yet, but they are the right shape for follow-up todos after `www` identifies concrete routes:

1. Add amount-sweep fork tests for each generated solver route and record the maximum passing amount buckets at the pinned Base block.
2. Add route-capacity metadata to generated solver artifacts so `www` can fail closed before constructing hopeless quotes.
3. Add new candidate routes found by the `www` route lab to `router-ts/src/compiler/compileRoute.ts` or its successor graph generator, then regenerate artifacts.
4. Promote additional pool fixtures from `base-v1-pools.json` into route-generation coverage when they improve FAME buy/sell execution.
5. Add dynamic split and split-then-merge examples as Foundry fork tests, not only TypeScript artifact tests.
6. Capture failing large-amount routes as regression fixtures with exact amount, selected pools, revert/simulation reason, and expected solver rejection.

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Release current arbitrary-amount scaling with wallet simulation as the only safety gate | Simulation protects funds but still produces unsafe quote UX and predictable failed routes. |
| 2 | Add only a hardcoded small-amount cap and call the solver done | Useful as a temporary kill switch, but it does not build the route engine the product needs. |
| 3 | Add more preferred route IDs without changing the solver model | Duplicates the current failure: one preferred path still drains and fails for larger amounts. |
| 4 | Move all solving into React hooks | The repo already has a better pure/API boundary; hooks should consume solver output. |
| 5 | Use an external aggregator as the primary route source | Conflicts with the owned FAME router goal and would not test FameRouter route construction. |
| 6 | Build an onchain optimizer | Too expensive and outside the v1 router architecture. |
| 7 | Prioritize route visualization before route correctness | The UI can explain routes only after the solver chooses safe ones. |
| 8 | Prioritize archive RPC validation above solver safety | Still important, but deterministic evidence for unsafe route selection does not unblock release. |
| 9 | Prioritize typed artifact generation above solver safety | Typed artifacts are valuable, but the current artifact shape can still describe an unsafe quote strategy. |
| 10 | Estimate liquidity fees before amount-aware route quotes | Fee labels are downstream of reliable pool metadata and quote adapters. |
| 11 | Exhaustively brute-force every possible graph path at runtime | Too slow and not necessary; the FAME universe should use bounded, allowlisted route families. |
| 12 | Treat `router-ts` generated artifacts as a complete solver | The contract repo explicitly documents that `router-ts` is deterministic and does not discover or rank liquidity. |
| 13 | Route promotion pipeline | Rejected by user as too heavy; focus on existing pools and concrete route evidence instead. |
| 14 | Keep or raise deterministic hard caps | Explicitly rejected by user; caps are not liquidity and caused false `no_safe_route` for a small USDC amount. |
| 15 | Make the checked-in pool topology file calculate liquidity by itself | The artifact has no reserves, ticks, sqrt prices, or liquidity fields, so it cannot support liquidity math without new state data. |
| 16 | Keep production quotes synchronous in React while requiring live liquidity | Live pool reads are async RPC work; pretending they are local sync calculations recreates the current false-safety boundary. |
| 17 | Hand-roll every venue invariant first | Too risky for stable and concentrated-liquidity pools; prefer venue quote reads or narrowly tested local math per adapter. |
| 18 | Depend on wallet simulation as the first liquidity check | Still too late in the UX; solver quote evidence must exist before approval or swap transaction data is emitted. |

## Suggested Brainstorm Seeds

1. Define the amount-aware solver gate and temporary fail-closed behavior for the current widget/API.
2. Define the pure route graph solver library: graph model, venue adapters, candidate generation, ranking, and rejection states.
3. Define the dynamic split algorithm and first amount-sweep corpus for WETH/USDC/ETH -> FAME and FAME -> USDC/WETH/ETH.
4. Define the route lab and `../fame-contracts` feedback loop for promoting interesting routes into pinned artifacts.
5. Define the liquidity-derived quote architecture: async API adapter, pinned pool-state snapshot adapter, block context, and widget fetch boundary.

## Session Log

- 2026-05-12: Initial ideation research draft. Grounded in the completed FAME router feature branch, the `router-ts` reference solver, `www` Next/wagmi structure, and `fleet` Anvil fork test harness. Generated and filtered 17 candidate directions; 7 survived.
- 2026-05-12: Updated native ETH status after implementation and verification. `FAME -> ETH` and `ETH -> FAME` are now generated solver artifacts and passed pinned Base fork execution in `test_PinnedBaseForkGeneratedSolverRouteTableExecutesEveryRoute`.
- 2026-05-13: Split post-implementation ideation into solver/backend and UI/UX workstreams after reviewing plan status, todos, commit `6c07283`, focused FAME swap tests, lint output, and the current widget screenshot. Generated 24 solver/backend candidates; 7 survived.
- 2026-05-13: Re-ideated after discovering that arbitrary route materialization is not user-safe for larger amounts. Grounded in `quote.ts`, `materializeRoute.ts`, the quote API, wallet simulation hook, current `.context` todos, `../fame-contracts/router-ts`, and Foundry generated-route fork tests. Generated 28 candidates; 7 survived, with amount-aware solver safety moved to the release-blocking top priority.
- 2026-05-13: Added liquidity-derived quoting pivot after the first amount-aware solver pass exposed deterministic hard caps. Grounded in `deterministicAdapter.ts`, `adapters.ts`, `base-v1-pools.json`, `FameSwapWidget.tsx`, and the quote API. Generated 11 liquidity candidates; 6 survived. Hard caps, sync production quoting, and wallet-simulation-first liquidity checks were rejected.
