import {
  CREATOR_UPLOAD_APPLICATION_ID,
  CREATOR_UPLOAD_TAGS,
  creatorContentHash,
  findCreatorTag,
  normalizeCreatorAddress,
  type CreatorImageType,
  type CreatorMetadataUploadMode,
  type CreatorUploadTag,
} from "@/features/fame/creatorMetadata";
import type { IrysSponsoredUploader } from "@/service/irys_sponsored_upload";

export const IRYS_GATEWAY_ORIGIN = "https://gateway.irys.xyz";
export const IRYS_BASE_CURRENCY = "base-eth";
const TRANSACTION_ID_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export type CreatorIrysTransaction = {
  id: string;
  address: string;
  currency: string;
  tags: CreatorUploadTag[];
};

export type CreatorIrysVerifier = {
  getTransaction: (transactionId: string) => Promise<CreatorIrysTransaction>;
  findMetadataTransaction: (
    input: {
      operationId: string;
      tokenId: number;
      creatorAddress: string;
      mode: CreatorMetadataUploadMode;
      imageUri: string;
      sponsorAddress: string;
    },
  ) => Promise<CreatorIrysTransaction | null>;
  readData: (transactionId: string, maxBytes: number) => Promise<Uint8Array>;
};

export type VerifiedCreatorImage = {
  transaction: CreatorIrysTransaction;
  bytes: Uint8Array;
  imageUri: string;
  imageTxId: string;
};

export function parseCreatorIrysGatewayUri(value: unknown): {
  uri: string;
  transactionId: string;
} | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (
      url.origin !== IRYS_GATEWAY_ORIGIN ||
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !TRANSACTION_ID_PATTERN.test(url.pathname.slice(1))
    ) {
      return null;
    }
    return { uri: value, transactionId: url.pathname.slice(1) };
  } catch {
    return null;
  }
}

function hasMagicBytes(bytes: Uint8Array, type: CreatorImageType): boolean {
  if (type === "image/png") {
    return [137, 80, 78, 71, 13, 10, 26, 10].every(
      (byte, index) => bytes[index] === byte,
    );
  }
  if (type === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (type === "image/gif") {
    const header = new TextDecoder().decode(bytes.slice(0, 6));
    return header === "GIF87a" || header === "GIF89a";
  }
  return (
    new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
  );
}

function assertUniqueTags(tags: readonly CreatorUploadTag[]) {
  const names = new Set<string>();
  for (const tag of tags) {
    if (names.has(tag.name)) throw new Error("Duplicate Irys tag");
    names.add(tag.name);
  }
}

function assertImageTags(input: {
  transaction: CreatorIrysTransaction;
  operationId: string;
  creatorAddress: string;
  tokenId: number;
  mode: CreatorMetadataUploadMode;
  imageType: CreatorImageType;
  imageBytes: number;
  imageHash: string;
}) {
  const { transaction } = input;
  assertUniqueTags(transaction.tags);
  if (transaction.currency !== IRYS_BASE_CURRENCY) {
    throw new Error("Unexpected Irys currency");
  }
  if (
    normalizeCreatorAddress(transaction.address).toLowerCase() !==
    normalizeCreatorAddress(input.creatorAddress).toLowerCase()
  ) {
    throw new Error("Irys transaction owner mismatch");
  }
  const expected: Record<string, string> = {
    [CREATOR_UPLOAD_TAGS.application]: CREATOR_UPLOAD_APPLICATION_ID,
    [CREATOR_UPLOAD_TAGS.operation]: input.operationId,
    [CREATOR_UPLOAD_TAGS.creator]: normalizeCreatorAddress(
      input.creatorAddress,
    ).toLowerCase(),
    [CREATOR_UPLOAD_TAGS.token]: String(input.tokenId),
    [CREATOR_UPLOAD_TAGS.mode]: input.mode,
    [CREATOR_UPLOAD_TAGS.purpose]: "image",
    [CREATOR_UPLOAD_TAGS.contentType]: input.imageType,
    [CREATOR_UPLOAD_TAGS.contentLength]: String(input.imageBytes),
    [CREATOR_UPLOAD_TAGS.contentHash]: input.imageHash,
  };
  for (const [name, value] of Object.entries(expected)) {
    if (findCreatorTag(transaction.tags, name) !== value) {
      throw new Error("Irys operation tags do not match authorization");
    }
  }
}

function assertMetadataTags(input: {
  transaction: CreatorIrysTransaction;
  operationId: string;
  creatorAddress: string;
  tokenId: number;
  mode: CreatorMetadataUploadMode;
  imageUri: string;
  sponsorAddress: string;
}) {
  const { transaction } = input;
  assertUniqueTags(transaction.tags);
  if (transaction.currency !== IRYS_BASE_CURRENCY) {
    throw new Error("Unexpected Irys metadata currency");
  }
  if (
    normalizeCreatorAddress(transaction.address).toLowerCase() !==
    normalizeCreatorAddress(input.sponsorAddress).toLowerCase()
  ) {
    throw new Error("Irys metadata transaction owner mismatch");
  }
  const expected: Record<string, string> = {
    [CREATOR_UPLOAD_TAGS.application]: CREATOR_UPLOAD_APPLICATION_ID,
    [CREATOR_UPLOAD_TAGS.operation]: input.operationId,
    [CREATOR_UPLOAD_TAGS.creator]: normalizeCreatorAddress(
      input.creatorAddress,
    ).toLowerCase(),
    [CREATOR_UPLOAD_TAGS.token]: String(input.tokenId),
    [CREATOR_UPLOAD_TAGS.mode]: input.mode,
    [CREATOR_UPLOAD_TAGS.purpose]: "metadata",
    [CREATOR_UPLOAD_TAGS.contentType]: "application/json",
    "Fame-Creator-Image-Uri": input.imageUri,
  };
  for (const [name, value] of Object.entries(expected)) {
    if (findCreatorTag(transaction.tags, name) !== value) {
      throw new Error("Irys metadata tags do not match authorization");
    }
  }
  const contentLength = findCreatorTag(
    transaction.tags,
    CREATOR_UPLOAD_TAGS.contentLength,
  );
  const contentHash = findCreatorTag(
    transaction.tags,
    CREATOR_UPLOAD_TAGS.contentHash,
  );
  if (
    !contentLength ||
    !/^\d+$/.test(contentLength) ||
    !contentHash ||
    !/^[0-9a-f]{64}$/.test(contentHash)
  ) {
    throw new Error("Irys metadata content tags are invalid");
  }
}

export async function verifyCreatorImage(input: {
  verifier: CreatorIrysVerifier;
  imageUri: string;
  operationId: string;
  creatorAddress: string;
  tokenId: number;
  mode: CreatorMetadataUploadMode;
  imageType: CreatorImageType;
  imageBytes: number;
  imageHash: string;
}): Promise<VerifiedCreatorImage> {
  const parsed = parseCreatorIrysGatewayUri(input.imageUri);
  if (!parsed) throw new Error("Invalid Irys image URI");
  const transaction = await input.verifier.getTransaction(parsed.transactionId);
  if (transaction.id !== parsed.transactionId) {
    throw new Error("Irys transaction id mismatch");
  }
  assertImageTags({ ...input, transaction });
  const bytes = await input.verifier.readData(
    parsed.transactionId,
    input.imageBytes,
  );
  if (bytes.byteLength !== input.imageBytes) {
    throw new Error("Irys image byte length mismatch");
  }
  if (!hasMagicBytes(bytes, input.imageType)) {
    throw new Error("Irys image content type mismatch");
  }
  if (creatorContentHash(bytes) !== input.imageHash) {
    throw new Error("Irys image content hash mismatch");
  }
  return {
    transaction,
    bytes,
    imageUri: parsed.uri,
    imageTxId: parsed.transactionId,
  };
}

export function createCreatorIrysVerifier(
  uploader: IrysSponsoredUploader,
  fetchImpl: typeof fetch = fetch,
): CreatorIrysVerifier {
  const transactions = uploader.transactions;
  if (!transactions) throw new Error("Irys transaction query support is unavailable");
  return {
    async getTransaction(transactionId) {
      const transaction = await transactions.getById(transactionId);
      return {
        id: transaction.id,
        address: transaction.address,
        currency: transaction.currency,
        tags: transaction.tags,
      };
    },
    async findMetadataTransaction({
      operationId,
      tokenId,
      creatorAddress,
      mode,
      imageUri,
      sponsorAddress,
    }) {
      const results = await transactions.query({
        tags: [
          { name: CREATOR_UPLOAD_TAGS.application, values: [CREATOR_UPLOAD_APPLICATION_ID] },
          { name: CREATOR_UPLOAD_TAGS.operation, values: [operationId] },
          { name: CREATOR_UPLOAD_TAGS.purpose, values: ["metadata"] },
          { name: CREATOR_UPLOAD_TAGS.token, values: [String(tokenId)] },
          {
            name: CREATOR_UPLOAD_TAGS.creator,
            values: [normalizeCreatorAddress(creatorAddress).toLowerCase()],
          },
          { name: CREATOR_UPLOAD_TAGS.mode, values: [mode] },
          { name: "Fame-Creator-Image-Uri", values: [imageUri] },
          { name: CREATOR_UPLOAD_TAGS.contentType, values: ["application/json"] },
        ],
        limit: 2,
      });
      if (results.length > 1) {
        throw new Error("Multiple Irys metadata transactions found");
      }
      const transaction = results[0];
      if (!transaction) return null;
      const normalized = {
        id: transaction.id,
        address: transaction.address,
        currency: transaction.currency,
        tags: transaction.tags,
      };
      assertMetadataTags({
        transaction: normalized,
        operationId,
        creatorAddress,
        tokenId,
        mode,
        imageUri,
        sponsorAddress,
      });
      return normalized;
    },
    async readData(transactionId, maxBytes) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      try {
        const response = await fetchImpl(
          `${IRYS_GATEWAY_ORIGIN}/${transactionId}`,
          { redirect: "error", signal: controller.signal },
        );
        if (!response.ok || !response.body) {
          throw new Error("Irys image data is unavailable");
        }
        const contentLength = response.headers.get("content-length");
        if (contentLength && Number(contentLength) > maxBytes) {
          throw new Error("Irys image exceeds authorized size");
        }
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let total = 0;
        while (true) {
          const next = await reader.read();
          if (next.done) break;
          total += next.value.byteLength;
          if (total > maxBytes) throw new Error("Irys image exceeds authorized size");
          chunks.push(next.value);
        }
        const bytes = new Uint8Array(total);
        let offset = 0;
        for (const chunk of chunks) {
          bytes.set(chunk, offset);
          offset += chunk.byteLength;
        }
        return bytes;
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
