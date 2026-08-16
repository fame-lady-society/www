"use client";

import { useId, useState } from "react";
import { useConnection, usePublicClient, useSwitchChain, useWalletClient } from "wagmi";
import { base } from "viem/chains";
import {
  MAX_CREATOR_IMAGE_BYTES,
  isSupportedCreatorImageType,
  validateCreatorImageDescriptor,
  type CreatorMetadataUploadMode,
} from "@/features/fame/creatorMetadata";
import { useSiweSession } from "@/context/SiweSession";
import {
  authorizeCreatorImage,
  finalizeCreatorMetadata,
  revokeCreatorImageAuthorization,
  uploadCreatorImage,
  type CreatorImageUploadResult,
  type CreatorMetadataResult,
} from "@/service/creator_irys_upload";

type SponsoredCreatorMetadataUploaderProps = {
  address: `0x${string}`;
  tokenId: number;
  mode: CreatorMetadataUploadMode;
  onComplete: (result: SponsoredCreatorMetadataResult) => void;
};

export type SponsoredCreatorMetadataResult = CreatorMetadataResult & {
  imageCapability?: string;
  operationId?: string;
};

export type SponsoredCreatorUploadState =
  | "idle"
  | "preparing"
  | "switching"
  | "awaiting_signature"
  | "uploading"
  | "finalizing"
  | "done"
  | "cancelled"
  | "error";

function isWalletRejection(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: number; name?: string };
  return (
    candidate.code === 4001 ||
    candidate.name === "UserRejectedRequestError" ||
    candidate.name === "UserRejectedRequestErrorType"
  );
}

function errorMessage(error: unknown) {
  if (isWalletRejection(error)) {
    return "Upload signature cancelled. Nothing was uploaded; you can try again.";
  }
  return error instanceof Error ? error.message : "Sponsored upload failed.";
}

function stateCopy(state: SponsoredCreatorUploadState, signedIn: boolean) {
  switch (state) {
    case "preparing":
      return "Preparing a capped sponsor authorization…";
    case "switching":
      return "Switching to Base…";
    case "awaiting_signature":
      return "Approve the image signature in your wallet. FLS pays Irys storage; this is not a gas-funded sponsor transaction.";
    case "uploading":
      return "Uploading the image directly to Irys…";
    case "finalizing":
      return "Finalizing metadata…";
    case "done":
      return "Metadata URI ready.";
    case "cancelled":
      return "Signature cancelled. Try again when ready.";
    case "error":
      return "Upload failed. Your image URI is retained when available.";
    default:
      return signedIn
        ? "Your wallet will sign the image; FLS sponsors the Irys upload."
        : "Sign in with Ethereum on Base before uploading. The image will upload directly to Irys.";
  }
}

function isBusy(state: SponsoredCreatorUploadState) {
  return [
    "preparing",
    "switching",
    "awaiting_signature",
    "uploading",
    "finalizing",
  ].includes(state);
}

export function SponsoredCreatorMetadataUploader({
  address,
  tokenId,
  mode,
  onComplete,
}: SponsoredCreatorMetadataUploaderProps) {
  const inputId = useId();
  const { isSignedIn, signIn } = useSiweSession();
  const connection = useConnection();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId: base.id });
  const { mutateAsync: switchChain } = useSwitchChain();
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<SponsoredCreatorUploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [imageUpload, setImageUpload] = useState<CreatorImageUploadResult | null>(null);
  const [metadataUri, setMetadataUri] = useState<string | null>(null);

  const busy = isBusy(state);

  const resetForFile = (nextFile: File | null) => {
    if (imageUpload) {
      void revokeCreatorImageAuthorization(imageUpload.capability).catch(
        (revokeError) => {
          console.error("[creator-upload] file-change revoke failed", revokeError);
        },
      );
    }
    setFile(nextFile);
    setState("idle");
    setError(null);
    setImageUpload(null);
    setMetadataUri(null);
  };

  const validateFile = (selectedFile: File) => {
    if (!isSupportedCreatorImageType(selectedFile.type)) {
      return "Choose a PNG, JPG, GIF, or WebP image.";
    }
    return validateCreatorImageDescriptor({
      type: selectedFile.type,
      size: selectedFile.size,
    });
  };

  const finalize = async (
    upload: CreatorImageUploadResult,
  ): Promise<CreatorMetadataResult> => {
    setState("finalizing");
    const result = await finalizeCreatorMetadata({
      address,
      tokenId,
      mode,
      imageUri: upload.imageUri,
      capability: upload.capability,
    });
    setMetadataUri(result.metadataUri);
    setState("done");
    onComplete({
      ...result,
      imageCapability: upload.capability,
      operationId: upload.operationId,
    });
    return result;
  };

  const handleUpload = async () => {
    if (!file || busy) return;
    const fileError = validateFile(file);
    if (fileError) {
      setState("error");
      setError(fileError);
      return;
    }
    if (!isSignedIn) {
      setError("Sign in with Ethereum on Base before uploading metadata.");
      setState("error");
      return;
    }
    if (!walletClient || !publicClient) {
      setError("Connect your wallet before uploading.");
      setState("error");
      return;
    }
    if (connection.chainId !== base.id) {
      setState("switching");
      try {
        await switchChain({ chainId: base.id });
        setState("idle");
        setError("Switched to Base. Click the upload button again to approve the image signature.");
        return;
      } catch (switchError) {
        setState(isWalletRejection(switchError) ? "cancelled" : "error");
        setError(errorMessage(switchError));
        return;
      }
    }

    setError(null);
    setMetadataUri(null);
    setState("preparing");
    let authorization: (Awaited<ReturnType<typeof authorizeCreatorImage>>) | null = null;
    let completedUpload: CreatorImageUploadResult | null = null;
    try {
      authorization = await authorizeCreatorImage({
        address,
        tokenId,
        mode,
        file,
      });
      setState("awaiting_signature");
      const upload = await uploadCreatorImage({
        walletClient,
        publicClient,
        address,
        tokenId,
        mode,
        file,
        authorization,
      });
      setImageUpload(upload);
      completedUpload = upload;
      await finalize(upload);
    } catch (uploadError) {
      if (authorization && !completedUpload) {
        try {
          await revokeCreatorImageAuthorization(authorization.capability);
        } catch (revokeError) {
          console.error("[creator-upload] client revoke failed", revokeError);
        }
      }
      setState(isWalletRejection(uploadError) ? "cancelled" : "error");
      setError(errorMessage(uploadError));
    }
  };

  const retryMetadata = async () => {
    if (!imageUpload || busy) return;
    setError(null);
    try {
      await finalize(imageUpload);
    } catch (retryError) {
      setState("error");
      setError(errorMessage(retryError));
    }
  };

  const limitLabel = `${Math.floor(MAX_CREATOR_IMAGE_BYTES / (1024 * 1024))} MB`;

  return (
    <div className="rounded-md border border-gray-200 bg-white/60 p-3">
      <div className="space-y-3">
        <div>
          <label htmlFor={inputId} className="mb-2 block text-sm font-medium">
            Image for generated metadata
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            disabled={busy}
            onChange={(event) => resetForFile(event.currentTarget.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-700 file:mr-3 file:rounded file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-700 disabled:opacity-60"
          />
          <p className="mt-1 text-xs text-gray-500">
            PNG, JPG, GIF, or WebP up to {limitLabel}. Uploads go directly to Irys.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!isSignedIn && (
            <button
              type="button"
              onClick={() => void signIn?.()}
              disabled={busy}
              className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              Sign in
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleUpload()}
            disabled={!file || busy || !isSignedIn}
            className="rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {busy ? "Working…" : "Approve sponsored image upload"}
          </button>
          <span className="text-sm text-gray-600" role="status">
            {stateCopy(state, isSignedIn)}
          </span>
        </div>

        {error && (
          <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {imageUpload && (
          <div className="text-sm">
            <div className="text-xs text-gray-500">Image URI</div>
            <div className="break-words text-gray-800">{imageUpload.imageUri}</div>
          </div>
        )}
        {metadataUri && (
          <div className="text-sm">
            <div className="text-xs text-gray-500">Metadata URI</div>
            <div className="break-words text-gray-800">{metadataUri}</div>
          </div>
        )}
        {imageUpload && !metadataUri && state === "error" && (
          <button
            type="button"
            onClick={() => void retryMetadata()}
            className="rounded border border-indigo-600 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
          >
            Retry metadata only
          </button>
        )}
      </div>
    </div>
  );
}
