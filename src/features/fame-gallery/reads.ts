import { isAddress, isAddressEqual, type Address } from "viem";
import { base } from "viem/chains";
import { client as baseClient } from "@/viem/base-client";
import { fameMirrorAbi, universalPoolArtMarketplaceAbi } from "@/wagmi";
import {
  creatorArtistMagicAddress,
  fameFromNetwork,
  societyFromNetwork,
} from "@/features/fame/contract";
import { classifyFameGalleryStatus, type FameGalleryStatus } from "./status";

const STATUS_BATCH_SIZE = 64;

export type FameGalleryStatusProjection = {
  observedAt: number;
  membershipFingerprint: string;
  statuses: Record<string, FameGalleryStatus>;
};

function marketplaceAddress(): Address | null {
  const candidate = process.env.NEXT_PUBLIC_BASE_UNIVERSAL_MARKETPLACE_ADDRESS;
  return candidate && isAddress(candidate) ? candidate : null;
}

export function hasVerifiedFameGalleryMarketplaceAuthority({
  fame,
  mirror,
  creatorMagic,
  paused,
  inventory,
}: {
  fame: unknown;
  mirror: unknown;
  creatorMagic: unknown;
  paused: unknown;
  inventory: unknown;
}) {
  return (
    typeof fame === "string" &&
    typeof mirror === "string" &&
    typeof creatorMagic === "string" &&
    isAddress(fame) &&
    isAddress(mirror) &&
    isAddress(creatorMagic) &&
    isAddressEqual(fame, fameFromNetwork(base.id)) &&
    isAddressEqual(mirror, societyFromNetwork(base.id)) &&
    isAddressEqual(creatorMagic, creatorArtistMagicAddress(base.id)) &&
    typeof paused === "boolean" &&
    typeof inventory === "bigint"
  );
}

/**
 * Ownership is deliberately best-effort: membership controls visibility;
 * unavailable market authority merely yields an unknown public decoration.
 */
export async function readFameGalleryStatuses(
  visibleTokenIds: readonly number[],
  membershipFingerprint: string,
  now = Date.now,
): Promise<FameGalleryStatusProjection> {
  const marketplace = marketplaceAddress();
  const statuses: Record<string, FameGalleryStatus> = {};
  if (!marketplace) {
    visibleTokenIds.forEach((tokenId) => {
      statuses[String(tokenId)] = "unknown";
    });
    return { observedAt: now(), membershipFingerprint, statuses };
  }
  const blockNumber = await baseClient.getBlockNumber();
  const global = await baseClient.multicall({
    allowFailure: true,
    blockNumber,
    contracts: ["fame", "mirror", "creatorMagic", "paused", "inventory"].map(
      (functionName) => ({
        address: marketplace,
        abi: universalPoolArtMarketplaceAbi,
        functionName,
      }),
    ),
  });
  const [fame, mirror, creatorMagic, paused, inventory] = global.map((result) =>
    result.status === "success" ? result.result : null,
  );
  const marketIsValid = hasVerifiedFameGalleryMarketplaceAuthority({
    fame,
    mirror,
    creatorMagic,
    paused,
    inventory,
  });
  if (!marketIsValid || typeof inventory !== "bigint") {
    visibleTokenIds.forEach((tokenId) => {
      statuses[String(tokenId)] = "unknown";
    });
    return { observedAt: now(), membershipFingerprint, statuses };
  }
  for (let offset = 0; offset < visibleTokenIds.length; offset += STATUS_BATCH_SIZE) {
    const tokenIds = visibleTokenIds.slice(offset, offset + STATUS_BATCH_SIZE);
    const owners = await baseClient.multicall({
      allowFailure: true,
      blockNumber,
      contracts: tokenIds.map((tokenId) => ({
        address: societyFromNetwork(base.id),
        abi: fameMirrorAbi,
        functionName: "ownerAt" as const,
        args: [BigInt(tokenId)] as const,
      })),
    });
    const artworks = await baseClient.multicall({
      allowFailure: true,
      blockNumber,
      contracts: tokenIds.map((tokenId) => ({
        address: marketplace,
        abi: universalPoolArtMarketplaceAbi,
        functionName: "artworkHash" as const,
        args: [BigInt(tokenId)] as const,
      })),
    });
    tokenIds.forEach((tokenId, index) => {
      const result = owners[index];
      const artwork = artworks[index];
      const owner = result?.status === "success" && typeof result.result === "string"
        ? result.result as Address
        : null;
      statuses[String(tokenId)] = classifyFameGalleryStatus({
        owner,
        marketplace,
        authorityVerified: marketIsValid,
        available: owner === marketplace && paused === false && inventory > 0n && artwork?.status === "success" && artwork.result !== "0x0000000000000000000000000000000000000000000000000000000000000000",
      });
    });
  }
  return { observedAt: now(), membershipFingerprint, statuses };
}
