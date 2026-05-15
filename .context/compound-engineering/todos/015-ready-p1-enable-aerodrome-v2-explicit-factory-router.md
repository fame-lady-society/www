---
id: 015
status: ready
priority: p1
title: Enable Aerodrome V2 explicit-factory FameRouter routes
created: 2026-05-15
source_repo: fame-contracts
---

# Enable Aerodrome V2 Explicit-Factory FameRouter Routes

## Context

The contracts repo deployed a new Base `FameRouter` with `AerodromeV2 = 7` support:

- Base router: `0xAdefa5860389E8936ebf2977e1Fb4a365aA39636`
- Aerodrome V2 router target: `0xcf77a3ba9a5ca399b7c97c74d54e5b1beb874e43`
- Aerodrome V2 factory: `0x420dd381b31aef6683db6b902084cb0ffece40da`
- Aerodrome V2 USDC/WETH pool: `0xcdac0d6c6c59727a65f871236188350531885c43`

The contract route schema remains version `1`, with the new appended venue ordinal `7`.

## Requirements

- Add `AerodromeV2 = 7` to the app Fame router schema/types.
- Stop treating `aerodrome-v2-usdc-weth` as `solidly`.
- Encode Aerodrome V2 payloads as `(Route[] routes, uint256 deadline)` where each route hop has `from`, `to`, `stable`, and `factory`.
- Keep existing `Solidly` payloads three-field only.
- Update `NEXT_PUBLIC_FAME_ROUTER_ADDRESS` / app router config to `0xAdefa5860389E8936ebf2977e1Fb4a365aA39636` after app tests pass.
- Remove the Aerodrome V2 blocked reason only after route builder/schema tests and fork smoke coverage pass.

## Evidence

- Contract unit tests cover Aerodrome V2 happy path, native ETH rejection, bad endpoints, zero factory, broken continuity, and direct allowance cleanup.
- Contract fixtures include `aerodrome-v2-usdc-weth` as an explicit Aerodrome V2 pool.
- Pinned Base fork tests execute the Aerodrome V2 USDC/WETH route and generated USDC -> WETH -> FAME proof route.
- Basescan verification passed for the new router.
