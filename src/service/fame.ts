"use server";

import { encodePacked, keccak256, type Address } from "viem";
import { client as baseClient } from "@/viem/base-client";
import {
  creatorArtistMagicAbi,
  unrevealedLadyRendererAbi,
  unrevealedLadyRendererAddress,
} from "@/wagmi";
import { base, mint } from "viem/chains";
import {
  creatorArtistMagicAddress,
  fameFromNetwork,
} from "@/features/fame/contract";
import { IMetadata } from "@/utils/metadata";

export async function getArtPoolRange() {
  const [startIndex, endIndex, nextIndex] = await Promise.all([
    baseClient.readContract({
      abi: creatorArtistMagicAbi,
      address: creatorArtistMagicAddress(base.id),
      functionName: "artPoolStartIndex",
    }),
    baseClient.readContract({
      abi: creatorArtistMagicAbi,
      address: creatorArtistMagicAddress(base.id),
      functionName: "artPoolEndIndex",
    }),
    baseClient.readContract({
      abi: creatorArtistMagicAbi,
      address: creatorArtistMagicAddress(base.id),
      functionName: "artPoolNext",
    }),
  ]);
  return {
    startIndex: Number(startIndex),
    endIndex: Number(endIndex),
    nextIndex: Number(nextIndex),
  };
}

export async function getFamePools() {
  const { burnPool, nextTokenId } = await getDN404Storage();

  // using creatorArtistMagicAddress(base.id) and creatorArtistMagicAbi, get all token URIs from the burn pool using `tokenURI` function. Use viem's `readContract` function.and allow batching to happen
  const uris = await Promise.all(
    burnPool.map((tokenId) =>
      baseClient
        .readContract({
          abi: creatorArtistMagicAbi,
          address: creatorArtistMagicAddress(base.id),
          functionName: "tokenURI",
          args: [tokenId],
        })
        .then((uri) => ({
          uri,
          tokenId: Number(tokenId),
        })),
    ),
  );

  const mintPoolEnd = await baseClient.readContract({
    abi: creatorArtistMagicAbi,
    address: creatorArtistMagicAddress(base.id),
    functionName: "nextTokenId",
  });

  // Fetch metadata for mint pool
  const mintPoolUris = await Promise.all(
    Array.from(
      { length: Number(mintPoolEnd) - Number(nextTokenId) },
      (_, i) => {
        const tokenId = nextTokenId + BigInt(i);
        return baseClient
          .readContract({
            abi: creatorArtistMagicAbi,
            address: creatorArtistMagicAddress(base.id),
            functionName: "tokenURI",
            args: [tokenId],
          })
          .then((uri) => ({
            uri,
            tokenId: Number(tokenId),
          }));
      },
    ),
  );

  return {
    burnPool: await Promise.all(
      uris.map(async ({ uri, tokenId }) => {
        const response = await fetch(uri);
        const metadata: IMetadata = await response.json();
        return {
          tokenId,
          image: metadata.image,
        };
      }),
    ),
    mintPool: await Promise.all(
      mintPoolUris.map(async ({ uri, tokenId }) => {
        const response = await fetch(uri);
        const metadata: IMetadata = await response.json();
        return {
          tokenId,
          image: metadata.image, // Assuming metadata has an image field
        };
      }),
    ),
  };
}

interface DN404Storage {
  numAliases: bigint;
  nextTokenId: bigint;
  burnedPoolHead: bigint;
  burnedPoolTail: bigint;
  totalNFTSupply: bigint;
  totalSupply: bigint;
  burnPool: bigint[];
}

export async function getDN404Storage(): Promise<DN404Storage> {
  const baseSlot = computeDN404StorageSlot();

  // Read Slot 0
  const slot0Hex = await baseClient.getStorageAt({
    address: fameFromNetwork(base.id),
    slot: baseSlot,
    blockTag: "latest",
  });

  if (!slot0Hex) {
    throw new Error("Failed to fetch storage slots");
  }

  // Parse Slot 0
  const storageSlotBigInt = BigInt(slot0Hex);
  const numAliases = extractUint32(storageSlotBigInt, 0);
  const nextTokenId = extractUint32(storageSlotBigInt, 32);
  const burnedPoolHead = extractUint32(storageSlotBigInt, 64);
  const burnedPoolTail = extractUint32(storageSlotBigInt, 96);
  const totalNFTSupply = extractUint32(storageSlotBigInt, 128);
  const totalSupply = extractUint96(storageSlotBigInt, 160);

  const burnPool: bigint[] = await readBurnedPool(
    baseClient,
    fameFromNetwork(base.id),
    burnedPoolHead,
    burnedPoolTail,
  );

  return {
    numAliases,
    nextTokenId,
    burnedPoolHead,
    burnedPoolTail,
    totalNFTSupply,
    totalSupply,
    burnPool,
  };
}

function computeDN404StorageSlot() {
  return "0xa20d6e21d0e5255308" as const;
}

async function readBurnedPool(
  client: typeof baseClient,
  contractAddress: Address,
  burnedPoolHead: bigint,
  burnedPoolTail: bigint,
): Promise<bigint[]> {
  const baseSlot = BigInt("0xa20d6e21d0e5255308");
  const mapSlot = baseSlot + BigInt(9); // burnedPool is at baseSlot + 9

  // Create array of indices to process
  const indices = Array.from(
    { length: Number(burnedPoolTail - burnedPoolHead) },
    (_, index) => BigInt(index) + burnedPoolHead,
  );

  // Create array of promises for all storage reads
  const storagePromises = indices.map((i) => {
    const s = mapSlot * BigInt(2) ** BigInt(96) + i / BigInt(8);
    const slot = `0x${s.toString(16).padStart(64, "0")}` as `0x${string}`;

    return client.getStorageAt({
      address: contractAddress,
      slot,
      blockTag: "latest",
    });
  });

  // Execute all storage reads in parallel
  const storageValues = await Promise.all(storagePromises);

  // Process results
  return indices.map((i, index) => {
    const storageValueHex = storageValues[index];
    if (!storageValueHex) {
      throw new Error("Failed to fetch storage slot");
    }

    const storageValue = BigInt(storageValueHex);
    const o = (i % BigInt(8)) * BigInt(32);
    return extractUint32(storageValue, Number(o));
  });
}

function extractUint32(value: bigint, shiftBits: number) {
  return (value >> BigInt(shiftBits)) & BigInt(0xffffffff);
}

function extractUint96(value: bigint, shiftBits: number): bigint {
  return (value >> BigInt(shiftBits)) & ((BigInt(1) << BigInt(96)) - BigInt(1));
}

function shuffleArray<T>(array: T[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
