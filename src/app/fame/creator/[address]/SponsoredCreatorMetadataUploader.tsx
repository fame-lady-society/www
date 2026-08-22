"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  useConnection,
  usePublicClient,
  useSwitchChain,
  useWalletClient,
} from "wagmi";
import { base } from "viem/chains";
import {
  MAX_CREATOR_IMAGE_BYTES,
  isSupportedCreatorImageType,
  validateCreatorImageDescriptor,
  type CreatorMetadataUploadMode,
} from "@/features/fame/creatorMetadata";
import { useSiweSession } from "@/context/SiweSession";
import { CopyToClipboard } from "@/components/CopyToClipboard";
import type { CreatorUploadFundingSnapshot } from "@/features/fame/creatorUploadFunding";
import {
  authorizeCreatorImage,
  finalizeCreatorMetadata,
  reauthorizeCreatorMetadata,
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
  initialFunding?: CreatorUploadFundingSnapshot;
  resetKey?: number;
  onBusyChange?: (busy: boolean) => void;
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

function formatImageSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function SponsoredCreatorMetadataUploader({
  address,
  tokenId,
  mode,
  onComplete,
  initialFunding,
  resetKey,
  onBusyChange,
}: SponsoredCreatorMetadataUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const imageUploadRef = useRef<CreatorImageUploadResult | null>(null);
  const previousResetKey = useRef(resetKey);
  const { isSignedIn, signIn } = useSiweSession();
  const connection = useConnection();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId: base.id });
  const { mutateAsync: switchChain } = useSwitchChain();
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<SponsoredCreatorUploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [imageUpload, setImageUpload] =
    useState<CreatorImageUploadResult | null>(null);
  const [metadataUri, setMetadataUri] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [funding, setFunding] = useState<CreatorUploadFundingSnapshot | null>(
    initialFunding ?? null,
  );
  const [fundingLoading, setFundingLoading] = useState(false);
  const fundingRequestId = useRef(0);
  const mounted = useRef(true);

  const busy = isBusy(state);

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refreshFunding = useCallback(
    async (selectedImageBytes?: number) => {
      const requestId = fundingRequestId.current + 1;
      fundingRequestId.current = requestId;
      setFundingLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedImageBytes !== undefined) {
          params.set("imageBytes", String(selectedImageBytes));
          params.set("tokenId", String(tokenId));
        }
        const response = await fetch(
          `/api/fame/creator/metadata/funding?${params.toString()}`,
          { credentials: "same-origin", cache: "no-store" },
        );
        if (!response.ok) {
          throw new Error(`Funding status failed: ${response.status}`);
        }
        const nextFunding =
          (await response.json()) as CreatorUploadFundingSnapshot;
        if (requestId === fundingRequestId.current) setFunding(nextFunding);
      } catch (fundingError) {
        console.error(
          "[creator-upload] client funding refresh failed",
          fundingError,
        );
      } finally {
        if (requestId === fundingRequestId.current) setFundingLoading(false);
      }
    },
    [tokenId],
  );

  useEffect(() => {
    if (!file) return;
    void refreshFunding(file.size);
  }, [file, refreshFunding]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);
    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [file]);

  useEffect(() => {
    if (previousResetKey.current === resetKey) return;
    previousResetKey.current = resetKey;

    const currentUpload = imageUploadRef.current;
    if (currentUpload) {
      void revokeCreatorImageAuthorization(currentUpload.capability).catch(
        (revokeError) => {
          console.error(
            "[creator-upload] release reset revoke failed",
            revokeError,
          );
        },
      );
    }
    imageUploadRef.current = null;
    if (inputRef.current) inputRef.current.value = "";
    setFile(null);
    setState("idle");
    setError(null);
    setImageUpload(null);
    setMetadataUri(null);
    void refreshFunding();
  }, [refreshFunding, resetKey]);

  const resetForFile = (nextFile: File | null) => {
    const currentUpload = imageUploadRef.current;
    if (currentUpload) {
      void revokeCreatorImageAuthorization(currentUpload.capability).catch(
        (revokeError) => {
          console.error(
            "[creator-upload] file-change revoke failed",
            revokeError,
          );
        },
      );
    }
    imageUploadRef.current = null;
    setFile(nextFile);
    setState("idle");
    setError(null);
    setImageUpload(null);
    setMetadataUri(null);
  };

  const resetEverything = () => {
    const currentUpload = imageUploadRef.current;
    if (currentUpload) {
      void revokeCreatorImageAuthorization(currentUpload.capability).catch(
        (revokeError) => {
          console.error("[creator-upload] reset revoke failed", revokeError);
        },
      );
    }
    imageUploadRef.current = null;
    if (inputRef.current) inputRef.current.value = "";
    setFile(null);
    setState("idle");
    setError(null);
    setImageUpload(null);
    setMetadataUri(null);
    void refreshFunding();
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
    if (mounted.current) {
      onComplete({
        ...result,
        imageCapability: upload.capability,
        operationId: upload.operationId,
      });
    }
    void refreshFunding(file?.size);
    return result;
  };

  const handleUpload = async () => {
    if (!file || busy || imageUpload) return;
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
        setError(
          "Switched to Base. Click the upload button again to approve the image signature.",
        );
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
    let authorization: Awaited<
      ReturnType<typeof authorizeCreatorImage>
    > | null = null;
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
      imageUploadRef.current = upload;
      void refreshFunding(file.size);
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

  const updateMetadata = async () => {
    if (!imageUpload || busy) return;
    setError(null);
    setState("finalizing");
    try {
      let result: CreatorMetadataResult;
      try {
        result = await finalizeCreatorMetadata({
          address,
          tokenId,
          mode,
          imageUri: imageUpload.imageUri,
          capability: imageUpload.capability,
        });
      } catch (finalizationError) {
        if (
          !(finalizationError instanceof Error) ||
          !/Metadata finalization failed: (401|403)\b/.test(
            finalizationError.message,
          )
        ) {
          throw finalizationError;
        }
        const authorization = await reauthorizeCreatorMetadata({
          address,
          tokenId,
          mode,
          operationId: imageUpload.operationId,
          imageUri: imageUpload.imageUri,
        });
        result = await finalizeCreatorMetadata({
          address,
          tokenId,
          mode,
          imageUri: imageUpload.imageUri,
          capability: authorization.capability,
        });
      }
      setMetadataUri(result.metadataUri);
      setState("done");
      if (mounted.current) {
        onComplete({
          ...result,
          imageCapability: imageUpload.capability,
          operationId: imageUpload.operationId,
        });
      }
      void refreshFunding(file?.size);
    } catch (retryError) {
      setState("error");
      setError(errorMessage(retryError));
    }
  };

  const limitLabel = `${Math.floor(MAX_CREATOR_IMAGE_BYTES / (1024 * 1024))} MB`;
  const estimatedUploadLabel = funding?.estimatedUploadEth
    ? `~${funding.estimatedUploadEth} ETH`
    : fundingLoading
      ? "Checking…"
      : file
        ? "Unavailable"
        : "Select an image";
  const estimatedImagesLabel =
    funding?.estimatedImages !== null && funding?.estimatedImages !== undefined
      ? `~${funding.estimatedImages.toLocaleString()}`
      : fundingLoading
        ? "Checking…"
        : file
          ? "Unavailable"
          : "Select an image";

  return (
    <div className="border border-[#c9aa67]/20 bg-[#11100d] p-4 text-[#f4eee2]">
      <div className="space-y-3">
        {funding?.sponsorAddress ? (
          <div className="border border-[#c9aa67]/20 bg-[#16140f] p-4 text-sm text-[#bdb4a4]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="font-semibold text-[#f4eee2]">Upload funding</div>
              <div className="text-xs text-[#8f8779]">
                Server-side metadata signer · Base
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xs font-medium uppercase tracking-wide text-[#8f8779]">
                Funding address
              </div>
              <CopyToClipboard text={funding.sponsorAddress} clipboard>
                {(handleClick) => (
                  <button
                    type="button"
                    onClick={handleClick}
                    className="fame-focus mt-1 flex w-full items-center justify-between gap-3 border border-[#c9aa67]/30 bg-[#0d0c0a] px-3 py-2 text-left font-mono text-xs text-[#bdb4a4] transition hover:border-[#c9aa67] hover:text-[#f4eee2]"
                    aria-label="Copy upload funding address"
                  >
                    <span className="break-all">{funding.sponsorAddress}</span>
                    <span className="shrink-0 font-sans text-xs font-semibold text-[#c9aa67]">
                      Copy
                    </span>
                  </button>
                )}
              </CopyToClipboard>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-[#8f8779]">
                  Base balance
                </div>
                <div className="mt-1 font-mono text-sm text-[#f4eee2]">
                  {funding.baseBalanceEth ?? "Unavailable"} ETH
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-[#8f8779]">
                  Loaded Irys balance
                </div>
                <div className="mt-1 font-mono text-sm text-[#f4eee2]">
                  {funding.loadedIrysBalanceEth ?? "Not checked"} ETH
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-[#8f8779]">
                  This image + metadata
                </div>
                <div className="mt-1 font-mono text-sm text-[#f4eee2]">
                  {estimatedUploadLabel}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-[#8f8779]">
                  Approx. full uploads
                </div>
                <div className="mt-1 font-mono text-sm text-[#f4eee2]">
                  {estimatedImagesLabel}
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#8f8779]">
              Estimate includes the Irys image and metadata costs with the
              existing 10% buffer. Approximate uploads combine the loaded Irys
              balance with Base ETH above the approximately{" "}
              {funding.baseGasReserveEth} ETH gas reserve. Base ETH is only
              debited when the signer&apos;s loaded Irys balance needs a top-up.
            </p>
            {funding.error && (
              <p className="mt-2 text-xs text-[#e4cd96]">{funding.error}</p>
            )}
          </div>
        ) : funding?.error ? (
          <p className="border-l border-[#c9aa67] bg-[#241f14] p-3 text-sm text-[#e4cd96]">
            {funding.error}
          </p>
        ) : null}

        <div>
          <label
            htmlFor={inputId}
            className="fame-kicker mb-2 block text-[#bdb4a4]"
          >
            Image for generated metadata
          </label>
          <input
            id={inputId}
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            disabled={busy || Boolean(imageUpload)}
            onChange={(event) =>
              resetForFile(event.currentTarget.files?.[0] ?? null)
            }
            className="block w-full text-sm text-[#bdb4a4] file:mr-3 file:border-0 file:bg-[#c9aa67] file:px-3 file:py-2 file:text-sm file:font-bold file:text-[#0d0c0a] hover:file:bg-[#dfc584] disabled:opacity-60"
          />
          <p className="mt-2 text-xs text-[#8f8779]">
            PNG, JPG, GIF, or WebP up to {limitLabel}. Uploads go directly to
            Irys.
          </p>
        </div>

        {file && previewUrl && (
          <div className="grid gap-4 border border-[#c9aa67]/20 bg-[#16140f] p-3 sm:grid-cols-[minmax(0,160px)_1fr]">
            <div className="flex min-h-40 items-center justify-center overflow-hidden bg-[#0d0c0a]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={`Selected artwork preview: ${file.name}`}
                className="max-h-40 w-full object-contain"
              />
            </div>
            <div className="self-center text-sm text-[#bdb4a4]">
              <div className="font-medium text-[#f4eee2]">
                Selected image preview
              </div>
              <div className="mt-1 break-words text-[#bdb4a4]">
                {file.name} · {formatImageSize(file.size)}
              </div>
              <p className="mt-2 text-xs text-[#8f8779]">
                Confirm this is the artwork you want before approving the
                sponsored upload.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {!isSignedIn && !imageUpload && (
            <button
              type="button"
              onClick={() => void signIn?.()}
              disabled={busy}
              className="fame-action fame-focus border border-[#c9aa67]/50 px-3 py-2 text-sm font-medium text-[#f4eee2] hover:border-[#c9aa67] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sign in
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleUpload()}
            disabled={!file || busy || !isSignedIn || Boolean(imageUpload)}
            className="fame-action fame-focus bg-[#c9aa67] px-3 py-2 text-sm font-bold text-[#0d0c0a] hover:bg-[#dfc584] disabled:cursor-not-allowed disabled:bg-[#554b37] disabled:text-[#93866d]"
          >
            {busy
              ? "Working…"
              : imageUpload
                ? "Image uploaded — release below"
                : "Approve sponsored image upload"}
          </button>
          <span className="text-sm text-[#8f8779]" role="status">
            {stateCopy(state, isSignedIn)}
          </span>
        </div>

        {imageUpload && (
          <div className="flex flex-wrap items-center gap-3 border-l border-[#c9aa67] bg-[#241f14] p-3 text-sm text-[#e4cd96]">
            <span>
              {mode === "release"
                ? "The image upload is locked. Release the Society below, update metadata if needed, or reset everything."
                : "The image upload is locked. Update metadata if needed, or reset everything before choosing another image."}
            </span>
            <button
              type="button"
              onClick={() => void updateMetadata()}
              disabled={busy}
              className="fame-action fame-focus border border-[#c9aa67]/50 px-3 py-2 font-medium text-[#f4eee2] hover:border-[#c9aa67] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Update metadata
            </button>
            <button
              type="button"
              onClick={resetEverything}
              disabled={busy}
              className="fame-action fame-focus border border-[#8f8779]/50 px-3 py-2 font-medium text-[#bdb4a4] hover:border-[#bdb4a4] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset everything
            </button>
          </div>
        )}

        {error && (
          <p className="border-l border-[#c96f67] bg-[#2a1512] p-3 text-sm text-[#efc1b8]">
            {error}
          </p>
        )}

        {imageUpload && (
          <div className="text-sm">
            <div className="text-xs text-[#8f8779]">Image URI</div>
            <div className="break-words text-[#bdb4a4]">
              {imageUpload.imageUri}
            </div>
          </div>
        )}
        {metadataUri && (
          <div className="text-sm">
            <div className="text-xs text-[#8f8779]">Metadata URI</div>
            <div className="break-words text-[#bdb4a4]">{metadataUri}</div>
          </div>
        )}
      </div>
    </div>
  );
}
