import {
  spawn,
  spawnSync,
  type ChildProcessWithoutNullStreams,
} from "node:child_process";
import { accessSync, constants, existsSync, readFileSync } from "node:fs";
import { createServer as createHttpServer, request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import {
  createPublicClient,
  getContractAddress,
  http,
  isAddress,
  keccak256,
  toHex,
  type Address,
  type Hex,
} from "viem";
import { base } from "viem/chains";
import {
  FAME_SWAP_ARTIFACT_MANIFEST,
  type FameSwapRouteArtifactId,
} from "../src/features/fame-swap/artifacts/manifest";
import type { FameSwapConfig } from "../src/features/fame-swap/config";
import { fameRouterAbi } from "../src/features/fame-swap/router/abi";
import { fameRouteToCall } from "../src/features/fame-swap/router/callRoute";
import { hashFameRoute } from "../src/features/fame-swap/router/encodeRoute";
import { routeArtifactById } from "../src/features/fame-swap/solver/artifacts";
import { quoteFameSwap } from "../src/features/fame-swap/solver/quote";
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
import { FAME, NATIVE_ETH, tokenForAddress } from "../src/features/fame-swap/tokens";

const ANVIL_LOCAL_HOST = "127.0.0.1";
const DEFAULT_ANVIL_BIND_HOST = ANVIL_LOCAL_HOST;
const DEFAULT_FORK_ACCOUNT =
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as const satisfies Address;
const DEFAULT_FORK_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const DEFAULT_ROUTE_ID =
  "solver-eth-zora-basedflick-fame" as const satisfies FameSwapRouteArtifactId;

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
  getTransactionCount(parameters: { address: Address }): Promise<number>;
  getCode(parameters: { address: Address }): Promise<Hex | undefined>;
  readContract(parameters: {
    address: Address;
    abi: typeof fameRouterAbi;
    functionName: "feePpm";
  }): Promise<bigint | number>;
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

interface FoundryBroadcastTransaction {
  contractAddress?: string;
  contractName?: string;
}

interface FoundryBroadcast {
  transactions?: FoundryBroadcastTransaction[];
}

function envValue(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

function envAddress(name: string): Address | null {
  const value = envValue(name);
  return value && isAddress(value) ? value : null;
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

function deployedRouterFromBroadcast(broadcastDir: string): Address | null {
  const latestRunPath = resolve(broadcastDir, "run-latest.json");
  if (!existsSync(latestRunPath)) return null;

  const broadcast = JSON.parse(
    readFileSync(latestRunPath, "utf8"),
  ) as FoundryBroadcast;
  const routerTransaction = broadcast.transactions?.find(
    (transaction) =>
      transaction.contractName === "FameRouter" &&
      transaction.contractAddress &&
      isAddress(transaction.contractAddress),
  );
  if (routerTransaction?.contractAddress) {
    return routerTransaction.contractAddress as Address;
  }

  return null;
}

function uniqueAddresses(addresses: Array<Address | null>): Address[] {
  const unique = new Map<string, Address>();
  for (const address of addresses) {
    if (!address) continue;
    unique.set(address.toLowerCase(), address);
  }
  return [...unique.values()];
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

async function waitForRpc(
  client: ChainProbeClient,
  expectedForkBlock: number | null,
): Promise<void> {
  const timeoutAt = Date.now() + 20_000;
  let lastError: Error | null = null;

  while (Date.now() < timeoutAt) {
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

  throw lastError ?? new Error("Timed out waiting for anvil RPC.");
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
  const forgePath = findExecutable("forge");
  if (!forgePath) {
    throw new Error(
      "FAME router address is unset and forge is unavailable; install Foundry or set FAME_ROUTER_ADDRESS.",
    );
  }

  const deployerNonce = await client.getTransactionCount({
    address: DEFAULT_FORK_ACCOUNT,
  });
  const firstDeployerCreateAddress = getContractAddress({
    from: DEFAULT_FORK_ACCOUNT,
    nonce: BigInt(deployerNonce),
  });
  const predictedCodeBefore = await client.getCode({
    address: firstDeployerCreateAddress,
  });

  const contractsDir = fameContractsDir();
  const broadcastDir = resolve(
    contractsDir,
    "broadcast",
    "DeployFameRouter.s.sol",
    base.id.toString(),
  );
  const broadcastExisted = existsSync(broadcastDir);
  const tempRoot = await mkdtemp(resolve(tmpdir(), "fame-swap-forge-"));
  let broadcastRouterAddress: Address | null = null;

  try {
    const forgeArgs = [
      "script",
      "script/DeployFameRouter.s.sol:DeployFameRouter",
      "--rpc-url",
      anvilUrl,
      "--broadcast",
      "--slow",
      "--non-interactive",
      "--skip-simulation",
      "--timeout",
      "120",
      "--cache-path",
      resolve(tempRoot, "cache"),
      "--out",
      resolve(tempRoot, "out"),
    ];
    if (envValue("FAME_SWAP_DEBUG_FORGE") !== "1") {
      forgeArgs.push("--quiet");
    }

    const result = spawnSync(
      forgePath,
      forgeArgs,
      {
        cwd: contractsDir,
        encoding: "utf8",
        env: childEnv({
          BASE_DEPLOYER_PRIVATE_KEY: DEFAULT_FORK_PRIVATE_KEY,
          BASE_FAME_ROUTER_FEE_RECIPIENT: DEFAULT_FORK_ACCOUNT,
          BASE_FAME_ROUTER_OWNER: DEFAULT_FORK_ACCOUNT,
          BASE_FAME_ROUTER_FEE_PPM: "2222",
        }),
      },
    );

    if (envValue("FAME_SWAP_DEBUG_FORGE") === "1") {
      console.error(result.stdout.trim());
      console.error(result.stderr.trim());
    }

    if (result.status !== 0) {
      const detail = [result.stdout.trim(), result.stderr.trim()]
        .filter((value) => value.length > 0)
        .join("\n");
      throw new Error(
        `Local FAME router deployment failed.${detail ? `\n${detail}` : ""}`,
      );
    }

    broadcastRouterAddress = deployedRouterFromBroadcast(broadcastDir);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
    if (!broadcastExisted) {
      await rm(broadcastDir, { recursive: true, force: true });
    }
  }

  const deployerCreateAddresses = Array.from({ length: 8 }, (_, offset) =>
    getContractAddress({
      from: DEFAULT_FORK_ACCOUNT,
      nonce: BigInt(deployerNonce + offset),
    }),
  );
  const scriptCreateAddresses = [0n, 1n, 2n].map((nonce) =>
    getContractAddress({
      from: firstDeployerCreateAddress,
      nonce,
    }),
  );
  const candidateAddresses = uniqueAddresses([
    broadcastRouterAddress,
    ...scriptCreateAddresses,
    ...deployerCreateAddresses,
    predictedCodeBefore && predictedCodeBefore !== "0x"
      ? null
      : firstDeployerCreateAddress,
  ]);
  let routerAddress: Address | null = null;
  for (const candidateAddress of candidateAddresses) {
    if (await isRouterCandidate(client, candidateAddress)) {
      routerAddress = candidateAddress;
      break;
    }
  }

  if (!routerAddress) {
    throw new Error(
      "Local FAME router deployment completed, but the deployed router address could not be found.",
    );
  }

  return routerAddress;
}

async function main(): Promise<void> {
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
  const proxy = allowRpcProcessArg ? null : await startRpcProxy(rpcUrl);
  const bindHost = anvilBindHost();
  const publicHost = anvilPublicHost(bindHost);
  const port = await findOpenPort(bindHost);
  const anvilUrl = `http://${ANVIL_LOCAL_HOST}:${port}`;
  const publicAnvilUrl = `http://${hostForUrl(publicHost)}:${port}`;
  const forkBlockArgs =
    forkBlock === null ? [] : ["--fork-block-number", forkBlock.toString()];
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
      "--silent",
    ],
    {
      env: childEnv(),
    },
  );

  const client = createPublicClient({
    chain: base,
    transport: http(anvilUrl, { timeout: 120_000 }),
  });

  try {
    await waitForRpc(client, forkBlock);

    const configuredRouterAddress =
      envValue("FAME_SWAP_IGNORE_CONFIGURED_ROUTER") === "1"
        ? null
        : envAddress("NEXT_PUBLIC_FAME_ROUTER_ADDRESS") ??
          envAddress("FAME_ROUTER_ADDRESS");
    const routerAddress =
      configuredRouterAddress ?? (await deployLocalRouter(client, anvilUrl));

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

    const artifact = routeArtifactById(DEFAULT_ROUTE_ID);
    const tokenIn = tokenForAddress(NATIVE_ETH);
    const tokenOut = tokenForAddress(FAME);
    if (!artifact || !tokenIn || !tokenOut) {
      throw new Error("Pinned native ETH -> FAME route artifact or token metadata is missing.");
    }

    const quote = quoteFameSwap({
      tokenIn,
      tokenOut,
      amountIn: BigInt(artifact.route.amountIn) + 1n,
      recipient: DEFAULT_FORK_ACCOUNT,
      config,
      readiness,
      now: new Date(),
    });

    if (quote.status !== "ready") {
      throw new Error(`Fork quote blocked with status ${quote.status}: ${quote.message}`);
    }

    const probeSimulation = await client.simulateContract({
      account: DEFAULT_FORK_ACCOUNT,
      address: quote.routerAddress,
      abi: fameRouterAbi,
      functionName: "executeRoute",
      args: [fameRouteToCall(quote.route)],
      value: quote.callValue,
    });
    const protectedMinimum = applySlippageToAmount(
      probeSimulation.result,
      quote.slippageBps,
    );
    const protectedRoute = {
      ...quote.route,
      minAmountOutAfterFee: protectedMinimum,
    };
    const protectedRouteHash = hashFameRoute(protectedRoute);
    const protectedSimulation = await client.simulateContract({
      account: DEFAULT_FORK_ACCOUNT,
      address: quote.routerAddress,
      abi: fameRouterAbi,
      functionName: "executeRoute",
      args: [fameRouteToCall(protectedRoute)],
      value: quote.callValue,
    });

    console.log("FAME swap fork smoke passed");
    console.log(`Router: ${quote.routerAddress}`);
    console.log(`Route: ${quote.routeArtifactId}`);
    console.log(`Materialized route hash: ${protectedRouteHash}`);
    console.log(`Fork RPC: ${publicAnvilUrl}`);
    if (bindHost !== ANVIL_LOCAL_HOST) {
      console.log(`Anvil bind host: ${bindHost}`);
    }
    console.log(`Probe output: ${probeSimulation.result.toString()}`);
    console.log(`Protected minimum: ${protectedMinimum.toString()}`);
    console.log(`Protected output: ${protectedSimulation.result.toString()}`);

    await keepForkAliveIfRequested(
      publicAnvilUrl,
      quote.routerAddress,
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
