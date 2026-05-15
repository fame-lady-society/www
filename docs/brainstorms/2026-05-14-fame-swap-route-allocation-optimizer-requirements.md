---
date: 2026-05-14
topic: fame-swap-route-allocation-optimizer
origin: docs/ideation/2026-05-14-fame-swap-route-allocation-optimizer-ideation.md
status: ready-for-planning
source_todo: .context/compound-engineering/todos/012-ready-p1-add-route-allocation-optimizer.md
---

# FAME Swap Route Allocation Optimizer Requirements

## Problem Frame

The FAME swap solver can enumerate bounded route candidates, quote live or recorded liquidity, and rank materialized candidates by protected output. It still treats allocation as part of candidate generation. Current split samples are fixed bps values, split-merge support is narrow, and route-lab does not explain why one split ratio, merge point, or multi-pool alternative won or lost.

This work should introduce a backend allocation optimizer that improves split and merge decisions without turning the app into a general DEX aggregator. The first milestone must stay executable under the current flat `FameRoute.legs` model, preserve quote safety, and produce route-lab evidence detailed enough for operators to trust why a split was or was not selected.

This document defines the first shippable optimizer milestone for todo `012`. It should not be used to close all of todo `012` unless 3+ pool/corridor consideration is either satisfied by route-lab evidence under the current router constraints or split into an explicit follow-up todo with the remaining topology work.

## Requirements

**Optimizer Objective**

- R1. The optimizer must have an explicit objective contract before adding allocation search. The first objective is: maximize protected net output after venue-inclusive leg quotes, router fee, and slippage protection, while preserving one consistent quote context. Selection must respect a planned minimum improvement threshold; near ties below that threshold prefer the simpler or unsplit route with the margin recorded in route-lab.
- R2. Venue fees must be treated as included in AMM quote outputs and must not be subtracted a second time. The FLS router fee remains calculated separately from gross route output.
- R3. Market impact must be recorded per allocation trial. In the first milestone, protected output wins unless an existing or configured safety policy marks an allocation unsafe; impact-aware soft scoring is deferred unless explicitly planned later.
- R4. Quote adapter failure, budget exhaustion, unsafe output, disabled pool, unsupported router shape, and worse-output rejection must remain distinct optimizer outcomes.

**First Executable Scope**

- R5. The first optimizer milestone must operate only on route shapes that can be materialized into the current flat ordered `FameRoute.legs` model. The optimizer core must be shared by deterministic/snapshot route-lab and async live quote paths, or both paths must intentionally move to one async runner while preserving snapshot determinism.
- R6. The first executable allocation search is limited to two-branch direct splits and the current same-intermediate split-merge shape. Segment-level splits and 3+ branch executable allocations are out of the first milestone unless planning proves exact flat-leg materialization semantics, but the milestone must still detect and classify 3+ eligible pool or corridor groups as selected by a two-branch subset, pruned, unsupported, ineligible, or deferred.
- R7. Public quote inputs remain limited to supported FAME-facing pairs. The optimizer may use internal connector routes only through the existing bounded graph and manifest-ready edge policy.
- R8. Native ETH and WETH remain distinct. ETH/WETH wrap or unwrap pseudo-edges are not part of this optimizer until `../fame-contracts` lands and proves explicit wrap/unwrap route legs.
- R9. Aerodrome V2 and migrated Slipstream pools remain disabled for executable optimization until corresponding contract/router support is proven.

**Route Templates And Allocation Plans**

- R10. The solver must distinguish route topology from allocation. A route template describes executable topology without a chosen split ratio; an allocation plan assigns concrete branch amounts or bps for one trial.
- R11. A selected allocation plan must be convertible back into the existing selected-route shape consumed by route display, route materialization, fee breakdowns, API serialization, and simulation.
- R12. Static `allocationBps` must no longer be treated as the route identity for optimizer-owned templates. The same template may have many allocation trials, with route-lab evidence attached to the template and trial.
- R13. Optimizer diagnostics may describe templates, trials, and allocation vectors, but executable quotes must expose only the selected materialized route.

**Materialization Safety**

- R14. The optimizer must never quote one set of branch inputs and materialize a route that spends different runtime inputs.
- R15. Entry-token two-way splits must materialize to concrete ordered legs whose amount modes consume exactly the quoted allocation. The accepted shape is fixed `Exact` branch amount(s) plus a final `All` branch for the route-local remainder when needed.
- R16. Split-merge routes may merge only after all branch outputs have accumulated in the same route-local token balance. The downstream merge or suffix leg must spend that token balance with `All`.
- R17. Per-leg `minAmountOut` must be derived from the quote for the exact materialized leg input.
- R18. Final `minAmountOutAfterFee` must be based on net output after the router fee and then slippage protection.
- R19. Final validation must quote or simulate the selected protected materialized route, not an abstract allocation trial or an unprotected route. Each selectable template must have an executable amount-mode proof or test fixture covering branch order, route-local balance isolation, pre-existing or dust balances, per-leg `minAmountOut`, and final protected-route simulation.

**Quote And State Planning**

- R20. Optimizer runs must use one quote context: the same live block, fork block, deterministic profile, or recorded snapshot.
- R21. The optimizer must use request-scoped memoization through a run-owned `QuoteRunCache` / `QuoteRunStats` boundary, or an equivalent wrapped read client, that is passed through the optimizer and adapters. No quote or state cache may persist globally across independent quote requests.
- R22. State-read cache keys must include quote context, pool identity, and state field. Relevant fields include reserves, `slot0`, concentrated liquidity, and V4 `StateView` data.
- R23. Exact quote cache keys must include quote context, adapter/protocol identity, pool id, direction, and amount in.
- R24. Async live mode should coalesce concurrent duplicate reads into one in-flight operation when the same quote or state key is requested more than once. Coalesced reads count once against underlying read budgets; cache hits count as logical requests but not as new underlying reads.
- R25. Constant-product reserve pools may be evaluated locally from cached reserves and fee metadata once those reserves are pinned to the run's quote context and rounding/fee semantics have been validated against the corresponding adapter. Concentrated liquidity, stable curves, migrated factories, and V4 hooks remain quoter-backed unless planning adds separately validated local math.

**Allocation Search**

- R26. The first search algorithm must be a coarse two-branch grid plus local refinement around the best point.
- R27. The grid must include unsplit endpoints so the optimizer can prove a split beat the best one-branch alternative rather than only compare interior split samples.
- R28. The optimizer must compare the best optimized split or split-merge allocation against the best unsplit candidate under the same objective.
- R29. The optimizer must include at least one deterministic test fixture where the optimal allocation is not one of the old static split samples: `1000`, `2500`, `5000`, `7500`, or `9000` bps.
- R30. The optimizer must stop under explicit quote-call and work budgets and report whether untested allocations were pruned or budget-exhausted instead of treating them as losers. Budgets must distinguish logical allocation trials, unique exact quote reads, unique state reads, cache hits, and underlying RPC reads. Production selection must have an operator-controlled rollout mode, such as disabled, shadow, and select, plus fallback to the best legacy-compatible route when budgets, timeouts, validation, or confidence gates fail.

**Route-Lab And Diagnostics**

- R31. Route-lab JSON must include optimizer evidence separately from existing edge matrix and protocol coverage. It must also include a template-generation and eligibility summary with display-safe counts by topology/protocol and skipped-candidate reasons for expected but ungenerated alternatives.
- R32. Optimizer evidence must include the objective summary, selected template id, selected allocation vector, branch inputs, branch outputs, gross output, net output, protected output, max leg impact, and winning margin versus best unsplit and best rejected split when available.
- R33. Route-lab JSON must include allocation trials with a closed first-milestone status vocabulary: `selected`, `rejected`, `pruned`, `budget_exhausted`, `quote_failed`, `unsupported_shape`, and `ineligible`, plus a display-safe reason.
- R34. Route-lab JSON must include quote-plan stats: logical quote requests, unique exact quote reads, unique state reads, cache hits, coalesced in-flight reads, budget consumed, and expected versus actual cache-hit rates where meaningful.
- R35. Route-lab Markdown must include a compact allocation summary and trial table. JSON remains the source of truth for detailed evidence.
- R36. Route-lab output must preserve current redaction rules: no private RPC URLs, secrets, request bodies, failed-state executable payloads, or long raw calldata-like hex strings. Route-lab artifacts are operator diagnostics only; they must not be emitted by public quote responses or routine production logs, and any persisted route-lab artifacts require access control, redaction, and an explicit retention policy.

**Public Quote Boundary**

- R37. Public quote API responses must not expose raw optimizer trials, raw pool state, private quote-plan stats, or route-lab-only protocol evidence. Public quote execution must enforce timeout, budget, and abuse-control policy when optimizer search increases backend work.
- R38. Public ready responses may expose selected-route fields already safe for users: route hash, pool ids, route display, fee breakdown, selected output/protection, and coarse user-safe warnings or counts. Detailed rejected-candidate summaries belong behind route-lab or an operator/developer diagnostic flag, not the default public quote response.
- R39. Non-ready public responses remain structurally non-executable and must not contain approval requests, swap requests, route calldata, or failed optimizer trial payloads.

**Verification**

- R40. Existing `FAME_ROUTE_CORPUS` coverage must continue to pass for supported USDC, WETH, native ETH, and FAME sell directions.
- R41. Optimizer-sensitive route-lab expectations must cover `weth-fame-split`, `usdc-fame-fixture`, `usdc-fame-five-dollars`, `fame-usdc-large-closed`, and at least one budget/pruning case. They must also include outcome gates for the user-reported failure classes: large WETH/FAME swaps expected to evaluate UniswapV2/Scale-style liquidity splits, USDC/FAME requests expected to evaluate large USDC/WETH alternatives rather than only ZORA/USDC, and msUSD/msETH visibility when those pools are eligible. Each gate may pass by selecting the optimized route or by route-lab evidence explaining ineligibility, unsupported router shape, pruning, or worse output.
- R42. Snapshot route-lab must remain deterministic for the same recorded snapshot and must attach optimizer trial evidence to ready rows.
- R43. Live route-lab must use one pinned block context per run and classify live failures as quote, budget, adapter, or simulation failures with sanitized diagnostics.
- R44. Optional live `--simulate` must validate the selected protected materialized route.
- R45. Tests must assert observable memoization behavior, not just output equality: repeated trial points and shared pool state must reduce underlying state reads or increase cache-hit counters. Tests and route-lab must not treat cache hits alone as proof that search cost is controlled; they must report unique exact quote reads and unique state reads.
- R46. Milestone exit evidence must classify each top reported failing request as solved within two-branch direct split, solved within same-intermediate split-merge, tried and lost under the objective, unsupported by current router semantics, ineligible by pool policy, or requiring N-way/segment work. If most remaining value is outside two-branch scope, the next topology todo must be created before todo `012` is considered complete.

## Success Criteria

- Route-lab can show exactly which allocation ratios were tried and why the selected ratio won.
- At least one representative pair proves a selected allocation that is not simply one of the old fixed split candidates, or proves with evidence that no optimized split beats the best unsplit route.
- Top reported failures are represented by route-lab gates that either improve the selected route or clearly explain why the expected route is ineligible, unsupported, pruned, or worse.
- The selected optimizer route materializes to the same flat route model currently executed by `FameRouter`.
- Public quote responses remain compact and safe while operator route-lab output gets detailed allocation evidence.
- Quote/state memoization prevents allocation search from multiplying repeated pool-state reads unnecessarily.
- Production quote execution can run the optimizer in shadow or selected mode and can fall back to a legacy-compatible route when optimizer budgets or validation fail.
- Snapshot tests provide deterministic optimizer evidence, and live route-lab validates the same behavior against current Base liquidity where available.

## Scope Boundaries

- Do not build a general aggregator or min-cost-flow router in this milestone.
- Do not globally increase graph depth as a substitute for allocation optimization.
- Do not execute segment-level splits until flat-leg materialization semantics are specified and tested.
- Do not execute 3+ branch allocations until exact amount-mode rules, route display semantics, and route materialization rules are specified and tested.
- Do not mark todo `012` complete from a two-branch-only implementation unless route-lab evidence proves the remaining 3+ pool/corridor acceptance is satisfied or explicitly moved to a follow-up todo.
- Do not implement full local Uniswap V3 or V4 math as part of the first optimizer milestone.
- Do not use final wallet simulation as the primary allocation search mechanism.
- Do not force splits when protected output is worse unless an explicit safety policy rejects the unsplit route.
- Do not expose route-lab-only optimizer traces in the public quote API.

## Key Decisions

- **Start with a debuggable baseline:** Coarse grid plus local refinement is intentionally preferred before adaptive search. It creates the reference behavior for todo `013`.
- **Keep execution flat:** The optimizer may reason in templates and allocation plans, but selected routes must materialize to current flat `FameRoute.legs`.
- **Protect quote safety over search ambition:** If a candidate cannot be quoted and materialized consistently, it cannot be selected.
- **Cache within a quote run:** Request-scoped quote/state memoization is required before grid search grows quote volume.
- **Use route-lab as the detailed evidence surface:** Public quote responses stay concise; route-lab carries allocation trials and quote-plan stats.
- **Defer broad N-way and segment execution, not evidence:** The first milestone proves the optimizer on existing executable two-branch shapes while still classifying 3+ and segment expectations as unsupported, ineligible, pruned, worse, or follow-up work.

## Dependencies / Assumptions

- Existing router materialization and amount modes remain the execution boundary for `www`.
- Contract-side ETH/WETH wrap support and Aerodrome V2/migrated Slipstream support are separate workstreams in `../fame-contracts`.
- Existing pool-universe and manifest readiness policy remain the source of executable edge eligibility.
- Existing route-lab redaction and public API serialization safety rules remain in force.

## Outstanding Questions

### Resolve Before Planning

None.

### Deferred to Planning

- [Affects R3][Technical] Choose the first explicit unsafe market-impact threshold, or confirm the first milestone only records impact without hard rejecting on it.
- [Affects R1, R28][Technical] Choose the minimum protected-output improvement threshold and deterministic tie-breakers for near ties.
- [Affects R15, R16][Technical] Decide the exact ordered-leg encoding for each supported two-branch template.
- [Affects R26, R27][Technical] Choose the initial coarse grid and refinement step sizes.
- [Affects R21, R24, R30][Technical] Set optimizer quote-call, state-read, RPC-read, cache-hit, timeout, and allocation-trial budgets.
- [Affects R41][Technical] Design the synthetic fixture where the optimal split is not one of the old static bps samples.
- [Affects R30, R38][Product/Technical] Define public quote rollout mode, fallback policy, rate limits, and which diagnostics are operator-only.
- [Affects R46][Technical] Pick the exact failing quote requests that falsify or validate the two-branch-first milestone.

## Next Steps

-> `/ce:plan docs/brainstorms/2026-05-14-fame-swap-route-allocation-optimizer-requirements.md` for structured implementation planning.
