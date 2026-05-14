---
date: 2026-05-13
status: complete
topic: fame-swap-full-liquidity-solver
---

# Goal: Finish FAME Swap Liquidity Solver

Drive the FAME swap router to a release-safe solver. Do not stop at partial route support, demo fixtures, hard caps, or API-only wiring. Continue until every supported FAME-facing route family is live-quoted, recorded-state quoted, fork-proven, or explicitly blocked with tested diagnostics and no executable transaction data.

The solver must remain portable TypeScript that can run from the browser, API, route lab, tests, and fork scripts with injected quote providers. The API may be the first live runner, but it is not the quote authority.

Use `doppler run` and configured Base RPCs whenever needed to inspect pools, fork Base, run route experiments, capture state, and prove behavior. Do not leak RPC URLs, signer keys, or failed executable payloads. Prefer forked-chain proof and read-only live calls over production transactions.

Finish liquidity-derived quote adapters for every known pool and route family in the pinned universe: Solidly, Uniswap V2, Slipstream, Uniswap V3, Uniswap V4, native ETH, WETH, USDC, frxUSD, ZORA, basedflick, and current intermediates. Unsupported venues may fail closed only until proof says they are truly unsupported.

Quotes must calculate exact-input outputs leg by leg, including split and split-then-merge paths where downstream `All` legs consume upstream outputs. Outputs must account for venue liquidity fees, emit FLS router fee separately, and never subtract venue fees twice.

For every selected route, calculate and emit:
- gross output before FLS router fee,
- FLS router fee amount and rate,
- net output after FLS router fee,
- protected minimum after slippage,
- quote source and block or recorded-state context,
- selected pools and rejected candidates,
- estimated post-swap pool price where computable,
- market impact percentage versus the pre-swap pool or route price where computable.

Build whatever POCs, route-lab modes, fork harnesses, recorded-state generators, and fixtures are needed. Take pinned pool-state captures when useful. Recorded state data must be liquidity-derived and source-labeled, not renamed hard caps.

Create and maintain extensive tests:
- pure solver tests for routing, ranking, split allocation, fees, price impact, and status semantics,
- adapter tests for each venue and failure mode,
- API runner tests for bounded public inputs and no unsafe transaction data,
- widget tests for loading, stale quote invalidation, and disabled unsafe actions,
- route-lab corpus tests across representative amount buckets,
- fork tests against real live forked pools for every release-supported route family.

Keep iterating until small routes such as `$5` USDC and meaningful larger route-lab amounts either produce fork-proven safe quotes or fail closed for liquidity-derived reasons. Record exact follow-up todos for `../fame-contracts` whenever contract fixtures, amount sweeps, or route artifacts need promotion.
