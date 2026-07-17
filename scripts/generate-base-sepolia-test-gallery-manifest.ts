import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createPublicClient,
  fallback,
  getAddress,
  http,
  isAddress,
  isHash,
  parseAbi,
  type Address,
  type Hash,
} from "viem";
import { baseSepolia } from "viem/chains";

const FIXTURE_PATH = resolve(
  process.cwd(),
  "scripts/fixtures/base-sepolia-test-gallery-checkpoint.json",
);
const GENERATED_PATH = resolve(
  process.cwd(),
  "src/features/fame-gallery/config/baseSepoliaTestGallery.generated.ts",
);

const GENERATOR_VERSION = 1;
const COLLECTION = {
  firstTokenId: 1,
  lastTokenId: 888,
} as const;
const DEPLOYMENT = {
  blockNumber: 44_267_510,
  blockHash:
    "0x1c7b8ca7765a7bdec064b0d63b662a26ccd568f4d58804135854ae120a0228ad",
} as const satisfies { blockNumber: number; blockHash: Hash };
const CHECKPOINT = {
  blockNumber: 44_267_553,
  blockHash:
    "0x59e6365e9843a3a4be266430f94a7a28ec39b3e103473d91db2c29d814a372cd",
} as const satisfies { blockNumber: number; blockHash: Hash };
const ADDRESSES = {
  fame: "0x2cF0408Ee86b337216dD0073ab257F84497067cA",
  mirror: "0x2907936013BDF568F98A98893AC1C746256A9cC5",
  renderer: "0x980f1c21b29d4e16ac3Fc49Fe9Aaf64b97C5A9De",
  creatorMagic: "0xa16C005203cD46cC1929cc8e494cF7945887951B",
  gallery: "0x7f9bA27F40686E548f613e679835158070901c47",
  admin: "0xD52E2A6bBcEba9673440e4D7843Db6713E9B6FD9",
  feeRecipient: "0xD52E2A6bBcEba9673440e4D7843Db6713E9B6FD9",
  smokeRecipient: "0x7307E109C747AaD76CBc0A09612b8350410D35ba",
} as const satisfies Record<string, Address>;

const galleryCheckpointAbi = parseAbi([
  "function fame() view returns (address)",
  "function mirror() view returns (address)",
  "function creatorMagic() view returns (address)",
  "function listings(uint256 tokenId) view returns (uint96 premium, bool active)",
  "event Listed(uint256 indexed tokenId, uint256 premium)",
  "event Unlisted(uint256 indexed tokenId)",
  "event PremiumUpdated(uint256 indexed tokenId, uint256 premium)",
  "event Filled(address indexed buyer, address indexed recipient, uint256 indexed tokenId, uint256 unitAmount, uint256 premium, uint256 inventoryBefore, uint256 inventoryAfter)",
]);

const LIFECYCLE_EVENT_NAMES = new Set([
  "Listed",
  "Unlisted",
  "PremiumUpdated",
  "Filled",
]);

type FixtureEvent = {
  eventName: "Listed" | "Unlisted" | "PremiumUpdated" | "Filled";
  tokenId: number;
  blockNumber: number;
  transactionHash: Hash;
};

type CheckpointFixture = {
  schemaVersion: number;
  chainId: number;
  galleryAddress: Address;
  deployment: {
    blockNumber: number;
    blockHash: Hash;
  };
  checkpoint: {
    blockNumber: number;
    blockHash: Hash;
  };
  events: FixtureEvent[];
};

type GalleryManifest = ReturnType<typeof buildManifestFromCheckpointFixture>;

function requireRecord(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${path} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireCanonicalHash(
  value: unknown,
  expected: Hash,
  path: string,
): Hash {
  if (typeof value !== "string" || !isHash(value) || value !== expected) {
    throw new Error(`${path} does not match canonical Base Sepolia history`);
  }
  return value;
}

function requireCanonicalAddress(
  value: unknown,
  expected: Address,
  path: string,
): Address {
  if (
    typeof value !== "string" ||
    !isAddress(value, { strict: true }) ||
    getAddress(value) !== expected
  ) {
    throw new Error(`${path} does not match the deployed gallery`);
  }
  return expected;
}

export function parseCheckpointFixture(value: unknown): CheckpointFixture {
  const fixture = requireRecord(value, "fixture");
  if (fixture.schemaVersion !== 1) {
    throw new Error("fixture.schemaVersion must equal 1");
  }
  if (fixture.chainId !== baseSepolia.id) {
    throw new Error(`fixture.chainId must equal ${baseSepolia.id}`);
  }

  const deployment = requireRecord(fixture.deployment, "fixture.deployment");
  if (deployment.blockNumber !== DEPLOYMENT.blockNumber) {
    throw new Error("fixture.deployment.blockNumber is not canonical");
  }

  const checkpoint = requireRecord(fixture.checkpoint, "fixture.checkpoint");
  if (checkpoint.blockNumber !== CHECKPOINT.blockNumber) {
    throw new Error("fixture.checkpoint.blockNumber is not canonical");
  }

  if (!Array.isArray(fixture.events)) {
    throw new Error("fixture.events must be an array");
  }
  const events = fixture.events.map((value, index) => {
    const event = requireRecord(value, `fixture.events[${index}]`);
    if (
      typeof event.eventName !== "string" ||
      !LIFECYCLE_EVENT_NAMES.has(event.eventName)
    ) {
      throw new Error(`fixture.events[${index}].eventName is unsupported`);
    }
    if (
      !Number.isSafeInteger(event.tokenId) ||
      (event.tokenId as number) < COLLECTION.firstTokenId ||
      (event.tokenId as number) > COLLECTION.lastTokenId
    ) {
      throw new Error(`fixture.events[${index}].tokenId is out of range`);
    }
    if (
      !Number.isSafeInteger(event.blockNumber) ||
      (event.blockNumber as number) < DEPLOYMENT.blockNumber ||
      (event.blockNumber as number) > CHECKPOINT.blockNumber
    ) {
      throw new Error(`fixture.events[${index}].blockNumber is out of range`);
    }
    if (
      typeof event.transactionHash !== "string" ||
      !isHash(event.transactionHash)
    ) {
      throw new Error(
        `fixture.events[${index}].transactionHash must be a hash`,
      );
    }

    return {
      eventName: event.eventName as FixtureEvent["eventName"],
      tokenId: event.tokenId as number,
      blockNumber: event.blockNumber as number,
      transactionHash: event.transactionHash,
    };
  });

  return {
    schemaVersion: 1,
    chainId: baseSepolia.id,
    galleryAddress: requireCanonicalAddress(
      fixture.galleryAddress,
      ADDRESSES.gallery,
      "fixture.galleryAddress",
    ),
    deployment: {
      blockNumber: DEPLOYMENT.blockNumber,
      blockHash: requireCanonicalHash(
        deployment.blockHash,
        DEPLOYMENT.blockHash,
        "fixture.deployment.blockHash",
      ),
    },
    checkpoint: {
      blockNumber: CHECKPOINT.blockNumber,
      blockHash: requireCanonicalHash(
        checkpoint.blockHash,
        CHECKPOINT.blockHash,
        "fixture.checkpoint.blockHash",
      ),
    },
    events,
  };
}

export function reduceCheckpointCandidates(
  events: readonly Pick<FixtureEvent, "eventName" | "tokenId">[],
) {
  const candidates = new Set<number>();
  for (const event of events) {
    if (
      !LIFECYCLE_EVENT_NAMES.has(event.eventName) ||
      !Number.isSafeInteger(event.tokenId) ||
      event.tokenId < COLLECTION.firstTokenId ||
      event.tokenId > COLLECTION.lastTokenId
    ) {
      throw new Error(`Invalid ${event.eventName} candidate ${event.tokenId}`);
    }
    candidates.add(event.tokenId);
  }
  return [...candidates].sort((left, right) => left - right);
}

export function buildManifestFromCheckpointFixture(value: unknown) {
  const fixture = parseCheckpointFixture(value);

  return {
    schemaVersion: 1,
    generatorVersion: GENERATOR_VERSION,
    chainId: baseSepolia.id,
    addresses: ADDRESSES,
    testToken: {
      name: "Example",
      symbol: "TEST",
      unit: "1000000",
    },
    collection: COLLECTION,
    deployment: fixture.deployment,
    checkpoint: {
      ...fixture.checkpoint,
      candidateTokenIds: reduceCheckpointCandidates(fixture.events),
    },
  } as const;
}

export function formatGeneratedManifest(manifest: GalleryManifest): string {
  return `// Generated by scripts/generate-base-sepolia-test-gallery-manifest.ts.
// Source checkpoint: Base Sepolia block ${manifest.checkpoint.blockNumber}
// Source block hash: ${manifest.checkpoint.blockHash}

// prettier-ignore
export const BASE_SEPOLIA_TEST_GALLERY_MANIFEST = ${JSON.stringify(
    manifest,
    null,
    2,
  )} as const;

export type BaseSepoliaTestGalleryManifest =
  typeof BASE_SEPOLIA_TEST_GALLERY_MANIFEST;
`;
}

function rpcUrls() {
  const urls = [
    process.env.BASE_SEPOLIA_RPC,
    process.env.RPC_URL,
    process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL_1,
  ];

  const json = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_JSON;
  if (json) {
    const parsed = JSON.parse(json);
    if (
      !Array.isArray(parsed) ||
      parsed.some((url) => typeof url !== "string")
    ) {
      throw new Error("NEXT_PUBLIC_BASE_SEPOLIA_RPC_JSON must be a JSON array");
    }
    urls.push(...parsed);
  }

  urls.push("https://sepolia.base.org");
  return [...new Set(urls.filter((url): url is string => Boolean(url)))];
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, received ${actual}`);
  }
}

async function verifyLiveCheckpoint(manifest: GalleryManifest) {
  const client = createPublicClient({
    chain: baseSepolia,
    transport: fallback(rpcUrls().map((url) => http(url))),
  });

  assertEqual(
    await client.getChainId(),
    manifest.chainId,
    "Base Sepolia chain mismatch",
  );

  const [deploymentBlock, checkpointBlock] = await Promise.all([
    client.getBlock({
      blockNumber: BigInt(manifest.deployment.blockNumber),
    }),
    client.getBlock({
      blockNumber: BigInt(manifest.checkpoint.blockNumber),
    }),
  ]);
  assertEqual(
    deploymentBlock.hash,
    manifest.deployment.blockHash,
    "Gallery deployment block hash mismatch",
  );
  assertEqual(
    checkpointBlock.hash,
    manifest.checkpoint.blockHash,
    "Gallery checkpoint block hash mismatch",
  );

  const contractAddresses = [
    manifest.addresses.fame,
    manifest.addresses.mirror,
    manifest.addresses.renderer,
    manifest.addresses.creatorMagic,
    manifest.addresses.gallery,
  ];
  const code = await Promise.all(
    contractAddresses.map((address) =>
      client.getCode({
        address,
        blockNumber: BigInt(manifest.checkpoint.blockNumber),
      }),
    ),
  );
  code.forEach((bytecode, index) => {
    if (!bytecode || bytecode === "0x") {
      throw new Error(`No contract code at ${contractAddresses[index]}`);
    }
  });

  const [fame, mirror, creatorMagic, listing, logs] = await Promise.all([
    client.readContract({
      address: manifest.addresses.gallery,
      abi: galleryCheckpointAbi,
      functionName: "fame",
      blockNumber: BigInt(manifest.checkpoint.blockNumber),
    }),
    client.readContract({
      address: manifest.addresses.gallery,
      abi: galleryCheckpointAbi,
      functionName: "mirror",
      blockNumber: BigInt(manifest.checkpoint.blockNumber),
    }),
    client.readContract({
      address: manifest.addresses.gallery,
      abi: galleryCheckpointAbi,
      functionName: "creatorMagic",
      blockNumber: BigInt(manifest.checkpoint.blockNumber),
    }),
    client.readContract({
      address: manifest.addresses.gallery,
      abi: galleryCheckpointAbi,
      functionName: "listings",
      args: [1n],
      blockNumber: BigInt(manifest.checkpoint.blockNumber),
    }),
    client.getLogs({
      address: manifest.addresses.gallery,
      events: galleryCheckpointAbi.filter((item) => item.type === "event"),
      fromBlock: BigInt(manifest.deployment.blockNumber),
      toBlock: BigInt(manifest.checkpoint.blockNumber),
      strict: true,
    }),
  ]);

  assertEqual(
    getAddress(fame),
    manifest.addresses.fame,
    "Gallery FAME mismatch",
  );
  assertEqual(
    getAddress(mirror),
    manifest.addresses.mirror,
    "Gallery mirror mismatch",
  );
  assertEqual(
    getAddress(creatorMagic),
    manifest.addresses.creatorMagic,
    "Gallery CreatorMagic mismatch",
  );
  assertEqual(listing[1], false, "Checkpoint token 1 listing must be inactive");

  const candidates = reduceCheckpointCandidates(
    logs.map((log) => ({
      eventName: log.eventName,
      tokenId: Number(log.args.tokenId),
    })),
  );
  assertEqual(
    JSON.stringify(candidates),
    JSON.stringify(manifest.checkpoint.candidateTokenIds),
    "Checkpoint candidate reduction mismatch",
  );
}

export async function generateBaseSepoliaTestGalleryManifest(options?: {
  check?: boolean;
}) {
  const fixture = JSON.parse(await readFile(FIXTURE_PATH, "utf8"));
  const manifest = buildManifestFromCheckpointFixture(fixture);
  const generated = formatGeneratedManifest(manifest);

  if (options?.check) {
    const committed = await readFile(GENERATED_PATH, "utf8");
    assertEqual(
      committed,
      generated,
      "Committed gallery manifest is not reproducible",
    );
    await verifyLiveCheckpoint(manifest);
    return manifest;
  }

  await writeFile(GENERATED_PATH, generated);
  return manifest;
}

function shouldRunCli() {
  return (
    process.argv[1]?.endsWith(
      "generate-base-sepolia-test-gallery-manifest.ts",
    ) ?? false
  );
}

if (shouldRunCli()) {
  const check = process.argv.includes("--check");
  await generateBaseSepoliaTestGalleryManifest({ check });
  process.stdout.write(
    check
      ? "Base Sepolia TEST gallery manifest matches live checkpoint.\n"
      : `Generated ${GENERATED_PATH}\n`,
  );
}
