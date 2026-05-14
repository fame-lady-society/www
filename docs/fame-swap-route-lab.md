# FAME Swap Route Lab

The route lab runs amount buckets through the shared FAME swap solver without React, browser wallets, or live user transactions.

## Modes

- Recorded mode is the default: `bun scripts/fame-swap-route-lab.ts`. It replays the recorded-state artifact `base-v1-pool-state-snapshot.json`, captured from read-only Base quote calls and pool state at `base-v1-live-45964183`.
- Deterministic mode is explicit: `bun scripts/fame-swap-route-lab.ts --deterministic`. It uses the pinned test-only deterministic capacity profile to prove old cap failures and pure solver behavior.
- Live mode: `doppler run -- bun scripts/fame-swap-route-lab.ts --live`. It reads Base RPC liquidity through the live adapters and records a live block quote context.
- Live simulation: add `--simulate` and set `FAME_SWAP_SIMULATION_ACCOUNT` or `NEXT_PUBLIC_FAME_SWAP_SIMULATION_ACCOUNT`. ERC20 routes simulate approval plus swap as one bundle, derive a slippage-protected minimum from the probe result, then simulate the protected route; native routes do the same with direct router calls. This is the initiating-account path for below-balance and route-execution checks.
- Markdown output: add `--markdown` to any mode.

Fork/router execution is still handled by `yarn fame-swap:fork-smoke`; route lab remains the amount grid, quote evidence, optional initiating-account simulation, and contract-todo source.

## Quote Context

Ready rows include a quote context:

- `deterministic-test:<profile>` for test-only cap profiles.
- `recorded:<captureId>:<pinnedBaseBlock>` for deterministic recorded-state replay.
- `live:8453:<block>` for read-only Base liquidity quotes.

Recorded and live quote outputs are exact-input leg quotes. Venue fees are already included in adapter outputs; the FLS router fee is calculated and emitted separately.

## Price Impact

Route lab reports `computablePriceImpactLegs` and `maxLegMarketImpactBps`.

- Uniswap V2 uses reserve math and emits pre-swap price, estimated post-swap price, execution price, and market impact.
- Slipstream and Uniswap V3 read pool `slot0` before quoting and use the quoter's `sqrtPriceX96After` for post-quote price.
- Uniswap V4 reads `StateView.getSlot0` for pre-swap price and computes market impact against execution price. The current Base V4 quoter response exposes output and gas, not after-price, so post-swap price remains unavailable for V4 legs. Treat hooks, dynamic fees, and custom accounting as reasons to add route simulation evidence, not as a reason to backfill an unverifiable after-price.
- Solidly volatile `getAmountOut` legs emit reserve-based constant-product impact. Solidly stable legs still quote from the pool but do not emit market impact until a validated stable-curve state-transition price source is added.

## Simulation Fallback

V4's missing after-price should be handled as an execution-evidence gap, not by inventing a local post-price. The fallback is route-level simulation against current infrastructure:

- Route lab `--live --simulate` uses the configured initiating account and simulates both the probe route and the protected route for ERC20 and native paths.
- Fork smoke runs against a local Base fork, funds the public fork account for supported ERC20 inputs, probes the raw route, applies slippage, and simulates the protected route.
- Use `FAME_SWAP_FORK_CASES=all` for slower full-corpus stress runs, or a comma-separated case list for one-pool or one-route investigations.

## Output Safety

`bun scripts/fame-swap-route-lab.ts --recorded --markdown` emits display-safe Markdown with selected pools, quote context, fee diagnostics, price-impact coverage, rejected candidates, and suggested contract-repo todo bodies.

Failed route states intentionally omit executable route payloads, approval requests, swap calldata, RPC URLs, and signer material. Simulation failures are sanitized. Ready rows include selected pool ids and quote evidence, but no private RPC configuration.

## Current Evidence

Recent verified runs:

- Recorded route lab: `base-v1-live-45964183`, pinned Base block `45884844`.
- Live route lab: Base block `45967003`.
- Full-corpus fork smoke: pinned local Base fork block `45884844`, fork quote context block `45884855`, all 12 `FAME_ROUTE_CORPUS` cases passed protected route simulation.
- `$5` USDC -> FAME is `ready` in both recorded and live modes, selecting `slipstream-zora-usdc`, `slipstream-zora-weth`, and `uniswap-v2-fame-direct` in the latest live run. Deterministic mode remains the expected cap-profile failure.
- Solidly FAME -> USDC routes now report one computable market-impact leg for the volatile FAME/frxUSD hop; the stable USDC/frxUSD hop remains quoted but non-computable for market impact.
- Representative larger USDC, WETH, and native ETH buckets now quote from liquidity evidence instead of deterministic capacity caps.

## Contract Follow-Ups

Suggested todos are evidence snippets, not a route promotion pipeline. Review the output first, then create targeted todos in the `fame-contracts` repo for exact amount sweeps, route-capacity metadata, generated route artifacts, split examples, or regression fixtures.
