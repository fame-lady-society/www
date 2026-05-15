---
id: 015
status: complete
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

- [x] App route config can represent Aerodrome V2 pools with `factory`, `stable`, and `pool`.
- [x] App-generated calldata uses `VenueFamily.AerodromeV2 = 7`.
- [x] App-generated Aerodrome payload contains `from`, `to`, `stable`, and `factory`.
- [x] Existing Solidly route payloads remain three-field routes.
- [x] Base FameRouter address is updated to the deployed router above.
- [x] Quote and execution tests cover the Aerodrome V2 USDC/WETH route path.

## Work Log

### 2026-05-15 - Implementation

**By:** Codex

**Plan:** `docs/plans/2026-05-15-015-fame-swap-aerodrome-v2-plan.md`

**Actions:**
- Added `VenueFamily.AerodromeV2 = 7` and `aerodrome-v2` pool config support with explicit `pool`, `stable`, `factory`, and `feeBps` fields.
- Reclassified `aerodrome-v2-usdc-weth` from blocked Solidly-shaped routing to enabled Aerodrome V2 routing, added the default Aerodrome factory, refreshed pool artifact hashes, and added the Aerodrome router target to the manifest.
- Added Aerodrome V2 route payload encoding/materialization with `from`, `to`, `stable`, `factory`, and `deadline`, while preserving Solidly's existing three-field route ABI.
- Extended live and recorded quote adapters, graph diagnostics, and pool display metadata so Aerodrome V2 is distinguishable from Solidly.
- Kept `slipstream-usdc-weth-migrating-50` blocked and out of scope.
- Confirmed `wagmi.config.ts` and generated wagmi config already point Base FameRouter at `0xAdefa5860389E8936ebf2977e1Fb4a365aA39636`.

**Verification:**
- `doppler run -- bun test src/features/fame-swap/router/encodeRoute.test.ts src/features/fame-swap/solver/poolUniverse.test.ts src/features/fame-swap/solver/materializeRoute.test.ts src/features/fame-swap/solver/quotes/liveAdapters.test.ts src/features/fame-swap/solver/amountSolver.test.ts`
- `doppler run -- bun test src/features/fame-swap`
- `doppler run -- bun scripts/fame-swap-route-lab.ts --markdown`
- `git diff --check`

**Notes:**
- Doppler could not reach the API from this sandbox and used its fallback file for these runs.
- Recorded route-lab shows Aerodrome V2 USDC/WETH as its own venue and the migrated Slipstream USDC/WETH pool as disabled.
