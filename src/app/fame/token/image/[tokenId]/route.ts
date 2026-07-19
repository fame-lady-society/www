import { client as baseClient } from "@/viem/base-client";
import {
  fameMetadataFetchUrls,
  imageFromFameMetadata,
} from "@/service/fameMetadata";
import { creatorArtistMagicAddress } from "@/features/fame/contract";
import { unstable_cache } from "next/cache";
import { base } from "viem/chains";
import { creatorArtistMagicAbi } from "@/wagmi";

const TOKEN_IMAGE_REVALIDATE_SECONDS = 60 * 60;
const UPSTREAM_TIMEOUT_MS = 10_000;

type TokenImageDependencies = {
  readTokenUri: (tokenId: bigint) => Promise<string>;
  fetchResource: typeof fetch;
};

const defaultDependencies: TokenImageDependencies = {
  readTokenUri: (tokenId) =>
    baseClient.readContract({
      abi: creatorArtistMagicAbi,
      address: creatorArtistMagicAddress(base.id),
      functionName: "tokenURI",
      args: [tokenId],
    }),
  fetchResource: fetch,
};

async function resolveTokenImageUrl(
  tokenId: string,
  dependencies: TokenImageDependencies,
) {
  const tokenUri = await dependencies.readTokenUri(BigInt(tokenId));
  let lastError: unknown;

  for (const metadataUrl of fameMetadataFetchUrls(tokenUri)) {
    try {
      const metadataResponse = await dependencies.fetchResource(metadataUrl, {
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      });
      if (!metadataResponse.ok) {
        throw new Error(
          `Metadata request failed with ${metadataResponse.status} ${metadataResponse.statusText}`,
        );
      }

      return imageFromFameMetadata(await metadataResponse.json());
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to resolve token image");
}

const resolveCachedTokenImageUrl = unstable_cache(
  (tokenId: string) => resolveTokenImageUrl(tokenId, defaultDependencies),
  ["fame-token-image-url"],
  { revalidate: TOKEN_IMAGE_REVALIDATE_SECONDS },
);

async function fetchTokenImage(
  tokenImageUrl: string,
  fetchResource: typeof fetch,
) {
  const imageResponse = await fetchResource(tokenImageUrl, {
    next: {
      revalidate: 0,
    },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  if (!imageResponse.ok) {
    throw new Error(
      `Image request failed with ${imageResponse.status} ${imageResponse.statusText}`,
    );
  }

  return new Response(imageResponse.body, {
    headers: {
      "Cache-Control": `public, s-maxage=${TOKEN_IMAGE_REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
      "Content-Type": imageResponse.headers.get("Content-Type") || "",
    },
  });
}

export async function handleTokenImageRequest(
  tokenId: string,
  dependencies: TokenImageDependencies = defaultDependencies,
) {
  const tokenImageUrl = await resolveTokenImageUrl(tokenId, dependencies);
  return fetchTokenImage(tokenImageUrl, dependencies.fetchResource);
}

export async function GET(
  _request: Request,
  props: { params: Promise<{ tokenId: string }> },
) {
  const params = await props.params;
  const tokenImageUrl = await resolveCachedTokenImageUrl(params.tokenId);
  return fetchTokenImage(tokenImageUrl, defaultDependencies.fetchResource);
}
