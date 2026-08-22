import { reconcileSubmittedTransaction } from "./submittedTransactionState";

export type FrozenArtworkRelease = Readonly<{
  expectedTokenId: bigint;
  imageUri: string;
  metadataUri: string;
  imageCapability?: string;
  operationId?: string;
}>;

export type ReleaseFailureResolution = "complete" | "recover" | "block";

export async function resolveArtworkReleaseFailure(
  wasSubmitted: boolean,
  readReceiptStatus: () => Promise<"success" | "reverted">,
): Promise<ReleaseFailureResolution> {
  if (!wasSubmitted) return "recover";
  const status = await reconcileSubmittedTransaction(readReceiptStatus);
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
    ...(frozen.imageCapability
      ? { imageCapability: frozen.imageCapability }
      : {}),
    ...(frozen.operationId ? { operationId: frozen.operationId } : {}),
  };
}
