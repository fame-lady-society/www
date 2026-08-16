import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import {
  createCreatorUploadCapability,
  digestSessionCookie,
} from "@/service/creator_upload_authorization";
import type { CreatorUploadJournal, CreatorUploadOperation } from "@/service/creator_upload_journal";
import { verifyCreatorUploadCapability } from "@/service/creator_upload_authorization";

process.env.SESSION_SECRET ||= "test-session-secret";
process.env.CREATOR_UPLOAD_CAPABILITY_SECRET ||= "test-creator-upload-secret";

const { handleCreatorMetadataRevoke } = await import("./route");

const CREATOR = "0x0000000000000000000000000000000000000001" as const;
const SPONSOR = "0x0000000000000000000000000000000000000009" as const;
const SESSION_COOKIE = "session-cookie";
const operation: CreatorUploadOperation = {
  operationId: "cu_test-operation-123456",
  creatorAddress: CREATOR,
  sessionDigest: digestSessionCookie(SESSION_COOKIE),
  tokenId: 123,
  mode: "update",
  imageType: "image/png",
  imageBytes: 12,
  imageHash: "a".repeat(64),
  sponsorAddress: SPONSOR,
  approvalAmount: "1000",
  createdAt: Date.now(),
  expiresAt: Date.now() + 300_000,
  status: "authorized",
};

function request(capability: string) {
  return new NextRequest(
    "https://fameladysociety.com/api/fame/creator/metadata/revoke",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `siwe=${SESSION_COOKIE}`,
      },
      body: JSON.stringify({ capability }),
    },
  );
}

describe("/api/fame/creator/metadata/revoke", () => {
  it("revokes the image payer approval and closes the operation", async () => {
    let revoked = false;
    let status = operation.status;
    const capability = createCreatorUploadCapability({
      purpose: "image-upload",
      operationId: operation.operationId,
      address: CREATOR,
      sessionDigest: operation.sessionDigest,
      tokenId: operation.tokenId,
      mode: operation.mode,
      imageType: operation.imageType,
      imageBytes: operation.imageBytes,
      imageHash: operation.imageHash,
      sponsorAddress: SPONSOR,
      approvalAmount: operation.approvalAmount,
    }).token;
    assert.ok(verifyCreatorUploadCapability(capability));
    const journal: CreatorUploadJournal = {
      reserveCreator: async () => true,
      releaseCreator: async () => undefined,
      createOperation: async () => true,
      getOperation: async () => ({ ...operation, status }),
      updateOperation: async (_operationId, patch) => {
        status = patch.status ?? status;
        return { ...operation, status };
      },
      acquireFinalization: async () => null,
      releaseFinalization: async () => null,
    };
    const response = await handleCreatorMetadataRevoke(request(capability), {
      getSession: () => ({
        address: CREATOR,
        chainId: 8453,
        expiresAt: Date.now() + 60_000,
      }),
      createUploader: async () => ({
        getPrice: async () => 1n,
        getBalance: async () => 1n,
        fund: async () => undefined,
        upload: async () => ({ id: "unused" }),
        approval: {
          createApproval: async () => undefined,
          getApproval: async () => ({ amount: "1" }),
          revokeApproval: async () => {
            revoked = true;
          },
        },
      }),
      journal,
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).revoked, true);
    assert.equal(revoked, true);
    assert.equal(status, "revoked");
  });
});
