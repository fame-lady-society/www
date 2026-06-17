import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import { handleCreatorMetadataUpload } from "./route";
import type { IrysSponsoredUploader } from "@/service/irys_sponsored_upload";

const CREATOR = "0x0000000000000000000000000000000000000001" as const;
const OTHER = "0x0000000000000000000000000000000000000002" as const;

function makeRequest(opts: {
  address?: string;
  tokenId?: string;
  mode?: string;
  image?: File | string;
}) {
  const formData = new FormData();
  if (opts.address !== undefined) formData.set("address", opts.address);
  if (opts.tokenId !== undefined) formData.set("tokenId", opts.tokenId);
  if (opts.mode !== undefined) formData.set("mode", opts.mode);
  if (opts.image !== undefined) formData.set("image", opts.image);

  return new NextRequest("http://localhost/api/fame/creator/metadata", {
    method: "POST",
    body: formData,
  });
}

function imageFile(type = "image/png", name = "creator.png") {
  return new File(["image-bytes"], name, { type });
}

function deps(opts: {
  sessionAddress?: `0x${string}` | null;
  roles?: bigint;
  uploads?: Array<{ content: string | Uint8Array; tags: unknown }>;
}) {
  const uploads = opts.uploads ?? [];
  const uploader: IrysSponsoredUploader = {
    getPrice: async () => 1n,
    getBalance: async () => 10n,
    fund: async () => undefined,
    upload: async (content, uploadOpts) => {
      uploads.push({ content, tags: uploadOpts.tags });
      return { id: uploads.length === 1 ? "image-tx" : "metadata-tx" };
    },
  };

  return {
    getSession: () =>
      opts.sessionAddress === null
        ? null
        : {
            address: opts.sessionAddress ?? CREATOR,
            chainId: 8453,
            expiresAt: Date.now() + 60_000,
          },
    readRoles: async () => opts.roles ?? 0n,
    createUploader: async () => uploader,
    getMaxFundAmount: async () => 100n,
  };
}

describe("/api/fame/creator/metadata", () => {
  it("returns 401 when unauthenticated", async () => {
    const response = await handleCreatorMetadataUpload(
      makeRequest({
        address: CREATOR,
        tokenId: "123",
        mode: "update",
        image: imageFile(),
      }),
      deps({ sessionAddress: null }),
    );

    assert.equal(response.status, 401);
  });

  it("returns 403 when the session address does not match the request address", async () => {
    const response = await handleCreatorMetadataUpload(
      makeRequest({
        address: OTHER,
        tokenId: "123",
        mode: "update",
        image: imageFile(),
      }),
      deps({ sessionAddress: CREATOR, roles: 2n }),
    );

    assert.equal(response.status, 403);
  });

  it("returns 400 when the image is missing or unsupported", async () => {
    const missing = await handleCreatorMetadataUpload(
      makeRequest({
        address: CREATOR,
        tokenId: "123",
        mode: "update",
      }),
      deps({ roles: 2n }),
    );
    assert.equal(missing.status, 400);

    const unsupported = await handleCreatorMetadataUpload(
      makeRequest({
        address: CREATOR,
        tokenId: "123",
        mode: "update",
        image: imageFile("text/plain", "creator.txt"),
      }),
      deps({ roles: 2n }),
    );
    assert.equal(unsupported.status, 400);
  });

  it("allows art pool managers to sponsor art-pool metadata", async () => {
    const response = await handleCreatorMetadataUpload(
      makeRequest({
        address: CREATOR,
        tokenId: "123",
        mode: "art",
        image: imageFile(),
      }),
      deps({ roles: 8n }),
    );

    assert.equal(response.status, 200);
  });

  it("rejects wallets without the required mode role", async () => {
    const response = await handleCreatorMetadataUpload(
      makeRequest({
        address: CREATOR,
        tokenId: "123",
        mode: "update",
        image: imageFile(),
      }),
      deps({ roles: 0n }),
    );

    assert.equal(response.status, 403);
  });

  it("uploads the image, then generated metadata, and returns both gateway URIs", async () => {
    const uploads: Array<{ content: Buffer; tags: unknown }> = [];
    const response = await handleCreatorMetadataUpload(
      makeRequest({
        address: CREATOR,
        tokenId: "123",
        mode: "update",
        image: imageFile(),
      }),
      deps({ roles: 2n, uploads }),
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      imageUri: "https://gateway.irys.xyz/image-tx",
      metadataUri: "https://gateway.irys.xyz/metadata-tx",
    });
    assert.equal(uploads.length, 2);
    assert.ok(Buffer.isBuffer(uploads[0].content));
    assert.ok(Buffer.isBuffer(uploads[1].content));
    assert.equal(
      JSON.parse(uploads[1].content.toString("utf-8")).image,
      "https://gateway.irys.xyz/image-tx",
    );
  });
});
