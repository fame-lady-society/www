# Base Fork Marketplace Checkout Browser Campaign

Status: passed on a disposable localhost Base fork on 2026-08-01

This records browser behavior for the fork-only marketplace checkout. It is not
a deployment manifest or production authorization. Temporary marketplace and
checkout addresses are deliberately omitted.

## Run boundary

- Base fork started at block `49392666`, hash
  `0x1637485978b2c48bf27782e8e1dc585851a76fc61ff14d125d998bdc41ec7d5d`.
- Both browser and server RPC transports used literal loopback
  `http://127.0.0.1:8545`; no public Base fallback was available.
- The browser used an explicitly configured, disposable Anvil account with no
  production key.
- Fork-only metadata fallback was enabled separately from fork wallet mode.
- Contract baseline: `fame-contracts` `bae7c1f`.
- Gallery checkout baseline: `fls-www` `fbd2a88`, plus the fork harness and
  browser fixes recorded with this campaign.

## Browser results

| Case                         | Result                                                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Direct FAME, held inventory  | Passed; exact approval followed by one marketplace purchase                                                                |
| Native ETH, pool fulfillment | Passed; no approval and one atomic checkout transaction                                                                    |
| USDC, pool fulfillment       | Passed; exact approval followed by one atomic checkout transaction                                                         |
| WETH, held fulfillment       | Passed; the existing exact approval was reused and one atomic checkout transaction settled                                 |
| Transaction UX               | Used the repository transaction modal and Wagmi lifecycle; no automatic transaction retry                                  |
| Quote UX                     | Showed maximum input, marketplace FAME charge, protected FAME, estimated surplus, and liquidity-dependent FAME refund copy |
| Post-settlement custody      | Checkout retained zero ETH, FAME, USDC, WETH, and mirror NFTs                                                              |

Campaign purchase transaction hashes from this disposable fork were:

- Direct FAME held:
  `0xcb1cf62cdad15177c7828c35757a412db633e645cf84d3398e22ae55f150b572`
- ETH pool: `0x8fe371095f496e528fd3dbf95fb546a0706c1a51e3d91bd9d33913f0329b663e`
- USDC pool: `0x0473c7922105197ad0b247d031d831ea7a49b0f8088422b256437b27802da921`
- WETH held: `0x0c612ba1a7c356f5ed053d6f034062758dd70f76d4b9fa08c0063eb41bfb0550`

The selected checkout route hashes were:

- ETH: `0x941a35a1a857158ae525d3cb08120682d8b81d2ab88d5cd98ff789167f6448be`
- USDC: `0x1fdbb62f0ad3e0e13c9d9ae8f947f1a4b8493676de056422fa98cb2ba153c742`
- WETH: `0x2b80d0a7738f992a1fd2c73089b77ba638c557bd132be07803884aa9cac71593`

Each checkout charged exactly `1,030,000 FAME`. The settlement events reported
approximately `10,404` to `10,407 FAME` returned to the buyer, with zero unused
input residue for these three selected routes.

## Campaign findings

- The first USDC simulation exposed a corrupted local fixture: earlier funding
  had transferred USDC out of an Aerodrome pool without updating its stored
  reserves. No checkout transaction was sent. Restoring the pool balance and
  funding the disposable wallet through Anvil storage produced a fresh quote
  and successful checkout.
- A WETH attempt selected a held card made stale by earlier inventory
  consumption. Fulfillment resolution rejected it before purchase submission.
  Reloading canonical inventory exposed the replacement held card; the fresh
  selection then settled successfully.
- Base's well-known Anvil development accounts carry EIP-7702 delegation code
  in the forked state and are unsafe DN404 NFT recipients. The campaign used a
  plain, empty-code disposable address instead.
- React's pending-transaction list exposed an undefined-key warning. The modal
  now uses a stable kind-and-position key. A separate React 19 `element.ref`
  warning originates in the existing UI dependency stack and did not affect
  checkout behavior.
- After review hardening, the live ETH quote remained available while pinning
  and checking the marketplace's `authorizedCheckout` at the quote block.

## Teardown

Stop the app and Anvil after the run. Do not copy temporary contract addresses,
fork funding state, or Foundry `broadcast/` output into tracked configuration.
Production deployment, funding, activation, and Safe ownership transfer remain
deferred.
