---
date: 2026-08-13
topic: fame-creator-direct-irys-uploads
type: brainstorm
---

# FAME Creator Direct Irys Uploads

## Summary

Move every FAME Creator Portal image upload to a browser-to-Irys flow funded by the FLS sponsor. The creator explicitly signs each image upload, while the backend receives only the resulting image URI and generates the metadata. Metadata finalization can be retried without uploading the image again.

## Problem Frame

The Creator Portal currently sends the selected image through a Vercel Function as multipart form data. The UI and route allow images up to 12 MiB (12,582,912 bytes), but Vercel rejects request bodies above 4.5 MB before the existing sponsored Irys uploader runs.

This creates a size-dependent failure that is invisible to the Creator Portal flow. The image already belongs in Irys, so routing it through an intermediate object store would add storage, copying, and cleanup concerns without improving the canonical asset path.

## Key Decisions

- **Use one direct-to-Irys path for every image.** Small and large images receive the same behavior and avoid a Vercel-size branch.
- **Let the creator sign while the sponsor pays.** The creator does not need to fund storage, and the sponsor private key never enters the browser. The signature must be visible as an intentional upload authorization.
- **Separate image upload from metadata finalization.** The image URI becomes a retryable handoff so a metadata failure does not force a second image upload.
- **Preserve the returned Irys URI exactly.** The system does not rewrite the URI through another gateway.

## Actors

- A1. **Creator** — an authenticated wallet with the role required for the selected Creator Portal operation.
- A2. **Creator Portal** — validates the selection, explains the signature, launches the wallet prompt, displays progress, and retains retryable results.
- A3. **FLS upload service** — authorizes the operation, controls sponsored allowance, validates the completed image upload, and generates metadata.
- A4. **Creator wallet** — signs the Irys data item and does not submit a gas-funded storage transaction.
- A5. **Irys** — receives the image directly from the browser and returns the canonical asset URI.

## Key Flows

### F1. Authorize and sign an image upload

- **Trigger:** An authorized creator selects a supported image and starts an upload.
- **Actors:** A1, A2, A3, A4, A5.
- **Steps:** The portal validates the selection, obtains operation-scoped sponsorship authorization, explains that a wallet signature is required, and opens the wallet signature prompt. After approval, the browser uploads the image directly to Irys.
- **Outcome:** The portal receives an Irys image URI without sending the image bytes through Vercel.
- **Covered by:** R1, R2, R3, R4, R5, R6, R7.

### F2. Finalize metadata

- **Trigger:** Direct image upload succeeds.
- **Actors:** A2, A3.
- **Steps:** The portal submits the image URI and operation context. The upload service validates that the URI belongs to the authorized operation, then generates and sponsors the metadata upload.
- **Outcome:** The portal receives the image URI and metadata URI.
- **Covered by:** R8, R9, R10.

### F3. Recover after metadata failure

- **Trigger:** The image upload succeeds but metadata finalization fails.
- **Actors:** A1, A2, A3.
- **Steps:** The portal retains the completed image URI, explains that the image is already uploaded, and offers a metadata-only retry. The retry does not open a second image-signature flow.
- **Outcome:** A successful retry finalizes metadata for the existing image URI.
- **Covered by:** R10, R11, R12.

## Requirements

**Authorization and sponsorship**

- R1. Only an authenticated creator whose wallet matches the active session and has permission for the selected Creator Portal mode may initiate a sponsored upload.
- R2. Sponsorship authorization must be capped, expiring, and bound to the authenticated creator, token, mode, allowed image types, and maximum image size.
- R3. The browser must never receive the sponsor private key or unrestricted authority to spend the sponsor balance.
- R4. Sponsorship failure, expiry, or scope mismatch must fail closed before metadata is generated.

**Upload experience**

- R5. Every supported Creator Portal image upload must use the direct browser-to-Irys path, including images below the Vercel request limit.
- R6. The portal must present an explicit action that tells the creator a wallet signature is required to approve the sponsored image upload.
- R7. The portal must show distinct states for preparing authorization, waiting for signature, uploading to Irys, finalizing metadata, completed, cancelled, and failed.
- R8. A rejected or cancelled wallet signature must not trigger metadata finalization and must leave the creator with an actionable retry state.
- R9. The existing supported image types and 12 MiB (12,582,912-byte) image ceiling must remain enforced at both the user-experience boundary and the trusted upload boundary.

**URI integrity and finalization**

- R10. Vercel must receive only the completed Irys image URI and bounded operation data after the browser upload; it must not receive the image bytes.
- R11. Before generating metadata, the upload service must validate the image URI, operation authorization, declared size and type, and content identity needed to prevent arbitrary URI injection.
- R12. Metadata must reference the exact Irys image URI returned by the completed upload.
- R13. If metadata finalization fails after image upload, the portal must retain the image URI and provide a metadata-only retry without re-uploading the image.
- R14. A successful completion must expose both the image URI and metadata URI to the existing Creator Portal operation.

## Acceptance Examples

- AE1. **Normal upload** — Given an authenticated creator with the required role and a valid PNG under 12 MiB, when the creator approves the sponsored upload signature, then the image uploads directly to Irys and metadata finalization receives only the resulting image URI.
- AE2. **Large upload** — Given a valid image larger than 4.5 MB and no other validation failure, when the creator approves the upload, then the upload does not pass through the Vercel Function and can complete through Irys.
- AE3. **Signature rejection** — Given a valid selected image, when the creator rejects the wallet signature, then no image URI is finalized, no metadata upload starts, and the portal offers a clear retry.
- AE4. **Metadata recovery** — Given a completed Irys image upload, when metadata finalization fails, then the portal retains the image URI and a retry finalizes metadata without another image upload or wallet signature.
- AE5. **Invalid operation** — Given an expired, mismatched, or over-limit sponsorship authorization, when the portal submits the completed image URI, then metadata is not generated and the creator receives an actionable failure.
- AE6. **Unauthorized creator** — Given a connected wallet without the required mode role, when the creator attempts an upload, then the portal refuses authorization before opening the sponsored upload flow.

## Success Criteria

- No Creator Portal image upload sends image bytes to a Vercel Function.
- The same user-facing flow works for images on both sides of Vercel’s 4.5 MB request limit.
- A metadata failure never forces a successful image upload to be repeated.
- The creator can distinguish a wallet signature request from a gas-funded blockchain transaction.
- Unauthorized, expired, oversized, unsupported, and sponsor-exhaustion cases fail without metadata publication.
- Canonical Irys image URIs remain byte-for-byte unchanged after finalization.

## Scope Boundaries

- Temporary Vercel Blob, S3, or other object-storage intermediaries are outside this change.
- Batch or multi-file uploads are deferred.
- Cross-device recovery after the current portal workflow ends is deferred.
- Image resizing, compression, moderation, and transformation are outside this change.
- Deleting or rolling back an abandoned immutable Irys image is outside this change; capped and expiring sponsorship limits the exposure.

## Dependencies and Assumptions

- The Creator Portal continues to use SIWE session identity and existing mode-specific role checks.
- The creator wallet is available to sign the Irys data item through the existing browser wallet integration.
- Irys browser uploads and balance approvals remain available for the configured Base payment path. ([Irys browser uploads](https://docs.irys.xyz/build/d/irys-in-the-browser), [Irys balance approvals](https://docs.irys.xyz/build/d/features/balance-approvals))
- Irys image uploads are immutable, so successful image transactions may remain stored if the creator abandons metadata finalization.

## Outstanding Questions

### Deferred to Planning

- The exact lifetime, refresh, and revocation mechanics for the capped sponsorship authorization.
- The verification mechanism for confirming the uploaded Irys content matches the authorized type, size, and content identity.
- The client-state boundary for retaining an image URI during a page navigation or refresh.

## Sources / Research

- [Vercel Function request body limit](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions)
- [Irys browser upload guidance](https://docs.irys.xyz/build/d/irys-in-the-browser)
- [Irys balance approvals](https://docs.irys.xyz/build/d/features/balance-approvals)
- `src/app/fame/creator/[address]/SponsoredCreatorMetadataUploader.tsx`
- `src/app/api/fame/creator/metadata/route.ts`
- `src/service/irys_client.ts`
- `src/service/irys_sponsored_upload.ts`
