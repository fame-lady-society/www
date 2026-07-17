import { getAddress, isAddress, isHash, type Address, type Hash } from "viem";
import { baseSepolia } from "viem/chains";
import { BASE_SEPOLIA_TEST_GALLERY_MANIFEST } from "./baseSepoliaTestGallery.generated";

const EXPECTED_ADDRESSES = {
  fame: "0x2cF0408Ee86b337216dD0073ab257F84497067cA",
  mirror: "0x2907936013BDF568F98A98893AC1C746256A9cC5",
  renderer: "0x980f1c21b29d4e16ac3Fc49Fe9Aaf64b97C5A9De",
  creatorMagic: "0xa16C005203cD46cC1929cc8e494cF7945887951B",
  gallery: "0x7f9bA27F40686E548f613e679835158070901c47",
  admin: "0xD52E2A6bBcEba9673440e4D7843Db6713E9B6FD9",
  feeRecipient: "0xD52E2A6bBcEba9673440e4D7843Db6713E9B6FD9",
  smokeRecipient: "0x7307E109C747AaD76CBc0A09612b8350410D35ba",
} as const satisfies Record<string, Address>;

const EXPECTED_DEPLOYMENT = {
  blockNumber: 44_267_510,
  blockHash:
    "0x1c7b8ca7765a7bdec064b0d63b662a26ccd568f4d58804135854ae120a0228ad",
} as const satisfies { blockNumber: number; blockHash: Hash };

const EXPECTED_CHECKPOINT = {
  blockNumber: 44_267_553,
  blockHash:
    "0x59e6365e9843a3a4be266430f94a7a28ec39b3e103473d91db2c29d814a372cd",
  candidateTokenIds: [1],
} as const satisfies {
  blockNumber: number;
  blockHash: Hash;
  candidateTokenIds: readonly number[];
};

export type GalleryLifecycleEvent = {
  eventName: "Listed" | "PremiumUpdated" | "Unlisted" | "Filled";
  tokenId: number | bigint;
};

export type GalleryCollectionBounds = {
  firstTokenId: number;
  lastTokenId: number;
};

type ManifestRecord = Record<string, unknown>;

function requireRecord(value: unknown, path: string): ManifestRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${path} must be an object`);
  }

  return value as ManifestRecord;
}

function requireExactNumber(
  record: ManifestRecord,
  key: string,
  expected: number,
) {
  if (record[key] !== expected) {
    throw new Error(`${key} must equal ${expected}`);
  }
}

function requireExactHash(record: ManifestRecord, key: string, expected: Hash) {
  const value = record[key];
  if (typeof value !== "string" || !isHash(value) || value !== expected) {
    throw new Error(`${key} does not match the canonical block hash`);
  }
}

function validateAddresses(value: unknown) {
  const addresses = requireRecord(value, "addresses");

  for (const [name, expected] of Object.entries(EXPECTED_ADDRESSES)) {
    const address = addresses[name];
    if (
      typeof address !== "string" ||
      !isAddress(address, { strict: true }) ||
      getAddress(address) !== expected
    ) {
      throw new Error(`addresses.${name} does not match the deployed stack`);
    }
  }
}

function validateCandidateTokenIds(
  value: unknown,
  bounds: GalleryCollectionBounds,
) {
  if (!Array.isArray(value)) {
    throw new Error("checkpoint.candidateTokenIds must be an array");
  }

  const candidates = value.map((candidate, index) => {
    if (
      !Number.isSafeInteger(candidate) ||
      candidate < bounds.firstTokenId ||
      candidate > bounds.lastTokenId
    ) {
      throw new Error(
        `checkpoint.candidateTokenIds[${index}] is outside the collection`,
      );
    }
    return candidate as number;
  });

  const normalized = [...new Set(candidates)].sort(
    (left, right) => left - right,
  );
  if (
    normalized.length !== candidates.length ||
    normalized.some((candidate, index) => candidate !== candidates[index])
  ) {
    throw new Error(
      "checkpoint.candidateTokenIds must be unique and ascending",
    );
  }

  if (
    normalized.length !== EXPECTED_CHECKPOINT.candidateTokenIds.length ||
    normalized.some(
      (candidate, index) =>
        candidate !== EXPECTED_CHECKPOINT.candidateTokenIds[index],
    )
  ) {
    throw new Error(
      "checkpoint.candidateTokenIds does not match canonical history",
    );
  }

  return normalized;
}

export function reduceGalleryCandidateTokenIds(
  events: readonly GalleryLifecycleEvent[],
  bounds: GalleryCollectionBounds,
): number[] {
  const candidates = new Set<number>();

  for (const event of events) {
    const tokenId = Number(event.tokenId);
    if (
      !Number.isSafeInteger(tokenId) ||
      tokenId < bounds.firstTokenId ||
      tokenId > bounds.lastTokenId
    ) {
      throw new Error(
        `${event.eventName} token ${event.tokenId.toString()} is outside the collection`,
      );
    }
    candidates.add(tokenId);
  }

  return [...candidates].sort((left, right) => left - right);
}

export function validateBaseSepoliaTestGalleryManifest(value: unknown) {
  const manifest = requireRecord(value, "manifest");
  requireExactNumber(manifest, "schemaVersion", 1);
  requireExactNumber(manifest, "generatorVersion", 1);
  requireExactNumber(manifest, "chainId", baseSepolia.id);
  validateAddresses(manifest.addresses);

  const token = requireRecord(manifest.testToken, "testToken");
  if (
    token.name !== "Example" ||
    token.symbol !== "TEST" ||
    token.unit !== "1000000"
  ) {
    throw new Error("testToken does not match the deployed TEST token");
  }

  const collection = requireRecord(manifest.collection, "collection");
  requireExactNumber(collection, "firstTokenId", 1);
  requireExactNumber(collection, "lastTokenId", 888);
  const bounds = {
    firstTokenId: 1,
    lastTokenId: 888,
  } as const;

  const deployment = requireRecord(manifest.deployment, "deployment");
  requireExactNumber(
    deployment,
    "blockNumber",
    EXPECTED_DEPLOYMENT.blockNumber,
  );
  requireExactHash(deployment, "blockHash", EXPECTED_DEPLOYMENT.blockHash);

  const checkpoint = requireRecord(manifest.checkpoint, "checkpoint");
  requireExactNumber(
    checkpoint,
    "blockNumber",
    EXPECTED_CHECKPOINT.blockNumber,
  );
  requireExactHash(checkpoint, "blockHash", EXPECTED_CHECKPOINT.blockHash);
  const candidateTokenIds = validateCandidateTokenIds(
    checkpoint.candidateTokenIds,
    bounds,
  );

  return {
    schemaVersion: 1,
    generatorVersion: 1,
    chainId: baseSepolia.id,
    addresses: EXPECTED_ADDRESSES,
    testToken: {
      name: "Example",
      symbol: "TEST",
      unit: 1_000_000n,
    },
    collection: bounds,
    deployment: {
      blockNumber: BigInt(EXPECTED_DEPLOYMENT.blockNumber),
      blockHash: EXPECTED_DEPLOYMENT.blockHash,
    },
    checkpoint: {
      blockNumber: BigInt(EXPECTED_CHECKPOINT.blockNumber),
      blockHash: EXPECTED_CHECKPOINT.blockHash,
      candidateTokenIds,
    },
  } as const;
}

export const BASE_SEPOLIA_TEST_GALLERY_CONFIG =
  validateBaseSepoliaTestGalleryManifest(BASE_SEPOLIA_TEST_GALLERY_MANIFEST);
