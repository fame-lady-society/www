---
date: 2026-05-12
updated: 2026-05-13
topic: fame-swap-router-solver-www
origin: docs/ideation/2026-05-12-fame-swap-router-solver-ideation.md
status: ready-for-planning
supersedes_plan: docs/plans/2026-05-13-001-fame-swap-router-solver-plan.md
---

# FAME Swap Amount-Aware Solver Requirements

## Problem Frame

Fame Lady Society needs the owned `/fame/swap` flow to stop behaving like a route demo and become a user-safe swap quote system. The initial implementation proved route encoding, readiness gates, widget mechanics, and wallet simulation. A later amount-aware pass moved the system toward graph-based route selection, split candidates, typed no-safe-route states, route diagnostics, and fee breakdowns.

The new blocker is quote evidence. The deterministic solver profile currently uses synthetic rates and hard per-pool `capacityIn` values. That can falsely reject normal user amounts, such as `$5` USDC, because the profile is not calculating from pool liquidity. Hard caps are not a production quote model.

The next work should finish the solver by replacing synthetic capacity caps with liquidity-derived quote evidence. The goal remains bounded: use existing known FAME router pools, keep the route graph testable, make `/api/fame/swap/quote` the authoritative executable quote boundary, and produce concrete contract-repo follow-ups only when route lab evidence identifies exact pools, amounts, and outcomes.

## Requirements

**Release Safety**
- R1. The swap quote boundary must not return executable approval or swap transaction data for an amount unless the system has selected a route for that amount and has liquidity-derived quote evidence to treat it as safe to present. Simulation may strengthen that evidence, but it must not replace quote selection.
- R2. If no safe route is found for the requested amount, the user-facing quote state must fail closed before approval with a clear "no safe route for this amount" style status, not a wallet-simulation failure after the user has begun the transaction flow.
- R3. Wallet-side or server-side simulation remains the final submission gate, but it must not be the first mechanism that discovers routine route exhaustion for common larger amounts.
- R4. Until liquidity-derived quote evidence is in place, arbitrary scaled fixture routes must be treated as prototype behavior and must be disabled or marked non-release-ready. Emergency amount limits may be used as a kill switch, but not as production quote evidence.

**Route Universe And Solver Behavior**
- R5. The solver must focus on existing known pools and route families from the current FAME router fixture universe. It must not attempt broad pool discovery, general aggregation, or speculative routing outside the known FAME swap scope.
- R6. The solver must compare candidate routes for the requested amount instead of selecting only the gap-matrix preferred artifact for a token pair.
- R7. Candidate routes must support direct, multi-hop, split, and split-then-merge shapes when those shapes are backed by known pools and executable router semantics.
- R8. Dynamic split behavior must be bounded and explainable. A simple sampled allocation strategy is acceptable before any more complex optimizer, as long as tests prove it avoids the current single-route-drain failure.
- R9. Route results must include enough diagnostic information for tests and operators to understand selected pools, rejected candidates, quote/simulation evidence, protected output, and rejection reasons.

**Quote And UI Contract**
- R10. `/api/fame/swap/quote` and the client quote experience must share the same safety semantics so the widget, tests, and scripts do not diverge on which routes are executable.
- R11. Quote states must distinguish unsupported pair, stale artifact/config, router not live-ready, no safe route for amount, quote adapter failure, simulation failure, and ready.
- R12. A ready quote must include human-facing output information and exact transaction intent: input token, output token, amount in, estimated output when available, protected minimum, route hash, approval requirement, call value, route summary, warnings, and expiry.
- R13. The widget must keep approval and swap actions disabled for every non-ready solver state, including "no safe route for amount."

**Testing And Route Learning**
- R14. The solver must have a pure, testable route component that can be exercised without React, browser wallets, or live user transactions.
- R15. The test corpus must cover representative amount buckets for every supported FAME-facing direction: FAME <-> USDC, FAME <-> WETH, and FAME <-> native ETH.
- R16. The corpus must include known large-amount failures from the current prototype and assert that the solver either chooses a safer route or fails closed before transaction data is produced.
- R17. A route-lab or equivalent script must let developers run amount grids against the solver and, when configured, against a local fork/router simulation path.
- R18. Solver test output should be suitable for creating concrete follow-up todos in the sibling contract repo: exact amount, token pair, selected pools, rejected candidates, simulation result, and observed failure or opportunity.

**Contract Repo Feedback**
- R19. `www` may discover promising routes or failure cases, but launch evidence remains contract-repo evidence. Interesting routes should become targeted contract-repo todos only when they are tied to concrete pools, amounts, and observed behavior.
- R20. Contract-repo follow-ups should focus on amount sweeps, route-capacity metadata, new generated route artifacts for existing pools, split and split-then-merge fork examples, and failing-route regression fixtures.
- R21. Do not introduce a generic route promotion pipeline. The rejected direction is too heavy; use concrete evidence-driven todos focused on the pools that exist.

**Existing Guarantees To Preserve**
- R22. Native ETH and WETH must remain distinct in labels, route selection, approvals, call value, and transaction construction.
- R23. The router artifact manifest, route hashes, ABI parity checks, readiness checks, and fee/venue policy gates must remain fail-closed.
- R24. ERC-20 approvals must remain exact to the quoted input amount unless a later requirements update explicitly approves a broader allowance model.
- R25. The implementation must avoid deprecated GraphQL data dependencies and continue using the repo's TypeScript, wagmi, and viem patterns.
- R26. Public quote responses and route-lab diagnostics must not expose private RPC URLs, signer material, or executable transaction payloads for failed route states.

**Liquidity-Derived Quote Evidence**
- R27. User-facing `ready` and `no_safe_route` decisions must be based on liquidity-derived quote evidence, not synthetic hard caps, copied fixture amounts, or arbitrary deterministic capacity profiles.
- R28. The checked-in pool topology artifact is not sufficient quote evidence by itself. Production quotes must read live pool state, call venue quote functions, or use an explicitly generated pool-state snapshot.
- R29. All candidate routes in a single ranking pass must use one consistent quote context: the same live block, the same fork block, or the same pinned pool-state snapshot.
- R30. Quote evidence must be exact-input and leg-aware so downstream `All` legs are quoted from upstream output rather than from the original input amount.
- R31. Quote adapter failures must remain distinguishable from true liquidity exhaustion. If a candidate cannot be quoted because the quote source failed or is unsupported, the result should be `quote_adapter_failure` or candidate-level quote failure, not a misleading liquidity-derived `no_safe_route`.
- R32. Deterministic tests may use pinned pool-state captures, but they must not use arbitrary hard caps as a substitute for pool liquidity.
- R33. The FLS router fee must be calculated and emitted separately from venue liquidity fees. Venue fees that are already included in AMM quote output must not be subtracted a second time.
- R34. Quote responses and route-lab output must identify the quote source and block or snapshot context used to select the route.

**API And Widget Quote Boundary**
- R35. The production executable quote path must support asynchronous liquidity reads. The widget must not treat synchronous local deterministic quote construction as authoritative for transaction-ready quotes when liquidity evidence requires RPC or snapshot reads.
- R36. The widget must handle quote loading, stale response, retry, and quote failure states without exposing approval or swap actions from an older ready quote.
- R37. Local pure quote helpers may remain for tests, route-lab offline replay, and diagnostics, but they must be clearly separated from production executable quote evidence.
- R38. Quote requests must be bounded by supported tokens, known pools, candidate budgets, RPC timeouts, and request validation. The API must not accept arbitrary pool addresses, arbitrary router targets, arbitrary RPC URLs, or unbounded amount-grid work from public clients.
- R39. If a venue quote source is not implemented or fails for a candidate, that candidate must fail with quote diagnostics and cannot become ready. A ready route must not contain a leg whose quote evidence was unavailable.
- R40. Quote responses must be invalidated when amount, pair, recipient, chain readiness, router address, slippage, deadline, or quote context changes.

## Success Criteria

- Common larger amounts that currently fail simulation no longer produce misleading executable quotes. They either route safely through a better/split route or fail closed before approval.
- Normal small-dollar amounts, such as `$5` USDC, do not fail with `no_safe_route` solely because of synthetic per-pool hard caps.
- No production-ready quote path uses arbitrary `capacityIn` profiles as route capacity.
- Every ready quote records whether it was selected from live liquidity, fork liquidity, or a pinned pool-state snapshot, including the block or snapshot context.
- Public quote requests are bounded and validated so liquidity reads cannot become an unbounded public RPC fanout.
- The solver can be tested as a standalone component with deterministic fixtures and representative amount buckets.
- Every ready quote has a traceable selected route, output/protection data, and transaction intent that matches the final simulation gate.
- The quote API and widget agree on solver states and never expose approval or swap actions for unsafe routes.
- Route-lab output can be used to create specific contract-repo follow-up todos without inventing a broad route promotion process.

## Scope Boundaries

- Do not build an onchain solver.
- Do not use an external aggregator as the primary route source.
- Do not discover arbitrary new pools in `www`; focus on existing known FAME router pool fixtures and route families.
- Do not add a heavyweight route promotion pipeline or lifecycle process.
- Do not bypass `FameRouter` by submitting raw Universal Router calls from the UI.
- Do not treat linearly scaled fixture routes as release-ready arbitrary-amount quotes.
- Do not treat hardcoded per-pool capacity caps as production liquidity calculations.
- Do not treat `base-v1-pools.json` topology alone as sufficient to calculate route output.
- Do not keep production executable quotes dependent on a synchronous client-only deterministic adapter once liquidity reads are required.
- Do not hand-roll every venue invariant as the first implementation choice when a safer venue quote/read path exists.
- Do not expose public quote inputs that let callers choose arbitrary pool addresses, router targets, or RPC URLs.
- Do not make UI polish, route visualization, liquidity-fee display, or browser E2E the primary work until solver safety is addressed.
- Do not require live production swaps as the primary QA loop.

## Key Decisions

- **Focus on existing pools:** The user rejected a route promotion pipeline as too heavy. The solver should get better at using the pools already in the current FAME router universe before adding process or broad discovery.
- **Fail closed before approval:** A route that is likely to fail should be blocked at quote time, not after the user has approved or waited for wallet simulation.
- **Keep simulation as a final gate:** Simulation remains essential, but it should validate the selected route, not compensate for the absence of route solving.
- **Prefer bounded split search:** Start with explainable bounded split allocation over known pools. More complex optimization must be justified by corpus results.
- **Use concrete contract feedback:** Follow-ups to the contract repo should be created from exact route lab evidence, not from an abstract promotion workflow.
- **Reject hard caps as quote evidence:** Hard caps may help diagnose test cases, but they are not liquidity and cannot decide production `ready` or `no_safe_route` states.
- **Make the API the executable quote authority:** Live liquidity reads are asynchronous. `/api/fame/swap/quote` should become the authoritative path for transaction-ready quotes, while the widget consumes that result and keeps wallet simulation as the final gate.
- **Use snapshots for deterministic tests:** Pure tests and offline route lab runs need a pinned pool-state snapshot or fixture that represents liquidity inputs, not a synthetic capacity profile.
- **Keep quote context consistent:** A selected route should be explainable by one block or one snapshot so route-lab output and contract follow-ups are reproducible.
- **Bound the public API:** The quote endpoint is a public surface over RPC-backed reads. It should only accept known swap inputs and should enforce candidate, timeout, and response-safety limits.

## Alternatives Considered

| Alternative | Decision | Reason |
|---|---|---|
| Keep arbitrary scaled fixture routes and rely on wallet simulation | Rejected | It protects funds but produces poor, predictable failure UX and is not a real solver. |
| Hard-cap all amounts to tiny known-good values | Rejected for production | Useful only as a temporary emergency safety switch; it does not calculate from liquidity and can reject normal user amounts. |
| Build a route promotion pipeline | Rejected by user | Too heavy for the current need; focus on existing pools and concrete tests. |
| Use an external aggregator as primary solver | Rejected | It conflicts with the owned FAME router goal and does not improve FameRouter route evidence. |
| Build a general aggregator over all Base pools | Rejected | Too broad; the requirement is a bounded FAME router solver. |
| Keep synchronous client-side deterministic quotes as production authority | Rejected | Liquidity-derived quotes require RPC reads or pinned snapshots; a sync profile recreates false `no_safe_route` and false-ready risks. |
| Hand-roll every AMM invariant first | Rejected as default | Safer venue quote/read paths should be preferred where available; local math belongs behind tested adapters when needed. |

## Dependencies / Assumptions

- The current FAME router fixture universe contains enough existing pools to improve route selection for at least some larger amounts.
- The sibling contract repo remains the place where route artifacts and fork evidence are promoted after `www` identifies concrete route candidates or failures.
- Some venue quote behavior may require fork simulation rather than pure view quoting; the requirements allow either as long as readiness and quote states stay explicit.
- Current `base-v1-pools.json` is a topology artifact, not a pool-state capture. Planning must add a live read path, a recorded-state artifact, or both before liquidity-derived quotes can replace deterministic caps.
- API-backed quote reads depend on Base RPC availability and must fail closed when required reads are unavailable.
- Private RPC URLs and signer material must remain in Doppler or local secrets and must not be committed or printed.
- Not every known venue must have a complete quote adapter in the first liquidity-derived release, but unsupported venue candidates must fail closed and remain visible in diagnostics.

## Outstanding Questions

### Resolve Before Planning

None.

### Deferred to Planning

- [Affects R27, R28, R32][Needs research] Choose the first pool-state snapshot shape: reserves-only for constant-product pools, venue quote snapshots, concentrated-liquidity state, or a mixed approach.
- [Affects R29, R34][Technical] Decide how quote context is represented in API responses, route-lab output, and tests.
- [Affects R30, R31][Needs research] Choose per-venue quote source order: live venue quote calls, pool state math, fork simulation, or unsupported/fail-closed.
- [Affects R35, R36][Technical] Define the widget quote-fetch state model and stale-response protection.
- [Affects R38][Technical] Choose candidate budgets, RPC timeout behavior, and any cache/debounce policy for the public quote endpoint.
- [Affects R17, R34][Needs research] Decide which route-lab modes run against pinned snapshots, latest live liquidity, pinned fork liquidity, or local router simulation.
- [Affects R19, R20][Technical] Choose the todo format for contract-repo follow-ups so route lab evidence is easy to paste without over-formalizing the workflow.

## Next Steps

-> /ce:plan for structured implementation planning.
