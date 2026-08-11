export type FrozenArtworkRelease = Readonly<{
  expectedTokenId: bigint;
  imageUri: string;
  metadataUri: string;
}>;

export type SubmittedReleaseStatus = "success" | "reverted" | "unknown";
export type ReleaseFailureResolution = "complete" | "recover" | "block";

export function createArtworkReleaseSingleFlight() {
  let active = false;

  return async (task: () => Promise<void>): Promise<boolean> => {
    if (active) return false;
    active = true;
    try {
      await task();
      return true;
    } finally {
      active = false;
    }
  };
}

export async function reconcileSubmittedArtworkRelease(
  readReceiptStatus: () => Promise<"success" | "reverted">,
): Promise<SubmittedReleaseStatus> {
  try {
    return await readReceiptStatus();
  } catch {
    return "unknown";
  }
}

export async function resolveArtworkReleaseFailure(
  wasSubmitted: boolean,
  readReceiptStatus: () => Promise<"success" | "reverted">,
): Promise<ReleaseFailureResolution> {
  if (!wasSubmitted) return "recover";
  const status = await reconcileSubmittedArtworkRelease(readReceiptStatus);
  if (status === "success") return "complete";
  if (status === "reverted") return "recover";
  return "block";
}

export async function recoverContendedArtworkRelease(
  frozen: FrozenArtworkRelease,
  readNextTokenId: () => Promise<bigint>,
  regenerateMetadata: (input: {
    expectedTokenId: bigint;
    imageUri: string;
  }) => Promise<string>,
): Promise<FrozenArtworkRelease | null> {
  const nextTokenId = await readNextTokenId();
  if (nextTokenId === frozen.expectedTokenId) return null;

  return {
    expectedTokenId: nextTokenId,
    imageUri: frozen.imageUri,
    metadataUri: await regenerateMetadata({
      expectedTokenId: nextTokenId,
      imageUri: frozen.imageUri,
    }),
  };
}
