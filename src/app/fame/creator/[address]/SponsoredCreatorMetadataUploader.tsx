"use client";

import { useId, useState } from "react";
import type { CreatorMetadataUploadMode } from "@/features/fame/creatorMetadata";
import { useSiweSession } from "@/context/SiweSession";

type SponsoredCreatorMetadataUploaderProps = {
  address: `0x${string}`;
  tokenId: number;
  mode: CreatorMetadataUploadMode;
  onComplete: (result: SponsoredCreatorMetadataResult) => void;
};

type UploadState = "idle" | "uploading" | "done" | "error";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type SponsoredCreatorMetadataResult = {
  imageUri: string;
  metadataUri: string;
};

type SponsoredCreatorMetadataInput = {
  address: `0x${string}`;
  tokenId: number;
  mode: CreatorMetadataUploadMode;
} & ({ image: File; imageUri?: never } | { image?: never; imageUri: string });

export async function uploadSponsoredCreatorMetadata(
  input: SponsoredCreatorMetadataInput,
): Promise<SponsoredCreatorMetadataResult> {
  const formData = new FormData();
  formData.set("address", input.address);
  formData.set("tokenId", String(input.tokenId));
  formData.set("mode", input.mode);
  if (input.image) formData.set("image", input.image);
  if (input.imageUri) formData.set("imageUri", input.imageUri);

  const response = await fetch("/api/fame/creator/metadata", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Sponsored upload failed: ${response.status} ${text}`);
  }
  return (await response.json()) as SponsoredCreatorMetadataResult;
}

export function SponsoredCreatorMetadataUploader({
  address,
  tokenId,
  mode,
  onComplete,
}: SponsoredCreatorMetadataUploaderProps) {
  const inputId = useId();
  const { isSignedIn, signIn } = useSiweSession();
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [metadataUri, setMetadataUri] = useState<string | null>(null);

  const isUploading = state === "uploading";

  const handleUpload = async () => {
    if (!file || isUploading) return;
    if (!isSignedIn) {
      setState("error");
      setError("Sign in with Ethereum before uploading metadata.");
      return;
    }

    if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
      setState("error");
      setError("Choose a PNG, JPG, GIF, or WebP image.");
      return;
    }
    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
      setState("error");
      setError("Choose an image smaller than 10 MB.");
      return;
    }

    setState("uploading");
    setError(null);
    setImageUri(null);
    setMetadataUri(null);

    try {
      const data = await uploadSponsoredCreatorMetadata({
        address,
        tokenId,
        mode,
        image: file,
      });

      setImageUri(data.imageUri);
      setMetadataUri(data.metadataUri);
      setState("done");
      onComplete(data);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Sponsored upload failed");
    }
  };

  return (
    <div className="rounded-md border border-gray-200 bg-white/60 p-3">
      <div className="space-y-3">
        <div>
          <label htmlFor={inputId} className="block text-sm font-medium mb-2">
            Image for generated metadata
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            disabled={isUploading}
            onChange={(event) => {
              setFile(event.currentTarget.files?.[0] ?? null);
              setState("idle");
              setError(null);
              setImageUri(null);
              setMetadataUri(null);
            }}
            className="block w-full text-sm text-gray-700 file:mr-3 file:rounded file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-700 disabled:opacity-60"
          />
        </div>

        <div className="flex items-center gap-3">
          {!isSignedIn && (
            <button
              type="button"
              onClick={() => signIn?.()}
              disabled={isUploading}
              className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Sign in
            </button>
          )}
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || isUploading || !isSignedIn}
            className="rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isUploading ? "Uploading..." : "Generate metadata URI"}
          </button>
          <span className="text-sm text-gray-600">
            {state === "idle" &&
              (isSignedIn
                ? "Backend sponsors image and metadata upload."
                : "Sign in to upload generated metadata.")}
            {state === "uploading" && "Uploading image, then metadata."}
            {state === "done" && "Metadata URI ready."}
            {state === "error" && "Upload failed."}
          </span>
        </div>

        {error && (
          <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {imageUri && (
          <div className="text-sm">
            <div className="text-xs text-gray-500">Image URI</div>
            <div className="break-words text-gray-800">{imageUri}</div>
          </div>
        )}
        {metadataUri && (
          <div className="text-sm">
            <div className="text-xs text-gray-500">Metadata URI</div>
            <div className="break-words text-gray-800">{metadataUri}</div>
          </div>
        )}
      </div>
    </div>
  );
}
