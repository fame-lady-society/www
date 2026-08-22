import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import {
  createCreatorMetadataJson,
  creatorContentHash,
  creatorImageTags,
} from "@/features/fame/creatorMetadata";
import type {
  CreatorIrysVerifier,
  CreatorIrysTransaction,
} from "@/service/creator_irys_verifier";
import type {
  CreatorUploadJournal,
  CreatorUploadOperation,
} from "@/service/creator_upload_journal";
import {
  createCreatorUploadCapability,
  digestSessionCookie,
} from "@/service/creator_upload_authorization";
import type { IrysSponsoredUploader } from "@/service/irys_sponsored_upload";

process.env.SESSION_SECRET ||= "test-session-secret";
process.env.CREATOR_UPLOAD_CAPABILITY_SECRET ||= "test-creator-upload-secret";

const { handleCreatorMetadataUpload } = await import("./route");

const CREATOR = "0x0000000000000000000000000000000000000001" as const;
const OTHER = "0x0000000000000000000000000000000000000002" as const;
const IMAGE_TX_ID = "i".repeat(43);
const METADATA_TX_ID = "m".repeat(43);
const SESSION_COOKIE = "session-cookie";

function makeRequest(body: Record<string, unknown>, cookie = SESSION_COOKIE) {
  return new NextRequest(
    "https://fameladysociety.com/api/fame/creator/metadata",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `siwe=${cookie}`,
      },
      body: JSON.stringify(body),
    },
  );
}

function makePng(): Uint8Array {
  return new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3, 4]);
}

function makeJournal(initial?: CreatorUploadOperation): CreatorUploadJournal {
  const records = new Map<string, CreatorUploadOperation>();
  if (initial) records.set(initial.operationId, initial);
  const leases = new Set<string>();
  return {
    reserveCreator: async () => true,
    releaseCreator: async () => undefined,
    createOperation: async (operation) => {
      if (records.has(operation.operationId)) return false;
      records.set(operation.operationId, operation);
      return true;
    },
    getOperation: async (operationId) => records.get(operationId) ?? null,
    updateOperation: async (operationId, patch) => {
      const current = records.get(operationId);
      if (!current) return null;
      const next = { ...current, ...patch };
      records.set(operationId, next);
      return next;
    },
    acquireFinalization: async (operationId, lease) => {
      if (leases.has(operationId)) return null;
      const current = records.get(operationId);
      if (!current) return null;
      leases.add(operationId);
      const next = {
        ...current,
        status: "finalizing" as const,
        finalizationLease: lease,
      };
      records.set(operationId, next);
      return next;
    },
    releaseFinalization: async (operationId) => {
      leases.delete(operationId);
      const current = records.get(operationId);
      if (!current) return null;
      const next = {
        ...current,
        status:
          current.status === "finalizing"
            ? ("image_verified" as const)
            : current.status,
        finalizationLease: undefined,
      };
      records.set(operationId, next);
      return next;
    },
  };
}

function makeOperation(image: Uint8Array): CreatorUploadOperation {
  const now = Date.now();
  return {
    operationId: "cu_test-operation-123456",
    creatorAddress: CREATOR,
    sessionDigest: digestSessionCookie(SESSION_COOKIE),
    tokenId: 123,
    mode: "update",
    imageType: "image/png",
    imageBytes: image.byteLength,
    imageHash: creatorContentHash(image),
    sponsorAddress: OTHER,
    approvalAmount: "1000",
    createdAt: now,
    expiresAt: now + 300_000,
    status: "authorized",
  };
}

function makeDeps(image: Uint8Array, operation = makeOperation(image)) {
  const transaction: CreatorIrysTransaction = {
    id: IMAGE_TX_ID,
    address: CREATOR,
    currency: "base-eth",
    tags: creatorImageTags({
      operationId: operation.operationId,
      creatorAddress: CREATOR,
      tokenId: operation.tokenId,
      mode: operation.mode,
      type: operation.imageType,
      size: image.byteLength,
      contentHash: operation.imageHash,
    }),
  };
  const verifier: CreatorIrysVerifier = {
    getTransaction: async () => transaction,
    findMetadataTransaction: async () => null,
    readData: async () => image,
  };
  const uploads: Array<{ content: Buffer; tags: unknown }> = [];
  let revoked = false;
  const uploader: IrysSponsoredUploader = {
    getPrice: async () => 1n,
    getBalance: async () => 10n,
    fund: async () => undefined,
    upload: async (content, opts) => {
      uploads.push({ content, tags: opts.tags });
      return { id: METADATA_TX_ID };
    },
    approval: {
      createApproval: async () => undefined,
      getApproval: async () => ({ amount: "1000" }),
      revokeApproval: async () => {
        revoked = true;
      },
    },
  };
  const journal = makeJournal(operation);
  return {
    getSession: () => ({
      address: CREATOR,
      chainId: 8453,
      expiresAt: Date.now() + 60_000,
    }),
    readRoles: async () => 2n,
    readNextTokenId: async () => 650n,
    createUploader: async () => uploader,
    createVerifier: () => verifier,
    getMaxFundAmount: async () => 100n,
    journal,
    uploads,
    wasRevoked: () => revoked,
  };
}

function requestBody(operation: CreatorUploadOperation, imageUri: string) {
  const capability = createCreatorUploadCapability({
    purpose: "image-upload",
    operationId: operation.operationId,
    address: CREATOR,
    sessionDigest: digestSessionCookie(SESSION_COOKIE),
    tokenId: operation.tokenId,
    mode: operation.mode,
    imageType: operation.imageType,
    imageBytes: operation.imageBytes,
    imageHash: operation.imageHash,
    sponsorAddress: operation.sponsorAddress,
    approvalAmount: operation.approvalAmount,
  }).token;
  return {
    address: CREATOR,
    tokenId: operation.tokenId,
    mode: operation.mode,
    imageUri,
    capability,
  };
}

describe("/api/fame/creator/metadata", () => {
  it("rejects update finalization outside the released token range", async () => {
    const image = makePng();
    const operation = { ...makeOperation(image), tokenId: 650 };
    const injected = makeDeps(image, operation);
    const response = await handleCreatorMetadataUpload(
      makeRequest(
        requestBody(operation, `https://gateway.irys.xyz/${IMAGE_TX_ID}`),
      ),
      injected,
    );
    assert.equal(response.status, 400);
  });

  it("rejects a metadata capability retargeted from another update token", async () => {
    const image = makePng();
    const operation = {
      ...makeOperation(image),
      imageUri: `https://gateway.irys.xyz/${IMAGE_TX_ID}`,
      imageTxId: IMAGE_TX_ID,
      status: "image_verified" as const,
    };
    const tokenId = 124;
    const capability = createCreatorUploadCapability({
      purpose: "metadata-finalization",
      operationId: operation.operationId,
      address: CREATOR,
      sessionDigest: operation.sessionDigest,
      tokenId,
      mode: "update",
      imageType: operation.imageType,
      imageBytes: operation.imageBytes,
      imageHash: operation.imageHash,
      sponsorAddress: operation.sponsorAddress,
      approvalAmount: operation.approvalAmount,
      imageUri: operation.imageUri,
      imageTxId: operation.imageTxId,
    }).token;
    const response = await handleCreatorMetadataUpload(
      makeRequest({
        address: CREATOR,
        tokenId,
        mode: "update",
        imageUri: operation.imageUri,
        capability,
      }),
      makeDeps(image, operation),
    );
    assert.equal(response.status, 404);
  });

  it("requires the CREATOR role for update finalization", async () => {
    const image = makePng();
    const operation = makeOperation(image);
    const response = await handleCreatorMetadataUpload(
      makeRequest(
        requestBody(operation, `https://gateway.irys.xyz/${IMAGE_TX_ID}`),
      ),
      { ...makeDeps(image, operation), readRoles: async () => 0n },
    );
    assert.equal(response.status, 403);
  });

  it("returns 401 when unauthenticated", async () => {
    const image = makePng();
    const injected = makeDeps(image);
    const response = await handleCreatorMetadataUpload(
      makeRequest(
        requestBody(
          makeOperation(image),
          `https://gateway.irys.xyz/${IMAGE_TX_ID}`,
        ),
      ),
      { ...injected, getSession: () => null },
    );
    assert.equal(response.status, 401);
  });

  it("rejects multipart image bytes and address substitution", async () => {
    const image = makePng();
    const operation = makeOperation(image);
    const injected = makeDeps(image, operation);
    const formData = new FormData();
    formData.set("address", CREATOR);
    formData.set("tokenId", "123");
    formData.set("mode", "update");
    formData.set(
      "image",
      new File(["image"], "creator.png", { type: "image/png" }),
    );
    const multipart = new NextRequest(
      "https://fameladysociety.com/api/fame/creator/metadata",
      {
        method: "POST",
        body: formData,
        headers: { cookie: `siwe=${SESSION_COOKIE}` },
      },
    );
    assert.equal(
      await handleCreatorMetadataUpload(multipart, injected).then(
        (r) => r.status,
      ),
      422,
    );

    const substituted = {
      ...requestBody(operation, `https://gateway.irys.xyz/${IMAGE_TX_ID}`),
      address: OTHER,
    };
    assert.equal(
      await handleCreatorMetadataUpload(
        makeRequest(substituted),
        injected,
      ).then((r) => r.status),
      403,
    );
  });

  it("verifies the Irys image and publishes metadata with the exact URI", async () => {
    const image = makePng();
    const operation = makeOperation(image);
    const injected = makeDeps(image, operation);
    const imageUri = `https://gateway.irys.xyz/${IMAGE_TX_ID}`;
    const response = await handleCreatorMetadataUpload(
      makeRequest(requestBody(operation, imageUri)),
      injected,
    );
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.imageUri, imageUri);
    assert.equal(
      body.metadataUri,
      `https://gateway.irys.xyz/${METADATA_TX_ID}`,
    );
    assert.equal(injected.uploads.length, 1);
    const uploadedMetadata = JSON.parse(
      injected.uploads[0].content.toString(),
    );
    assert.equal(uploadedMetadata.name, "FAME Society");
    assert.equal(uploadedMetadata.image, imageUri);
    assert.equal(injected.wasRevoked(), true);
  });

  it("fails closed when the declared MIME does not match image bytes", async () => {
    const image = makePng();
    const operation = {
      ...makeOperation(image),
      imageType: "image/jpeg" as const,
    };
    const injected = makeDeps(image, operation);
    const response = await handleCreatorMetadataUpload(
      makeRequest(
        requestBody(operation, `https://gateway.irys.xyz/${IMAGE_TX_ID}`),
      ),
      injected,
    );
    assert.equal(response.status, 422);
    assert.equal(injected.uploads.length, 0);
  });

  it("returns the existing result instead of publishing metadata twice", async () => {
    const image = makePng();
    const operation = {
      ...makeOperation(image),
      status: "finalized" as const,
      imageUri: `https://gateway.irys.xyz/${IMAGE_TX_ID}`,
      metadataUri: `https://gateway.irys.xyz/${METADATA_TX_ID}`,
    };
    const injected = makeDeps(image, operation);
    const response = await handleCreatorMetadataUpload(
      makeRequest(requestBody(operation, operation.imageUri!)),
      injected,
    );
    assert.equal(response.status, 200);
    assert.equal((await response.json()).metadataUri, operation.metadataUri);
    assert.equal(injected.uploads.length, 0);
  });
});
