---
date: 2026-05-15
topic: fame-swap-adaptive-route-search
origin: docs/ideation/2026-05-15-fame-swap-adaptive-route-search-ideation.md
status: ready-for-planning
source_todo: .context/compound-engineering/todos/013-complete-p2-add-adaptive-route-search-algorithms.md
---

# FAME Swap Adaptive Route Search Requirements

## Problem Frame

The FAME swap solver now has a baseline route allocation optimizer, route-lab allocation traces, request-scoped quote memoization, NativeWrap support, and Aerodrome V2 as a distinct venue family. The remaining problem is search efficiency and breadth: the optimizer should refine smooth two-way allocations adaptively and consider 3+ allocations without exploding quote calls.

## Requirements

- R1. Keep the coarse-grid optimizer as the correctness oracle and fallback.
- R2. Preserve `maxTemplates: 32`.
- R3. Adaptive two-way search may run only for smooth, unimodal, fully quoted samples.
- R4. Adaptive search must fail closed to grid fallback on quote failure, non-unimodal samples, unsupported protocols, V4 hooks, stable curves, unvetted factories, budget pressure, or no improvement.
- R5. Route-lab evidence must identify the algorithm used for each trial: grid, adaptive two-way, coordinate descent, or local math.
- R6. Route-lab evidence must include stop reasons: convergence, quote budget, non-unimodal samples, quote failure, unsupported protocol, and no improvement.
- R7. 3+ allocation search must run behind strict branch-count, trial-count, and quote-call budgets.
- R8. 3+ search must materialize only routes that fit the current flat `FameRoute.legs` model.
- R9. Local marginal-price allocation may select routes only when the adapter provides complete pinned-block local math for every variable branch.
- R10. Public quote responses must continue to omit raw optimizer trials, quote-plan stats, and route-lab-only traces.
- R11. Final selected routes must still pass protected materialization and quote validation.

## Success Criteria

- Deterministic tests show adaptive two-way search matches or improves the grid baseline within tolerance.
- Tests cover grid fallback for quote failures and unsupported/non-smooth samples.
- Tests show 3+ coordinate search stays inside the configured quote/trial budget.
- Route-lab JSON and Markdown display algorithm selection and stop reasons without executable payloads.
- Public serialization still strips raw optimizer evidence.

## Scope Boundaries

- Do not build a general DEX aggregator or min-cost-flow router.
- Do not increase `maxTemplates`.
- Do not run adaptive search for V4 hooks or stable/unknown curves.
- Do not implement broad concentrated-liquidity local math in this todo.
- Do not expose raw optimizer traces in public API responses.

## Decisions

- Adaptive two-way search is an additive refinement, not a replacement for grid.
- 3+ search uses coordinate descent because it is explainable and bounded.
- Local marginal-price search is guarded by an explicit capability check; unsupported local math produces evidence and follow-up work rather than speculative selection.

## Outstanding Questions

### Resolve Before Planning

None.

### Deferred to Planning

- Choose the exact adaptive smoothness heuristic.
- Choose the N-way branch cap and coordinate step size.
- Decide how much algorithm evidence belongs in public `optimizerSummary` versus route-lab only.
