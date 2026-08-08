export const FAME_METADATA_FALLBACK_IMAGE = "/images/fame/gold-leaf-square.png";

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

  return image;
}
