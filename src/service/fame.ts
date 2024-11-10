import { type Address } from 'viem';
import { client as baseClient } from "@/viem/base-client";

interface DN404Storage {
  numAliases: bigint;
  nextTokenId: bigint;
  burnedPoolHead: bigint;
  burnedPoolTail: bigint;
  totalNFTSupply: bigint;
  totalSupply: bigint;
  burnPool: bigint[];
}

export async function getDN404Storage(
  client: typeof baseClient,
  contractAddress: Address
): Promise<DN404Storage> {
  const baseSlot = computeDN404StorageSlot();

  // Read Slot 0
  const slot0Hex = await client.getStorageAt({
    address: contractAddress,
    slot: baseSlot,
    blockTag: 'latest'
  });


  if (!slot0Hex) {
    throw new Error('Failed to fetch storage slots');
  }

  // Parse Slot 0
  const storageSlotBigInt = BigInt(slot0Hex);
  const numAliases = extractUint32(storageSlotBigInt, 0);
  const nextTokenId = extractUint32(storageSlotBigInt, 32);
  const burnedPoolHead = extractUint32(storageSlotBigInt, 64);
  const burnedPoolTail = extractUint32(storageSlotBigInt, 96);
  const totalNFTSupply = extractUint32(storageSlotBigInt, 128);
  const totalSupply = extractUint96(storageSlotBigInt, 160);

  const burnPool: bigint[] = await readBurnedPool(client, contractAddress, burnedPoolHead, burnedPoolTail);

  return {
    numAliases,
    nextTokenId,
    burnedPoolHead,
    burnedPoolTail,
    totalNFTSupply,
    totalSupply,
    burnPool
  };
}

function computeDN404StorageSlot() {
  return '0xa20d6e21d0e5255308' as const;
}

async function readBurnedPool(
  client: typeof baseClient,
  contractAddress: Address,
  burnedPoolHead: bigint,
  burnedPoolTail: bigint
): Promise<bigint[]> {
  const baseSlot = BigInt('0xa20d6e21d0e5255308');
  const mapSlot = baseSlot + BigInt(9); // burnedPool is at baseSlot + 9

  // Create array of indices to process
  const indices = Array.from(
    { length: Number(burnedPoolTail - burnedPoolHead) },
    (_, index) => BigInt(index) + burnedPoolHead
  );

  // Create array of promises for all storage reads
  const storagePromises = indices.map(i => {
    const s = mapSlot * (BigInt(2) ** BigInt(96)) + (i / BigInt(8));
    const slot = `0x${s.toString(16).padStart(64, '0')}` as `0x${string}`;

    return client.getStorageAt({
      address: contractAddress,
      slot,
      blockTag: 'latest',
    });
  });

  // Execute all storage reads in parallel
  const storageValues = await Promise.all(storagePromises);

  // Process results
  return indices.map((i, index) => {
    const storageValueHex = storageValues[index];
    if (!storageValueHex) {
      throw new Error('Failed to fetch storage slot');
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
  return (value >> BigInt(shiftBits)) & (BigInt(1) << BigInt(96)) - BigInt(1);
}