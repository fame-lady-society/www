import { isFameCollectionTokenId } from "@/features/fame/collection";

export type PendingMetadataUpdate = Readonly<{
  account: `0x${string}`;
  tokenId: number;
  metadataUrl: string;
  hash: `0x${string}`;
  submittedAt: number;
}>;

export function parsePendingMetadataUpdate(
  value: string | null,
  expectedAccount: string,
): PendingMetadataUpdate | null {
  if (!value) return null;
  try {
    const candidate = JSON.parse(value) as Partial<PendingMetadataUpdate>;
    if (
      typeof candidate.account !== "string" ||
      candidate.account.toLowerCase() !== expectedAccount.toLowerCase() ||
      !Number.isSafeInteger(candidate.tokenId) ||
      !isFameCollectionTokenId(candidate.tokenId ?? 0) ||
      typeof candidate.metadataUrl !== "string" ||
      candidate.metadataUrl.length === 0 ||
      typeof candidate.hash !== "string" ||
      !/^0x[0-9a-fA-F]{64}$/.test(candidate.hash) ||
      !Number.isSafeInteger(candidate.submittedAt) ||
      (candidate.submittedAt ?? 0) <= 0
    ) {
      return null;
    }
    return candidate as PendingMetadataUpdate;
  } catch {
    return null;
  }
}

export function createLatestRequestGuard() {
  let latest = 0;
  return {
    begin() {
      latest += 1;
      return latest;
    },
    invalidate() {
      latest += 1;
    },
    isCurrent(requestId: number) {
      return requestId === latest;
    },
  };
}

export function matchesSubmittedMetadataUrl(
  revision: { tokenUri: string } | null,
  submittedMetadataUrl: string,
) {
  return revision?.tokenUri === submittedMetadataUrl;
}

export function isUsableSubmittedMetadataRefresh(
  artwork: {
    revision: { tokenUri: string } | null;
    metadata: { status: string };
  },
  submittedMetadataUrl: string,
) {
  return (
    matchesSubmittedMetadataUrl(artwork.revision, submittedMetadataUrl) &&
    artwork.metadata.status === "ready"
  );
}
