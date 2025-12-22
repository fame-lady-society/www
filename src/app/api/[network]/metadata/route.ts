import * as sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/siwe/session-utils";
import {
  client as mainnetClient,
  flsTokenAddress as mainnetFlsTokenAddress,
  namedLadyRendererAddress as mainnetNamedLadyRendererAddress,
  walletClient as mainnetWalletClient,
  createSignerAccount as createMainnetSignerAccount,
} from "@/viem/mainnet-client";
import {
  client as sepoliaClient,
  flsTokenAddress as sepoliaFlsTokenAddress,
  namedLadyRendererAddress as sepoliaNamedLadyRendererAddress,
  walletClient as sepoliaWalletClient,
  createSignerAccount as createSepoliaSignerAccount,
} from "@/viem/sepolia-client";
import { client as basePublicClient } from "@/viem/base-client";
import {
  encodePacked,
  erc721Abi,
  formatEther,
  keccak256,
  PublicClient,
  WalletClient,
} from "viem";
import { readContract, signMessage, getBalance } from "viem/actions";
import { IMetadata, defaultDescription } from "@/utils/metadata";
import { fetchJson } from "@/ipfs/client";
import { mainnet, sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import {
  namedLadyRendererAbi,
  fameLadySocietyAbi,
  fameLadySocietyAddress,
  wrappedNftAbi,
  wrappedNftAddress,
} from "@/wagmi";
import { buildNodeIrysUploader } from "@/service/irys_backend_client_node";

type IUpdateMetadata = {
  name: string;
  description: string;
  tokenId: number;
};

type SupportedNetwork = "mainnet" | "sepolia";

interface NetworkConfig {
  network: SupportedNetwork;
  chainId: number;
  client: PublicClient;
  walletClient: WalletClient;
  flsTokenAddress: `0x${string}`;
  ownershipContractAddress: `0x${string}`;
  ownershipAbi: typeof fameLadySocietyAbi | typeof wrappedNftAbi;
  namedLadyRendererAddress: `0x${string}`;
  createSignerAccount: () => ReturnType<typeof createMainnetSignerAccount>;
}

function getNetworkConfig(network: string): NetworkConfig {
  const normalizedNetwork = network.toLowerCase();
  if (normalizedNetwork === "sepolia") {
    const chainId = sepolia.id;
    const ownershipContractAddress = wrappedNftAddress[chainId];
    if (!ownershipContractAddress) {
      throw new Error(`Wrapped NFT address missing for sepolia`);
    }
    return {
      network: "sepolia" as const,
      chainId,
      client: sepoliaClient,
      walletClient: sepoliaWalletClient,
      flsTokenAddress: sepoliaFlsTokenAddress,
      ownershipContractAddress,
      ownershipAbi: wrappedNftAbi,
      namedLadyRendererAddress: sepoliaNamedLadyRendererAddress,
      createSignerAccount: createSepoliaSignerAccount,
    };
  } else {
    const chainId = mainnet.id;
    const ownershipContractAddress = fameLadySocietyAddress[chainId];
    if (!ownershipContractAddress) {
      throw new Error(`Fame Lady Society address missing for mainnet`);
    }
    return {
      network: "mainnet" as const,
      chainId,
      client: mainnetClient,
      walletClient: mainnetWalletClient,
      flsTokenAddress: mainnetFlsTokenAddress,
      ownershipContractAddress,
      ownershipAbi: fameLadySocietyAbi,
      namedLadyRendererAddress: mainnetNamedLadyRendererAddress,
      createSignerAccount: createMainnetSignerAccount,
    };
  }
}

async function getBackendIrysUploader() {
  const privateKey = process.env.METADATA_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("METADATA_PRIVATE_KEY not configured");
  }

  const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL_1;
  if (!rpcUrl) {
    throw new Error("NEXT_PUBLIC_BASE_RPC_URL_1 not configured");
  }

  return buildNodeIrysUploader({
    privateKey: privateKey as `0x${string}`,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { network: string } },
) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const networkConfig = getNetworkConfig(params.network);

    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name") ?? undefined;
    const description = searchParams.get("description") ?? undefined;
    const tokenId = searchParams.get("tokenId");

    if ((!name && !description) || !tokenId) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    if (name && name.length > 256) {
      return NextResponse.json({ error: "Name too long" }, { status: 400 });
    }
    if (description && description.length > 2048) {
      return NextResponse.json(
        { error: "Description too long" },
        { status: 400 },
      );
    }

    const signContent = async (content: string, expiration: string) => {
      const payload = { expiration, content };
      const signature = await signMessage(networkConfig.walletClient, {
        account: networkConfig.createSignerAccount(),
        message: {
          raw: keccak256(encodePacked(["string"], [JSON.stringify(payload)])),
        },
      });
      return signature;
    };

    const [ownerOfToken, tokenUri] = await Promise.all([
      readContract(networkConfig.client, {
        abi: networkConfig.ownershipAbi,
        address: networkConfig.ownershipContractAddress,
        functionName: "ownerOf",
        args: [BigInt(tokenId)],
      }),
      readContract(networkConfig.client, {
        abi: erc721Abi,
        address: networkConfig.flsTokenAddress,
        functionName: "tokenURI",
        args: [BigInt(tokenId)],
      }),
    ]);

    if (ownerOfToken.toLowerCase() !== session.address.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    let metadata: IMetadata;
    if (tokenUri.startsWith("ipfs://")) {
      metadata = await fetchJson<IMetadata>({
        cid: tokenUri.replace("ipfs://", ""),
      });
    } else {
      const response = await fetch(tokenUri, {
        headers: { "Content-Type": "application/json" },
      });
      metadata = await response.json();
    }

    metadata.name = name ?? metadata.name;
    metadata.description =
      typeof description !== "undefined" && description.length > 0
        ? `${description}\n\n${defaultDescription}`
        : defaultDescription;

    const namedAttribute = metadata.attributes?.find(
      (attribute) => attribute.trait_type === "Named",
    );
    if (namedAttribute) {
      namedAttribute.value = "true";
    } else {
      metadata.attributes?.push({
        trait_type: "Named",
        value: "true",
      });
    }

    const expiration = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const content = JSON.stringify(metadata);
    const signature = await signContent(content, expiration);

    return NextResponse.json({ metadata: content, signature, expiration });
  } catch (error) {
    console.error(error);
    sentry.captureException(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { network: string } },
) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const networkConfig = getNetworkConfig(params.network);

    const body = (await request.json()) as
      | (IUpdateMetadata & {
          metadata: string;
          signature: string;
          expiration: string;
        })
      | undefined;

    if (!body) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const {
      name,
      description,
      tokenId,
      metadata: metadataContent,
      signature: clientSig,
      expiration,
    } = body;

    if (!tokenId || !metadataContent || !clientSig || !expiration) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (!name && !description) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    if (name && name.length > 256) {
      return NextResponse.json({ error: "Name too long" }, { status: 400 });
    }
    if (description && description.length > 2048) {
      return NextResponse.json(
        { error: "Description too long" },
        { status: 400 },
      );
    }

    const isExpired = new Date(expiration) < new Date();
    if (isExpired) {
      return NextResponse.json({ error: "Signature expired" }, { status: 400 });
    }

    const ownerOfToken = await readContract(networkConfig.client, {
      abi: networkConfig.ownershipAbi,
      address: networkConfig.ownershipContractAddress,
      functionName: "ownerOf",
      args: [BigInt(tokenId)],
    });

    if (ownerOfToken.toLowerCase() !== session.address.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const signContent = async (content: string, expiration: string) => {
      const payload = { expiration, content };
      const signature = await signMessage(networkConfig.walletClient, {
        account: networkConfig.createSignerAccount(),
        message: {
          raw: keccak256(encodePacked(["string"], [JSON.stringify(payload)])),
        },
      });
      return signature;
    };

    const regeneratedSig = await signContent(metadataContent, expiration);
    if (regeneratedSig !== clientSig) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const irysUploader = await getBackendIrysUploader();
    const metadataBytes = new TextEncoder().encode(metadataContent);
    const priceRaw = await irysUploader.getPrice(metadataBytes.length);
    const priceBn = BigInt(priceRaw?.toString?.() ?? priceRaw ?? 0);
    const bufferedPrice = (priceBn * 110n) / 100n;

    let loadedBalance = await irysUploader.getBalance();
    let loadedBn = BigInt(loadedBalance?.toString?.() ?? loadedBalance ?? 0);
    if (loadedBn < bufferedPrice) {
      const account = privateKeyToAccount(
        process.env.METADATA_PRIVATE_KEY! as `0x${string}`,
      );
      const accountBalance = await getBalance(basePublicClient, {
        address: account.address,
      });
      const estimatedGas = 21000n * 20n;
      const availableBalance =
        accountBalance > estimatedGas ? accountBalance - estimatedGas : 0n;

      const cap = bufferedPrice * 20_000n;
      const fundAmount = availableBalance < cap ? availableBalance : cap;

      if (fundAmount > 0n) {
        for (let attempt = 0; attempt < 2; attempt += 1) {
          await irysUploader.fund(fundAmount);
          const refreshed = await irysUploader.getBalance();
          const refreshedBn = BigInt(refreshed?.toString?.() ?? refreshed ?? 0);
          if (refreshedBn > loadedBn) {
            loadedBn = refreshedBn;
            break;
          }
        }
        console.log(
          "[metadata] funding complete",
          JSON.stringify({ tokenId, loaded: formatEther(loadedBn) }),
        );
      }
    }

    const uploadResult = await irysUploader.upload(metadataContent, {
      tags: [
        {
          name: "Content-Type",
          value: "application/json",
        },
        {
          name: "Content-Length",
          value: metadataContent.length.toString(),
        },
        {
          name: "Content-Disposition",
          value: `attachment; filename="fls-metadata-${tokenId}.json"`,
        },
        {
          name: "Content-Hash",
          value: keccak256(new TextEncoder().encode(metadataContent)).split(
            "0x",
          )[1],
        },
      ],
    });

    const txid = uploadResult?.id;
    if (!txid) {
      throw new Error("Upload failed: no transaction ID returned");
    }
    const uri = `https://gateway.irys.xyz/${txid}`;

    const nonce = await readContract(networkConfig.client, {
      abi: namedLadyRendererAbi,
      address: networkConfig.namedLadyRendererAddress,
      functionName: "currentNonce",
      args: [session.address],
    });

    const tokenUriRequest = encodePacked(
      ["uint256", "string", "uint256"],
      [BigInt(tokenId), uri, nonce],
    );
    const hash = keccak256(tokenUriRequest);
    const finalSignature = await signMessage(networkConfig.walletClient, {
      account: networkConfig.createSignerAccount(),
      message: { raw: hash },
    });

    return NextResponse.json({ uri, signature: finalSignature });
  } catch (error) {
    console.error(error);
    sentry.captureException(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
