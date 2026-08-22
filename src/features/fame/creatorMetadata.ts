import { getAddress, isAddress, keccak256 } from "viem";
import { isFameCollectionTokenId } from "./collection";

export const CREATOR_METADATA_UPLOAD_MODES = [
  "art",
  "end",
  "release",
  "update",
] as const;

export type CreatorMetadataUploadMode =
  (typeof CREATOR_METADATA_UPLOAD_MODES)[number];

export const MAX_CREATOR_IMAGE_BYTES = 12 * 1024 * 1024;
export const CREATOR_IMAGE_TYPES = [
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export type CreatorImageType = (typeof CREATOR_IMAGE_TYPES)[number];
export const CREATOR_UPLOAD_APPLICATION_ID = "fame-creator-metadata-v2";

export const CREATOR_UPLOAD_TAGS = {
  application: "App-Name",
  operation: "Fame-Creator-Operation",
  creator: "Fame-Creator-Address",
  token: "Fame-Creator-Token",
  mode: "Fame-Creator-Mode",
  purpose: "Fame-Creator-Purpose",
  contentHash: "Content-Hash",
  contentLength: "Content-Length",
  contentType: "Content-Type",
} as const;

export type CreatorUploadTag = {
  name: string;
  value: string;
};

export type CreatorImageDescriptor = {
  type: string;
  size: number;
};

export function isSupportedCreatorImageType(
  type: unknown,
): type is CreatorImageType {
  return (
    typeof type === "string" &&
    (CREATOR_IMAGE_TYPES as readonly string[]).includes(type)
  );
}

export function validateCreatorImageDescriptor(
  descriptor: CreatorImageDescriptor,
): string | null {
  if (!isSupportedCreatorImageType(descriptor.type)) {
    return "Unsupported image type";
  }
  if (!Number.isSafeInteger(descriptor.size) || descriptor.size <= 0) {
    return "Invalid image size";
  }
  if (descriptor.size > MAX_CREATOR_IMAGE_BYTES) {
    return "Image exceeds the 12 MB limit";
  }
  return null;
}

export function normalizeCreatorAddress(value: string): `0x${string}` {
  if (!isAddress(value)) throw new Error("Invalid creator address");
  return getAddress(value) as `0x${string}`;
}

export function creatorContentHash(bytes: Uint8Array): string {
  return keccak256(bytes).slice(2).toLowerCase();
}

export function creatorImageTags(input: {
  operationId: string;
  creatorAddress: string;
  tokenId: number;
  mode: CreatorMetadataUploadMode;
  type: CreatorImageType;
  size: number;
  contentHash: string;
}): CreatorUploadTag[] {
  return [
    {
      name: CREATOR_UPLOAD_TAGS.application,
      value: CREATOR_UPLOAD_APPLICATION_ID,
    },
    { name: CREATOR_UPLOAD_TAGS.operation, value: input.operationId },
    {
      name: CREATOR_UPLOAD_TAGS.creator,
      value: normalizeCreatorAddress(input.creatorAddress).toLowerCase(),
    },
    { name: CREATOR_UPLOAD_TAGS.token, value: String(input.tokenId) },
    { name: CREATOR_UPLOAD_TAGS.mode, value: input.mode },
    { name: CREATOR_UPLOAD_TAGS.purpose, value: "image" },
    { name: CREATOR_UPLOAD_TAGS.contentType, value: input.type },
    { name: CREATOR_UPLOAD_TAGS.contentLength, value: String(input.size) },
    { name: CREATOR_UPLOAD_TAGS.contentHash, value: input.contentHash },
  ];
}

export function creatorMetadataTags(input: {
  operationId: string;
  creatorAddress: string;
  tokenId: number;
  mode: CreatorMetadataUploadMode;
  content: string;
  imageUri: string;
}): CreatorUploadTag[] {
  const bytes = new TextEncoder().encode(input.content);
  return [
    {
      name: CREATOR_UPLOAD_TAGS.application,
      value: CREATOR_UPLOAD_APPLICATION_ID,
    },
    { name: CREATOR_UPLOAD_TAGS.operation, value: input.operationId },
    {
      name: CREATOR_UPLOAD_TAGS.creator,
      value: normalizeCreatorAddress(input.creatorAddress).toLowerCase(),
    },
    { name: CREATOR_UPLOAD_TAGS.token, value: String(input.tokenId) },
    { name: CREATOR_UPLOAD_TAGS.mode, value: input.mode },
    { name: CREATOR_UPLOAD_TAGS.purpose, value: "metadata" },
    { name: CREATOR_UPLOAD_TAGS.contentType, value: "application/json" },
    {
      name: CREATOR_UPLOAD_TAGS.contentLength,
      value: String(bytes.byteLength),
    },
    { name: CREATOR_UPLOAD_TAGS.contentHash, value: creatorContentHash(bytes) },
    { name: "Fame-Creator-Image-Uri", value: input.imageUri },
  ];
}

export function findCreatorTag(
  tags: readonly CreatorUploadTag[],
  name: string,
): string | null {
  const matches = tags.filter((tag) => tag.name === name);
  if (matches.length !== 1) return null;
  return matches[0]?.value ?? null;
}

export type CreatorPortalRoles = {
  isCreator: boolean;
  isBanisher: boolean;
  isArtPoolManager: boolean;
  hasAnyRole: boolean;
  raw: number;
};

const ROLE_CREATOR = 1n << 1n;
const ROLE_BANISHER = 1n << 2n;
const ROLE_ART_POOL_MANAGER = 1n << 3n;

export function isCreatorMetadataUploadMode(
  mode: unknown,
): mode is CreatorMetadataUploadMode {
  return CREATOR_METADATA_UPLOAD_MODES.some((candidate) => candidate === mode);
}

export function decodeCreatorPortalRoles(roles?: bigint): CreatorPortalRoles {
  const bitmask = roles ?? 0n;
  const isCreator = (bitmask & ROLE_CREATOR) !== 0n;
  const isBanisher = (bitmask & ROLE_BANISHER) !== 0n;
  const isArtPoolManager = (bitmask & ROLE_ART_POOL_MANAGER) !== 0n;

  return {
    isCreator,
    isBanisher,
    isArtPoolManager,
    hasAnyRole: isCreator || isBanisher || isArtPoolManager,
    raw: Number(bitmask),
  };
}

export function canUploadCreatorMetadata(
  roles: CreatorPortalRoles,
  mode: CreatorMetadataUploadMode,
) {
  switch (mode) {
    case "art":
      return roles.isCreator || roles.isArtPoolManager;
    case "end":
      return roles.isCreator || roles.isBanisher;
    case "release":
      return roles.isCreator;
    case "update":
      return roles.isCreator;
  }
}

export function isReleasedCreatorUpdateToken(
  tokenId: number,
  nextTokenId: number | bigint,
) {
  return (
    Number.isSafeInteger(tokenId) &&
    isFameCollectionTokenId(tokenId) &&
    BigInt(tokenId) < BigInt(nextTokenId)
  );
}

export function createCreatorMetadataJson(tokenId: number, imageUrl: string) {
  return JSON.stringify({
    name: `FAME Society #${tokenId}`,
    image: imageUrl,
    description:
      "Experience the innovative $FAME token from the Fame Lady Society, a DN404 project seamlessly integrating ERC20 and ERC721 standards. Each $FAME token is part of a revolutionary system where owning multiples of 1 million $FAME automatically mints a rare and exclusive Society NFT to your wallet. These NFTs, backed by 1 million $FAME tokens each, merge the worlds of liquidity and ownership, offering both stability and exclusivity.\n\nWhen you hold a Society NFT, you're not just an owner; you're part of a vibrant, empowering community dedicated to transparency, community governance, and women's empowerment in Web3. Selling any portion of the associated 1 million $FAME will cause the NFT to vanish, reflecting the unique balance of value and rarity within the Fame Lady Society ecosystem.\n\nThe Fame Lady Society, born from the pioneering all-female generative PFP project, continues to push boundaries by promoting true decentralization and sustainability. Fame Lady Society's mission is to transform Web3 into 'webWE,' ensuring every member has a voice in shaping the future. Join us in this exciting journey and redefine how NFTs and tokens can be traded and gamified.",
  });
}
