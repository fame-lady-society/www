import {
  FAME_METADATA_FALLBACK_IMAGE,
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

function validatedAuctionImage(metadata: unknown): string {
  // Reuse the shared FAME validator, but preserve the source URL. Current Irys
  // transactions redirect to typed media while their arweave.net mirrors can
  // resolve to HTML, which Next/Image correctly refuses to render.
  imageFromFameMetadata(metadata);
  return (metadata as { image: string }).image;
}

export async function loadSocietyNftMetadata(
  tokenUri: string,
  fetchMetadata: MetadataFetch = fetch,
  timeoutMs = 10_000,
): Promise<SocietyNftAuctionMetadata> {
  if (tokenUri.trim().length === 0) {
    return societyNftMetadataFallback("Society NFT token URI is unavailable");
  }

  try {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const response = await Promise.race([
      fetchMetadata(tokenUri.trim()),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Society NFT metadata request timed out")),
          timeoutMs,
        );
      }),
    ]).finally(() => clearTimeout(timeout));
    if (!response.ok) {
      return societyNftMetadataFallback("Society NFT metadata is unavailable");
    }

    const metadata: unknown = await response.json();
    if (metadata === null || typeof metadata !== "object") {
      return societyNftMetadataFallback(
        "Society NFT metadata does not contain a usable image",
      );
    }

    try {
      const record = metadata as Record<string, unknown>;
      return {
        image: validatedAuctionImage(metadata),
        name: optionalMetadataString(record, "name"),
        description: optionalMetadataString(record, "description"),
        error: null,
      };
    } catch {
      return societyNftMetadataFallback(
        "Society NFT metadata does not contain a usable image",
      );
    }
  } catch {
    return societyNftMetadataFallback("Society NFT metadata is unavailable");
  }
}
