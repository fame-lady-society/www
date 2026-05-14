import {
  spawn,
  spawnSync,
  type ChildProcessWithoutNullStreams,
} from "node:child_process";
import { accessSync, constants, readFileSync } from "node:fs";
import { createServer as createHttpServer, request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { resolve } from "node:path";
import {
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  http,
  isAddress,
  keccak256,
  toHex,
  type Address,
  type Hash,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { FAME_SWAP_ARTIFACT_MANIFEST } from "../src/features/fame-swap/artifacts/manifest";
import type { FameSwapConfig } from "../src/features/fame-swap/config";
import { fameRouterAbi } from "../src/features/fame-swap/router/abi";
import { fameRouteToCall } from "../src/features/fame-swap/router/callRoute";
import { hashFameRoute } from "../src/features/fame-swap/router/encodeRoute";
import { erc20ApprovalAbi } from "../src/features/fame-swap/router/erc20Abi";
import { quoteFameSwapAsync } from "../src/features/fame-swap/solver/quote";
import { createLiveLiquidityQuoteAdapter } from "../src/features/fame-swap/solver/quotes/liveAdapters";
import {
  corpusTokenLabel,
  FAME_ROUTE_CORPUS,
  type FameRouteCorpusCase,
} from "../src/features/fame-swap/solver/routeCorpus";
import {
  liveReadiness,
  routerPolicyTargetKey,
  EXPECTED_FEE_PPM,
  type RouterPolicyReader,
  type RouterPolicySnapshot,
} from "../src/features/fame-swap/solver/readiness";
import {
  applySlippageToAmount,
  DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
} from "../src/features/fame-swap/solver/slippage";
import {
  FAME,
  NATIVE_ETH,
  USDC,
  WETH,
  tokenForAddress,
} from "../src/features/fame-swap/tokens";

const ANVIL_LOCAL_HOST = "127.0.0.1";
const DEFAULT_ANVIL_BIND_HOST = ANVIL_LOCAL_HOST;
const LOCAL_RPC_TIMEOUT_MS = 90_000;
const LOCAL_RPC_RETRY_ATTEMPTS = 4;
const DEFAULT_FORK_ACCOUNT =
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as const satisfies Address;
const DEFAULT_FORK_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const DEFAULT_FORK_CASE_IDS = [
  "usdc-fame-five-dollars",
  "fame-usdc-fixture",
  "weth-fame-small-direct",
  "fame-weth-fixture",
  "eth-fame-fixture",
  "fame-eth-fixture",
] as const;
const FAME_DN404_STORAGE_SLOT = 0xa20d6e21d0e5255308n;
const FAME_DN404_ADDRESS_DATA_MAPPING_SLOT = FAME_DN404_STORAGE_SLOT + 11n;
const FAME_DN404_ADDRESS_DATA_BALANCE_SHIFT = 160n;
const FAME_DN404_ADDRESS_DATA_LOWER_MASK =
  (1n << FAME_DN404_ADDRESS_DATA_BALANCE_SHIFT) - 1n;
const UINT96_MAX = (1n << 96n) - 1n;
const fameRouterDeploymentAbi = [
  {
    type: "constructor",
    stateMutability: "payable",
    inputs: [{ name: "initialFeeRecipient", type: "address" }],
  },
  {
    type: "function",
    name: "setVenueFamilyEnabled",
    stateMutability: "nonpayable",
    inputs: [
      { name: "family", type: "uint8" },
      { name: "enabled", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "setVenueTargetEnabled",
    stateMutability: "nonpayable",
    inputs: [
      { name: "family", type: "uint8" },
      { name: "target", type: "address" },
      { name: "enabled", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "setV4HookDataHashEnabled",
    stateMutability: "nonpayable",
    inputs: [
      { name: "hookDataKey", type: "bytes32" },
      { name: "enabled", type: "bool" },
    ],
    outputs: [],
  },
] as const;

const erc20BalanceAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
] as const;

const wethDepositAbi = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
] as const;

interface ArtifactHashExpectation {
  path: string;
  expected: Hex;
  label: string;
}

interface ChainProbeClient {
  getChainId(): Promise<number>;
  getBlockNumber(): Promise<bigint>;
}

interface DeploymentClient {
  getCode(parameters: { address: Address }): Promise<Hex | undefined>;
  waitForTransactionReceipt(parameters: {
    hash: Hash;
  }): Promise<{ status: "success" | "reverted"; contractAddress?: Address | null }>;
  readContract(parameters: {
    address: Address;
    abi: typeof fameRouterAbi;
    functionName: "feePpm";
  }): Promise<bigint | number>;
}

interface FameRouterArtifact {
  bytecode: {
    object: Hex;
  };
}

interface RouterPolicyReadClient {
  feePpm(routerAddress: Address): Promise<bigint | number>;
  venueFamilyEnabled(
    routerAddress: Address,
    familyOrdinal: number,
  ): Promise<boolean>;
  venueTargetEnabled(
    routerAddress: Address,
    familyOrdinal: number,
    target: Address,
  ): Promise<boolean>;
  v4HookDataHashEnabled(
    routerAddress: Address,
    hookDataKey: Hex,
  ): Promise<boolean>;
}

interface RpcProxy {
  url: string;
  close(): Promise<void>;
}

function envValue(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

function envAddress(name: string): Address | null {
  const value = envValue(name);
  return value && isAddress(value) ? value : null;
}

function logProgress(message: string): void {
  console.log(`Fork smoke: ${message}`);
}

function selectedForkCases(): readonly FameRouteCorpusCase[] {
  const casesById = new Map(FAME_ROUTE_CORPUS.map((entry) => [entry.id, entry]));
  const requested = envValue("FAME_SWAP_FORK_CASES");
  const ids =
    requested && requested.toLowerCase() !== "default"
      ? requested.toLowerCase() === "all"
        ? FAME_ROUTE_CORPUS.map((entry) => entry.id)
        : requested
            .split(",")
            .map((id) => id.trim())
            .filter((id) => id.length > 0)
      : [...DEFAULT_FORK_CASE_IDS];

  if (ids.length === 0) {
    throw new Error("FAME_SWAP_FORK_CASES did not include any case ids.");
  }

  return ids.map((id) => {
    const entry = casesById.get(id);
    if (!entry) {
      throw new Error(`Unknown FAME_SWAP_FORK_CASES id: ${id}.`);
    }
    return entry;
  });
}

function childEnv(extra: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  const allowedKeys = [
    "PATH",
    "HOME",
    "TMPDIR",
    "TEMP",
    "TMP",
    "XDG_CACHE_HOME",
    "NO_COLOR",
    "CI",
    "FOUNDRY_DISABLE_NIGHTLY_WARNING",
  ] as const;
  const env: NodeJS.ProcessEnv = {
    FOUNDRY_DISABLE_NIGHTLY_WARNING: "1",
    NODE_ENV: process.env.NODE_ENV ?? "development",
  };

  for (const key of allowedKeys) {
    if (process.env[key]) {
      env[key] = process.env[key];
    }
  }

  return {
    ...env,
    ...extra,
  };
}

function findExecutable(name: string): string | null {
  const override = envValue(`${name.toUpperCase()}_BIN`);
  if (override) {
    try {
      accessSync(override, constants.X_OK);
      return override;
    } catch {
      return null;
    }
  }

  const result = spawnSync("which", [name], {
    stdio: "pipe",
    encoding: "utf8",
    env: childEnv(),
  });

  if (result.status === 0) {
    return result.stdout.trim();
  }

  const fallback = resolve(process.env.HOME ?? ".", ".foundry/bin", name);
  try {
    accessSync(fallback, constants.X_OK);
    return fallback;
  } catch {
    return null;
  }
}

function fameContractsDir(): string {
  return resolve(envValue("FAME_CONTRACTS_DIR") ?? "../fame-contracts");
}

function createForkWallet(anvilUrl: string) {
  return createWalletClient({
    account: privateKeyToAccount(DEFAULT_FORK_PRIVATE_KEY),
    chain: base,
    transport: http(anvilUrl, {
      retryCount: 5,
      retryDelay: 1_000,
      timeout: LOCAL_RPC_TIMEOUT_MS,
    }),
  });
}

async function isRouterCandidate(
  client: DeploymentClient,
  address: Address,
): Promise<boolean> {
  const bytecode = await client.getCode({ address });
  if (!bytecode || bytecode === "0x") return false;

  try {
    const feePpm = await client.readContract({
      address,
      abi: fameRouterAbi,
      functionName: "feePpm",
    });
    return BigInt(feePpm) === EXPECTED_FEE_PPM;
  } catch {
    return false;
  }
}

function hostForUrl(host: string): string {
  return host.includes(":") && !host.startsWith("[") ? `[${host}]` : host;
}

function anvilBindHost(): string {
  return envValue("FAME_SWAP_ANVIL_BIND_HOST") ?? DEFAULT_ANVIL_BIND_HOST;
}

function anvilPublicHost(bindHost: string): string {
  return (
    envValue("FAME_SWAP_ANVIL_PUBLIC_HOST") ??
    (bindHost === "0.0.0.0" || bindHost === "::"
      ? ANVIL_LOCAL_HOST
      : bindHost)
  );
}

async function findOpenPort(host: string): Promise<number> {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.on("error", reject);
    server.listen(0, host, () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === "object") {
          resolvePort(address.port);
          return;
        }
        reject(new Error("Could not allocate a local port."));
      });
    });
  });
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolveWait) => {
    setTimeout(resolveWait, milliseconds);
  });
}

function timeoutAfter<T>(label: string, milliseconds: number): Promise<T> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${label} timed out after ${milliseconds.toString()}ms.`));
    }, milliseconds);
  });
}

async function retryLocalRpc<T>(
  label: string,
  operation: () => Promise<T>,
  attempts = LOCAL_RPC_RETRY_ATTEMPTS,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await Promise.race([
        operation(),
        timeoutAfter<T>(label, LOCAL_RPC_TIMEOUT_MS),
      ]);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await wait(1_000 * attempt);
      }
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`${label} failed: ${displaySafeProcessOutput(message)}`);
}

async function waitForRpc(
  client: ChainProbeClient,
  expectedForkBlock: number | null,
  anvil: ChildProcessWithoutNullStreams,
  anvilOutput: () => string,
): Promise<void> {
  const timeoutAt = Date.now() + 90_000;
  let lastError: Error | null = null;

  while (Date.now() < timeoutAt) {
    if (anvil.exitCode !== null) {
      const detail = anvilOutput();
      throw new Error(
        `Anvil exited before its RPC was ready.${detail ? `\n${detail}` : ""}`,
      );
    }

    try {
      await client.getChainId();
      const blockNumber = await client.getBlockNumber();
      if (expectedForkBlock !== null && blockNumber < BigInt(expectedForkBlock)) {
        throw new Error(`Fork block ${blockNumber.toString()} is behind pinned block.`);
      }
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("RPC probe failed.");
      await wait(250);
    }
  }

  const detail = anvilOutput();
  throw new Error(
    [
      lastError?.message ?? "Timed out waiting for anvil RPC.",
      detail,
    ]
      .filter((value) => value && value.length > 0)
      .join("\n"),
  );
}

function displaySafeProcessOutput(output: string): string {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(-12)
    .join("\n")
    .replace(/https?:\/\/\S+/g, "[redacted-url]")
    .replace(/0x[a-fA-F0-9]{96,}/g, "[redacted-hex]");
}

async function startRpcProxy(upstreamUrl: string): Promise<RpcProxy> {
  const upstream = new URL(upstreamUrl);
  const request = upstream.protocol === "https:" ? httpsRequest : httpRequest;

  const server = createHttpServer((incoming, outgoing) => {
    if (incoming.method !== "POST") {
      outgoing.statusCode = 405;
      outgoing.end();
      return;
    }

    const chunks: Buffer[] = [];
    incoming.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    incoming.on("end", () => {
      const body = Buffer.concat(chunks);
      const forwarded = request(
        {
          protocol: upstream.protocol,
          hostname: upstream.hostname,
          port: upstream.port || undefined,
          path: `${upstream.pathname}${upstream.search}`,
          method: "POST",
          headers: {
            "content-type": incoming.headers["content-type"] ?? "application/json",
            "content-length": body.length.toString(),
          },
        },
        (response) => {
          outgoing.statusCode = response.statusCode ?? 502;
          const contentType = response.headers["content-type"];
          if (contentType) {
            outgoing.setHeader("content-type", contentType);
          }
          response.pipe(outgoing);
        },
      );

      forwarded.on("error", () => {
        if (!outgoing.headersSent) {
          outgoing.statusCode = 502;
          outgoing.setHeader("content-type", "application/json");
        }
        outgoing.end(
          JSON.stringify({
            jsonrpc: "2.0",
            id: null,
            error: {
              code: -32_000,
              message: "Upstream RPC proxy request failed.",
            },
          }),
        );
      });
      forwarded.end(body);
    });
  });

  return new Promise((resolveProxy, reject) => {
    server.on("error", reject);
    server.listen(0, ANVIL_LOCAL_HOST, () => {
      const address = server.address();
      if (!address || typeof address !== "object") {
        reject(new Error("Could not start local RPC proxy."));
        return;
      }

      resolveProxy({
        url: `http://${ANVIL_LOCAL_HOST}:${address.port}`,
        close: async () => {
          await new Promise<void>((resolveClose) => {
            server.close(() => resolveClose());
          });
        },
      });
    });
  });
}

async function stopAnvil(anvil: ChildProcessWithoutNullStreams): Promise<void> {
  if (anvil.exitCode !== null) return;

  await new Promise<void>((resolveStop) => {
    const timeout = setTimeout(() => {
      anvil.kill("SIGKILL");
      resolveStop();
    }, 2_000);

    anvil.once("exit", () => {
      clearTimeout(timeout);
      resolveStop();
    });

    anvil.kill("SIGTERM");
  });
}

async function verifyArtifactHashes(): Promise<void> {
  logProgress("verifying artifact hashes");
  const expectations: ArtifactHashExpectation[] = [
    {
      path: "src/features/fame-swap/artifacts/base-v1-solver-routes.json",
      expected: FAME_SWAP_ARTIFACT_MANIFEST.solverRoutesJsonHash,
      label: "solver routes",
    },
    {
      path: "src/features/fame-swap/artifacts/base-v1-route-gap-matrix.json",
      expected: FAME_SWAP_ARTIFACT_MANIFEST.gapMatrixJsonHash,
      label: "gap matrix",
    },
    {
      path: "src/features/fame-swap/artifacts/base-v1-route-parity-vectors.json",
      expected: FAME_SWAP_ARTIFACT_MANIFEST.parityVectorsJsonHash,
      label: "parity vectors",
    },
    {
      path: "src/features/fame-swap/artifacts/base-v1-pools.json",
      expected: FAME_SWAP_ARTIFACT_MANIFEST.poolsJsonHash,
      label: "pool universe",
    },
    {
      path: "src/features/fame-swap/artifacts/base-v1-pool-state-snapshot.json",
      expected: FAME_SWAP_ARTIFACT_MANIFEST.poolStateSnapshotJsonHash,
      label: "recorded pool state",
    },
  ];

  for (const expectation of expectations) {
    const bytes = await readFile(expectation.path);
    const actual = keccak256(toHex(bytes));
    if (actual !== expectation.expected) {
      throw new Error(
        `${expectation.label} hash mismatch: expected ${expectation.expected}, got ${actual}`,
      );
    }
  }
}

function buildConfig(routerAddress: Address): FameSwapConfig {
  return {
    routerAddress,
    defaultSlippageBps: DEFAULT_FAME_SWAP_SLIPPAGE_BPS,
    expectedSchemaVersion: FAME_SWAP_ARTIFACT_MANIFEST.schemaVersion,
    expectedPinnedBaseBlock: FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock,
    expectedSolverRoutesHash: FAME_SWAP_ARTIFACT_MANIFEST.solverRoutesJsonHash,
    expectedGapMatrixHash: FAME_SWAP_ARTIFACT_MANIFEST.gapMatrixJsonHash,
    expectedParityVectorsHash:
      FAME_SWAP_ARTIFACT_MANIFEST.parityVectorsJsonHash,
    expectedPoolsHash: FAME_SWAP_ARTIFACT_MANIFEST.poolsJsonHash,
    expectedPoolStateSnapshotHash:
      FAME_SWAP_ARTIFACT_MANIFEST.poolStateSnapshotJsonHash,
  };
}

async function keepForkAliveIfRequested(
  anvilUrl: string,
  routerAddress: Address,
  slippageBps: number,
): Promise<void> {
  if (envValue("FAME_SWAP_KEEP_FORK_ALIVE") !== "1") return;

  console.log("");
  console.log("FAME swap fork remains running. Use this web env:");
  console.log(`NEXT_PUBLIC_BASE_RPC_URL_1=${anvilUrl}`);
  console.log(`NEXT_PUBLIC_FAME_ROUTER_ADDRESS=${routerAddress}`);
  console.log(`NEXT_PUBLIC_FAME_SWAP_SLIPPAGE_BPS=${slippageBps.toString()}`);
  console.log("Press Ctrl-C to stop the fork.");
  await new Promise<void>((resolveKeepAlive) => {
    process.once("SIGINT", resolveKeepAlive);
    process.once("SIGTERM", resolveKeepAlive);
  });
}

function buildPolicyReader(client: RouterPolicyReadClient): RouterPolicyReader {
  return {
    read: async (routerAddress): Promise<RouterPolicySnapshot> => {
      const feePpm = await client.feePpm(routerAddress);

      const familyResults = await Promise.all(
        FAME_SWAP_ARTIFACT_MANIFEST.requiredVenueTargets.map(
          async (target) => {
            const enabled = await client.venueFamilyEnabled(
              routerAddress,
              target.familyOrdinal,
            );
            return [target.familyOrdinal, enabled] as const;
          },
        ),
      );

      const targetResults = await Promise.all(
        FAME_SWAP_ARTIFACT_MANIFEST.requiredVenueTargets.map(
          async (target) => {
            const enabled = await client.venueTargetEnabled(
              routerAddress,
              target.familyOrdinal,
              target.target,
            );
            return [
              routerPolicyTargetKey(target.familyOrdinal, target.target),
              enabled,
            ] as const;
          },
        ),
      );

      const hookDataResults = await Promise.all(
        FAME_SWAP_ARTIFACT_MANIFEST.requiredV4HookDataKeys.map(
          async (hookDataKey) => {
            const enabled = await client.v4HookDataHashEnabled(
              routerAddress,
              hookDataKey,
            );
            return [hookDataKey.toLowerCase(), enabled] as const;
          },
        ),
      );

      return {
        feePpm: typeof feePpm === "bigint" ? feePpm : BigInt(feePpm),
        venueFamilies: new Map(familyResults),
        venueTargets: new Map(targetResults),
        v4HookDataKeys: new Map(hookDataResults),
      };
    },
  };
}

async function deployLocalRouter(
  client: DeploymentClient,
  anvilUrl: string,
): Promise<Address> {
  logProgress("deploying local router");
  const artifactPath = resolve(
    fameContractsDir(),
    "out",
    "FameRouter.sol",
    "FameRouter.json",
  );
  const artifact = JSON.parse(
    readFileSync(artifactPath, "utf8"),
  ) as FameRouterArtifact;
  const wallet = createForkWallet(anvilUrl);

  async function waitForSuccess(hash: Hash, label: string): Promise<Address | null> {
    const receipt = await retryLocalRpc(label, () =>
      client.waitForTransactionReceipt({ hash }),
    );
    if (receipt.status !== "success") {
      throw new Error(`${label} reverted on the local fork.`);
    }
    return receipt.contractAddress ?? null;
  }

  const deployHash = await retryLocalRpc("Deploy FAME router", () =>
    wallet.deployContract({
      abi: fameRouterDeploymentAbi,
      bytecode: artifact.bytecode.object,
      args: [DEFAULT_FORK_ACCOUNT],
    }),
  );
  const routerAddress = await waitForSuccess(deployHash, "FAME router deploy");

  if (!routerAddress) {
    throw new Error("Local FAME router deployment did not return an address.");
  }
  logProgress(`local router deployed at ${routerAddress}`);

  for (const target of FAME_SWAP_ARTIFACT_MANIFEST.requiredVenueTargets) {
    logProgress(`enabling venue family ${target.family}`);
    await waitForSuccess(
      await retryLocalRpc(`Enable venue family ${target.family}`, () =>
        wallet.writeContract({
          address: routerAddress,
          abi: fameRouterDeploymentAbi,
          functionName: "setVenueFamilyEnabled",
          args: [target.familyOrdinal, true],
        }),
      ),
      `Enable venue family ${target.family}`,
    );
    logProgress(`enabling venue target ${target.family}:${target.target}`);
    await waitForSuccess(
      await retryLocalRpc(`Enable venue target ${target.family}`, () =>
        wallet.writeContract({
          address: routerAddress,
          abi: fameRouterDeploymentAbi,
          functionName: "setVenueTargetEnabled",
          args: [target.familyOrdinal, target.target, true],
        }),
      ),
      `Enable venue target ${target.family}:${target.target}`,
    );
  }

  for (const hookDataKey of FAME_SWAP_ARTIFACT_MANIFEST.requiredV4HookDataKeys) {
    logProgress(`enabling V4 hook data ${hookDataKey}`);
    await waitForSuccess(
      await retryLocalRpc(`Enable V4 hook data ${hookDataKey}`, () =>
        wallet.writeContract({
          address: routerAddress,
          abi: fameRouterDeploymentAbi,
          functionName: "setV4HookDataHashEnabled",
          args: [hookDataKey, true],
        }),
      ),
      `Enable V4 hook data ${hookDataKey}`,
    );
  }

  if (!(await isRouterCandidate(client, routerAddress))) {
    throw new Error("Local FAME router deployment did not pass readiness probes.");
  }

  return routerAddress;
}

async function main(): Promise<void> {
  logProgress("starting");
  const rpcUrl = envValue("BASE_RPC_URL") ?? envValue("NEXT_PUBLIC_BASE_RPC_URL_1");
  if (!rpcUrl) {
    throw new Error(
      "Set BASE_RPC_URL or NEXT_PUBLIC_BASE_RPC_URL_1 to a Base RPC URL before running the fork smoke test.",
    );
  }

  const anvilPath = findExecutable("anvil");
  if (!anvilPath) {
    throw new Error("Install Foundry anvil or set ANVIL_BIN to its executable path.");
  }

  await verifyArtifactHashes();

  const forkBlockValue = envValue("FAME_SWAP_FORK_BLOCK");
  const forkBlock =
    forkBlockValue === "latest"
      ? null
      : Number(forkBlockValue ?? FAME_SWAP_ARTIFACT_MANIFEST.pinnedBaseBlock);
  if (forkBlock !== null && !Number.isSafeInteger(forkBlock)) {
    throw new Error("FAME_SWAP_FORK_BLOCK must be a safe integer or latest.");
  }

  const allowRpcProcessArg = envValue("FAME_SWAP_ALLOW_RPC_URL_PROCESS_ARG") === "1";
  logProgress(
    allowRpcProcessArg ? "using RPC URL as Anvil argument" : "starting loopback RPC proxy",
  );
  const proxy = allowRpcProcessArg ? null : await startRpcProxy(rpcUrl);
  if (proxy) {
    logProgress("loopback RPC proxy ready");
  }
  const bindHost = anvilBindHost();
  const publicHost = anvilPublicHost(bindHost);
  logProgress(`allocating Anvil port on ${bindHost}`);
  const port = await findOpenPort(bindHost);
  const anvilUrl = `http://${ANVIL_LOCAL_HOST}:${port}`;
  const publicAnvilUrl = `http://${hostForUrl(publicHost)}:${port}`;
  const forkBlockArgs =
    forkBlock === null ? [] : ["--fork-block-number", forkBlock.toString()];
  const debugAnvil = envValue("FAME_SWAP_DEBUG_ANVIL") === "1";
  logProgress(
    `starting Anvil fork at ${forkBlock === null ? "latest" : forkBlock.toString()}`,
  );
  const anvil = spawn(
    anvilPath,
    [
      "--host",
      bindHost,
      "--port",
      port.toString(),
      "--fork-url",
      proxy?.url ?? rpcUrl,
      ...forkBlockArgs,
      "--no-storage-caching",
      "--chain-id",
      base.id.toString(),
      ...(debugAnvil ? [] : ["--silent"]),
    ],
    {
      env: childEnv(),
    },
  );
  let anvilOutput = "";
  const appendAnvilOutput = (chunk: Buffer) => {
    anvilOutput = `${anvilOutput}${chunk.toString("utf8")}`.slice(-8_000);
  };
  anvil.stdout.on("data", appendAnvilOutput);
  anvil.stderr.on("data", appendAnvilOutput);

  const client = createPublicClient({
    chain: base,
    transport: http(anvilUrl, {
      retryCount: 5,
      retryDelay: 1_000,
      timeout: LOCAL_RPC_TIMEOUT_MS,
    }),
  });

  try {
    logProgress("waiting for Anvil RPC");
    await waitForRpc(client, forkBlock, anvil, () =>
      displaySafeProcessOutput(anvilOutput),
    );
    logProgress("Anvil RPC ready");

    const configuredRouterAddress =
      envValue("FAME_SWAP_IGNORE_CONFIGURED_ROUTER") === "1"
        ? null
        : envAddress("NEXT_PUBLIC_FAME_ROUTER_ADDRESS") ??
          envAddress("FAME_ROUTER_ADDRESS");
    const routerAddress =
      configuredRouterAddress ?? (await deployLocalRouter(client, anvilUrl));
    if (configuredRouterAddress) {
      logProgress(`using configured router ${routerAddress}`);
    }

    const config = buildConfig(routerAddress);
    const policyClient: RouterPolicyReadClient = {
      feePpm: (address) =>
        client.readContract({
          address,
          abi: fameRouterAbi,
          functionName: "feePpm",
        }),
      venueFamilyEnabled: (address, familyOrdinal) =>
        client.readContract({
          address,
          abi: fameRouterAbi,
          functionName: "venueFamilyEnabled",
          args: [familyOrdinal],
        }),
      venueTargetEnabled: (address, familyOrdinal, target) =>
        client.readContract({
          address,
          abi: fameRouterAbi,
          functionName: "venueTargetEnabled",
          args: [familyOrdinal, target],
        }),
      v4HookDataHashEnabled: (address, hookDataKey) =>
        client.readContract({
          address,
          abi: fameRouterAbi,
          functionName: "v4HookDataHashEnabled",
          args: [hookDataKey],
        }),
    };
    const readiness = await liveReadiness(config, buildPolicyReader(policyClient));
    if (readiness.status !== "ready") {
      throw new Error(`Router readiness blocked: ${readiness.reason}. ${readiness.message}`);
    }

    if (envValue("FAME_SWAP_SKIP_ROUTE_SMOKE") === "1") {
      console.log("FAME swap fork ready");
      console.log(`Router: ${routerAddress}`);
      console.log(`Fork RPC: ${publicAnvilUrl}`);
      if (bindHost !== ANVIL_LOCAL_HOST) {
        console.log(`Anvil bind host: ${bindHost}`);
      }
      await keepForkAliveIfRequested(
        publicAnvilUrl,
        routerAddress,
        config.defaultSlippageBps,
      );
      return;
    }

    const quoteAdapter = await createLiveLiquidityQuoteAdapter({
      client: {
        getBlockNumber: () => client.getBlockNumber(),
        readContract: (request) =>
          client.readContract(
            request as Parameters<typeof client.readContract>[0],
          ) as Promise<unknown>,
      },
      chainId: base.id,
      contextSource: "fork",
      forkUrlLabel: "local-anvil",
      readTimeoutMs: 30_000,
    });
    const wallet = createForkWallet(anvilUrl);
    const forkRequest = (method: string, params: unknown[] = []) =>
      (client as unknown as {
        request(request: { method: string; params?: unknown[] }): Promise<unknown>;
      }).request({ method, params });
    const tokenBalanceSlotCache = new Map<Address, Hex>();

    async function waitForSuccess(hash: Hash, label: string): Promise<void> {
      const receipt = await retryLocalRpc(label, () =>
        client.waitForTransactionReceipt({ hash }),
      );
      if (receipt.status !== "success") {
        throw new Error(`${label} reverted on the local fork.`);
      }
    }

    async function readTokenBalance(tokenAddress: Address): Promise<bigint> {
      return client.readContract({
        address: tokenAddress,
        abi: erc20BalanceAbi,
        functionName: "balanceOf",
        args: [DEFAULT_FORK_ACCOUNT],
      }) as Promise<bigint>;
    }

    async function setStorageAt(
      address: Address,
      slot: Hex,
      value: Hex,
    ): Promise<void> {
      await retryLocalRpc("anvil_setStorageAt", () =>
        forkRequest("anvil_setStorageAt", [address, slot, value]),
      );
      await retryLocalRpc("evm_mine", () => forkRequest("evm_mine"));
    }

    async function storageAt(address: Address, slot: Hex): Promise<Hex> {
      const value = (await retryLocalRpc("eth_getStorageAt", () =>
        forkRequest("eth_getStorageAt", [address, slot, "latest"]),
      )) as Hex | undefined;
      return value && value !== "0x" ? value : toHex(0n, { size: 32 });
    }

    async function seedFameBalance(amount: bigint): Promise<void> {
      if (amount > UINT96_MAX) {
        throw new Error("FAME fork seed amount exceeds DN404 uint96 balance storage.");
      }
      if ((await readTokenBalance(FAME)) >= amount) return;

      const storageSlot = keccak256(
        encodeAbiParameters(
          [{ type: "address" }, { type: "uint256" }],
          [DEFAULT_FORK_ACCOUNT, FAME_DN404_ADDRESS_DATA_MAPPING_SLOT],
        ),
      );
      const currentValue = BigInt(await storageAt(FAME, storageSlot));
      const updatedValue =
        (currentValue & FAME_DN404_ADDRESS_DATA_LOWER_MASK) |
        (amount << FAME_DN404_ADDRESS_DATA_BALANCE_SHIFT);

      await setStorageAt(FAME, storageSlot, toHex(updatedValue, { size: 32 }));
      if ((await readTokenBalance(FAME)) < amount) {
        throw new Error("Could not seed DN404 FAME balance on the local fork.");
      }
    }

    async function seedTokenBalance(
      tokenAddress: Address,
      amount: bigint,
    ): Promise<void> {
      if ((await readTokenBalance(tokenAddress)) >= amount) return;
      if (tokenAddress === FAME) {
        await seedFameBalance(amount);
        return;
      }

      const cachedSlot = tokenBalanceSlotCache.get(tokenAddress);
      if (cachedSlot) {
        await setStorageAt(tokenAddress, cachedSlot, toHex(amount, { size: 32 }));
        if ((await readTokenBalance(tokenAddress)) >= amount) return;
        tokenBalanceSlotCache.delete(tokenAddress);
      }

      for (let slot = 0n; slot < 200n; slot += 1n) {
        const storageSlot = keccak256(
          encodeAbiParameters(
            [{ type: "address" }, { type: "uint256" }],
            [DEFAULT_FORK_ACCOUNT, slot],
          ),
        );
        const original = await storageAt(tokenAddress, storageSlot);

        await setStorageAt(tokenAddress, storageSlot, toHex(amount, { size: 32 }));
        if ((await readTokenBalance(tokenAddress)) >= amount) {
          tokenBalanceSlotCache.set(tokenAddress, storageSlot);
          return;
        }
        await setStorageAt(
          tokenAddress,
          storageSlot,
          original === "0x" ? toHex(0n, { size: 32 }) : original,
        );
      }

      throw new Error(`Could not seed ERC20 balance for ${tokenAddress}.`);
    }

    async function prepareInputBalance(
      entry: FameRouteCorpusCase,
    ): Promise<void> {
      if (entry.tokenIn === NATIVE_ETH) return;
      if (entry.tokenIn === WETH) {
        const balance = await readTokenBalance(WETH);
        if (balance < entry.amountIn) {
          await waitForSuccess(
            await retryLocalRpc("Deposit WETH", () =>
              wallet.writeContract({
                address: WETH,
                abi: wethDepositAbi,
                functionName: "deposit",
                value: entry.amountIn - balance,
              }),
            ),
            "Deposit WETH",
          );
        }
        return;
      }
      if (entry.tokenIn === USDC || entry.tokenIn === FAME) {
        await seedTokenBalance(entry.tokenIn, entry.amountIn);
        return;
      }
      throw new Error(`No fork seeding strategy for ${corpusTokenLabel(entry.tokenIn)}.`);
    }

    async function proveForkCase(entry: FameRouteCorpusCase) {
      const tokenIn = tokenForAddress(entry.tokenIn);
      const tokenOut = tokenForAddress(entry.tokenOut);
      if (!tokenIn || !tokenOut) {
        throw new Error(`Unsupported fork corpus token for ${entry.id}.`);
      }

      const quote = await quoteFameSwapAsync({
        tokenIn,
        tokenOut,
        amountIn: entry.amountIn,
        recipient: DEFAULT_FORK_ACCOUNT,
        config,
        readiness,
        now: new Date(),
        adapter: quoteAdapter,
      });

      if (quote.status !== "ready") {
        const rejectionDetail =
          "rejectedCandidates" in quote
            ? quote.rejectedCandidates
                .slice(0, 5)
                .map((candidate) => `${candidate.reason}: ${candidate.message}`)
                .join(" / ")
            : "";
        throw new Error(
          `Fork quote ${entry.id} blocked with status ${quote.status}: ${
            quote.message
          }${rejectionDetail ? ` ${rejectionDetail}` : ""}`,
        );
      }

      await prepareInputBalance(entry);
      const approval = quote.approval;
      if (approval) {
        await waitForSuccess(
          await retryLocalRpc(`Approve ${entry.id}`, () =>
            wallet.writeContract({
              address: approval.token.address,
              abi: erc20ApprovalAbi,
              functionName: "approve",
              args: [approval.spender, approval.amount],
            }),
          ),
          `Approve ${entry.id}`,
        );
      }

      const probeSimulation = await retryLocalRpc(`Probe ${entry.id}`, () =>
        client.simulateContract({
          account: DEFAULT_FORK_ACCOUNT,
          address: quote.routerAddress,
          abi: fameRouterAbi,
          functionName: "executeRoute",
          args: [fameRouteToCall(quote.route)],
          value: quote.callValue,
        }),
      );
      const protectedMinimum = applySlippageToAmount(
        probeSimulation.result,
        quote.slippageBps,
      );
      const protectedRoute = {
        ...quote.route,
        minAmountOutAfterFee: protectedMinimum,
      };
      const protectedRouteHash = hashFameRoute(protectedRoute);
      const protectedSimulation = await retryLocalRpc(`Protected probe ${entry.id}`, () =>
        client.simulateContract({
          account: DEFAULT_FORK_ACCOUNT,
          address: quote.routerAddress,
          abi: fameRouterAbi,
          functionName: "executeRoute",
          args: [fameRouteToCall(protectedRoute)],
          value: quote.callValue,
        }),
      );

      return {
        id: entry.id,
        pair: `${corpusTokenLabel(entry.tokenIn)}->${corpusTokenLabel(entry.tokenOut)}`,
        route: quote.routeArtifactId,
        routeHash: protectedRouteHash,
        output: protectedSimulation.result,
        protectedMinimum,
        pools: quote.poolIds,
        quoteContext:
          quote.quoteContext?.source === "fork"
            ? `fork:${quote.quoteContext.chainId}:${quote.quoteContext.blockNumber.toString()}`
            : "fork:n/a",
      };
    }

    const proofRows: Array<Awaited<ReturnType<typeof proveForkCase>>> = [];
    const forkCases = selectedForkCases();
    logProgress(`selected ${forkCases.length.toString()} fork case(s)`);
    for (const entry of forkCases) {
      console.log(
        `Fork smoke case: ${entry.id} (${corpusTokenLabel(entry.tokenIn)}->${corpusTokenLabel(
          entry.tokenOut,
        )})`,
      );
      proofRows.push(await proveForkCase(entry));
    }

    console.log("FAME swap fork smoke passed");
    console.log(`Router: ${routerAddress}`);
    console.log(`Fork RPC: ${publicAnvilUrl}`);
    console.log(`Cases: ${forkCases.map((entry) => entry.id).join(",")}`);
    if (bindHost !== ANVIL_LOCAL_HOST) {
      console.log(`Anvil bind host: ${bindHost}`);
    }
    for (const row of proofRows) {
      console.log(
        [
          `Case: ${row.id}`,
          `Pair: ${row.pair}`,
          `Route: ${row.route}`,
          `Pools: ${row.pools.join(",")}`,
          `Quote context: ${row.quoteContext}`,
          `Route hash: ${row.routeHash}`,
          `Protected minimum: ${row.protectedMinimum.toString()}`,
          `Protected output: ${row.output.toString()}`,
        ].join(" | "),
      );
    }

    await keepForkAliveIfRequested(
      publicAnvilUrl,
      routerAddress,
      config.defaultSlippageBps,
    );
  } finally {
    await stopAnvil(anvil);
    await proxy?.close();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown fork smoke failure.";
  console.error(`FAME swap fork smoke failed: ${message}`);
  process.exitCode = 1;
});
