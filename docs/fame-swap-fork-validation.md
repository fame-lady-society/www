# FAME Swap Fork Validation

The checked-in FAME swap route uses pinned route templates, arbitrary user amounts, and live router policy reads. Use the fork smoke test before promoting a router address into live public config.

## Command

```bash
BASE_RPC_URL=<base-rpc-url> \
bun run fame-swap:fork-smoke
```

## Current-Route Release Gate

Before enabling app routing against a newly deployed FameRouter, run the production current-route gate against the deployed Base router address:

```bash
NEXT_PUBLIC_FAME_ROUTER_ADDRESS=0xAdefa5860389E8936ebf2977e1Fb4a365aA39636 \
doppler run -- bun run fame-swap:release-gate
```

`fame-swap:release-gate` reuses the production quote resolver and materialization path. It sets `FAME_SWAP_USE_CONFIGURED_ROUTER=1`, `FAME_SWAP_FORK_CASES=all`, and `FAME_SWAP_FORK_BLOCK=latest`, then simulates each corpus route through the exact `executeRoute` calldata on a current Base fork. Each route is quoted with live liquidity, near-term deadlines, quote-derived per-leg minimums, and a final slippage-protected minimum computed from a probe simulation.

Treat any nonzero exit as a release stop. The output names the failing corpus case, route artifact, route hash, selected pools, quote context, and simulation step so the operator can decide whether to retry due to RPC/fork instability or disable the affected route family.

Run the command through Doppler or an equivalent secret manager. Do not print RPC URLs, private keys, or API keys; the fork harness proxies the upstream RPC through a loopback URL before passing it to Anvil.

Verified pinned archive run on 2026-05-14:

```bash
doppler run -- bun run fame-swap:fork-smoke
```

That run used the default Doppler `fls` / `dev` secret context, with `NEXT_PUBLIC_BASE_RPC_URL_1` supplied by the local Doppler fallback file, `FAME_SWAP_FORK_BLOCK` unset, and `FAME_SWAP_ALLOW_RPC_URL_PROCESS_ARG` unset. The harness used the loopback RPC proxy, forked the manifest-pinned Base block `45884844`, deployed a local router, and passed the six default fork cases with quote context `fork:8453:45884855`.

To keep the fork/router alive for browser testing:

```bash
BASE_RPC_URL=<base-rpc-url> \
FAME_SWAP_FORK_BLOCK=latest \
FAME_SWAP_KEEP_FORK_ALIVE=1 \
bun run fame-swap:fork-smoke
```

The keep-alive mode prints `NEXT_PUBLIC_BASE_RPC_URL_1`, `NEXT_PUBLIC_FAME_ROUTER_ADDRESS`, and `NEXT_PUBLIC_FAME_SWAP_SLIPPAGE_BPS`. Start `yarn dev` in another shell with those values so `/fame/swap` targets the local fork router.

For a package command that only starts the fork and deploys the local router:

```bash
doppler run -- bun run fame-swap:fork
```

To also write a temporary `.env.local` while the fork is running:

```bash
doppler run -- bun run fame-swap:fork -- --write-env-local
```

The `.env.local` file is restored or removed when the fork script exits cleanly.

When the fork runs inside WSL and the browser or wallet runs on Windows, bind Anvil to all WSL interfaces:

```bash
doppler run -- bun run fame-swap:fork:wsl -- --write-env-local
```

That keeps the printed `NEXT_PUBLIC_BASE_RPC_URL_1` as a Windows-friendly localhost URL while Anvil listens on `0.0.0.0`. If Windows localhost forwarding is unavailable, pass the WSL IP explicitly:

```bash
doppler run -- bun run fame-swap:fork -- --write-env-local --wsl --public-host <wsl-ip>
```

`fame-swap:fork` and `fame-swap:local-dev` ignore any router address already present in Doppler or a Bun-loaded `.env.local` by default, so they always deploy a fresh local router into the fork. Set `FAME_SWAP_USE_CONFIGURED_ROUTER=1` to validate against a preconfigured router address instead.

For the one-command local development loop, let Doppler provide the normal app env and run:

```bash
doppler run -- bun run fame-swap:local-dev
```

That command starts the fork smoke in keep-alive mode, waits for the local router address, then starts `yarn dev` with the fork RPC and router address wired into the Next public env.

Use `doppler run -- bun run fame-swap:local-dev:wsl` for the same one-command loop with Anvil bound for Windows access from WSL.

`fame-swap:local-dev` defaults `FAME_SWAP_ALLOW_RPC_URL_PROCESS_ARG=1` because Anvil's fork proxy path can stall during local router deployment with some RPC providers. Use it only on a trusted workstation; set `FAME_SWAP_ALLOW_RPC_URL_PROCESS_ARG=0` to force the proxy path.

It also clears `.next` before starting the dev server so Next does not reuse stale client bundles with old `NEXT_PUBLIC_*` values. Set `FAME_SWAP_KEEP_NEXT_CACHE=1` to keep the existing Next cache.

When secrets are managed by Doppler, run the same command inside a minimal config that exposes only the Base RPC value needed for `BASE_RPC_URL`. The script does not forward the full Doppler environment to `anvil` or `forge`.

`NEXT_PUBLIC_FAME_ROUTER_ADDRESS` or `FAME_ROUTER_ADDRESS` is optional. When neither is set, the script deploys the sibling `../fame-contracts` `DeployFameRouter.s.sol` script into the local fork with the public anvil account, then validates and simulates against that local router.

`fame-swap:fork-smoke` defaults to representative release route families: `usdc-fame-five-dollars`, `fame-usdc-fixture`, `weth-fame-small-direct`, `fame-weth-fixture`, `eth-fame-fixture`, and `fame-eth-fixture`. Set `FAME_SWAP_FORK_CASES=all` for the full corpus, or a comma-separated case list for targeted route and pool stress checks.

`fame-swap:release-gate` always uses the full corpus against the configured router and latest fork state. Use the plain `fame-swap:fork-smoke` command for deterministic pinned-block fixture checks or local router deployment tests.

## Artifact Sync

The checked-in route artifacts are copied from the sibling contracts repo and pinned by `src/features/fame-swap/artifacts/manifest.ts`. To refresh them from the same source layout:

```bash
SOURCE=../fame-contracts/test/router/fixtures
cp "$SOURCE/base-v1-solver-routes.json" src/features/fame-swap/artifacts/base-v1-solver-routes.json
cp "$SOURCE/base-v1-route-gap-matrix.json" src/features/fame-swap/artifacts/base-v1-route-gap-matrix.json
cp "$SOURCE/base-v1-route-parity-vectors.json" src/features/fame-swap/artifacts/base-v1-route-parity-vectors.json
cp "$SOURCE/base-v1-pools.json" src/features/fame-swap/artifacts/base-v1-pools.json
```

After copying, update `manifest.ts` from `FameRouterSolverFixtureManifest.sol` in that same fixture directory, including the source commit, pinned Base block, route ids, JSON hashes, and imported-content hashes. The schema parser is the early shape gate; the manifest hashes remain the drift gate.

Run the artifact checks before using refreshed artifacts:

```bash
bun test src/features/fame-swap/solver/artifactSchema.test.ts src/features/fame-swap/router/encodeRoute.test.ts src/features/fame-swap/solver/poolUniverse.test.ts src/features/fame-swap/solver/quotes/snapshotAdapter.test.ts src/features/fame-swap/solver/readiness.test.ts
```

## What It Checks

- Starts local `anvil` forked from the manifest-pinned Base block. Set `FAME_SWAP_FORK_BLOCK=latest` only when using a non-archive RPC for exploratory validation; that path is nondeterministic and does not replace pinned-block validation.
- Verifies local solver route, gap matrix, and parity vector file hashes against the manifest.
- Reads router fee, venue family gates, venue target gates, and V4 hook-data gates from the configured router.
- Deploys a local router to the fork when no router address is configured.
- Quotes each selected corpus case through live fork liquidity adapters.
- Funds the public fork account for selected ERC20 inputs using fork-only state changes: WETH deposits, USDC balance storage discovery, and DN404 FAME packed balance storage.
- Approves exact ERC20 inputs when required.
- Simulates `executeRoute` once as a probe, computes the slippage-protected final minimum, then simulates the exact protected route that would be submitted.

The script exits non-zero if RPC, `anvil`, router config, readiness, or simulation fail. It proxies the upstream RPC through a local loopback URL so secret-bearing RPC URLs are not passed to `anvil` as command-line arguments, and it uses temporary Foundry cache/output directories for local router deployment.

Archive providers can be slower at the pinned block than at latest state. The harness starts Anvil with a 120s upstream fork timeout, 8 retries, and 1s initial fork retry backoff by default. Override those only for provider-specific debugging:

```bash
FAME_SWAP_ANVIL_FORK_TIMEOUT_MS=180000 \
FAME_SWAP_ANVIL_FORK_RETRIES=10 \
FAME_SWAP_ANVIL_FORK_RETRY_BACKOFF_MS=1000 \
BASE_RPC_URL=<base-archive-rpc-url> \
bun run fame-swap:fork-smoke
```

If the loopback proxy is incompatible with an RPC provider during local debugging, `FAME_SWAP_ALLOW_RPC_URL_PROCESS_ARG=1` bypasses the proxy. Use that only on a trusted workstation because the RPC URL can then appear in local process listings.
