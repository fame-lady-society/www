export type CreatorMetadataUploadMode = "art" | "end" | "update";

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

export const CREATOR_METADATA_UPLOAD_MODES = ["art", "end", "update"] as const;

export function isCreatorMetadataUploadMode(
  mode: unknown,
): mode is CreatorMetadataUploadMode {
  return mode === "art" || mode === "end" || mode === "update";
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
    case "update":
      return roles.isCreator;
  }
}

export function createCreatorMetadataJson(tokenId: number, imageUrl: string) {
  return JSON.stringify({
    name: `FAME Society #${tokenId}`,
    image: imageUrl,
    description:
      "Experience the innovative $FAME token from the Fame Lady Society, a DN404 project seamlessly integrating ERC20 and ERC721 standards. Each $FAME token is part of a revolutionary system where owning multiples of 1 million $FAME automatically mints a rare and exclusive Society NFT to your wallet. These NFTs, backed by 1 million $FAME tokens each, merge the worlds of liquidity and ownership, offering both stability and exclusivity.\n\nWhen you hold a Society NFT, you're not just an owner; you're part of a vibrant, empowering community dedicated to transparency, community governance, and women's empowerment in Web3. Selling any portion of the associated 1 million $FAME will cause the NFT to vanish, reflecting the unique balance of value and rarity within the Fame Lady Society ecosystem.\n\nThe Fame Lady Society, born from the pioneering all-female generative PFP project, continues to push boundaries by promoting true decentralization and sustainability. Fame Lady Society's mission is to transform Web3 into 'webWE,' ensuring every member has a voice in shaping the future. Join us in this exciting journey and redefine how NFTs and tokens can be traded and gamified.",
  });
}
