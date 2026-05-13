---
date: 2026-05-12
topic: fame-swap-router-solver-www
origin: docs/ideation/2026-05-12-fame-swap-router-solver-ideation.md
status: ready-for-planning
---

# FAME Swap Router Solver Requirements

## Problem Frame

Fame Lady Society needs an owned FAME swap surface at `/fame/swap` that consumes the new multi-leg `FameRouter` safely instead of relying only on external swap links or letting React components invent route encoding. The current operational pain is that route correctness now depends on FAME-specific router artifacts, fee/minimum policy, ETH/WETH handling, and fork evidence that generic external links cannot express or validate.

The first version is a production-shaped, fork-first beta surface. It may be publicly discoverable, but live swap submission must remain fail-closed until live readiness gates pass. Until then, `/fame/swap` should explain why router execution is unavailable and preserve a safer fallback path to existing external swap options rather than claiming to replace them.

## Requirements

**Route Capability And Artifact Contract**
- R1. `/fame/swap` must be the canonical owned FAME swap beta page and must compose a reusable FAME swap widget that can later be embedded in other FAME surfaces.
- R2. The swap experience must treat the pinned contract repo route artifacts, including the gap matrix, parity vectors, route hashes, fork evidence, and capability metadata, as the source of truth for supported directions and schema compatibility.
- R3. The experience must support FAME <-> USDC, FAME <-> WETH, and FAME <-> native ETH directions only when the corresponding artifact row is generated, executable, fork-tested, and compatible with the configured schema and router.
- R4. Native ETH and WETH must remain distinct in labels, route selection, approvals, and transaction value. The UI must never silently substitute one for the other.
- R5. Split and split-then-merge routes must be representable in solver output and UI diagnostics even if the default compact display summarizes them.
- R21. Artifact provenance must be explicit: the implementation must pin the artifact source commit or package version, record a snapshot hash or manifest hash in `www`, verify expected route hashes and parity vectors in tests, and fail closed when the artifact source or hash does not match the approved manifest.

**Solver And Quote Boundary**
- R6. Swap route construction must live behind a typed solver/quote boundary rather than inside React components.
- R7. Quote output must include both human-facing data and exact transaction data: input token, output token, amount in, estimated output, final post-fee minimum, route hash, route artifact id, approval requirement, call value, warnings, and the exact route argument for `executeRoute`.
- R8. Slippage and minimum-output policy must be explicit, testable, and based on the router's per-leg minimums plus final `minAmountOutAfterFee`; user-facing minimums must be post-fee.
- R9. The first implementation may use pinned artifacts and deterministic fixture quotes before live market quote ranking, but it must make stale or unsupported quote status visible rather than presenting estimated amounts as live market truth.
- R22. Executable v1 swaps must either be restricted to artifact-supported exact fixture amounts, or must recompute the route `amountIn`, per-leg minimums, final post-fee minimum, call value, and ABI payload for each user-entered amount through a validated quote or simulation path before enabling submission.
- R23. Approval transactions must identify spender, token, chain, and allowance amount before submission, and must default to the minimum practical allowance for the quoted input amount. Unlimited approval is out of scope unless explicitly approved in a later requirements update.

**Widget Product Behavior**
- R10. The widget must support disconnected, wrong-chain, amount-entry, unsupported-route, stale-artifact, approval-needed, ready, submitting, confirmed, and reverted states.
- R11. The primary UI must be usable for ordinary users without requiring route diagnostics, while advanced route details must be available for developers and reviewers.
- R12. The widget must expose a compact/full mode boundary so `/fame/swap` can use the full version while future embeds can use a smaller surface.
- R13. The UI must present approval and native-value requirements clearly before submission.
- R24. Each widget state must define the visible status message, enabled controls, primary CTA, disabled fields, recovery action, and diagnostics visibility before implementation begins.
- R25. The core flow must proceed from token selection and amount entry to quote evaluation, approval when needed, swap submission, confirmation, and retry/cancel recovery. Wrong-chain, unsupported-route, stale-artifact, insufficient-readiness, and reverted paths must have explicit exits.
- R26. Full mode must keep token inputs, quote summary, fee/minimum summary, approval/native value summary, primary CTA, transaction status, and route diagnostics available. Compact mode may collapse diagnostics and secondary route details, but critical warnings, approval requirements, and final post-fee minimum must remain visible.
- R27. The widget must be mobile-first and accessible: controls need usable touch targets, keyboard navigation, clear focus movement through wallet and transaction states, and screen-reader labels for token, amount, approval, quote, warning, and status controls.

**Fork-First Validation**
- R14. The implementation must include a no-live-market validation path that can run against an Anvil Base fork using RPC secrets from Doppler or the local secret manager, without committing or printing private RPC URLs.
- R15. Tests must prove that `www` encodes route structs compatibly with the contract repo parity vectors before relying on any UI-level success signal.
- R16. The fork validation path must be able to point `www` at a local or deployed router address and deterministic route artifacts.
- R17. Live swaps must fail closed until router address, schema version, artifact snapshot, route capabilities, fee ppm, enabled venue families, enabled venue targets, and required V4 hook-data hashes match the expected configuration.
- R28. Fork validation must provision or impersonate funded accounts for every supported input asset: FAME, USDC, WETH, and native ETH. The funded wallet strategy must be documented for UI and integration tests.
- R29. Pinned fork evidence is not enough for live submission. Live mode must require current Base validation or bounded fresh simulation, with an explicit freshness policy for artifact snapshots, route support, and quote estimates.

**TypeScript And Integration Quality**
- R18. New TypeScript must use expressive types for router tokens, route legs, artifacts, quote results, widget states, and transaction inputs without `as any` or `as unknown`.
- R19. Public configuration such as router address, schema version, fixture snapshot, chain id, and public RPC aliases may be committed or exposed through `NEXT_PUBLIC_*`; private RPC URLs and signer material must stay in Doppler or local secrets.
- R20. The implementation must avoid deprecated GraphQL integrations and prefer existing wagmi/viem patterns in this repo.

## Success Criteria

- `/fame/swap` renders a polished FAME swap beta experience that distinguishes FAME, USDC, WETH, and native ETH, and can be reused as a widget.
- The solver/quote boundary returns a fully typed quote result containing display data and the exact router transaction payload.
- ABI parity tests compare `www` route encoding against the pinned parity-vector artifact selected for v1. Direct reads from `../fame-contracts` are allowed only for artifact sync or local verification when the sibling checkout is present.
- Route support comes from the pinned gap-matrix artifact and fails closed when artifacts, schema, router config, or live-readiness evidence are stale or unsupported.
- Relevant tests pass locally without using live market transactions.
- The final diff contains no `as any` or `as unknown` in new TypeScript.

## Scope Boundaries

- Do not build an onchain solver.
- Do not use an external aggregator API as the primary route source.
- Do not bypass `FameRouter` by submitting raw Universal Router calls from the UI.
- Do not hide the ETH/WETH distinction.
- Do not require live production swaps as the primary QA loop.
- Do not present fixture quotes as arbitrary live-user quotes.
- Do not migrate the project to a monorepo or package manager as part of this work.
- Do not add new GraphQL data dependencies.

## Key Decisions

- Build the page and widget fork-first, with public beta posture but fail-closed live submission: this lets the team validate real router behavior without live market risk while avoiding a false promise that the page has replaced external swap links before launch gates pass.
- Copy or pin the contract artifacts into `www` during planning unless a package contract already exists: this favors reproducible builds over implicit `../fame-contracts` runtime coupling.
- Keep quote construction in a typed service boundary: this keeps route correctness testable and prevents UI components from owning ABI details.
- Treat native ETH as `address(0)` and WETH as a separate ERC-20: this matches the router schema and current route evidence.
- Show split-route details behind developer diagnostics in v1: ordinary users need confidence and clarity, while developers still need the full route path.
- Default approvals to exact quoted input amounts: this minimizes token exposure while the router and artifact pipeline are still moving toward launch.

## Dependencies / Assumptions

- The contract repo at `../fame-contracts` contains the router artifacts and parity vectors referenced by the ideation document.
- The current route gap matrix, as one of the contract artifacts, includes executable, generated, fork-tested rows for FAME <-> USDC, FAME <-> WETH, and FAME <-> native ETH at pinned Base block `45884844`.
- A live `FameRouter` address may not be available yet, so local/fork config must support a placeholder or fork-deployed address while failing closed for live mode.
- Doppler-backed RPC access may be required for fork tests, but private values must not be committed or echoed in logs.

## Outstanding Questions

### Resolve Before Planning

None.

### Deferred to Planning

- [Affects R2, R15][Technical] Decide the artifact sync mechanism for v1: copied fixtures in `www`, direct relative import from `../fame-contracts`, or a package-style boundary.
- [Affects R6, R7][Technical] Decide whether quote generation is client-only, a Next API route, or a shared pure library with both entry points.
- [Affects R14, R16][Needs research] Determine the smallest reliable fork harness that works with this Next.js app and local router deployment.
- [Affects R17][Technical] Decide the exact router ABI source: generated wagmi output including `FameRouter.sol/**` or a minimal local ABI.
- [Affects R22, R29][Technical] Decide whether v1 uses exact fixture-only executable swaps, fork simulation for user-entered amounts, or live quote recomputation before submission.

## Next Steps

-> /ce:plan for structured implementation planning.
