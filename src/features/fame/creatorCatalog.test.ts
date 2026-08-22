import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address } from "viem";
import {
  readFameCreatorCatalog,
  type FameCreatorCatalogClient,
} from "./creatorCatalog";

const TOKEN_URI = "https://arweave.net/metadata";
const IMAGE = "https://arweave.net/image";

function catalogClient(input: {
  nextTokenId?: bigint | number;
  failedTokenIds?: readonly number[];
}) {
  const calls: Array<{ blockNumber: bigint; functionNames: string[] }> = [];
  const client: FameCreatorCatalogClient = {
    async getBlockNumber() {
      return 456n;
    },
    async multicall({ blockNumber, contracts }) {
      calls.push({
        blockNumber,
        functionNames: contracts.map(({ functionName }) => functionName),
      });
      if (
        contracts.length === 1 &&
        contracts[0]?.functionName === "nextTokenId"
      ) {
        return [{ status: "success", result: input.nextTokenId ?? 6n }];
      }
      return contracts.map(({ functionName, args }) => {
        const tokenId = Number(args?.[0] ?? 0n);
        if (
          functionName === "tokenURI" &&
          input.failedTokenIds?.includes(tokenId)
        ) {
          return { status: "failure" as const };
        }
        if (functionName === "tokenURI") {
          return {
            status: "success" as const,
            result: `${TOKEN_URI}/${tokenId}`,
          };
        }
        return {
          status: "success" as const,
          result: `0x${tokenId.toString(16).padStart(64, "0")}`,
        };
      });
    },
  };
  return { client, calls };
}

const resolveMetadata = async () => ({
  status: "ready" as const,
  image: IMAGE,
  name: "FAME",
  description: null,
  attributes: [],
  error: null,
});

describe("FAME creator catalog", () => {
  it("loads every released ID in bounded batches without Art Pool exclusions", async () => {
    const { client } = catalogClient({ nextTokenId: 421 });
    const result = await readFameCreatorCatalog(client, {
      cursor: 397,
      pageSize: 24,
      resolveMetadata,
    });

    assert.deepEqual(
      result.artworks.map(({ tokenId }) => tokenId),
      Array.from({ length: 24 }, (_, index) => 397 + index),
    );
    assert.equal(result.nextCursor, null);
    assert.equal(result.nextTokenId, 421);
  });

  it("pins continuation reads to the requested block", async () => {
    const { client, calls } = catalogClient({ nextTokenId: 80n });
    const result = await readFameCreatorCatalog(client, {
      cursor: 25,
      blockNumber: 123n,
      resolveMetadata,
    });

    assert.equal(result.blockNumber, 123n);
    assert.equal(result.nextCursor, 49);
    assert.ok(calls.every(({ blockNumber }) => blockNumber === 123n));
  });

  it("loads an exact released token without preceding IDs", async () => {
    const { client, calls } = catalogClient({ nextTokenId: 650n });
    const result = await readFameCreatorCatalog(client, {
      tokenId: 646,
      resolveMetadata,
    });

    assert.deepEqual(
      result.artworks.map(({ tokenId }) => tokenId),
      [646],
    );
    assert.equal(result.nextCursor, null);
    const revisionRead = calls.find(({ functionNames }) =>
      functionNames.includes("tokenURI"),
    );
    assert.deepEqual(revisionRead?.functionNames, ["tokenURI", "artworkHash"]);
  });

  it("rejects unreleased and invalid exact IDs", async () => {
    const { client } = catalogClient({ nextTokenId: 650n });
    await assert.rejects(
      () => readFameCreatorCatalog(client, { tokenId: 650 }),
      RangeError,
    );
    await assert.rejects(
      () => readFameCreatorCatalog(client, { tokenId: 0 }),
      RangeError,
    );
  });

  it("keeps a selectable identity when one token revision fails", async () => {
    const { client } = catalogClient({
      nextTokenId: 4n,
      failedTokenIds: [2],
    });
    const result = await readFameCreatorCatalog(client, { resolveMetadata });

    assert.deepEqual(
      result.artworks.map(({ tokenId }) => tokenId),
      [1, 2, 3],
    );
    assert.equal(result.artworks[1]?.revision, null);
    assert.equal(result.artworks[1]?.metadata.status, "failure");
  });
});
