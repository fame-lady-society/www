---
date: 2026-05-14
topic: fame-swap-open-connector-graph
origin: docs/ideation/2026-05-14-fame-swap-open-connector-graph-ideation.md
status: ready-for-planning
source_todo: .context/compound-engineering/todos/011-ready-p1-expand-route-solver-graph-and-liquidity-gap-matrix.md
---

# FAME Swap Open Connector Graph Requirements

## Problem Frame

The FAME swap solver now uses amount-aware quote evidence, but candidate generation and route-lab output still make it hard to prove the solver searched a real connector graph. Public quote requests must remain limited to supported FAME buy/sell pairs, yet internal route search should be able to traverse reviewed connector pools such as ZORA/USDC, ZORA/WETH, USDC/frxUSD, and other Aerodrome/Solidly connectors. When important connector liquidity such as WETH/USDC is absent, disabled, or unquoted, route-lab output should say so explicitly.

This work should improve graph openness and diagnostics without turning `/api/fame/swap/quote` into a public aggregator or treating disabled pools as executable.

## Requirements

### Public Boundary

- R1. Public quote inputs remain limited to FAME paired with USDC, WETH, or native ETH.
- R2. Unsupported public pairs such as USDC/WETH must still return non-executable unsupported quote states.
- R3. No public API input may select arbitrary pool ids, venue targets, router addresses, or connector token pairs.

### Internal Graph Search

- R4. Internal candidate search may traverse reviewed non-FAME connector edges when solving a supported FAME pair.
- R5. Executable candidates may only use edges whose venue target and family are live-ready under current manifest/readiness policy.
- R6. Disabled, unready, or unsupported connector edges must be excluded from executable candidates and preserved as diagnostics.
- R7. Candidate search must be deterministic and bounded by explicit simple-path depth, candidate count, split count, cycle, and timeout budgets.
- R8. Native ETH and WETH must remain distinct; native ETH routes must not silently substitute WETH connector edges.
- R9. The solver must be able to choose a route absent from the original pinned route artifact ids when recorded-state or live quote evidence supports it.

### Connector Coverage And Gap Matrix

- R10. Route-lab output must report selected, considered, rejected, disabled, and missing graph edges for every amount bucket.
- R11. The gap matrix must include WETH/USDC as an explicit connector check: selected/considered when reviewed pools exist, or missing when they do not.
- R12. Aerodrome and Solidly connector pools must be represented as executable, disabled, rejected, or missing with a reason.
- R13. Missing-edge diagnostics should identify token pair, direction, venue family when known, and why the edge is useful to investigate.
- R14. Gap-matrix language must feed manifest or pool-universe follow-ups without implying launch approval.

### Evidence And Safety

- R15. Executable route ranking remains based on recorded-state or live quote evidence, not topology, fake strength labels, or synthetic capacity profiles.
- R16. Rejected candidate output must distinguish quote adapter failure from unsafe output and missing/disabled graph edges.
- R17. Non-ready quote/API/widget states remain structurally non-executable and must not include approval, swap, route calldata, or failed-state transaction payloads.
- R18. User-facing docs should use "recorded-state quote evidence" and avoid describing topology-only artifacts as liquidity.

## Success Criteria

- Route candidates for supported FAME pairs can traverse connector liquidity not present in original pinned route artifacts.
- Route-lab Markdown and JSON answer why WETH/USDC was selected, considered, disabled, or missing for each amount bucket.
- Manifest-disabled connector edges stay non-executable but visible in diagnostics; Slipstream2 Gauge Caps edges become executable only when protocol quoter support and router readiness are both present.
- Tests fail if candidate generation collapses back to the original manifest-ready route families or if a newly introduced connector pool lacks a matrix status.
- The implementation remains bounded and deterministic enough for public quote API use.

## Scope Boundaries

- Do not support public non-FAME swaps.
- Do not discover arbitrary Base pools at runtime.
- Do not enable Slipstream2 without validating the protocol quoter path and router readiness gate.
- Do not create a route promotion lifecycle.
- Do not display fake route strength or unverified liquidity precision.
- Do not depend on GraphQL subgraphs.

## Key Decisions

- **Separate executable edges from diagnostic edges:** executable search uses manifest-ready edges; gap reporting sees all reviewed pool-universe edges plus configured missing connector checks.
- **Use bounded depth, not open aggregation:** increase connector path expressiveness only behind explicit budgets and deterministic ordering.
- **Make missing connectors durable:** WETH/USDC and other connector gaps become route-lab facts that can feed follow-up todos.
- **Keep quote evidence authoritative:** graph topology can create candidates, but only quote evidence can make them ready.

## Outstanding Questions

### Resolve Before Planning

None.

### Deferred to Planning

- Choose the exact candidate depth and count budgets.
- Choose the edge status schema for route-lab JSON and Markdown.
- Decide whether gap-matrix summaries should live only in route-lab output or also in reusable solver diagnostics.
