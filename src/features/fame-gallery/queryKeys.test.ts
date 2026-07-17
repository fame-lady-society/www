import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { QueryClient } from "@tanstack/react-query";
import { BASE_SEPOLIA_TEST_GALLERY_CONFIG } from "./config/baseSepoliaTestGallery";
import {
  GALLERY_CANONICAL_QUERY_OPTIONS,
  GALLERY_VISIBLE_TOKEN_BATCH_LIMIT,
  chunkGalleryTokenIds,
  galleryQueryKeys,
  invalidateGalleryToken,
} from "./queryKeys";

const identity = {
  chainId: BASE_SEPOLIA_TEST_GALLERY_CONFIG.chainId,
  galleryAddress: BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.gallery,
} as const;

describe("gallery query keys", () => {
  it("isolates global, token, account, authority, and pool projections", () => {
    const firstAccount = BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.admin;
    const secondAccount =
      BASE_SEPOLIA_TEST_GALLERY_CONFIG.addresses.smokeRecipient;

    assert.notDeepEqual(
      galleryQueryKeys.global(identity),
      galleryQueryKeys.token(identity, 1n),
    );
    assert.notDeepEqual(
      galleryQueryKeys.token(identity, 1n),
      galleryQueryKeys.token(identity, 2n),
    );
    assert.notDeepEqual(
      galleryQueryKeys.account(identity, firstAccount),
      galleryQueryKeys.account(identity, secondAccount),
    );
    assert.notDeepEqual(
      galleryQueryKeys.authority(identity, firstAccount),
      galleryQueryKeys.authority(identity, secondAccount),
    );
    assert.notDeepEqual(
      galleryQueryKeys.account(identity, firstAccount),
      galleryQueryKeys.account(
        { ...identity, chainId: identity.chainId + 1 },
        firstAccount,
      ),
    );
  });

  it("invalidates only the requested token", async () => {
    const queryClient = new QueryClient();
    const globalKey = galleryQueryKeys.global(identity);
    const firstTokenKey = galleryQueryKeys.token(identity, 1n);
    const secondTokenKey = galleryQueryKeys.token(identity, 2n);
    queryClient.setQueryData(globalKey, "global");
    queryClient.setQueryData(firstTokenKey, "first");
    queryClient.setQueryData(secondTokenKey, "second");

    await invalidateGalleryToken(queryClient, identity, 1n);

    assert.equal(queryClient.getQueryState(firstTokenKey)?.isInvalidated, true);
    assert.equal(
      queryClient.getQueryState(secondTokenKey)?.isInvalidated,
      false,
    );
    assert.equal(queryClient.getQueryState(globalKey)?.isInvalidated, false);
    queryClient.clear();
  });

  it("deduplicates equivalent in-flight reads through QueryClient", async () => {
    const queryClient = new QueryClient();
    let reads = 0;
    let release: (() => void) | undefined;
    const queryFn = async () => {
      reads += 1;
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return "complete";
    };
    const queryKey = galleryQueryKeys.global(identity);

    const first = queryClient.fetchQuery({ queryKey, queryFn });
    const second = queryClient.fetchQuery({ queryKey, queryFn });
    assert.equal(reads, 1);
    release?.();
    assert.deepEqual(await Promise.all([first, second]), [
      "complete",
      "complete",
    ]);
    queryClient.clear();
  });

  it("caps visible token batches and disables scheduled refresh", () => {
    const chunks = chunkGalleryTokenIds(
      Array.from({ length: 49 }, (_, index) => BigInt(index + 1)),
    );

    assert.deepEqual(
      chunks.map((chunk) => chunk.length),
      [GALLERY_VISIBLE_TOKEN_BATCH_LIMIT, GALLERY_VISIBLE_TOKEN_BATCH_LIMIT, 1],
    );
    assert.equal(GALLERY_CANONICAL_QUERY_OPTIONS.staleTime, Infinity);
    assert.equal(GALLERY_CANONICAL_QUERY_OPTIONS.refetchInterval, false);
    assert.equal(GALLERY_CANONICAL_QUERY_OPTIONS.refetchOnWindowFocus, false);
    assert.equal(GALLERY_CANONICAL_QUERY_OPTIONS.refetchOnReconnect, false);
  });
});
