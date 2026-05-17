---
title: FAME Swap Quote Solver Timeouts and NativeWrap Routing
date: 2026-05-15
category: performance-issues
module: fame-swap
problem_type: performance_issue
component: service_object
symptoms:
  - Large FAME swap quote requests timed out near the API request cap.
  - Large swaps did not consistently select split routes across the deepest WETH/FAME pools.
  - USDC-to-FAME routes avoided expected terminal splits and overused weaker connector paths.
  - ETH-to-FAME routes stayed in sparse native ETH connector liquidity instead of using WETH/FAME depth.
  - NativeWrap-ready routes were not executable against the old Base router address.
root_cause: logic_error
resolution_type: code_fix
severity: high
related_components:
  - quote API
  - route allocation optimizer
  - live quote adapters
  - router manifest
tags: [fame-swap, quote-solver, route-allocation, native-wrap, weth, split-routes, base-router]
---

# FAME Swap Quote Solver Timeouts and NativeWrap Routing

## Problem

The FAME swap quote solver had a working route graph, but it was not reliable for larger swaps or ETH-to-FAME quotes. It missed profitable split and terminal-split shapes, repeated expensive quote work inside one request, and could not explicitly move native ETH into the deeper WETH graph until the router supported a typed wrap operation.

The fix landed in commit `07c8595 feat(fame-swap): optimize route allocation and native wraps`.

## Symptoms

- Large quote requests timed out near the 15 second API cap and returned no quote.
- Large WETH/FAME swaps did not consistently select expected Scale/Uniswap v2 splits.
- USDC/FAME routes often found a connector route and then used only the lower-fee Uniswap v2 FAME pool instead of splitting the terminal WETH-to-FAME leg.
- ETH/FAME routes could select Uniswap v4 ETH/USDC but still detoured through weaker native connector liquidity such as frxUSD paths.
- NativeWrap candidate routes failed readiness checks against the old router because venue ordinal `6` was not enabled.

## What Didn't Work

- Treating "split route not selected" as only a ranking bug was incomplete. Prior session history showed this was also a coverage and materialization problem: missing route shapes, path-depth limits, and no executable terminal split primitive.
- Keeping the old 3-leg budget blocked known reviewed liquidity. Session-history evidence found `USDC -> FAME` needed 4 legs for msUSD/msETH routes, and the msETH corridor needed 5 legs; the known public universe stayed bounded at 107 candidates with `maxSimplePathLegs: 5` (session history).
- Expanding the graph without NativeWrap only added more native ETH candidates. It did not let ETH quotes enter WETH liquidity because native ETH and WETH have different router semantics.
- Silently substituting ETH and WETH was rejected. ETH uses `msg.value`, WETH uses ERC20 approval and transfer semantics, so the route must encode the wrap explicitly (session history).
- Generic wrap/unwrap through existing swap adapters was not viable. V2, Solidly, Slipstream, and V3 adapters reject native ETH; V4 was the only native-capable path; and the Universal Router adapter did not expose arbitrary wrap commands (session history).
- Triggering a slow legacy fallback path did not solve API timeouts. When the whole request hit the 15 second cap, no fallback quote was returned.

## Solution

Add a request-bounded route allocation optimizer and model `ETH <-> WETH` as a first-class `NativeWrap` route leg.

The optimizer lives under `src/features/fame-swap/solver/optimizer/` and keeps the search bounded:

```ts
export const DEFAULT_FAME_OPTIMIZER_BUDGETS = {
  maxTemplates: 32,
  maxTrialsPerTemplate: 16,
  maxLogicalQuoteRequests: 320,
  maxUniqueExactQuoteReads: 180,
  maxUniqueStateReads: 80,
  maxUnderlyingRpcReads: 240,
  timeoutMs: 9_500,
};
```

Important implementation points:

- `src/features/fame-swap/solver/optimizer/templates.ts` generates direct splits, terminal splits, and split-merge templates.
- `src/features/fame-swap/solver/optimizer/materialize.ts` converts selected templates into executable flat `FameRoute.legs` using explicit `Exact` branch amounts and final `All` legs.
- `src/features/fame-swap/solver/optimizer/quoteRunAdapter.ts` coalesces duplicate exact quote requests and in-flight work inside one quote run.
- `src/features/fame-swap/solver/optimizer/search.ts` uses bounded parallelism and races work against the remaining deadline.
- `src/app/api/fame/swap/quote/handler.ts` passes only the remaining request budget into optimizer work instead of letting optimizer search consume the whole API timeout.

`NativeWrap` is a synthetic graph venue, not a pool quote:

```ts
export const NATIVE_WRAP_POOL_ID = "native-wrap-weth";
```

NativeWrap route rules:

- venue family ordinal: `6`
- target: Base WETH `0x4200000000000000000000000000000000000006`
- payload data: `0x`
- leg `minAmountOut`: `0`
- quote: deterministic 1:1
- approval: none for native ETH input
- pool RPC reads: none

The app router address was updated to the NativeWrap-capable Base router in `wagmi.config.ts` and `src/wagmi/index.ts`:

```text
0xAdefa5860389E8936ebf2977e1Fb4a365aA39636
```

## Why This Works

The solver needed to optimize executable route shapes, not just choose among prebuilt routes. Terminal splits let a route first convert into the right connector asset, then split the high-impact final leg across the deepest FAME pools. That addresses the USDC-to-FAME case where the best structure is often "find WETH, then split WETH/FAME."

NativeWrap fixes ETH-to-FAME coverage by making the native/WETH boundary explicit. Once the solver can materialize `ETH -> WETH` as a real leg, ETH quotes can reuse the same WETH/FAME liquidity as ERC20 WETH routes without pretending ETH and WETH are interchangeable.

The request-scoped caches and bounded optimizer deadline keep the quote builder from repeating the same live edge/state reads across allocation trials. That makes the optimizer useful inside the API request budget instead of turning every large quote into a timeout.

## Prevention

- Keep optimizer output constrained to route shapes that can be encoded as flat `FameRoute.legs`; do not introduce hidden nested split trees.
- Keep `maxTemplates: 32` until there is route-lab evidence that a larger budget improves quote quality without breaking latency.
- Model balance-changing operations such as wrap/unwrap as explicit graph legs with router capability gates, not as silent token normalization.
- Verify new route primitives against both quote quality and router readiness. A good quote is not usable unless the deployed router enables the required venue family and target.
- Keep public quote diagnostics stripped of internal route-lab or protocol evidence that could leak through fields such as fee breakdowns (session history).

Focused tests used for this fix:

```bash
bun test src/features/fame-swap src/app/api/fame/swap/quote/route.test.ts scripts/fame-swap-route-lab.test.ts
git diff --check
```

Important regression cases:

- ETH-to-FAME quote materializes `native-wrap-weth` followed by a WETH/FAME split.
- NativeWrap leg uses ordinal `6`, target WETH, `data: "0x"`, and `minAmountOut: 0n`.
- NativeWrap live adapter returns 1:1 without a pool RPC read.
- API quote handling gives optimizer work a bounded remaining timeout.
- Route lab shows optimizer-selected split or terminal-split artifacts for large swaps.

## Related Issues

- `docs/plans/2026-05-14-012-feat-fame-swap-route-allocation-optimizer-plan.md` was the direct implementation plan, but it predates enabled NativeWrap support.
- `docs/brainstorms/2026-05-14-fame-swap-route-allocation-optimizer-requirements.md` captured the allocation optimizer requirements and is stale where it treats NativeWrap as deferred.
- `docs/ideation/2026-05-14-fame-swap-quoter-solver-audit-ideation.md` captured the original performance, efficiency, and coverage audit.
- `docs/fame-swap-route-lab.md` is the operational evidence surface and should be refreshed where it still describes native/WETH routes as NativeWrap-deferred.
- GitHub issue search for related FAME swap, NativeWrap, WETH, split-route, and quote-timeout terms found no matching issues.
