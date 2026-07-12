import {
  FAME_METADATA_FALLBACK_IMAGE,
  fameMetadataFetchUrls,
  imageFromFameMetadata,
} from "../../service/fameMetadata";
import type { SocietyNftAuctionMetadata } from "./types";

type MetadataFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export function societyNftMetadataFallback(
  error: string,
): SocietyNftAuctionMetadata {
  return {
    image: FAME_METADATA_FALLBACK_IMAGE,
    name: null,
    description: null,
    error,
  };
}

function optionalMetadataString(
  metadata: Record<string, unknown>,
  field: "name" | "description",
): string | null {
  const value = metadata[field];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export async function loadSocietyNftMetadata(
  tokenUri: string,
  fetchMetadata: MetadataFetch = fetch,
): Promise<SocietyNftAuctionMetadata> {
  if (tokenUri.trim().length === 0) {
    return societyNftMetadataFallback("Society NFT token URI is unavailable");
  }

  let foundMetadataWithoutImage = false;

  for (const url of fameMetadataFetchUrls(tokenUri)) {
    try {
      const response = await fetchMetadata(url);
      if (!response.ok) continue;

      const metadata: unknown = await response.json();
      if (metadata === null || typeof metadata !== "object") {
        foundMetadataWithoutImage = true;
        continue;
      }

      try {
        const record = metadata as Record<string, unknown>;
        return {
          image: imageFromFameMetadata(metadata),
          name: optionalMetadataString(record, "name"),
          description: optionalMetadataString(record, "description"),
          error: null,
        };
      } catch {
        foundMetadataWithoutImage = true;
      }
    } catch {
      // Try the next normalized/original token URI before using local artwork.
    }
  }

  return societyNftMetadataFallback(
    foundMetadataWithoutImage
      ? "Society NFT metadata does not contain a usable image"
      : "Society NFT metadata is unavailable",
  );
}
