---
title: "chore: Validate FAME swap pinned archive RPC path"
type: chore
status: complete
date: 2026-05-14
source_todo: .context/compound-engineering/todos/002-ready-p2-validate-fame-swap-pinned-archive-rpc-path.md
---

# chore: Validate FAME Swap Pinned Archive RPC Path

## Overview

Prove `bun run fame-swap:fork-smoke` works at the manifest-pinned Base block with an archive-capable RPC. The successful path must not require exposing the upstream RPC URL in Anvil process arguments unless that exposure is explicitly accepted for local debugging.

## Requirements Trace

- Todo `002`: pinned fork smoke passes with `FAME_SWAP_FORK_BLOCK` unset.
- Todo `002`: the passing command uses a minimal Doppler config or documented secret mapping.
- Todo `002`: the command does not require `FAME_SWAP_ALLOW_RPC_URL_PROCESS_ARG=1` unless explicitly accepted for local debugging.
- Todo `002`: operator docs include the exact verified command.

## Current-State Findings

- `anvil` and `forge` are installed locally.
- The sibling `../fame-contracts` repo and `DeployFameRouter.s.sol` script are present.
- No `BASE_RPC_URL` or `NEXT_PUBLIC_BASE_RPC_URL_1` is configured in this shell.
- No checked-in `.doppler.yaml` / `.doppler.yml` was found in this repo.
- `docs/fame-swap-fork-validation.md` already documents the default pinned fork command and warns that `FAME_SWAP_FORK_BLOCK=latest` is exploratory only.

## Scope Boundaries

- Do not commit or print RPC URLs or Doppler secret values.
- Do not mark this todo complete from latest-block validation.
- Do not set `FAME_SWAP_ALLOW_RPC_URL_PROCESS_ARG=1` for the primary acceptance path unless loopback proxy failure is separately documented and accepted.
- Do not change fork harness behavior unless validation reveals a local harness bug independent of provider archive support.

## Implementation Units

- [x] **Unit 1: Detect Secret/Config Availability**

**Approach:**

- Check whether the current shell has `BASE_RPC_URL` or `NEXT_PUBLIC_BASE_RPC_URL_1`.
- Check whether Doppler can provide a Base RPC value without printing it.
- If no archive RPC value is available, record the blocker and leave the todo ready rather than complete.

- [x] **Unit 2: Run Pinned Fork Smoke Through Safe RPC Path**

**Approach:**

- Run `bun run fame-swap:fork-smoke` with `FAME_SWAP_FORK_BLOCK` unset and `FAME_SWAP_ALLOW_RPC_URL_PROCESS_ARG` unset.
- Prefer `BASE_RPC_URL` over `NEXT_PUBLIC_BASE_RPC_URL_1`.
- Confirm output reaches protected-route simulation for the default representative corpus.
- Record the pinned block, selected command, and pass/fail summary without logging the RPC URL.

- [x] **Unit 3: Document Exact Verified Command**

**Approach:**

- Update `docs/fame-swap-fork-validation.md` with the exact verified command and secret mapping.
- If validation is blocked by missing archive RPC credentials, document the required command shape without marking the todo complete.

- [x] **Unit 4: Review, Verify, And Close Todo**

**Approach:**

- Run a review pass on any docs or harness changes.
- Mark the todo complete only if the pinned fork smoke passed.

## Verification Plan

- `bun run fame-swap:fork-smoke` with `BASE_RPC_URL` set to an archive-capable Base RPC and `FAME_SWAP_FORK_BLOCK` unset.
- `git diff --check -- docs/fame-swap-fork-validation.md docs/plans/2026-05-14-004-fame-swap-pinned-archive-rpc-validation-plan.md`

## Risks

| Risk                                                    | Likelihood | Impact | Mitigation                                                                                      |
| ------------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------- |
| No archive RPC credentials are available in this shell  | High       | Medium | Record blocker, do not mark todo complete, and leave exact safe command for operator execution. |
| Provider supports latest state but not the pinned block | Medium     | Medium | Keep latest validation separate and fail this todo until archive support is proven.             |
| Loopback proxy stalls with the provider                 | Medium     | Medium | Treat process-arg bypass as a separate local-debug path unless explicitly accepted.             |
| Secret-bearing URL leaks into logs                      | Low        | High   | Use environment variables only and avoid echoing secret values.                                 |

## Completion Notes

- Confirmed `anvil`, `forge`, and sibling `../fame-contracts` deploy scripts are available locally.
- Doppler API was unavailable in the sandbox, but the local Doppler fallback file supplied `NEXT_PUBLIC_BASE_RPC_URL_1` without printing the value.
- Initial sandbox run was blocked by loopback binding restrictions; escalated run reached Anvil and exposed a 45s upstream archive timeout.
- Added Anvil fork timeout/retry defaults and environment overrides to `scripts/fame-swap-fork-smoke.ts`.
- Verified `doppler run -- bun run fame-swap:fork-smoke` with `FAME_SWAP_FORK_BLOCK` unset and `FAME_SWAP_ALLOW_RPC_URL_PROCESS_ARG` unset.
- The passing run used the loopback proxy, forked pinned Base block `45884844`, deployed local router `0x58597381dfe7d925014cdfbc264bc928a2d5929d`, and passed the six default cases with quote context `fork:8453:45884855`.
- Updated `docs/fame-swap-fork-validation.md` with the exact verified command and timeout/retry knobs.
- Verification passed with Prettier, lint, and diff whitespace checks.
