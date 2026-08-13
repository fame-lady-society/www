---
title: "feat: Direct sponsored Irys uploads for FAME Creator Portal"
type: feat
status: active
date: 2026-08-13
origin: docs/brainstorms/2026-08-13-fame-creator-direct-irys-uploads-requirements.md
---

# Direct Sponsored Irys Uploads for the FAME Creator Portal

## Summary

Replace the Creator Portal's multipart image upload with one direct browser-to-Irys flow for `art`, `end`, `release`, and `update`. The creator's wallet signs the Irys data item, while the FLS sponsor pays through a short-lived, tightly capped Irys balance approval. The server receives only the completed image URI and bounded operation data, verifies the Irys transaction, and sponsors the small metadata upload.

The trusted image ceiling is 12 MiB (`12_582_912` bytes), matching the creator-feedback decision. The Vercel Function's 4.5 MB request limit is therefore avoided for every image, not only for large files.

## Problem Frame and Scope

The current Creator Portal sends the image through `/api/fame/creator/metadata` as multipart form data. Vercel can reject a request above 4.5 MB before the route runs, even though the existing UI and route intend to support larger images. The image's canonical destination is Irys, so the browser should upload there directly and hand the resulting URI to the application.

This plan covers the complete image-to-metadata flow, explicit wallet-signature UX, sponsor authorization, Irys transaction verification, metadata-only retry, and release-contention recovery. It does not add an object-storage intermediary, image processing, moderation, batch uploads, cross-device recovery, or deletion of abandoned immutable Irys images (see origin: `docs/brainstorms/2026-08-13-fame-creator-direct-irys-uploads-requirements.md`).

## Requirements Traceability

| Requirements | Plan coverage |
| --- | --- |
| R1–R4: authenticated role authorization, bounded sponsorship, server-only sponsor key, fail-closed validation | U2 authorization capability and approval; U3 finalization verification |
| R5–R9: direct upload for every mode, explicit signature, distinct states, cancellation handling, 12 MiB boundary | U1 shared policy; U4 browser transport; U5 portal state and UI |
| R10–R12: URI-only server request, operation/content verification, exact URI preservation | U3 finalization and Irys verifier |
| R13–R14: metadata-only retry and existing Creator Portal result contract | U5 retry state; U6 release recovery and mode regression |

## Actors and Flows Carried Forward

- The Creator authenticates through the existing SIWE session and must satisfy the existing mode-specific `CreatorArtistMagic` role check.
- The Creator Portal validates the file, requests sponsorship authorization, explains the wallet signature, uploads through the existing browser Irys adapter, and keeps a successful image URI for retry.
- The FLS upload service signs no creator image data and never exposes its private key. It authorizes the operation, prepares the sponsor allowance, verifies the completed transaction, and publishes metadata.
- The creator wallet signs the Irys data item. The sponsor pays the Irys upload and the server pays for metadata.
- Irys remains the canonical image destination; the exact returned `https://gateway.irys.xyz/<transaction-id>` string is preserved in metadata.

The end-to-end flow is:

```mermaid
sequenceDiagram
    participant C as Creator Portal
    participant W as Creator Wallet
    participant A as FLS Authorization API
    participant S as Sponsor Irys Account
    participant I as Irys
    participant M as Metadata API

    C->>A: JSON: address, token, mode, type, size, hash
    A->>A: SIWE session + Base role + policy checks
    A->>S: fund if needed; create expiring approval for creator
    A-->>C: signed capability, operation id, sponsor payer address
    C->>W: explicit "Approve sponsored image upload" action
    W-->>C: creator signs Irys data item (no gas-funded sponsor transaction)
    C->>I: uploadFile(file, paidBy: sponsor, signed operation tags)
    I-->>C: canonical image URI
    C->>M: JSON: image URI, capability, bounded context
    M->>M: re-check session, role, capability, Irys owner/tags/bytes/hash
    M->>I: sponsor metadata upload
    I-->>M: metadata URI
    M-->>C: exact image URI + metadata URI

    Note over C,M: If metadata fails, retain the image URI and retry finalization only.
    Note over A,I: Native Irys approval is a capped payment allowance, not a file ACL.
```

## Key Technical Decisions

### 1. Use one direct browser path for all Creator Portal images

The four image-producing modes use the same browser transport regardless of file size. This removes the Vercel-size branch and ensures that a future limit change does not create two behavioral contracts. The server metadata route no longer accepts an image `File` or any multipart image body.

### 2. Layer application capability over native Irys approval

The authorization response is a signed, stateless application capability containing:

- creator wallet address and Base chain id;
- token id and upload mode;
- allowed MIME type and exact byte length;
- client-declared content hash, operation nonce, issue time, and expiry;
- purpose (`image-upload` or `metadata-finalization`), sponsor address, and approved amount where applicable.

The capability is signed with the dedicated `CREATOR_UPLOAD_CAPABILITY_SECRET` and verified on both authorization-derived actions and finalization. A small Vercel KV journal provides the durable operation lock, one-active-upload-per-creator reservation, finalization lease, and idempotent result record.

Irys balance approvals remain a separate payment primitive. They are tied to payer, approved wallet, token, and Irys node, but not to a token id, mode, file type, or individual file. The plan therefore uses a five-minute expiry, an amount priced for one declared image plus bounded tag/header overhead and the existing 10% buffer, and revokes the approval after completion when practical. The application capability and post-upload verification enforce the operation binding; the native allowance limits the worst-case spend but cannot by itself provide a cryptographic one-file ACL.

### 3. Verify the completed Irys transaction before metadata publication

Gateway-host validation alone is insufficient. Before generating metadata, the server will:

1. Parse the exact Irys transaction id from the canonical URI.
2. Read the transaction owner and signed tags through the Irys transaction/query API.
3. Require the owner to match the authenticated creator and the operation, token, mode, MIME type, declared byte length, and content hash tags to match the capability.
4. Fetch the bounded Irys data payload with a timeout, compute the content hash independently, and compare the actual byte length and hash to the capability.
5. Fail closed on missing, mismatched, oversized, unsupported, or unavailable content.

This read-back does not route the upload through Vercel: the browser still sends the image directly to Irys, and the server only performs a bounded verification read after receiving the URI.

Finalization must also be idempotent by operation id. Before creating metadata, the server will look for an already published metadata transaction carrying the same operation id and verified image URI; a replay returns that existing metadata URI instead of spending the sponsor allowance again. If the Irys index is not yet consistent, the route will fail or retry safely rather than publish an untagged duplicate.

### 4. Make metadata finalization independently retryable

The browser stores the image URI and its operation proof as soon as Irys returns a transaction id. A metadata failure leaves that state visible and exposes a metadata-only retry. A retry within the capability lifetime reuses the capability. If it expires, the portal requests a new short-lived finalization capability bound to the existing image URI and original operation proof; it never asks the wallet to sign or uploads the image again.

Release contention is the same recovery pattern with a new token id: the server validates the original release operation and image provenance, then issues a new finalization capability for the advanced release boundary. Existing single-flight submission and transaction-receipt reconciliation remain in force.

### 5. Stay on the existing Irys and wallet packages

Reuse `@irys/web-upload`, `WebBaseEth`, and `ViemV2Adapter` in `src/service/irys_client.ts`, and reuse the Node `BaseEth` uploader for sponsor funding, approvals, verification queries, and metadata. The browser must pass the sponsor payer through the nested Irys upload option (`upload.paidBy`) and must never call `fund()` or receive the sponsor private key. No dependency change is expected.

The current SDK buffers a `File` in browser memory and does not need chunked-upload work for a 12 MiB ceiling. Do not add resumable chunking in this scope; retain the immutable image URI instead.

## Shared Policy and Security Contract

- `MAX_CREATOR_IMAGE_BYTES` is one shared constant: `12_582_912`.
- Supported types remain `image/gif`, `image/jpeg`, `image/png`, and `image/webp`.
- The browser check is only UX; the authorization and finalization checks are trusted boundaries.
- Content identity uses the existing `viem` Keccak-256 convention: lowercase hexadecimal without the `0x` prefix, computed independently by the server before metadata publication.
- The authenticated address must equal the requested address at authorization and finalization.
- The server re-reads Base `rolesOf` and applies the existing mode matrix at both boundaries.
- Capability signatures, expiry, operation purpose, and all bound fields are verified before sponsor use or metadata generation.
- Metadata finalization is replay-resistant: repeated finalization returns an existing verified result or fails closed while the Irys index catches up; it does not create unbounded duplicate metadata uploads. Image spend remains bounded by the one-file-priced, five-minute approval, because native Irys approvals are not single-use.
- Image operation tags are signed by the creator but never trusted without server-side transaction and payload verification.
- The exact Irys URI is used in `createCreatorMetadataJson`; it is not reconstructed, normalized, or rewritten through another gateway.
- Logs must contain operation id and outcome, not capability contents, private keys, image bytes, or signed hashes beyond what is needed for diagnosis.

## Implementation Units

### U1. Centralize the Creator image contract

**Files:**

- Modify `src/features/fame/creatorMetadata.ts`.
- Add `src/features/fame/creatorMetadata.test.ts`.
- Update consumers currently duplicating the size/type constants, including `src/app/fame/creator/[address]/SponsoredCreatorMetadataUploader.tsx` and the metadata API.

**Work:**

- Export the 12 MiB byte ceiling, supported MIME set, and pure image-descriptor validation helpers.
- Keep the existing mode list and role matrix as the shared authorization vocabulary.
- Provide a user-facing size message that says 12 MB while retaining the exact byte boundary in code and tests.

**Tests:**

- Accept each supported MIME type and reject unsupported types.
- Accept a positive file exactly at `12_582_912` bytes and reject `12_582_913` bytes.
- Reject zero-byte files and malformed descriptors.
- Preserve the existing `art`, `end`, `release`, and `update` role matrix.

### U2. Issue signed operation capabilities and sponsor approvals

**Files:**

- Add `src/service/creator_upload_authorization.ts`.
- Add `src/service/creator_upload_authorization.test.ts`.
- Add `src/app/api/fame/creator/metadata/authorize/route.ts`.
- Add `src/app/api/fame/creator/metadata/authorize/route.test.ts`.
- Modify `src/service/irys_sponsored_upload.ts` and its test.

**Work:**

- Define the versioned capability payload and HMAC signing/verification helpers using the dedicated `CREATOR_UPLOAD_CAPABILITY_SECRET`, with the verified SIWE cookie represented by a session digest.
- Keep authorization input JSON small: address, token id, mode, type, size, hash, and an optional existing image URI/proof for metadata-only recovery.
- Require SIWE, address equality, Base role permission, shared MIME/size policy, and valid token/mode before preparing sponsorship.
- Extend the server uploader contract with the approval address and approval create/revoke operations. Ensure the sponsor has enough Irys balance using a bounded price estimate that includes file bytes, the signed tag/header allowance, and the existing 10% price buffer.
- Create an approval for the authenticated creator only, with a five-minute expiry and no client access to the sponsor signer. Return the signed capability and sponsor payer address, never the private key.
- Support a metadata-only reauthorization path that binds a refreshed finalization capability to an already verified image operation without creating a new image approval.
- Include operation-id idempotency in finalization and tag every image/metadata transaction with it. Use the durable KV journal plus verified Irys operation tags, while treating the native approval's bounded replay allowance as a documented residual limitation rather than claiming single-use semantics.

**Tests:**

- Unauthenticated, address-mismatched, wrong-role, invalid-mode, unsupported-type, zero-byte, over-12-MiB, and invalid-hash requests fail before sponsor work.
- Capability tampering, wrong address, token, mode, type, size, purpose, operation id, or expiry fails verification.
- Sponsor balance exhaustion fails without a partial or unrestricted approval.
- A successful authorization returns a bounded capability, operation id, sponsor address, and expiry; private-key material is absent.
- Approval creation uses the creator wallet as the approved address, the bounded amount, and the configured expiry; revocation is attempted after completion.

### U3. Convert metadata finalization to URI-only verified requests

**Files:**

- Add `src/service/irys_creator_upload_verifier.ts` and its test.
- Modify `src/app/api/fame/creator/metadata/route.ts`.
- Modify `src/app/api/fame/creator/metadata/route.test.ts`.

**Work:**

- Replace multipart parsing and server-side image upload with bounded JSON containing the image URI, operation capability/proof, and metadata context.
- Reject image files, multipart image bodies, arbitrary gateway URLs, missing operation proof, and expired or mismatched capabilities.
- Implement the Irys owner/tag lookup plus bounded payload fetch described above, with a timeout and maximum read size. Compare actual bytes/hash/type/operation tags to the authorization.
- Query for an existing metadata result by operation id before uploading; return it when its image URI and operation tags verify, and do not publish a duplicate while the index is indeterminate.
- Re-check SIWE and mode-specific roles before generating metadata.
- Continue using the existing server-sponsor path for the small JSON metadata upload and return both exact URIs.
- Preserve the release-only existing-image recovery behavior as a verified metadata-only operation, generalized enough for the shared retry path.

**Tests:**

- JSON finalization succeeds for a verified image and metadata contains the exact image URI byte-for-byte.
- The route rejects multipart image input, invalid URI shape, wrong Irys owner, missing or mismatched operation tags, wrong type/size/hash, expired capability, and an image above the 12 MiB trusted ceiling.
- Session or role changes between image upload and finalization fail closed.
- Metadata sponsorship failure does not invoke image upload and leaves the image proof available to a retry caller.
- A metadata-only retry publishes a new metadata URI without a second image upload.

### U4. Add the direct browser Irys transport

**Files:**

- Add `src/service/creator_irys_upload.ts` and its test.
- Reuse `src/service/irys_client.ts`; modify it only if a small Base/account assertion or test seam is needed.

**Work:**

- Hash and validate the selected `File` before authorization.
- Rebuild the browser uploader when the connected wallet account or chain changes; require the connected account to match the SIWE address and use the Base Irys adapter for the sponsored path.
- Call `uploadFile` with `upload: { paidBy: sponsorAddress }` and signed operation tags for application id, operation id, creator, token, mode, MIME type, byte length, and content hash.
- Return the exact canonical Irys URI and operation proof to the UI.
- Do not call browser `fund()`, create a sponsor balance, or send an image through a Next route.

**Tests:**

- The upload options place `paidBy` under the nested Irys `upload` field.
- Required tags carry the authorized operation values and the returned URI is preserved exactly.
- Account mismatch, unsupported chain, signature rejection, and Irys upload failure stop before finalization.
- No browser path invokes sponsor funding.

### U5. Rework the shared Creator Portal uploader state and UI

**Files:**

- Modify `src/app/fame/creator/[address]/SponsoredCreatorMetadataUploader.tsx`.
- Add `src/app/fame/creator/[address]/sponsoredCreatorUploadState.ts` and its test.
- Update the uploader's shared request helpers and preserve the existing `onComplete` result contract for `MetadataSwap.tsx` and `ReleaseArtwork.tsx`.

**Work:**

- Model distinct states for idle, preparing authorization, switching/preparing Base, waiting for the creator signature, uploading to Irys, finalizing metadata, completed, cancelled/rejected, and failed.
- Keep the existing SIWE sign-in action separate from the Irys upload signature. Before invoking the wallet, show an explicit explanation that the creator is approving this image data, FLS pays Irys storage, and this is not a gas-funded sponsor transaction.
- Route the primary action through authorization, direct upload, and URI-only finalization. On wallet cancellation, provide a clear retry without metadata. On metadata failure, show the exact retained image URI/progress and a metadata-only retry button.
- Keep the component shared for all four image-producing modes and update copy from “Backend sponsors image and metadata upload” to the actual signature/direct-upload flow.

**Tests:**

- The pure state model covers every required state and valid transition.
- A rejected signature never calls finalization.
- A successful image followed by metadata failure retains the URI/proof; retry calls finalization only and does not call browser upload or wallet signing again.
- Completion returns both URIs to the existing mode consumers.
- The UI exposes the 12 MB limit, the explicit signature explanation, cancellation/error recovery, and separate image-upload versus metadata-finalization progress.

### U6. Preserve release contention and cross-mode behavior

**Files:**

- Modify `src/app/fame/creator/[address]/ReleaseArtwork.tsx` if needed for proof/capability handoff.
- Modify `src/app/fame/creator/[address]/releaseArtworkState.ts` if the frozen release record needs the image proof.
- Modify `src/app/fame/creator/[address]/releaseArtwork.test.ts`.
- Regression-check `src/app/fame/creator/[address]/MetadataSwap.tsx` and `src/app/fame/creator/[address]/CreatorPortal.tsx` without changing unrelated seams.

**Work:**

- Keep the successful image URI and operation proof in the frozen release state.
- When the release boundary advances, obtain a fresh metadata-only capability for the new token and reuse the exact existing image URI. Do not reopen the image signature or call the browser upload transport.
- Preserve single-flight release submission, receipt reconciliation, and the current user-facing contention recovery message.
- Verify `art`, `end`, `update`, and `release` all use the new direct flow and retain their current role rules.

**Tests:**

- Release contention regenerates metadata for the new boundary with no second image upload or signature.
- A receipt that is submitted but unknown still blocks duplicate release submission before any metadata recovery.
- Each mode reaches the shared uploader with the intended mode and role policy.
- The existing generated-metadata result wiring remains intact for art-pool, end-of-mint, update, and release callers.

## System-Wide Impact

| Surface | Impact and required behavior |
| --- | --- |
| Browser | Holds at most the selected 12 MiB file plus the Irys SDK buffer; invokes the existing wallet adapter for a typed data signature; never uploads image bytes to Vercel. |
| Wallet | May prompt for SIWE, Base network selection, and the creator's Irys data-item signature. The upload copy must distinguish the latter from a gas-funded transaction. |
| Next.js APIs | Add a small JSON authorization request and convert metadata finalization to small JSON. Both routes remain Node-side because they need server secret, Irys server SDK, and bounded verification fetches. |
| Sponsor | Continues to fund server metadata and now creates a narrowly priced, expiring approval for the creator image. Approval and funding failures are visible and fail closed. |
| Irys | Receives the image directly from the browser with operation tags and returns the canonical URI. The image is immutable and may remain orphaned if the creator abandons finalization. |
| Persistence | Vercel KV stores the short-lived operation journal and locks. Signed capabilities and Irys tags provide the operation handoff; client state retains retry data for the current portal session. |
| Operations | Add structured success/failure logging for authorization, approval, direct upload, verification, and metadata finalization without logging secrets or image content. Monitor sponsor balance and approval failures. |

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Native Irys approval is not file-bound | Use a five-minute expiry, exact one-image pricing plus bounded margin, server-issued operation capability, post-upload owner/tag/content verification, and revocation after completion where practical. Treat this as a residual protocol limitation rather than claiming stronger isolation. |
| Irys price changes or tag overhead exceed the allowance | Price content plus an explicit bounded overhead and retain the existing 10% buffer; fail before metadata if the upload cannot be verified or paid. Test atomic-unit arithmetic. |
| Creator changes wallet or chain between authorization and upload | Compare active wallet account to the SIWE address, require Base for the sponsored path, rebuild the uploader on changes, and reject mismatches before signing. |
| Metadata verification adds a second network read for a large image | Fetch only the exact Irys host, cap the response at 12 MiB plus one byte, use a timeout, and fail closed. The image never traverses the client-to-Vercel request path. |
| Metadata fails after immutable image upload | Retain the exact URI and operation proof; retry finalization only, refreshing a finalization capability if required. |
| Release boundary changes after image upload | Reauthorize metadata for the new release token from the verified existing image proof; preserve release single-flight and receipt reconciliation. |
| Browser memory or SDK behavior changes | Keep the 12 MiB ceiling, avoid forced chunking/resume scope, and include a browser verification for a file above 4.5 MB. |

## Acceptance Examples

| Origin example | Verification target |
| --- | --- |
| AE1 Normal upload | An authenticated authorized creator signs a valid PNG under 12 MiB; Irys receives the image directly and the metadata API receives only the URI/proof. |
| AE2 Large upload | A valid image over 4.5 MB and at or below 12 MiB completes without a request body containing image bytes reaching Vercel. |
| AE3 Signature rejection | Wallet rejection/cancellation stops before image finalization and exposes an actionable retry. |
| AE4 Metadata recovery | A successful image followed by metadata failure retains the URI and retries metadata without a second image upload or signature. |
| AE5 Invalid operation | Expired, mismatched, over-limit, unsupported, wrong-owner, or wrong-content proof prevents metadata publication. |
| AE6 Unauthorized creator | Missing mode permission is rejected by the server before sponsor authorization or wallet upload. |

## Verification and Handoff

Implementation should proceed in the unit order U1 → U2 → U3 → U4 → U5 → U6, keeping each boundary testable with injected session, role, sponsor, Irys query, and fetch dependencies. The implementation pass should run the focused `bun test` files as units land, then `yarn lint`, the full relevant test set, and a browser check of `/fame/creator` using a representative image above 4.5 MB and a metadata-failure retry path.

Before production release, verify in a staging environment that:

- the browser request trace contains no image POST to the Vercel origin;
- the wallet signature prompt is labeled by the wallet as a signature, not a gas-funded sponsor transaction;
- the resulting Irys image URI and metadata URI are both reachable and the metadata image field matches the exact returned URI;
- approval expiry, signature rejection, unsupported/oversized files, insufficient sponsor balance, and release contention fail or recover as specified.

No feature flag is planned. Deployment is the gate, consistent with the repository's project standards.

## Research and Existing Patterns

- [Vercel Function request-body limit](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions) — confirms the platform-level 4.5 MB limit and recommends direct-to-source uploads.
- [Irys browser uploads](https://docs.irys.xyz/build/d/irys-in-the-browser) — existing `WebUploader`/Ethereum/viem adapter pattern.
- [Irys balance approvals](https://docs.irys.xyz/build/d/features/balance-approvals) — sponsor-pays/user-signs flow, `paidBy`, and expiring approvals.
- [Irys chunked upload recovery](https://docs.irys.xyz/build/d/sdk/chunked-uploader/expired-uploads) — confirms resumability is a separate concern and remains outside the 12 MiB implementation.
- `src/app/fame/creator/[address]/SponsoredCreatorMetadataUploader.tsx` — shared current UI seam and duplicated 10 MiB policy.
- `src/app/api/fame/creator/metadata/route.ts` — current SIWE, role, exact URI recovery, and server-sponsored metadata patterns.
- `src/service/irys_client.ts` — existing browser `WebBaseEth`/Viem adapter.
- `src/service/irys_sponsored_upload.ts` — existing buffered pricing, sponsor funding, and Node payload normalization.
- `src/app/fame/creator/[address]/releaseArtworkState.ts` — existing immutable-image recovery and single-flight release pattern.
