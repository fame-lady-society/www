---
date: 2026-05-14
topic: fame-swap-open-connector-graph
status: selected
source_todo: .context/compound-engineering/todos/011-ready-p1-expand-route-solver-graph-and-liquidity-gap-matrix.md
---

# FAME Swap Open Connector Graph Ideation

## Focus

The current FAME swap solver is amount-aware and quote-backed, but its graph still behaves too much like the original route artifact family. The next improvement should keep public swaps limited to FAME buy/sell pairs while making internal search and diagnostics honest about connector liquidity, disabled pools, and useful missing edges.

## Grounding

- `src/features/fame-swap/solver/graph/buildGraph.ts` filters graph edges to `manifestReady`, so disabled or unreviewed pools are invisible to graph diagnostics.
- `src/features/fame-swap/solver/graph/candidates.ts` only exposes candidate generation for supported public FAME pairs. The internal DFS can traverse non-FAME connector edges, but the budgets and diagnostics do not explain which connector edges were considered, disabled, missing, or rejected.
- The pool universe already contains connector pairs such as ZORA/USDC, ZORA/WETH, USDC/frxUSD, WETH/SPX, WETH/msETH, and Slipstream2 connector pools, but not a direct WETH/USDC edge.
- `scripts/fame-swap-route-lab.ts` reports selected pools and candidate rejections per amount bucket, but not a per-edge graph matrix that can answer why WETH/USDC, Aerodrome/Solidly connectors, or absent-from-original-artifact routes did or did not participate.

## Candidate Ideas

### 1. Search Over All Reviewed Connector Edges

Let candidate generation receive a graph that keeps manifest-ready executable edges separate from diagnostic-only disabled edges. Candidate routes still use executable edges only, but the traversal budget and reporting can see the wider reviewed pool universe.

This is the strongest implementation direction because it improves route selection without opening the public API to arbitrary pairs or pools.

### 2. Emit A Route-Lab Edge Gap Matrix

Add a route-lab artifact that lists graph edges by amount bucket and pair with statuses such as `considered`, `selected`, `rejected`, `disabled`, and `missing`. Include direct connector gaps such as WETH/USDC even when no pool exists in the current universe.

This is required because the user-visible problem is observability as much as route quality: the system needs to prove it asked the right liquidity questions.

### 3. Raise Simple Path Depth With Strict Budgets

Allow connector paths up to four legs behind a hard candidate budget, cycle guard, and deterministic sort. This lets the solver consider routes absent from original artifacts when quote evidence supports them, while preventing unbounded aggregator behavior.

This is useful but must stay conservative. A deeper path should not become a substitute for protocol quote validation or route execution proof.

### 4. Treat Non-Executable Connector Edges As First-Class Diagnostics

Keep manifest-disabled targets out of executable candidates, but surface them in graph diagnostics with clear disabled reasons. Slipstream2 Gauge Caps pools are executable only after dedicated quoter validation plus router manifest/readiness coverage.

This prevents missing support from looking like missing liquidity.

### 5. Generate Follow-Up Inputs From Edge Gaps

Use the gap matrix to feed manifest and pool-universe follow-up text. The follow-up should identify exact token pair, desired connector, venue family, current status, and evidence need without implying launch approval.

This compounds route-lab output into actionable work while avoiding a route promotion pipeline.

## Rejected Ideas

| Idea                                            | Decision | Reason                                                                                                          |
| ----------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| Add arbitrary Base pool discovery               | Rejected | It violates the bounded FAME router scope and would turn the quote API into an aggregator surface.              |
| Make non-FAME public quote pairs supported      | Rejected | Public swaps should remain FAME buy/sell only. Connector pairs are internal search and diagnostics tools.       |
| Enable Slipstream2 by configuration only        | Rejected | Slipstream2 requires protocol quoter validation and router manifest/readiness coverage, not a config-only flip. |
| Rank routes by topology strength without quotes | Rejected | The stack now requires recorded-state or live quote evidence for executable decisions.                          |

## Selected Direction

Build an executable-edge graph plus diagnostic-edge matrix. Candidate search should run only over reviewed executable edges, but the route lab should report the larger connector universe, disabled/unready edges, and explicit missing connector gaps. The solver should support deterministic depth and candidate-count budgets, and tests should prove it can select a route that is not one of the original pinned route artifact ids when quote evidence supports it.
