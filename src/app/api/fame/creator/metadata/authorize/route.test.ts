import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import { MAX_CREATOR_IMAGE_BYTES } from "@/features/fame/creatorMetadata";
import type { CreatorUploadJournal } from "@/service/creator_upload_journal";

process.env.SESSION_SECRET ||= "test-session-secret";
process.env.CREATOR_UPLOAD_CAPABILITY_SECRET ||= "test-creator-upload-secret";

const { handleCreatorMetadataAuthorize } = await import("./route");

const CREATOR = "0x0000000000000000000000000000000000000001" as const;
const SPONSOR = "0x0000000000000000000000000000000000000009" as const;

function makeRequest(body: Record<string, unknown>, cookie = "session-cookie") {
  const request = new NextRequest(
    "https://fameladysociety.com/api/fame/creator/metadata/authorize",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `siwe=${cookie}`,
      },
      body: JSON.stringify(body),
    },
  );
  return request;
}

function journal(): CreatorUploadJournal {
  const records = new Map<string, any>();
  const active = new Map<string, string>();
  return {
    reserveCreator: async (address, operationId) => {
      const key = address.toLowerCase();
      if (active.has(key)) return false;
      active.set(key, operationId);
      return true;
    },
    releaseCreator: async (address, operationId) => {
      if (active.get(address.toLowerCase()) === operationId) {
        active.delete(address.toLowerCase());
      }
    },
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
    acquireFinalization: async () => null,
    releaseFinalization: async () => null,
  };
}

function deps(overrides: Partial<Parameters<typeof handleCreatorMetadataAuthorize>[1]> = {}) {
  let approvalCreated = false;
  let approvalRevoked = false;
  const uploader = {
    getPrice: async () => 1000n,
    getBalance: async () => 2000n,
    fund: async () => undefined,
    upload: async () => ({ id: "unused" }),
    approval: {
      createApproval: async () => {
        approvalCreated = true;
      },
      getApproval: async () => ({ amount: "1100", expiresBy: "9999999999999" }),
      revokeApproval: async () => {
        approvalRevoked = true;
      },
    },
  };
  return {
    getSession: () => ({
      address: CREATOR,
      chainId: 8453,
      expiresAt: Date.now() + 60_000,
    }),
    readRoles: async () => 2n,
    createUploader: async () => uploader,
    getSponsorAddress: () => SPONSOR,
    getMaxFundAmount: async () => 100_000n,
    journal: journal(),
    now: () => 1_700_000_000_000,
    ...overrides,
    _approvalCreated: () => approvalCreated,
    _approvalRevoked: () => approvalRevoked,
  } as any;
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    address: CREATOR,
    tokenId: 123,
    mode: "update",
    imageType: "image/png",
    imageBytes: 1024,
    imageHash: "a".repeat(64),
    ...overrides,
  };
}

describe("/api/fame/creator/metadata/authorize", () => {
  it("returns a short-lived capability and sponsor payer", async () => {
    const injected = deps();
    const response = await handleCreatorMetadataAuthorize(
      makeRequest(validBody()),
      injected,
    );
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.match(body.capability, /^ey/);
    assert.equal(body.sponsorAddress, SPONSOR);
    assert.equal(body.operationId.startsWith("cu_"), true);
  });

  it("requires Base SIWE and the matching authenticated address", async () => {
    const wrongAddress = await handleCreatorMetadataAuthorize(
      makeRequest(validBody({ address: SPONSOR })),
      deps(),
    );
    assert.equal(wrongAddress.status, 403);

    const wrongChain = await handleCreatorMetadataAuthorize(
      makeRequest(validBody()),
      deps({
        getSession: () => ({
          address: CREATOR,
          chainId: 1,
          expiresAt: Date.now() + 60_000,
        }),
      }),
    );
    assert.equal(wrongChain.status, 403);
  });

  it("rejects invalid image policy before sponsor approval", async () => {
    const injected = deps();
    const response = await handleCreatorMetadataAuthorize(
      makeRequest(
        validBody({
          imageType: "text/plain",
          imageBytes: MAX_CREATOR_IMAGE_BYTES + 1,
        }),
      ),
      injected,
    );
    assert.equal(response.status, 400);
    assert.equal(injected._approvalCreated(), false);
  });

  it("serializes concurrent authorizations for one creator", async () => {
    const injected = deps();
    const [first, second] = await Promise.all([
      handleCreatorMetadataAuthorize(makeRequest(validBody()), injected),
      handleCreatorMetadataAuthorize(makeRequest(validBody()), injected),
    ]);
    assert.deepEqual(
      [first.status, second.status].sort((a, b) => a - b),
      [200, 409],
    );
  });

  it("revokes the payer approval when operation persistence fails", async () => {
    const injected = deps({
      journal: {
        ...journal(),
        createOperation: async () => false,
      },
    });
    const response = await handleCreatorMetadataAuthorize(
      makeRequest(validBody()),
      injected,
    );
    assert.equal(response.status, 503);
    assert.equal(injected._approvalRevoked(), true);
  });
});
