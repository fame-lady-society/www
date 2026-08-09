import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Abi, Address } from "viem";
import {
  FAME_ARTWORK_REVISION_READ_CONCURRENCY,
  readFameArtworkRevisions,
  type FameArtworkRevisionClient,
} from "./artworkRevisions";

const creatorMagic = "0x1111111111111111111111111111111111111111" as Address;
const marketplace = "0x2222222222222222222222222222222222222222" as Address;
const creatorMagicAbi = [] as unknown as Abi;
const marketplaceAbi = [] as unknown as Abi;

describe("FAME artwork revision reads", () => {
  it("pins every read to one block and preserves exact token URIs", async () => {
    const blocks: bigint[] = [];
    const client: FameArtworkRevisionClient = {
      getBlockNumber: async () => 123n,
      multicall: async ({ blockNumber, contracts }) => {
        blocks.push(blockNumber);
        return contracts.map(({ address, abi, functionName, args }) => {
          assert.equal(
            address,
            functionName === "tokenURI" ? creatorMagic : marketplace,
          );
          assert.equal(
            abi,
            functionName === "tokenURI" ? creatorMagicAbi : marketplaceAbi,
          );
          return {
            status: "success" as const,
            result:
              functionName === "tokenURI"
                ? `https://gateway.irys.xyz/exact/${args[0]}?v=A%2FB`
                : `0x${args[0].toString(16).padStart(64, "0")}`,
          };
        });
      },
    };

    const snapshot = await readFameArtworkRevisions(
      client,
      creatorMagic,
      creatorMagicAbi,
      marketplace,
      marketplaceAbi,
      [2, 1, 2],
    );

    assert.equal(snapshot.blockNumber, 123n);
    assert.deepEqual(blocks, [123n]);
    assert.deepEqual(snapshot.revisions, [
      {
        tokenId: "2",
        tokenUri: "https://gateway.irys.xyz/exact/2?v=A%2FB",
        artworkHash: `0x${"2".padStart(64, "0")}`,
      },
      {
        tokenId: "1",
        tokenUri: "https://gateway.irys.xyz/exact/1?v=A%2FB",
        artworkHash: `0x${"1".padStart(64, "0")}`,
      },
    ]);
  });

  it("omits failed tokenURI reads without losing other revisions", async () => {
    const client: FameArtworkRevisionClient = {
      getBlockNumber: async () => 999n,
      multicall: async ({ contracts }) =>
        contracts.map(({ functionName, args }) =>
          args[0] === 2n && functionName === "tokenURI"
            ? { status: "failure" as const }
            : {
                status: "success" as const,
                result:
                  functionName === "tokenURI"
                    ? `data:metadata/${args[0]}`
                    : "not-a-hash",
              },
        ),
    };

    const snapshot = await readFameArtworkRevisions(
      client,
      creatorMagic,
      creatorMagicAbi,
      marketplace,
      marketplaceAbi,
      [1, 2],
      456n,
    );
    assert.equal(snapshot.blockNumber, 456n);
    assert.deepEqual(snapshot.revisions, [
      { tokenId: "1", tokenUri: "data:metadata/1" },
    ]);
  });

  it("bounds chunk concurrency and preserves requested order", async () => {
    let active = 0;
    let maximumActive = 0;
    const client: FameArtworkRevisionClient = {
      getBlockNumber: async () => 999n,
      multicall: async ({ contracts }) => {
        active += 1;
        maximumActive = Math.max(maximumActive, active);
        await new Promise((resolve) => setTimeout(resolve, 2));
        active -= 1;
        return contracts.map(({ functionName, args }) => ({
          status: "success" as const,
          result:
            functionName === "tokenURI"
              ? `https://gateway.irys.xyz/${args[0]}`
              : `0x${args[0].toString(16).padStart(64, "0")}`,
        }));
      },
    };
    const tokenIds = Array.from({ length: 130 }, (_, index) => index + 1);

    const snapshot = await readFameArtworkRevisions(
      client,
      creatorMagic,
      creatorMagicAbi,
      marketplace,
      marketplaceAbi,
      tokenIds,
    );

    assert.equal(maximumActive, FAME_ARTWORK_REVISION_READ_CONCURRENCY);
    assert.deepEqual(
      snapshot.revisions.map(({ tokenId }) => Number(tokenId)),
      tokenIds,
    );
  });
});
