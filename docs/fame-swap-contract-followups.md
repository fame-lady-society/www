# FAME Swap Contract Follow-Ups

`www` route-lab output should become `fame-contracts` todos only when the evidence names a concrete pair, raw amount, selected pool set, fee diagnostics, and observed solver or simulation result.

Use targeted follow-ups:

- Amount sweep for an existing route family.
- Route-capacity metadata for a known pool.
- Generated route artifact for a concrete existing-pool route.
- Split or split-then-merge fork example.
- Optimized allocation regression for a route-lab case where `optimizer.selectedAllocationBps` materially changes the pool set or branch amounts.
- Failing-route regression fixture for a specific amount.

Do not create a generic route promotion pipeline. Keep each todo tied to exact route-lab evidence and contract-repo acceptance criteria.

## Latest Evidence

- Recorded-state replay: `base-v1-live-45964183`, pinned Base block `45884844`.
- Live route lab: Base block `45969952` through Doppler RPC.
- Fork smoke: local Base fork deployed router `0x58597381dfe7d925014cdfbc264bc928a2d5929d` and passed protected route simulations for all 12 `FAME_ROUTE_CORPUS` cases at fork quote context `fork:8453:45884855`.
- Live `--simulate` was requested, but no initiating account env was configured. Set `FAME_SWAP_SIMULATION_ACCOUNT` or `NEXT_PUBLIC_FAME_SWAP_SIMULATION_ACCOUNT` before treating route-lab simulation as execution evidence.
- The formerly large closed buckets now quote as `ready` from recorded and live liquidity evidence. They should become amount-sweep or fork-proof follow-ups, not failure regressions.
- V4 routes are live-selected in current Doppler route-lab runs. V4 after-price is still not emitted by the current Base V4 quoter shape, so require route-level or one-pool simulation evidence; do not backfill unverifiable post-swap prices.
- Slipstream2 is enabled for the Base Gauge Caps deployment through the dedicated live quoter path. Unknown Slipstream2 deployments still fail closed and should not be included in launch-ready route evidence without separate validation.
- Route-lab now emits optimizer trial/status evidence. Use selected allocation bps, branch pool ids, and quote-plan stats when creating contract-side split examples; do not promote pruned, ineligible, or unsupported-shape trials as executable routes.

## Current Route-Lab Todo Candidates

### Prove USDC -> FAME Routes

- Case `usdc-fame-fixture`, amount in `1000000`.
- Live selected pools: `uniswap-v3-zora-usdc`, `uniswap-v4-basedflick-zora`, `slipstream-basedflick-fame`.
- Live router fee amount: `8939778144794596652`.
- Case `usdc-fame-five-dollars`, amount in `5000000`.
- Live selected pools: `uniswap-v3-zora-usdc`, `slipstream-zora-weth`, `uniswap-v2-fame-direct`.
- Live router fee amount: `44387113451261142918`.
- Fork smoke proved all three USDC -> FAME corpus buckets through `slipstream-zora-usdc`, `uniswap-v4-basedflick-zora`, and `slipstream-basedflick-fame`; protected outputs: `3965694263997776335875`, `19536964973556827513230`, and `7901912893467407859010`.
- Contract follow-up: add amount-sweep regressions for both live-selected pool sets, including V3/V4/Slipstream price-impact evidence and a below-balance initiating-account simulation.

### Prove FAME -> USDC Solidly Routes

- Case `fame-usdc-fixture`, amount in `31597600141347829`.
- Case `fame-usdc-large-closed`, amount in `31597600141347829000`.
- Live selected pools: `scale-equalizer-frxusd-fame`, `scale-equalizer-usdc-frxusd`.
- Fork smoke proved both FAME -> USDC corpus buckets through this pool set; protected outputs: `8` and `8065`.
- Contract follow-up: add fork regressions for both amounts. The fixture bucket still uses the stable USDC/frxUSD hop, which needs a validated stable-curve state-transition price source before its market impact can be marked computable. The larger bucket currently routes through `slipstream-usdc-frxusd` and reports two computable market-impact legs.

### Prove WETH -> FAME Routes

- Cases: `weth-fame-small-direct`, `weth-fame-split`, `weth-fame-large-closed`.
- Live selected pools: `weth-fame-small-direct` uses `uniswap-v3-zora-weth`, `uniswap-v4-basedflick-zora`, and `slipstream-basedflick-fame`; the larger buckets use `uniswap-v2-fame-direct`.
- Live max market impact bps: `301`, `30`, and `31`.
- Fork smoke proved all three WETH -> FAME corpus buckets through `slipstream-zora-weth`, `uniswap-v4-basedflick-zora`, and `slipstream-basedflick-fame`; protected outputs: `919635715360852133013`, `7312739029134378316001`, and `18094868045822744105938`.
- Contract follow-up: add amount sweeps across the direct V2 and Slipstream/V4 route families and confirm the generated route remains preferable to older split assumptions for each amount bucket.

### Prove Native ETH Paths

- Case `eth-fame-fixture`, amount in `500000000000000`.
- Case `eth-fame-large-closed`, amount in `2000000000000000`.
- Live selected pools: `uniswap-v4-zora-eth`, `uniswap-v4-basedflick-zora`, `slipstream-basedflick-fame`.
- Case `fame-eth-fixture`, amount in `31597600141347829`.
- Live selected pools: `slipstream-basedflick-fame`, `uniswap-v4-basedflick-zora`, `uniswap-v4-zora-eth`.
- Fork smoke proved both ETH -> FAME corpus buckets with protected outputs `4563513375757013848500` and `18012177704318796866686`, and proved `fame-eth-fixture` with protected output `3145201341`.
- Contract follow-up: add fork regressions proving native ETH remains distinct from WETH and capture the V4 pre-price plus route simulation result.

### Prove FAME -> WETH Direct V2 Route

- Case `fame-weth-fixture`, amount in `31597600141347829`.
- Live selected pools: `uniswap-v2-fame-direct`.
- Live max market impact bps: `30`.
- Fork smoke proved `fame-weth-fixture` through `uniswap-v2-fame-direct` at fork quote context `fork:8453:45884855`; protected output `3470853599`.
- Contract follow-up: add an amount sweep or route artifact decision for this direct V2 sell route.
