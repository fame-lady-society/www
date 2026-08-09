import { FAME_METADATA_FALLBACK_IMAGE } from "@/service/fameMetadata";
import type { FameMetadataAttribute, FameMetadataResult } from "./types";

export const FAME_METADATA_LIMITS = {
  encodedJson: 350 * 1024,
  decodedJson: 256 * 1024,
  encodedImage: Math.floor(1.4 * 1024 * 1024),
  decodedImage: 1024 * 1024,
  name: 256,
  description: 4_096,
  attributes: 32,
  attributeField: 256,
} as const;

function failure(error: string): FameMetadataResult {
  return {
    status: "failure",
    image: FAME_METADATA_FALLBACK_IMAGE,
    name: null,
    description: null,
    attributes: [],
    error,
  };
}

function decodeBase64Bytes(
  encoded: string,
  encodedLimit: number,
  decodedLimit: number,
) {
  if (
    encoded.length === 0 ||
    encoded.length > encodedLimit ||
    encoded.length % 4 !== 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      encoded,
    )
  ) {
    throw new Error("Base64 payload is malformed or too large");
  }

  const binary = atob(encoded);
  if (binary.length > decodedLimit) {
    throw new Error("Decoded payload is too large");
  }
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeBase64Text(
  encoded: string,
  encodedLimit: number,
  decodedLimit: number,
) {
  return new TextDecoder("utf-8", { fatal: true }).decode(
    decodeBase64Bytes(encoded, encodedLimit, decodedLimit),
  );
}

function decodeDataUri(
  uri: string,
  mime: string,
  encodedLimit: number,
  decodedLimit: number,
) {
  const prefix = `data:${mime};base64,`;
  if (!uri.startsWith(prefix)) {
    throw new Error(`Expected ${mime} Base64 data URI`);
  }
  return decodeBase64Text(uri.slice(prefix.length), encodedLimit, decodedLimit);
}

function optionalBoundedString(value: unknown, field: string, limit: number) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string" || value.length > limit) {
    throw new Error(`${field} is invalid or too long`);
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function attributes(value: unknown): FameMetadataAttribute[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > FAME_METADATA_LIMITS.attributes) {
    throw new Error("Metadata attributes exceed their bound");
  }

  return value.map((attribute, index) => {
    if (!attribute || typeof attribute !== "object") {
      throw new Error(`Metadata attribute ${index} is invalid`);
    }
    const record = attribute as Record<string, unknown>;
    const traitType = record.trait_type;
    const attributeValue = record.value;
    if (
      typeof traitType !== "string" ||
      typeof attributeValue !== "string" ||
      traitType.length === 0 ||
      traitType.length > FAME_METADATA_LIMITS.attributeField ||
      attributeValue.length > FAME_METADATA_LIMITS.attributeField
    ) {
      throw new Error(`Metadata attribute ${index} is invalid`);
    }
    return { traitType, value: attributeValue };
  });
}

function assertPassiveSvg(svg: string) {
  if (!/<svg(?:\s|>)/i.test(svg)) {
    throw new Error("Image payload is not SVG");
  }
  if (
    /<script(?:\s|>)/i.test(svg) ||
    /<foreignObject(?:\s|>)/i.test(svg) ||
    /\son[a-z][\w:-]*\s*=/i.test(svg) ||
    /<!DOCTYPE|<!ENTITY|@import/i.test(svg)
  ) {
    throw new Error("SVG contains active content");
  }

  for (const match of svg.matchAll(
    /\b(?:href|xlink:href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi,
  )) {
    const value = (match[1] ?? match[2] ?? match[3] ?? "").trim();
    if (!value.startsWith("#")) {
      throw new Error("SVG contains an external href");
    }
  }

  for (const match of svg.matchAll(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/gi)) {
    if (!match[2]?.trim().startsWith("#")) {
      throw new Error("SVG contains an external URL");
    }
  }
}

export function validateInlineFameImage(rawImage: string): string | null {
  const image = rawImage.trim();
  const match = image.match(
    /^data:(image\/(?:svg\+xml|png|jpeg|jpg|gif|webp|avif));base64,(.*)$/s,
  );
  if (!match) return null;

  try {
    const bytes = decodeBase64Bytes(
      match[2] ?? "",
      FAME_METADATA_LIMITS.encodedImage,
      FAME_METADATA_LIMITS.decodedImage,
    );
    if (match[1] === "image/svg+xml") {
      assertPassiveSvg(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    }
    return image;
  } catch {
    return null;
  }
}

export function decodeInlineFameMetadata(
  rawTokenUri: string,
): FameMetadataResult {
  const tokenUri = rawTokenUri.trim();
  if (tokenUri.length === 0) {
    return failure("Token metadata is unavailable");
  }

  try {
    const json = decodeDataUri(
      tokenUri,
      "application/json",
      FAME_METADATA_LIMITS.encodedJson,
      FAME_METADATA_LIMITS.decodedJson,
    );
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Metadata JSON must be an object");
    }
    const metadata = parsed as Record<string, unknown>;
    if (typeof metadata.image !== "string" || metadata.image.length === 0) {
      throw new Error("Metadata image is missing");
    }
    const image = validateInlineFameImage(metadata.image);
    if (!image) throw new Error("Metadata image could not be decoded safely");

    return {
      status: "ready",
      image,
      name: optionalBoundedString(
        metadata.name,
        "Metadata name",
        FAME_METADATA_LIMITS.name,
      ),
      description: optionalBoundedString(
        metadata.description,
        "Metadata description",
        FAME_METADATA_LIMITS.description,
      ),
      attributes: attributes(metadata.attributes),
      error: null,
    };
  } catch {
    return failure("Token metadata could not be decoded safely");
  }
}
