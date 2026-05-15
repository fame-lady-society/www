---
status: active
created: 2026-05-15
origin: .context/compound-engineering/todos/015-complete-p1-enable-aerodrome-v2-explicit-factory-router.md
todo_id: 015
---

# Fame Swap Aerodrome V2 Explicit Factory Plan

## Problem Frame

The deployed Base `FameRouter` supports `VenueFamily.AerodromeV2 = 7` with a distinct four-field Aerodrome V2 route payload. The app still models `aerodrome-v2-usdc-weth` as a blocked `solidly` pool, which would encode the old three-field Solidly route and keep the pool out of executable route search.

This work enables only the proven Aerodrome V2 USDC/WETH volatile pool from the origin todo. Migrated Slipstream pools remain blocked and out of scope.

## Requirements Trace

- Represent Aerodrome V2 pools with `pool`, `stable`, and explicit `factory`.
- Encode `VenueFamily.AerodromeV2 = 7`.
- Encode Aerodrome V2 payload routes with `from`, `to`, `stable`, `factory`, and top-level `deadline`.
- Preserve Solidly three-field route payloads.
- Keep diagnostics and quote evidence distinct between Solidly and Aerodrome V2.
- Keep the active Base FameRouter address at `0xAdefa5860389E8936ebf2977e1Fb4a365aA39636`.
- Do not enable migrated Slipstream pools.

## Implementation Units

### 1. Venue and Artifact Schema

Files:
- `src/features/fame-swap/router/types.ts`
- `src/features/fame-swap/solver/artifactSchema.ts`
- `src/features/fame-swap/solver/poolUniverse.ts`
- `src/features/fame-swap/artifacts/base-v1-pools.json`
- `src/features/fame-swap/artifacts/manifest.ts`

Approach:
- Add `AerodromeV2` to venue family ordinals at `7`.
- Add a distinct `aerodrome-v2` pool venue type requiring `pool`, `stable`, `factory`, and `feeBps`.
- Convert `aerodrome-v2-usdc-weth` from blocked Solidly to enabled Aerodrome V2 using the origin constants.
- Add the Aerodrome router target to required venue targets.
- Preserve `slipstream-usdc-weth-migrating-50` as blocked.

Test scenarios:
- Pool universe exposes `aerodrome-v2-usdc-weth` as `AerodromeV2`, manifest-ready, and factory-bearing.
- Existing Solidly pools still parse and expose Solidly venue metadata.
- The pool artifact hash expectation is updated only to match the reviewed artifact change.

### 2. Payload Encoding and Materialization

Files:
- `src/features/fame-swap/router/buildLegPayload.ts`
- `src/features/fame-swap/router/payloads.ts`
- `src/features/fame-swap/router/encodeRoute.test.ts`
- `src/features/fame-swap/solver/materializeRoute.test.ts`

Approach:
- Add an Aerodrome V2 payload ABI separate from Solidly.
- Encode Aerodrome V2 route hops as `from`, `to`, `stable`, `factory`; keep `deadline` at the payload level.
- Patch materialized Aerodrome V2 payload deadlines while leaving factory and route hops unchanged.
- Add tests that decode Aerodrome V2 with the four-field ABI and verify Solidly still decodes only with the three-field ABI.

Test scenarios:
- A generated Aerodrome V2 leg has ordinal `7`.
- Aerodrome V2 route data decodes with `factory`.
- Solidly route data remains three-field and has no `factory`.

### 3. Quote Path and Diagnostics

Files:
- `src/features/fame-swap/solver/quotes/liveAdapters.ts`
- `src/features/fame-swap/solver/quotes/liveAdapters.test.ts`
- `src/features/fame-swap/solver/amountSolver.test.ts`

Approach:
- Route Aerodrome V2 live quotes through pool `getAmountOut` plus reserve evidence for volatile pools.
- Use Aerodrome-specific evidence and active-liquidity diagnostic text.
- Add a solver test that prefers the Aerodrome V2 USDC/WETH connector and materializes the route with the new venue family.

Test scenarios:
- Live adapter reads the Aerodrome V2 pool, not the Solidly router, and emits Aerodrome-specific evidence.
- USDC to FAME can quote through Aerodrome V2 USDC/WETH when quote evidence prefers that connector.
- Existing Solidly quote evidence still says Solidly and still uses the Solidly pool path.

## Verification

Run focused commands under `doppler run --`:
- `bun test src/features/fame-swap/router/encodeRoute.test.ts`
- `bun test src/features/fame-swap/solver/poolUniverse.test.ts src/features/fame-swap/solver/materializeRoute.test.ts`
- `bun test src/features/fame-swap/solver/quotes/liveAdapters.test.ts src/features/fame-swap/solver/amountSolver.test.ts`
- Focused FAME swap suite if the above passes.

Then update the 015 todo work log, mark acceptance criteria complete only after the evidence above is real, and run CE review against the actual diff.
