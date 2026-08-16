import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import { creatorContentHash } from "@/features/fame/creatorMetadata";
import {
  createCreatorUploadCapability,
  digestSessionCookie,
  verifyCreatorUploadCapability,
} from "@/service/creator_upload_authorization";
import type { CreatorUploadJournal, CreatorUploadOperation } from "@/service/creator_upload_journal";

process.env.SESSION_SECRET ||= "test-session-secret";
process.env.CREATOR_UPLOAD_CAPABILITY_SECRET ||= "test-creator-upload-secret";

const { handleCreatorMetadataReauthorize } = await import("./route");

const CREATOR = "0x0000000000000000000000000000000000000001" as const;
const SPONSOR = "0x0000000000000000000000000000000000000009" as const;
const SESSION_COOKIE = "session-cookie";
const IMAGE_TX_ID = "i".repeat(43);
const IMAGE_URI = `https://gateway.irys.xyz/${IMAGE_TX_ID}`;

const operation: CreatorUploadOperation = {
  operationId: "cu_test-operation-123456",
  creatorAddress: CREATOR,
  sessionDigest: digestSessionCookie(SESSION_COOKIE),
  tokenId: 123,
  mode: "release",
  imageType: "image/png",
  imageBytes: 12,
  imageHash: creatorContentHash(new Uint8Array([1, 2, 3])),
  sponsorAddress: SPONSOR,
  approvalAmount: "1000",
  createdAt: Date.now(),
  expiresAt: Date.now() + 300_000,
  status: "finalized",
  imageUri: IMAGE_URI,
  imageTxId: IMAGE_TX_ID,
};

function request(body: Record<string, unknown>) {
  return new NextRequest(
    "https://fameladysociety.com/api/fame/creator/metadata/reauthorize",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `siwe=${SESSION_COOKIE}`,
      },
      body: JSON.stringify(body),
    },
  );
}

function deps(): CreatorUploadJournal {
  return {
    reserveCreator: async () => true,
    releaseCreator: async () => undefined,
    createOperation: async () => true,
    getOperation: async () => operation,
    updateOperation: async (_operationId, patch) => ({ ...operation, ...patch }),
    acquireFinalization: async () => null,
    releaseFinalization: async () => null,
  };
}

describe("/api/fame/creator/metadata/reauthorize", () => {
  it("issues metadata-only authorization for a new release token", async () => {
    const response = await handleCreatorMetadataReauthorize(
      request({
        address: CREATOR,
        tokenId: 124,
        mode: "release",
        operationId: operation.operationId,
        imageUri: IMAGE_URI,
      }),
      {
        getSession: () => ({
          address: CREATOR,
          chainId: 8453,
          expiresAt: Date.now() + 60_000,
        }),
        readRoles: async () => 2n,
        journal: deps(),
      },
    );
    assert.equal(response.status, 200);
    const body = await response.json();
    const capability = verifyCreatorUploadCapability(body.capability);
    assert.equal(capability?.purpose, "metadata-finalization");
    assert.equal(capability?.tokenId, 124);
    assert.equal(capability?.imageUri, IMAGE_URI);
  });

  it("does not reauthorize an image URI outside the verified operation", async () => {
    const response = await handleCreatorMetadataReauthorize(
      request({
        address: CREATOR,
        tokenId: 124,
        mode: "release",
        operationId: operation.operationId,
        imageUri: `https://gateway.irys.xyz/${"x".repeat(43)}`,
      }),
      {
        getSession: () => ({
          address: CREATOR,
          chainId: 8453,
          expiresAt: Date.now() + 60_000,
        }),
        readRoles: async () => 2n,
        journal: deps(),
      },
    );
    assert.equal(response.status, 404);
  });
});
