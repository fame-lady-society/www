"use server";

import { formatEther, type Address } from "viem";
import { getBalance } from "viem/actions";
import { privateKeyToAccount } from "viem/accounts";
import {
  createCreatorMetadataJson,
  MAX_CREATOR_IMAGE_BYTES,
} from "@/features/fame/creatorMetadata";
import { estimateCreatorImagesRemaining } from "@/features/fame/creatorUploadFunding";
import { liveClient as basePublicClient } from "@/viem/base-client";
import { buildNodeIrysUploader } from "@/service/irys_backend_client_node";
import {
  computeBufferedIrysPrice,
  toBigIntAmount,
  type IrysSponsoredUploader,
} from "@/service/irys_sponsored_upload";
import { CREATOR_UPLOAD_TAG_OVERHEAD_BYTES } from "@/service/creator_upload_authorization";
import type { CreatorUploadFundingSnapshot } from "@/features/fame/creatorUploadFunding";

const BASE_GAS_RESERVE_WEI = 21_000n * 20n;
const METADATA_UPLOAD_OVERHEAD_BYTES = 4_096;
const ESTIMATED_TRANSACTION_ID = "x".repeat(43);

export type CreatorUploadFundingEstimateInput = {
  imageBytes?: number;
  tokenId?: number;
};

function emptySnapshot(
  imageBytes: number | null,
  error: string | null = null,
): CreatorUploadFundingSnapshot {
  return {
    sponsorAddress: null,
    baseBalanceWei: null,
    baseBalanceEth: null,
    loadedIrysBalanceWei: null,
    loadedIrysBalanceEth: null,
    estimatedUploadWei: null,
    estimatedUploadEth: null,
    estimatedImages: null,
    imageBytes,
    baseGasReserveEth: formatEther(BASE_GAS_RESERVE_WEI),
    error,
  };
}

function safeImageBytes(imageBytes: number | undefined) {
  if (
    imageBytes === undefined ||
    !Number.isSafeInteger(imageBytes) ||
    imageBytes <= 0 ||
    imageBytes > MAX_CREATOR_IMAGE_BYTES
  ) {
    return null;
  }
  return imageBytes;
}

function safeTokenId(tokenId: number | undefined) {
  return tokenId !== undefined && Number.isSafeInteger(tokenId) && tokenId >= 0
    ? tokenId
    : 0;
}

async function estimateIrysUploadWei(
  uploader: IrysSponsoredUploader,
  imageBytes: number,
  tokenId: number,
) {
  const imagePrice = computeBufferedIrysPrice(
    toBigIntAmount(
      await uploader.getPrice(imageBytes + CREATOR_UPLOAD_TAG_OVERHEAD_BYTES),
    ),
  );
  const estimatedMetadata = createCreatorMetadataJson(
    tokenId,
    `https://gateway.irys.xyz/${ESTIMATED_TRANSACTION_ID}`,
  );
  const metadataBytes = new TextEncoder().encode(estimatedMetadata).byteLength;
  const metadataPrice = computeBufferedIrysPrice(
    toBigIntAmount(
      await uploader.getPrice(metadataBytes + METADATA_UPLOAD_OVERHEAD_BYTES),
    ),
  );
  return imagePrice + metadataPrice;
}

export async function getCreatorUploadFundingSnapshot(
  input: CreatorUploadFundingEstimateInput = {},
): Promise<CreatorUploadFundingSnapshot> {
  const imageBytes = safeImageBytes(input.imageBytes);
  const privateKey = process.env.METADATA_PRIVATE_KEY;
  if (!privateKey) {
    return emptySnapshot(imageBytes, "Upload funding status is unavailable.");
  }

  let sponsorAddress: Address;
  try {
    sponsorAddress = privateKeyToAccount(privateKey as `0x${string}`).address;
  } catch {
    return emptySnapshot(imageBytes, "Upload funding status is unavailable.");
  }

  let baseBalance: bigint | null = null;
  try {
    baseBalance = await getBalance(basePublicClient, {
      address: sponsorAddress,
    });
    let loadedIrysBalance: bigint | null = null;
    let estimatedUpload: bigint | null = null;
    if (imageBytes !== null) {
      const uploader = (await buildNodeIrysUploader({
        privateKey: privateKey as `0x${string}`,
      })) as unknown as IrysSponsoredUploader;
      loadedIrysBalance = toBigIntAmount(await uploader.getBalance());
      estimatedUpload = await estimateIrysUploadWei(
        uploader,
        imageBytes,
        safeTokenId(input.tokenId),
      );
    }

    return {
      sponsorAddress,
      baseBalanceWei: baseBalance.toString(),
      baseBalanceEth: formatEther(baseBalance),
      loadedIrysBalanceWei: loadedIrysBalance?.toString() ?? null,
      loadedIrysBalanceEth:
        loadedIrysBalance === null ? null : formatEther(loadedIrysBalance),
      estimatedUploadWei: estimatedUpload?.toString() ?? null,
      estimatedUploadEth: estimatedUpload ? formatEther(estimatedUpload) : null,
      estimatedImages: estimatedUpload
        ? estimateCreatorImagesRemaining(
            baseBalance,
            estimatedUpload,
            loadedIrysBalance ?? 0n,
          )
        : null,
      imageBytes,
      baseGasReserveEth: formatEther(BASE_GAS_RESERVE_WEI),
      error: null,
    };
  } catch (error) {
    console.error("[creator-upload] funding status failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      ...emptySnapshot(imageBytes, "Upload funding status is unavailable."),
      sponsorAddress,
      baseBalanceWei: baseBalance?.toString() ?? null,
      baseBalanceEth: baseBalance === null ? null : formatEther(baseBalance),
    };
  }
}
