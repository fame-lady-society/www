import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { creatorContentHash } from "@/features/fame/creatorMetadata";
import { uploadCreatorImageWithUploader } from "./creator_irys_upload";

const ADDRESS = "0x0000000000000000000000000000000000000001" as const;
const SPONSOR = "0x0000000000000000000000000000000000000009" as const;
const TX_ID = "i".repeat(43);

describe("creator browser Irys upload", () => {
  it("passes paidBy and the operation tags to Irys", async () => {
    const file = new File(
      [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])],
      "creator.png",
      { type: "image/png" },
    );
    const hash = creatorContentHash(new Uint8Array(await file.arrayBuffer()));
    let received: unknown;
    const result = await uploadCreatorImageWithUploader({
      uploader: {
        uploadFile: async (_file, options) => {
          received = options;
          return { id: TX_ID };
        },
      },
      address: ADDRESS,
      tokenId: 123,
      mode: "update",
      file,
      authorization: {
        capability: "capability",
        operationId: "cu_test-operation-123456",
        sponsorAddress: SPONSOR,
        expiresAt: Date.now() + 300_000,
        imageHash: hash,
      },
    });
    assert.equal(result.imageUri, `https://gateway.irys.xyz/${TX_ID}`);
    assert.deepEqual((received as any).upload, { paidBy: SPONSOR });
    assert.equal(
      (received as any).tags.some(
        (tag: { name: string; value: string }) =>
          tag.name === "Fame-Creator-Operation" &&
          tag.value === "cu_test-operation-123456",
      ),
      true,
    );
  });

  it("accepts wrapped and whitespace-padded Irys receipts", async () => {
    const file = new File(["image"], "creator.png", { type: "image/png" });
    const hash = creatorContentHash(new Uint8Array(await file.arrayBuffer()));
    const result = await uploadCreatorImageWithUploader({
      uploader: {
        uploadFile: async () => ({
          data: { id: ` ${TX_ID} ` },
        }),
      },
      address: ADDRESS,
      tokenId: 123,
      mode: "update",
      file,
      authorization: {
        capability: "capability",
        operationId: "cu_test-operation-123456",
        sponsorAddress: SPONSOR,
        expiresAt: Date.now() + 300_000,
        imageHash: hash,
      },
    });

    assert.equal(result.imageTxId, TX_ID);
  });

  it("does not upload when the selected file changed after authorization", async () => {
    const file = new File(["changed"], "creator.png", { type: "image/png" });
    await assert.rejects(
      uploadCreatorImageWithUploader({
        uploader: { uploadFile: async () => ({ id: TX_ID }) },
        address: ADDRESS,
        tokenId: 123,
        mode: "update",
        file,
        authorization: {
          capability: "capability",
          operationId: "cu_test-operation-123456",
          sponsorAddress: SPONSOR,
          expiresAt: Date.now() + 300_000,
          imageHash: "a".repeat(64),
        },
      }),
      /changed after authorization/,
    );
  });
});
