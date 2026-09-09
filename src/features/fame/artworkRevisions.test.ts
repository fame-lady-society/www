import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Abi, Address } from "viem";
import {
  FAME_ARTWORK_REVISION_READ_CONCURRENCY,
  findFameReleasedArtworkLocation,
  readFameArtworkRevisions,
  type FameArtworkRevisionClient,
} from "./artworkRevisions";

const creatorMagic = "0x1111111111111111111111111111111111111111" as Address;
const marketplace = "0x2222222222222222222222222222222222222222" as Address;
const creatorMagicAbi = [] as unknown as Abi;
const marketplaceAbi = [] as unknown as Abi;
const targetHash = `0x${"ab".repeat(32)}` as const;

function tokenIdFromArgs(args: readonly [bigint] | undefined) {
  if (!args) throw new Error("Expected a token ID argument");
  return args[0];
}

describe("FAME artwork revision reads", () => {
  it("stops scanning after the first batch containing a match", async () => {
    const calls: Array<{
      batchSize: number | undefined;
      blockNumber: bigint;
      functions: string[];
      tokenIds: bigint[];
    }> = [];
    const client: FameArtworkRevisionClient = {
      getBlockNumber: async () => 654321n,
      multicall: async ({ batchSize, blockNumber, contracts }) => {
        calls.push({
          batchSize,
          blockNumber,
          functions: contracts.map(({ functionName }) => functionName),
          tokenIds: contracts.flatMap(({ args }) => (args ? [args[0]] : [])),
        });
        if (contracts[0]?.functionName === "nextTokenId") {
          return [{ status: "success" as const, result: 654n }];
        }
        return contracts.map(({ args }) => ({
          status: "success" as const,
          result:
            tokenIdFromArgs(args) === 445n
              ? targetHash
              : `0x${tokenIdFromArgs(args).toString(16).padStart(64, "0")}`,
        }));
      },
    };

    const snapshot = await findFameReleasedArtworkLocation(
      client,
      creatorMagic,
      creatorMagicAbi,
      marketplace,
      marketplaceAbi,
      targetHash,
    );

    assert.equal(snapshot.blockNumber, 654321n);
    assert.deepEqual(snapshot.location, {
      tokenId: 445,
      artworkHash: targetHash,
    });
    assert.equal(calls.length, 8);
    assert.deepEqual(
      calls.map(({ blockNumber }) => blockNumber),
      Array(8).fill(654321n),
    );
    assert.deepEqual(calls[0]?.functions, ["nextTokenId"]);
    assert.equal(calls[1]?.tokenIds[0], 1n);
    assert.equal(calls.at(-1)?.tokenIds[0], 385n);
    assert.equal(calls.at(-1)?.tokenIds.at(-1), 448n);
    assert.equal(
      calls.slice(1).every(({ batchSize }) => batchSize === 1_048_576),
      true,
    );
    assert.equal(
      calls.some(({ tokenIds }) => tokenIds.includes(449n)),
      false,
    );
  });

  it("returns no match after scanning the released range", async () => {
    const scannedTokenIds: bigint[] = [];
    const client: FameArtworkRevisionClient = {
      getBlockNumber: async () => 123n,
      multicall: async ({ contracts }) => {
        if (contracts[0]?.functionName === "nextTokenId") {
          return [{ status: "success" as const, result: 4n }];
        }
        return contracts.map(({ args }) => {
          const tokenId = tokenIdFromArgs(args);
          scannedTokenIds.push(tokenId);
          return {
            status: "success" as const,
            result: `0x${tokenId.toString(16).padStart(64, "0")}`,
          };
        });
      },
    };

    const snapshot = await findFameReleasedArtworkLocation(
      client,
      creatorMagic,
      creatorMagicAbi,
      marketplace,
      marketplaceAbi,
      targetHash,
    );

    assert.equal(snapshot.blockNumber, 123n);
    assert.equal(snapshot.location, null);
    assert.deepEqual(scannedTokenIds, [1n, 2n, 3n]);
  });

  it("pins every read to one block and preserves exact token URIs", async () => {
    const blocks: bigint[] = [];
    const client: FameArtworkRevisionClient = {
      getBlockNumber: async () => 123n,
      multicall: async ({ blockNumber, contracts }) => {
        blocks.push(blockNumber);
        return contracts.map(({ address, abi, functionName, args }) => {
          const tokenId = tokenIdFromArgs(args);
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
                ? `https://gateway.irys.xyz/exact/${tokenId}?v=A%2FB`
                : `0x${tokenId.toString(16).padStart(64, "0")}`,
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
          tokenIdFromArgs(args) === 2n && functionName === "tokenURI"
            ? { status: "failure" as const }
            : {
                status: "success" as const,
                result:
                  functionName === "tokenURI"
                    ? `data:metadata/${tokenIdFromArgs(args)}`
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
              ? `https://gateway.irys.xyz/${tokenIdFromArgs(args)}`
              : `0x${tokenIdFromArgs(args).toString(16).padStart(64, "0")}`,
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
