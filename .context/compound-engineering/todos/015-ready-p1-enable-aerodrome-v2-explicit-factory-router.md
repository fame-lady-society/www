---
id: 015
status: ready
priority: p1
title: Enable Aerodrome V2 explicit-factory Fame router routes
created: 2026-05-15
source_repo: fame-contracts
source_commit: 98c9671
---

# Enable Aerodrome V2 Explicit-Factory Fame Router Routes

## Context

The FameRouter contract now supports Aerodrome V2 routes as a distinct venue family instead of encoding Aerodrome V2 pools through the legacy Solidly adapter.

Deployed Base router:

`0xAdefa5860389E8936ebf2977e1Fb4a365aA39636`

Basescan:

`https://basescan.org/address/0xadefa5860389e8936ebf2977e1fb4a365aa39636`

## Contract Encoding

- `VenueFamily.AerodromeV2 = 7`
- Payload ABI:

```solidity
struct AerodromeRoute {
    address from;
    address to;
    bool stable;
    address factory;
}

struct Payload {
    AerodromeRoute[] routes;
    uint256 deadline;
}
```

The adapter calls Aerodrome's four-field route overload:

```solidity
swapExactTokensForTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    AerodromeRoute[] routes,
    address to,
    uint256 deadline
)
```

## Base Route Constants

Aerodrome router:

`0xcf77a3ba9a5ca399b7c97c74d54e5b1beb874e43`

Aerodrome default factory:

`0x420dd381b31aef6683db6b902084cb0ffece40da`

USDC/WETH volatile pool:

`0xcdac0d6c6c59727a65f871236188350531885c43`

Tokens:

- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- WETH: `0x4200000000000000000000000000000000000006`

Pool metadata verified on Base:

- `stable = false`
- `factory.isPool(pool) = true`
- `factory.getPool(USDC, WETH, false) = pool`
- `factory.getFee(pool, false) = 30`

## Required App Work

- Add app-side route encoding support for `VenueFamily.AerodromeV2 = 7`.
- Stop treating the Aerodrome V2 USDC/WETH pool as a Solidly three-field route.
- Encode Aerodrome V2 route hops with explicit `factory`.
- Update the active Base FameRouter address to `0xAdefa5860389E8936ebf2977e1Fb4a365aA39636`.
- Add route compiler and quote-path tests proving the generated calldata uses the four-field Aerodrome route ABI.
- Keep migrated Slipstream pools out of scope until the contract repo adds separate Slipstream proof support.

## Acceptance Criteria

- [ ] App route config can represent Aerodrome V2 pools with `factory`, `stable`, and `pool`.
- [ ] App-generated calldata uses `VenueFamily.AerodromeV2 = 7`.
- [ ] App-generated Aerodrome payload contains `from`, `to`, `stable`, and `factory`.
- [ ] Existing Solidly route payloads remain three-field routes.
- [ ] Base FameRouter address is updated to the deployed router above.
- [ ] Quote and execution tests cover the Aerodrome V2 USDC/WETH route path.
