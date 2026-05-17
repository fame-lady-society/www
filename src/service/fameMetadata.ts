export const FAME_METADATA_FALLBACK_IMAGE =
  "/images/fame/gold-leaf-square.png";

export function irysGatewayToArweaveUrl(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || url.hostname !== "gateway.irys.xyz") {
    return null;
  }

  return `https://arweave.net${url.pathname}${url.search}`;
}

export function fameMetadataFetchUrls(uri: string): string[] {
  const arweaveUrl = irysGatewayToArweaveUrl(uri);
  if (!arweaveUrl) return [uri];

  return [arweaveUrl, uri];
}

export function normalizeFameImageUrl(image: string): string {
  return irysGatewayToArweaveUrl(image) ?? image;
}

export function imageFromFameMetadata(metadata: unknown): string {
  if (
    metadata === null ||
    typeof metadata !== "object" ||
    !("image" in metadata)
  ) {
    throw new Error("FAME metadata is missing an image field");
  }

  const { image } = metadata;
  if (typeof image !== "string" || image.length === 0) {
    throw new Error("FAME metadata image must be a non-empty string");
  }

  return normalizeFameImageUrl(image);
}
