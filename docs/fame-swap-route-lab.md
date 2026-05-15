# FAME Swap Route Lab

The route lab runs amount buckets through the shared FAME swap solver without React, browser wallets, or live user transactions.

## Modes

- Recorded mode is the default: `bun scripts/fame-swap-route-lab.ts`. It replays the recorded-state artifact `base-v1-pool-state-snapshot.json`, captured from read-only Base quote calls and pool state at `base-v1-live-45964183`.
- Deterministic mode is explicit: `bun scripts/fame-swap-route-lab.ts --deterministic`. It uses the pinned test-only deterministic capacity profile to prove old cap failures and pure solver behavior.
- Live mode: `doppler run -- bun scripts/fame-swap-route-lab.ts --live`. It reads Base RPC liquidity through the live adapters and records a live block quote context. Server/operator runs prefer `BASE_RPC_URL`; `NEXT_PUBLIC_BASE_RPC_URL_1` is only a fallback for browser-safe or local endpoints.
- Live simulation: add `--simulate` and set `FAME_SWAP_SIMULATION_ACCOUNT` or `NEXT_PUBLIC_FAME_SWAP_SIMULATION_ACCOUNT`. ERC20 routes simulate approval plus swap as one bundle, derive a slippage-protected minimum from the probe result, then simulate the protected route; native routes do the same with direct router calls. This is the initiating-account path for below-balance and route-execution checks. Default JSON and Markdown use a shortened account label.
- Markdown output: add `--markdown` to any mode.

Fork/router execution is still handled by `yarn fame-swap:fork-smoke`; route lab remains the amount grid, quote evidence, optional initiating-account simulation, and contract-todo source.

## Quote Context

Ready rows include a quote context:

- `deterministic-test:<profile>` for test-only cap profiles.
- `recorded:<captureId>:<pinnedBaseBlock>` for deterministic recorded-state replay.
- `live:8453:<block>` for read-only Base liquidity quotes.

Recorded and live quote outputs are exact-input leg quotes. Venue fees are already included in adapter outputs; the FLS router fee is calculated and emitted separately.

## Allocation Optimizer Evidence

Ready rows include an `optimizer` object when the async solver path runs. The object is operator evidence only; `/api/fame/swap/quote` does not serialize raw optimizer trials.

- `status` is `selected` when the optimizer selected the returned route and `fallback` when route-lab returned a legacy-compatible fallback with optimizer diagnostics attached.
- `selectedAllocationBps`, `selectedTemplateId`, and `selectedCandidateId` name the allocation that won, when one is executable under the current flat route model.
- `allocationTrials` records selected, rejected, quote-failed, pruned, budget-exhausted, unsupported, and ineligible allocation points with display-safe reasons.
- `quotePlanStats` separates logical quote requests from unique exact quote reads, state reads, cache hits, and underlying RPC reads.
- `templateEligibility` is where 3+ pool groups, segment-level expectations, disabled pools, Aerodrome V2/migrated Slipstream gating, and NativeWrap-deferred native/WETH routes show up before they are executable.

The first optimizer milestone executes two-branch direct splits and same-intermediate split-then-merge templates. It classifies N-way and segment-level opportunities but does not materialize them as selected routes.

## Price Impact

Route lab reports `computablePriceImpactLegs` and `maxLegMarketImpactBps`.

- Uniswap V2 uses reserve math and emits pre-swap price, estimated post-swap price, execution price, and market impact.
- Slipstream and Uniswap V3 read pool `slot0` before quoting and use the quoter's `sqrtPriceX96After` for post-quote price when available. Live Slipstream and Slipstream2 rows also read pool `liquidity()` as active-liquidity state evidence; a failed active-liquidity read marks only that evidence unavailable.
- Uniswap V4 reads `StateView.getSlot0` for pre-swap price and computes market impact against execution price. The current Base V4 quoter response exposes output and gas, not after-price, so post-swap price remains unavailable for V4 legs. Treat hooks, dynamic fees, and custom accounting as reasons to add route simulation evidence, not as a reason to backfill an unverifiable after-price.
- Live Uniswap V4 route-lab rows also read `StateView.getLiquidity` as active-liquidity state evidence. A failed active-liquidity read marks that evidence unavailable without turning a successful V4 output quote into a failed quote. Recorded route-lab rows mark V4 active liquidity unavailable unless the recorded-state artifact explicitly includes it.
- Solidly volatile `getAmountOut` legs emit reserve-based constant-product impact. Solidly stable legs still quote from the pool but do not emit market impact until a validated stable-curve state-transition price source is added.

## Protocol Coverage Status

- Uniswap V2: enabled for reviewed pools. The current universe includes a direct USDC/WETH pair with reserve-based output and market-impact evidence.
- Uniswap V3: enabled. Quotes use the validated quoter path and carry after-price evidence. The current universe includes reviewed direct USDC/WETH 5 bps and 30 bps pools.
- Uniswap V4: enabled. Latest live route-lab runs select V4 pools on USDC, WETH, native ETH, and FAME sell routes. V4 legs carry output, pre-price, and market-impact-against-execution evidence; after-price remains unavailable from the current Base V4 quoter shape and should be filled by route or one-pool simulation evidence, not guessed.
- Aerodrome Slipstream V1: enabled. Quotes use the validated Slipstream quoter path and carry after-price evidence where the quoter returns it. The reviewed USDC/WETH tick-spacing 100 pool is enabled. The migrating factory tick-spacing 50 USDC/WETH pool is present but disabled until router and quoter factory support are validated.
- Aerodrome Slipstream2: enabled for the Base Gauge Caps deployment. Quotes use the dedicated Slipstream2 quoter path, read `slot0`, and report active-liquidity evidence from pool `liquidity()` when that read succeeds. Unknown Slipstream2 deployments still fail closed.
- Solidly volatile: enabled with reserve-based impact evidence. The Aerodrome V2 USDC/WETH pool is present but disabled because the current Solidly adapter encodes 3-field routes, while Aerodrome V2 expects an explicit factory route shape.
- Solidly stable: enabled for output quotes, but market-impact state output remains unavailable until the stable-curve transition price source is validated.

## Simulation Fallback

V4's missing after-price should be handled as an execution-evidence gap, not by inventing a local post-price. The fallback is route-level simulation against current infrastructure:

- Route lab `--live --simulate` uses the configured initiating account and simulates both the probe route and the protected route for ERC20 and native paths.
- Fork smoke runs against a local Base fork, funds the public fork account for supported ERC20 inputs, probes the raw route, applies slippage, and simulates the protected route.
- Use `FAME_SWAP_FORK_CASES=all` for slower full-corpus stress runs, or a comma-separated case list for one-pool or one-route investigations.

## Output Safety

`bun scripts/fame-swap-route-lab.ts --recorded --markdown` emits display-safe Markdown with selected pools, quote context, fee diagnostics, price-impact coverage, rejected candidates, and suggested contract-repo todo bodies.

Failed route states intentionally omit executable route payloads, approval requests, swap calldata, RPC URLs, and signer material. Simulation failures are sanitized. Ready rows include selected pool ids and quote evidence, but no private RPC configuration.

## Edge Gap Matrix

Every route-lab row includes an edge matrix for the amount bucket. Matrix statuses use this precedence when an edge appears in multiple candidate states: `selected`, `considered`, `rejected`, `disabled`, then `missing`.

- `selected`: edge appears in the ready selected route.
- `considered`: edge appears in at least one generated executable candidate that was not selected.
- `rejected`: every candidate using the edge failed quote/ranking, with quote adapter failures kept distinct from unsafe output.
- `disabled`: edge exists in the reviewed pool universe but is not executable under current manifest/readiness policy.
- `missing`: a configured connector probe has no reviewed pool-universe edge.

The matrix always checks WETH/USDC connector probes for Aerodrome Slipstream and Solidly in both directions. Reviewed WETH/USDC pools now appear as normal selected, considered, rejected, or disabled rows. Disabled rows are intentional for reviewed pools that are on-chain valid but not executable under the current router adapter or manifest policy. Slipstream2 Gauge Caps edges are executable only when the router manifest/readiness policy includes their venue family and target.

The edge matrix is a follow-up source, not launch approval. Use it to create exact manifest or pool-universe follow-ups after reviewing recorded-state quote evidence and, where needed, live or fork simulation evidence.

## Protocol Coverage Matrix

Every route-lab row also includes protocol coverage rows derived from the edge matrix.

- `selected` rows can attach selected-leg quote evidence: quote output, pre-price, post-price when protocol-backed, market-impact computability, active-liquidity evidence, and route-simulation status.
- `considered` rows mean the edge appeared in an executable candidate but was not selected. They do not pretend to have retained selected-leg quote evidence.
- `rejected` rows use failed-leg metadata when ranking identifies the failed pool; otherwise they are labeled as candidate-level rejection evidence.
- `disabled` rows keep quote, state, and simulation coverage disabled for edges not enabled by the current manifest/readiness policy.
- `missing` rows describe absent reviewed connector coverage, not quote failure.

Protocol coverage is route-lab/operator evidence. `/api/fame/swap/quote` strips route-lab-only protocol evidence from public ready responses.

## Current Evidence

Recent verified runs:

- Recorded route lab: `base-v1-live-45964183`, pinned Base block `45884844`.
- Live route lab: Base block `45998621` through Doppler RPC.
- Full-corpus fork smoke: pinned local Base fork block `45884844`, fork quote context block `45884855`, all 12 `FAME_ROUTE_CORPUS` cases passed protected route simulation.
- Live V4 selections at block `45969952` included `uniswap-v4-basedflick-zora` on USDC -> FAME and WETH -> FAME, `uniswap-v4-zora-eth` plus `uniswap-v4-basedflick-zora` on native ETH -> FAME, and the reverse V4 path on FAME -> ETH.
- `$5` USDC -> FAME is `ready` in both recorded and live modes. The latest live run considered the reviewed USDC/WETH connector pools, selected the USDC/frxUSD corridor, and kept deterministic mode as the expected cap-profile failure.
- FAME -> USDC and representative WETH -> FAME live buckets now select the reviewed `slipstream-usdc-weth-100` connector. Native ETH buckets select `uniswap-v4-usdc-eth` without adding an ETH/WETH wrap or unwrap leg.
- Solidly FAME -> USDC routes now report one computable market-impact leg for the volatile FAME/frxUSD hop; the stable USDC/frxUSD hop remains quoted but non-computable for market impact.
- Representative larger USDC, WETH, and native ETH buckets now quote from liquidity evidence instead of deterministic capacity caps.

## Contract Follow-Ups

Suggested todos are evidence snippets, not a route promotion pipeline. Review the output first, then create targeted todos in the `fame-contracts` repo for exact amount sweeps, route-capacity metadata, generated route artifacts, split examples, or regression fixtures.
