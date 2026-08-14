import { createClient } from "@vercel/kv";

export type CreatorUploadOperationStatus =
  | "authorized"
  | "image_verified"
  | "finalizing"
  | "finalized"
  | "revoked"
  | "failed";

export type CreatorUploadOperation = {
  operationId: string;
  creatorAddress: `0x${string}`;
  sessionDigest: string;
  tokenId: number;
  mode: "art" | "end" | "release" | "update";
  imageType: "image/gif" | "image/jpeg" | "image/png" | "image/webp";
  imageBytes: number;
  imageHash: string;
  sponsorAddress: `0x${string}`;
  approvalAmount: string;
  createdAt: number;
  expiresAt: number;
  status: CreatorUploadOperationStatus;
  imageUri?: string;
  imageTxId?: string;
  metadataUri?: string;
  metadataTxId?: string;
  finalizationLease?: string;
  finalizationLeaseExpiresAt?: number;
};

export type CreatorUploadJournal = {
  reserveCreator: (
    creatorAddress: `0x${string}`,
    operationId: string,
    expiresInSeconds: number,
  ) => Promise<boolean>;
  releaseCreator: (
    creatorAddress: `0x${string}`,
    operationId: string,
  ) => Promise<void>;
  createOperation: (
    operation: CreatorUploadOperation,
    expiresInSeconds: number,
  ) => Promise<boolean>;
  getOperation: (
    operationId: string,
  ) => Promise<CreatorUploadOperation | null>;
  updateOperation: (
    operationId: string,
    patch: Partial<CreatorUploadOperation>,
  ) => Promise<CreatorUploadOperation | null>;
  acquireFinalization: (
    operationId: string,
    lease: string,
    expiresInSeconds: number,
  ) => Promise<CreatorUploadOperation | null>;
  releaseFinalization: (
    operationId: string,
    lease: string,
  ) => Promise<CreatorUploadOperation | null>;
};

const OPERATION_PREFIX = "fame:creator-upload:operation:";
const ACTIVE_PREFIX = "fame:creator-upload:active:";
const LEASE_PREFIX = "fame:creator-upload:lease:";

function requireKvClient() {
  const url = process.env.FLS_KV_REST_API_URL;
  const token = process.env.FLS_KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error("Creator upload journal requires Vercel KV configuration");
  }
  return createClient({ url, token });
}

function operationKey(operationId: string) {
  return `${OPERATION_PREFIX}${operationId}`;
}

function activeKey(creatorAddress: string) {
  return `${ACTIVE_PREFIX}${creatorAddress.toLowerCase()}`;
}

function leaseKey(operationId: string) {
  return `${LEASE_PREFIX}${operationId}`;
}

export function createCreatorUploadJournal(): CreatorUploadJournal {
  return {
    async reserveCreator(creatorAddress, operationId, expiresInSeconds) {
      const result = await requireKvClient().set(
        activeKey(creatorAddress),
        operationId,
        { nx: true, ex: expiresInSeconds },
      );
      return result === "OK";
    },

    async releaseCreator(creatorAddress, operationId) {
      const kv = requireKvClient();
      const current = await kv.get<string>(activeKey(creatorAddress));
      if (current === operationId) {
        await kv.del(activeKey(creatorAddress));
      }
    },

    async createOperation(operation, expiresInSeconds) {
      const result = await requireKvClient().set(
        operationKey(operation.operationId),
        operation,
        { nx: true, ex: expiresInSeconds },
      );
      return result === "OK";
    },

    async getOperation(operationId) {
      return await requireKvClient().get<CreatorUploadOperation>(
        operationKey(operationId),
      );
    },

    async updateOperation(operationId, patch) {
      const kv = requireKvClient();
      const current = await kv.get<CreatorUploadOperation>(
        operationKey(operationId),
      );
      if (!current) return null;
      const next = { ...current, ...patch };
      await kv.set(operationKey(operationId), next, {
        ex: Math.max(1, Math.ceil((current.expiresAt - Date.now()) / 1000)),
      });
      return next;
    },

    async acquireFinalization(operationId, lease, expiresInSeconds) {
      const kv = requireKvClient();
      const operation = await kv.get<CreatorUploadOperation>(
        operationKey(operationId),
      );
      if (!operation) return null;
      const lock = await kv.set(leaseKey(operationId), lease, {
        nx: true,
        ex: expiresInSeconds,
      });
      if (lock !== "OK") return null;
      const next = {
        ...operation,
        status: "finalizing" as const,
        finalizationLease: lease,
        finalizationLeaseExpiresAt: Date.now() + expiresInSeconds * 1000,
      };
      await kv.set(operationKey(operationId), next, {
        ex: Math.max(1, Math.ceil((operation.expiresAt - Date.now()) / 1000)),
      });
      return next;
    },

    async releaseFinalization(operationId, lease) {
      const kv = requireKvClient();
      const currentLease = await kv.get<string>(leaseKey(operationId));
      const operation = await kv.get<CreatorUploadOperation>(
        operationKey(operationId),
      );
      if (!operation || currentLease !== lease) return operation;
      await kv.del(leaseKey(operationId));
      const next = {
        ...operation,
        finalizationLease: undefined,
        finalizationLeaseExpiresAt: undefined,
        status:
          operation.status === "finalizing"
            ? ("image_verified" as const)
            : operation.status,
      };
      await kv.set(operationKey(operationId), next, {
        ex: Math.max(1, Math.ceil((operation.expiresAt - Date.now()) / 1000)),
      });
      return next;
    },
  };
}
