import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createCreatorMetadataJson,
  creatorContentHash,
  creatorImageTags,
  creatorMetadataTags,
} from "@/features/fame/creatorMetadata";
import {
  createCreatorIrysVerifier,
  parseCreatorIrysGatewayUri,
  verifyCreatorImage,
  type CreatorIrysVerifier,
} from "./creator_irys_verifier";

const CREATOR = "0x0000000000000000000000000000000000000001";
const SPONSOR = "0x0000000000000000000000000000000000000009";
const OPERATION = "cu_test-operation-123456";
const TX_ID = "i".repeat(43);
const LONG_TX_ID = "j".repeat(44);
const METADATA_TX_ID = "m".repeat(43);

function image() {
  return new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1]);
}

function verifier(bytes: Uint8Array, type = "image/png"): CreatorIrysVerifier {
  return {
    getTransaction: async () => ({
      id: TX_ID,
      address: CREATOR,
      currency: "base-eth",
      tags: creatorImageTags({
        operationId: OPERATION,
        creatorAddress: CREATOR,
        tokenId: 1,
        mode: "update",
        type: type as "image/png",
        size: bytes.byteLength,
        contentHash: creatorContentHash(bytes),
      }),
    }),
    findMetadataTransaction: async () => null,
    readData: async () => bytes,
  };
}

describe("creator Irys image verification", () => {
  it("accepts exact canonical gateway URI and valid content", async () => {
    const bytes = image();
    const result = await verifyCreatorImage({
      verifier: verifier(bytes),
      imageUri: `https://gateway.irys.xyz/${TX_ID}`,
      operationId: OPERATION,
      creatorAddress: CREATOR,
      tokenId: 1,
      mode: "update",
      imageType: "image/png",
      imageBytes: bytes.byteLength,
      imageHash: creatorContentHash(bytes),
    });
    assert.equal(result.imageTxId, TX_ID);
  });

  it("rejects malformed URI, wrong currency, and MIME/content mismatch", async () => {
    assert.equal(parseCreatorIrysGatewayUri("https://example.com/image"), null);
    assert.equal(
      parseCreatorIrysGatewayUri(`https://gateway.irys.xyz/${LONG_TX_ID}`)
        ?.transactionId,
      LONG_TX_ID,
    );
    const bytes = image();
    await assert.rejects(
      verifyCreatorImage({
        verifier: {
          ...verifier(bytes),
          getTransaction: async () => ({
            ...(await verifier(bytes).getTransaction(TX_ID)),
            currency: "eth",
          }),
        },
        imageUri: `https://gateway.irys.xyz/${TX_ID}`,
        operationId: OPERATION,
        creatorAddress: CREATOR,
        tokenId: 1,
        mode: "update",
        imageType: "image/png",
        imageBytes: bytes.byteLength,
        imageHash: creatorContentHash(bytes),
      }),
      /currency/,
    );
    await assert.rejects(
      verifyCreatorImage({
        verifier: verifier(new Uint8Array([1, 2, 3])),
        imageUri: `https://gateway.irys.xyz/${TX_ID}`,
        operationId: OPERATION,
        creatorAddress: CREATOR,
        tokenId: 1,
        mode: "update",
        imageType: "image/png",
        imageBytes: 3,
        imageHash: creatorContentHash(new Uint8Array([1, 2, 3])),
      }),
      /content type/,
    );
  });

  it("matches metadata only when the exact image URI and sponsor are present", async () => {
    const imageUri = `https://gateway.irys.xyz/${TX_ID}`;
    const content = createCreatorMetadataJson(1, imageUri);
    const transaction = {
      id: METADATA_TX_ID,
      address: SPONSOR,
      currency: "base-eth",
      tags: creatorMetadataTags({
        operationId: OPERATION,
        creatorAddress: CREATOR,
        tokenId: 1,
        mode: "update",
        content,
        imageUri,
      }),
    };
    let query: unknown;
    const verifier = createCreatorIrysVerifier({
      getPrice: async () => 1n,
      getBalance: async () => 1n,
      fund: async () => undefined,
      upload: async () => ({ id: METADATA_TX_ID }),
      transactions: {
        getById: async () => transaction,
        query: async (input) => {
          query = input;
          return [transaction];
        },
      },
    });
    const result = await verifier.findMetadataTransaction({
      operationId: OPERATION,
      tokenId: 1,
      creatorAddress: CREATOR,
      mode: "update",
      imageUri,
      sponsorAddress: SPONSOR,
    });
    assert.equal(result?.id, METADATA_TX_ID);
    assert.equal(
      JSON.stringify(query).includes("Fame-Creator-Image-Uri"),
      true,
    );
  });
});
