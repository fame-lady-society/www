---
mode: headless
scope: todo-002-pinned-archive-rpc
status: complete
---

# Code Review: Todo 002 Pinned Archive RPC Validation

## Review Scope

- `scripts/fame-swap-fork-smoke.ts`
- `docs/fame-swap-fork-validation.md`
- `docs/plans/2026-05-14-004-fame-swap-pinned-archive-rpc-validation-plan.md`

## P1/P2 Findings

None remaining after fixes.

## Fixes Applied During Review

- Added archive-friendly Anvil fork defaults: 120s upstream timeout, 8 retries, and 1s fork retry backoff.
- Added environment overrides for provider-specific debugging: `FAME_SWAP_ANVIL_FORK_TIMEOUT_MS`, `FAME_SWAP_ANVIL_FORK_RETRIES`, and `FAME_SWAP_ANVIL_FORK_RETRY_BACKOFF_MS`.
- Documented the exact pinned archive validation command and outcome.

## Verification

- `doppler run -- bun run fame-swap:fork-smoke` passed with `FAME_SWAP_FORK_BLOCK` unset and `FAME_SWAP_ALLOW_RPC_URL_PROCESS_ARG` unset.
- The successful run used the safe loopback RPC proxy, forked pinned Base block `45884844`, deployed a local router, and passed the six default fork cases with quote context `fork:8453:45884855`.
- `./node_modules/.bin/prettier --check scripts/fame-swap-fork-smoke.ts docs/fame-swap-fork-validation.md docs/plans/2026-05-14-004-fame-swap-pinned-archive-rpc-validation-plan.md` passed.
- `yarn lint --file scripts/fame-swap-fork-smoke.ts` passed.
- `git diff --check -- scripts/fame-swap-fork-smoke.ts docs/fame-swap-fork-validation.md docs/plans/2026-05-14-004-fame-swap-pinned-archive-rpc-validation-plan.md` passed.
