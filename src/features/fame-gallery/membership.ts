import { getAddress, isAddressEqual, type Address } from "viem";
import { base } from "viem/chains";
import { client as baseClient } from "@/viem/base-client";
import { creatorArtistMagicAbi, fameAbi } from "@/wagmi";
import {
  creatorArtistMagicAddress,
  fameFromNetwork,
} from "@/features/fame/contract";
import { visibleFameCollectionTokenIds } from "@/features/fame/collection";

export type FameGalleryMembershipSnapshot = {
  blockNumber: string;
  observedAt: number;
  visibleTokenIds: number[];
  fingerprint: string;
};

export type FameGalleryMembershipClient = {
  getBlockNumber(): Promise<bigint>;
  readContract(args: Record<string, unknown>): Promise<unknown>;
};

const productionClient: FameGalleryMembershipClient = baseClient;

function addressFingerprint(address: Address) {
  return getAddress(address).toLowerCase();
}

/**
 * Reads the active renderer identity and Art Pool bounds at one Base block.
 * The returned DTO deliberately contains only the visible public IDs.
 */
export async function readFameGalleryMembership(
  client: FameGalleryMembershipClient = productionClient,
  now = Date.now,
): Promise<FameGalleryMembershipSnapshot> {
  const blockNumber = await client.getBlockNumber();
  const fame = fameFromNetwork(base.id);
  const creatorMagic = creatorArtistMagicAddress(base.id);
  const read = (address: Address, abi: readonly unknown[], functionName: string) =>
    client.readContract({ address, abi, functionName, blockNumber });

  const [configuredFame, activeRenderer] = await Promise.all([
    read(creatorMagic, creatorArtistMagicAbi, "fame"),
    read(fame, fameAbi, "renderer"),
  ]);

  if (
    typeof configuredFame !== "string" ||
    typeof activeRenderer !== "string" ||
    !isAddressEqual(configuredFame as Address, fame) ||
    !isAddressEqual(activeRenderer as Address, creatorMagic)
  ) {
    throw new Error("Configured CreatorArtistMagic is not FAME's active renderer.");
  }

  const [start, end] = await Promise.all([
    read(creatorMagic, creatorArtistMagicAbi, "artPoolStartIndex"),
    read(creatorMagic, creatorArtistMagicAbi, "artPoolEndIndex"),
  ]);
  if (typeof start !== "bigint" || typeof end !== "bigint") {
    throw new Error("CreatorArtistMagic returned invalid Art Pool bounds.");
  }

  const visibleTokenIds = visibleFameCollectionTokenIds(Number(start), Number(end));
  return {
    blockNumber: blockNumber.toString(),
    observedAt: now(),
    visibleTokenIds,
    fingerprint: [
      base.id,
      addressFingerprint(fame),
      addressFingerprint(creatorMagic),
      blockNumber.toString(),
    ].join(":"),
  };
}

export function isFreshFameGalleryMembership(
  snapshot: FameGalleryMembershipSnapshot,
  now = Date.now(),
): boolean {
  return now - snapshot.observedAt < 300_000;
}
