"use client";

import { useId, useState } from "react";
import { withAuthHeaders } from "@/utils/authToken";
import type { CreatorMetadataUploadMode } from "@/features/fame/creatorMetadata";
import { useSIWE } from "connectkit";

type SponsoredCreatorMetadataUploaderProps = {
  address: `0x${string}`;
  tokenId: number;
  mode: CreatorMetadataUploadMode;
  onComplete: (metadataUri: string) => void;
};

type UploadState = "idle" | "uploading" | "done" | "error";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function SponsoredCreatorMetadataUploader({
  address,
  tokenId,
  mode,
  onComplete,
}: SponsoredCreatorMetadataUploaderProps) {
  const inputId = useId();
  const { isSignedIn, signIn } = useSIWE();
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
      const formData = new FormData();
      formData.set("address", address);
      formData.set("tokenId", String(tokenId));
      formData.set("mode", mode);
      formData.set("image", file);

      const response = await fetch("/api/fame/creator/metadata", {
        method: "POST",
        headers: withAuthHeaders(),
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Sponsored upload failed: ${response.status} ${text}`,
        );
      }

      const data = (await response.json()) as {
        imageUri: string;
        metadataUri: string;
      };

      setImageUri(data.imageUri);
      setMetadataUri(data.metadataUri);
      setState("done");
      onComplete(data.metadataUri);
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
