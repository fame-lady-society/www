"use client";

import type { PublicClient, WalletClient } from "viem";
import { getAddress, isAddressEqual } from "viem";
import {
  creatorContentHash,
  creatorImageTags,
  isSupportedCreatorImageType,
  validateCreatorImageDescriptor,
  type CreatorImageType,
  type CreatorMetadataUploadMode,
} from "@/features/fame/creatorMetadata";
import { getIrysUploader } from "@/service/irys_client";

export type CreatorImageAuthorization = {
  capability: string;
  operationId: string;
  sponsorAddress: `0x${string}`;
  expiresAt: number;
};

export type CreatorImageUploadResult = CreatorImageAuthorization & {
  imageUri: string;
  imageTxId: string;
  imageHash: string;
};

export type CreatorMetadataResult = {
  imageUri: string;
  metadataUri: string;
};

type BrowserIrysUploadReceipt = {
  id?: unknown;
  txid?: unknown;
  tx_id?: unknown;
  transactionId?: unknown;
};

type BrowserIrysUploader = {
  uploadFile: (
    file: File,
    options: {
      tags: { name: string; value: string }[];
      upload: { paidBy: string };
    },
  ) => Promise<
    BrowserIrysUploadReceipt & {
      data?: BrowserIrysUploadReceipt;
      receipt?: BrowserIrysUploadReceipt;
    }
  >;
};

const IRYS_TRANSACTION_ID_RE = /^[A-Za-z0-9_-]{43}$/;

function transactionIdFromResult(
  result: BrowserIrysUploadReceipt & {
    data?: BrowserIrysUploadReceipt;
    receipt?: BrowserIrysUploadReceipt;
  },
) {
  const candidates = [
    result.id,
    result.txid,
    result.tx_id,
    result.transactionId,
    result.data?.id,
    result.data?.txid,
    result.data?.tx_id,
    result.data?.transactionId,
    result.receipt?.id,
    result.receipt?.txid,
    result.receipt?.tx_id,
    result.receipt?.transactionId,
  ];
  const transactionId = candidates
    .map((value) => (typeof value === "string" ? value.trim() : null))
    .find((value): value is string => value !== null && IRYS_TRANSACTION_ID_RE.test(value));
  if (!transactionId) {
    console.error("[creator-upload] invalid Irys upload receipt", {
      keys: Object.keys(result),
      candidateTypes: [
        result.id,
        result.txid,
        result.tx_id,
        result.transactionId,
        result.data?.id,
        result.data?.txid,
        result.data?.tx_id,
        result.data?.transactionId,
        result.receipt?.id,
        result.receipt?.txid,
        result.receipt?.tx_id,
        result.receipt?.transactionId,
      ].map((value) => ({
        type: typeof value,
        length: typeof value === "string" ? value.length : undefined,
      })),
    });
    throw new Error("Irys upload returned an invalid transaction id");
  }
  return transactionId;
}

async function hashFile(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return { bytes, hash: creatorContentHash(bytes) };
}

export async function authorizeCreatorImage(input: {
  address: `0x${string}`;
  tokenId: number;
  mode: CreatorMetadataUploadMode;
  file: File;
}): Promise<CreatorImageAuthorization & { imageHash: string }> {
  const validationError = validateCreatorImageDescriptor({
    type: input.file.type,
    size: input.file.size,
  });
  if (validationError) throw new Error(validationError);
  if (!isSupportedCreatorImageType(input.file.type)) {
    throw new Error("Unsupported image type");
  }
  const { hash } = await hashFile(input.file);
  const response = await fetch("/api/fame/creator/metadata/authorize", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address: input.address,
      tokenId: input.tokenId,
      mode: input.mode,
      imageType: input.file.type,
      imageBytes: input.file.size,
      imageHash: hash,
    }),
  });
  if (!response.ok) {
    throw new Error(`Upload authorization failed: ${response.status}`);
  }
  const data = (await response.json()) as CreatorImageAuthorization;
  if (
    typeof data.capability !== "string" ||
    typeof data.operationId !== "string" ||
    typeof data.sponsorAddress !== "string" ||
    !Number.isSafeInteger(data.expiresAt)
  ) {
    throw new Error("Upload authorization response is invalid");
  }
  return { ...data, imageHash: hash };
}

export async function uploadCreatorImageWithUploader(input: {
  uploader: BrowserIrysUploader;
  address: `0x${string}`;
  tokenId: number;
  mode: CreatorMetadataUploadMode;
  file: File;
  authorization: CreatorImageAuthorization & { imageHash: string };
}): Promise<CreatorImageUploadResult> {
  const { bytes, hash } = await hashFile(input.file);
  if (bytes.byteLength !== input.file.size || hash !== input.authorization.imageHash) {
    throw new Error("Selected image changed after authorization");
  }
  const tags = creatorImageTags({
    operationId: input.authorization.operationId,
    creatorAddress: input.address,
    tokenId: input.tokenId,
    mode: input.mode,
    type: input.file.type as CreatorImageType,
    size: input.file.size,
    contentHash: hash,
  });
  const result = await input.uploader.uploadFile(input.file, {
    tags,
    upload: { paidBy: input.authorization.sponsorAddress },
  });
  const imageTxId = transactionIdFromResult(result);
  return {
    ...input.authorization,
    imageHash: hash,
    imageTxId,
    imageUri: `https://gateway.irys.xyz/${imageTxId}`,
  };
}

export async function uploadCreatorImage(input: {
  walletClient: WalletClient;
  publicClient: PublicClient;
  address: `0x${string}`;
  tokenId: number;
  mode: CreatorMetadataUploadMode;
  file: File;
  authorization: CreatorImageAuthorization & { imageHash: string };
}) {
  if (!input.walletClient.account) throw new Error("Wallet account unavailable");
  if (!isAddressEqual(getAddress(input.walletClient.account.address), input.address)) {
    throw new Error("Wallet changed during upload authorization");
  }
  if (input.walletClient.chain?.id !== 8453) {
    throw new Error("Switch to Base before uploading the creator image");
  }
  const uploader = await getIrysUploader(input.walletClient, input.publicClient);
  return uploadCreatorImageWithUploader({ ...input, uploader });
}

export async function finalizeCreatorMetadata(input: {
  address: `0x${string}`;
  tokenId: number;
  mode: CreatorMetadataUploadMode;
  imageUri: string;
  capability: string;
}): Promise<CreatorMetadataResult> {
  const response = await fetch("/api/fame/creator/metadata", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Metadata finalization failed: ${response.status} ${body}`);
  }
  const result = (await response.json()) as CreatorMetadataResult;
  if (typeof result.imageUri !== "string" || typeof result.metadataUri !== "string") {
    throw new Error("Metadata response is invalid");
  }
  return result;
}

export async function reauthorizeCreatorMetadata(input: {
  address: `0x${string}`;
  tokenId: number;
  mode: CreatorMetadataUploadMode;
  operationId: string;
  imageUri: string;
}): Promise<CreatorImageAuthorization> {
  const response = await fetch("/api/fame/creator/metadata/reauthorize", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(`Metadata reauthorization failed: ${response.status}`);
  }
  const result = (await response.json()) as CreatorImageAuthorization;
  if (
    typeof result.capability !== "string" ||
    typeof result.operationId !== "string" ||
    !Number.isSafeInteger(result.expiresAt)
  ) {
    throw new Error("Metadata reauthorization response is invalid");
  }
  return result;
}

export async function revokeCreatorImageAuthorization(capability: string) {
  await fetch("/api/fame/creator/metadata/revoke", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ capability }),
  });
}
