import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Address, Hash } from "viem";
import { creatorArtistMagicAddress } from "@/features/fame/contract";
import { loadFameMetadata } from "@/features/fame/metadata";
import { base } from "viem/chains";
import {
  readFameGalleryCatalog,
  type FameGalleryCatalogClient,
} from "./catalog";

const marketplace = "0x1111111111111111111111111111111111111111" as Address;
const externalOwner = "0x2222222222222222222222222222222222222222" as Address;
const artworkHash = `0x${"ab".repeat(32)}` as Hash;
const resolveMetadata = (revision: { tokenUri: string }) =>
  loadFameMetadata(revision.tokenUri);

function success(result: unknown) {
  return { status: "success" as const, result };
}

function metadataUri(tokenId: bigint) {
  const image = `data:image/svg+xml;base64,${Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>',
  ).toString("base64")}`;
  return `data:application/json;base64,${Buffer.from(
    JSON.stringify({ name: `FAME #${tokenId}`, image }),
  ).toString("base64")}`;
}

function client(
  resultFor: (functionName: string, tokenId: bigint | null) => unknown,
) {
  const calls: {
    blockNumber: bigint;
    functionNames: string[];
    tokenIds: bigint[];
  }[] = [];
  const mock: FameGalleryCatalogClient = {
    getBlockNumber: async () => 123n,
    multicall: async ({ blockNumber, contracts }) => {
      calls.push({
        blockNumber,
        functionNames: contracts.map(({ functionName }) => functionName),
        tokenIds: contracts.flatMap((contract) =>
          typeof contract.args?.[0] === "bigint" ? [contract.args[0]] : [],
        ),
      });
      return contracts.map((contract) =>
        success(
          resultFor(
            contract.functionName,
            typeof contract.args?.[0] === "bigint" ? contract.args[0] : null,
          ),
        ),
      );
    },
  };
  return { mock, calls };
}

describe("FAME gallery catalog", () => {
  it("uses the canonical CreatorArtistMagic, stops at nextTokenId, and excludes Art Pool before all token reads", async () => {
    const { mock, calls } = client((functionName, tokenId) => {
      switch (functionName) {
        case "nextTokenId":
          return 6n;
        case "artPoolStartIndex":
          return 3n;
        case "artPoolEndIndex":
          return 4n;
        case "isTokenInMintPool":
          return tokenId === 1n;
        case "isTokenInBurnedPool":
          return tokenId === 2n;
        case "ownerAt":
          return tokenId === 2n ? marketplace : externalOwner;
        case "artworkHash":
          return artworkHash;
        case "tokenURI":
          return metadataUri(tokenId!);
        default:
          throw new Error(`Unexpected ${functionName}`);
      }
    });

    const result = await readFameGalleryCatalog(mock, {
      marketplace,
      resolveMetadata,
    });

    assert.equal(result.blockNumber, 123n);
    assert.deepEqual(
      result.artworks.map(({ tokenId, kind, owner }) => ({
        tokenId,
        kind,
        owner,
      })),
      [
        { tokenId: 1, kind: "mint", owner: externalOwner },
        { tokenId: 2, kind: "burn", owner: marketplace },
        { tokenId: 5, kind: "owned", owner: externalOwner },
      ],
    );
    assert.equal(result.artworks[0]?.metadata.status, "ready");
    assert.ok(calls.every(({ blockNumber }) => blockNumber === 123n));
    assert.ok(
      calls
        .flatMap(({ tokenIds }) => tokenIds)
        .every((tokenId) => tokenId !== 3n && tokenId !== 4n && tokenId < 6n),
    );
    assert.ok(
      calls
        .flatMap(({ tokenIds }) => tokenIds)
        .every((tokenId) => tokenId !== 6n),
    );
    assert.ok(
      calls.some(({ functionNames }) => functionNames.includes("nextTokenId")),
    );
    const allFunctionNames = calls.flatMap(
      ({ functionNames }) => functionNames,
    );
    assert.equal(
      allFunctionNames.filter((name) => name === "tokenURI").length,
      3,
    );
    assert.equal(
      allFunctionNames.filter((name) => name === "artworkHash").length,
      3,
    );
    assert.equal(
      allFunctionNames.filter((name) => name === "ownerAt").length,
      3,
    );
    assert.equal(
      calls
        .filter(({ functionNames }) => functionNames.includes("tokenURI"))
        .every(({ tokenIds }) =>
          tokenIds.every((tokenId) => tokenId !== 3n && tokenId !== 4n),
        ),
      true,
    );
    assert.equal(
      creatorArtistMagicAddress(base.id),
      "0xC8268c2aa571F3C88044C2959F73DdB8eB9e139F",
    );
    assert.equal(
      calls.filter(({ functionNames }) => functionNames.includes("nextTokenId"))
        .length,
      1,
    );
    assert.equal(result.nextCursor, null);
  });

  it("returns a bounded cursor page and reuses a supplied block", async () => {
    let blockReads = 0;
    const { mock, calls } = client((functionName, tokenId) => {
      switch (functionName) {
        case "nextTokenId":
          return 12n;
        case "artPoolStartIndex":
          return 3n;
        case "artPoolEndIndex":
          return 4n;
        case "isTokenInMintPool":
          return tokenId === 6n;
        case "isTokenInBurnedPool":
          return false;
        case "ownerAt":
          return externalOwner;
        case "artworkHash":
          return artworkHash;
        case "tokenURI":
          return metadataUri(tokenId!);
        default:
          throw new Error(`Unexpected ${functionName}`);
      }
    });
    const pagedClient = {
      ...mock,
      getBlockNumber: async () => {
        blockReads += 1;
        return 999n;
      },
    };

    const result = await readFameGalleryCatalog(pagedClient, {
      marketplace,
      cursor: 5,
      blockNumber: 456n,
      pageSize: 4,
      resolveMetadata,
    });

    assert.equal(blockReads, 0);
    assert.equal(result.blockNumber, 456n);
    assert.deepEqual(
      result.artworks.map(({ tokenId }) => tokenId),
      [5, 6, 7, 8],
    );
    assert.equal(result.nextCursor, 9);
    assert.ok(
      calls
        .flatMap(({ tokenIds }) => tokenIds)
        .every((tokenId) => tokenId >= 5n && tokenId < 9n),
    );
  });

  it("accepts the deployed numeric nextTokenId return type", async () => {
    const { mock } = client((functionName, tokenId) => {
      switch (functionName) {
        case "nextTokenId":
          return 3;
        case "artPoolStartIndex":
          return 10n;
        case "artPoolEndIndex":
          return 20n;
        case "isTokenInMintPool":
          return true;
        case "isTokenInBurnedPool":
          return false;
        case "ownerAt":
          return externalOwner;
        case "artworkHash":
          return artworkHash;
        case "tokenURI":
          return metadataUri(tokenId!);
        default:
          throw new Error(`Unexpected ${functionName}`);
      }
    });

    const result = await readFameGalleryCatalog(mock, {
      marketplace,
      resolveMetadata,
    });
    assert.deepEqual(
      result.artworks.map(({ tokenId }) => tokenId),
      [1, 2],
    );
  });

  it("fails closed for ambiguous membership, failed chain reads, and unavailable tokens", async () => {
    const { mock } = client((functionName, tokenId) => {
      switch (functionName) {
        case "nextTokenId":
          return 8n;
        case "artPoolStartIndex":
          return 3n;
        case "artPoolEndIndex":
          return 4n;
        case "isTokenInMintPool":
          return tokenId === 1n ? true : tokenId === 2n ? "failed" : false;
        case "isTokenInBurnedPool":
          return tokenId === 1n ? true : false;
        case "ownerAt":
          return tokenId === 7n
            ? "0x0000000000000000000000000000000000000000"
            : externalOwner;
        case "artworkHash":
          return tokenId === 5n ? `0x${"0".repeat(64)}` : artworkHash;
        case "tokenURI":
          return tokenId === 6n ? null : metadataUri(tokenId!);
        default:
          throw new Error(`Unexpected ${functionName}`);
      }
    });

    const result = await readFameGalleryCatalog(mock, {
      marketplace,
      resolveMetadata,
    });
    assert.deepEqual(result.artworks, []);
  });
});
