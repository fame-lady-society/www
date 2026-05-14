# FAME Swap Fork Validation

The checked-in FAME swap route uses pinned route templates, arbitrary user amounts, and live router policy reads. Use the fork smoke test before promoting a router address into live public config.

## Command

```bash
BASE_RPC_URL=<base-rpc-url> \
bun run fame-swap:fork-smoke
```

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

If the loopback proxy is incompatible with an RPC provider during local debugging, `FAME_SWAP_ALLOW_RPC_URL_PROCESS_ARG=1` bypasses the proxy. Use that only on a trusted workstation because the RPC URL can then appear in local process listings.
