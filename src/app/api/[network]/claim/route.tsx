import { createClient } from "@vercel/kv";
import { type NextRequest, NextResponse } from "next/server";
import {
  client as baseClient,
  walletClient as baseWalletClient,
  claimToFameAddress as baseClaimToFameAddress,
  createSignerAccount as baseCreateSignerAccount,
} from "@/viem/base-client";
import {
  client as sepoliaClient,
  walletClient as sepoliaWalletClient,
  claimToFameAddress as sepoliaClaimToFameAddress,
  createSignerAccount as sepoliaCreateSignerAccount,
} from "@/viem/sepolia-client";
import { claimToFameAbi } from "@/wagmi";
import { encodePacked, formatUnits, keccak256 } from "viem";
import { getFlsPoolAllocation } from "@/features/claim/hooks/useSnapshot";

interface Input {
  address: `0x${string}`;
  tokenIds: number[];
}

interface Claim {
  tokenIds: number[];
  destination: `0x${string}`;
  deadlineSeconds: number;
  address: `0x${string}`;
  signature: `0x${string}`;
  nonce: number;
  amount: string;
}

function asNetwork(network: string) {
  if (["base", "sepolia"].includes(network)) {
    return network as "base" | "sepolia";
  }
  return null;
}

function publicClientForNetwork(network: "base" | "sepolia") {
  if (network === "base") {
    return baseClient;
  }
  if (network === "sepolia") {
    return sepoliaClient;
  }
  throw new Error("invalid network");
}

function walletClientForNetwork(network: "base" | "sepolia") {
  if (network === "base") {
    return baseWalletClient;
  }
  if (network === "sepolia") {
    return sepoliaWalletClient;
  }
  throw new Error("invalid network");
}

function createSignerAccountForNetwork(network: "base" | "sepolia") {
  if (network === "base") {
    return baseCreateSignerAccount();
  }
  if (network === "sepolia") {
    return sepoliaCreateSignerAccount();
  }
  throw new Error("invalid network");
}

function claimToFameAddressForNetwork(network: "base" | "sepolia") {
  if (network === "base") {
    return baseClaimToFameAddress;
  }
  if (network === "sepolia") {
    return sepoliaClaimToFameAddress;
  }
  throw new Error("invalid network");
}

async function wasClaimed(network: "base" | "sepolia", tokenIds: number[]) {
  const client = publicClientForNetwork(network);
  const claimToFameAddress = claimToFameAddressForNetwork(network);
  const claimed = await client.readContract({
    abi: claimToFameAbi,
    address: claimToFameAddress,
    functionName: "isClaimedBatch",
    args: [tokenIds.map((tokenId) => BigInt(tokenId))],
  });
  return claimed;
}

async function signClaimRequest({
  address,
  account,
  client,
  amount,
  deadlineSeconds,
  tokenIds,
  nonce,
}: {
  address: `0x${string}`;
  account: ReturnType<typeof createSignerAccountForNetwork>;
  client: ReturnType<typeof walletClientForNetwork>;
  amount: bigint;
  network: "base" | "sepolia";
  deadlineSeconds: number;
  tokenIds: number[];
  nonce: bigint;
}) {
  const signature = encodePacked(
    ["address", "uint256", "uint256", "uint16[]", "uint256"],
    [address, amount, BigInt(deadlineSeconds), tokenIds, nonce],
  );
  const hash = keccak256(signature);
  return await client.signMessage({
    message: hash,
    account,
  });
}

const allocation = getFlsPoolAllocation(1.5, 3);

export async function POST(
  req: NextRequest,
  { params }: { params: { network: string } },
) {
  const network = asNetwork(params.network);

  if (!network) {
    return NextResponse.json({ error: "invalid network" }, { status: 400 });
  }

  try {
    let data: Input;
    try {
      data = await req.json();
    } catch (error) {
      return NextResponse.json({ error: "invalid input" }, { status: 400 });
    }

    // expect all tokens to be found in the allocation
    for (const tokenId of data.tokenIds) {
      if (!allocation.has(tokenId)) {
        return NextResponse.json(
          { error: "token not found in allocation", tokenId },
          { status: 400 },
        );
      }
    }

    // expect all tokens to be unclaimed
    const claimed = await wasClaimed(network, data.tokenIds);
    if (claimed.some((isClaimed) => isClaimed)) {
      return NextResponse.json(
        {
          error: "some tokens already claimed",
          tokenIds: data.tokenIds.filter((_, i) => claimed[i]),
        },
        { status: 400 },
      );
    }

    const kv = createClient({
      token: process.env.KV_REST_API_TOKEN,
      url: process.env.KV_REST_API_URL,
    });

    const tokensAlreadyHasActiveClaimId = new Map<number, string>();
    // For each token, check if it exists in the KV store
    for (const tokenId of data.tokenIds) {
      const claim = await kv.get<string>(`claim-id:${network}:${tokenId}`);
      if (claim) {
        tokensAlreadyHasActiveClaimId.set(tokenId, claim);
      }
    }
    const uniqueClaimIds = new Set<string>();
    const tokensAlreadyHasActiveClaim = new Map<string, Claim>();
    // For each token, check if it exists in the KV store
    for (const claimId of tokensAlreadyHasActiveClaimId.values()) {
      if (uniqueClaimIds.has(claimId)) {
        continue;
      }
      uniqueClaimIds.add(claimId);
      const claim = await kv.get<Claim>(`claim:${claimId}`);
      if (claim) {
        tokensAlreadyHasActiveClaim.set(claimId, claim);
      }
    }

    if (tokensAlreadyHasActiveClaim.size > 0) {
      // We found some claims that are already active. Return them but don't create a new claim.
      return NextResponse.json(
        {
          error: "some tokens already have an active claim",
          tokenIds: Array.from(tokensAlreadyHasActiveClaimId.keys()),
          claims: Array.from(tokensAlreadyHasActiveClaim.values()),
        },
        { status: 409 },
      );
    }
    const client = publicClientForNetwork(network);
    const claimToFameAddress = claimToFameAddressForNetwork(network);
    const account = createSignerAccountForNetwork(network);
    const nonce = await client.readContract({
      abi: claimToFameAbi,
      address: claimToFameAddress,
      functionName: "signatureNonces",
      args: [data.address],
    });
    const amount = data.tokenIds.reduce(
      (acc, tokenId) => acc + BigInt(allocation.get(tokenId)!),
      0n,
    );
    const deadlineSeconds = Math.floor((Date.now() + 1000 * 60) / 100); // 10 minutes
    const signature = await signClaimRequest({
      account,
      address: data.address,
      amount,
      client: walletClientForNetwork(network),
      deadlineSeconds,
      network,
      nonce,
      tokenIds: data.tokenIds,
    });

    const claim: Claim = {
      tokenIds: data.tokenIds,
      destination: data.address,
      signature,
      nonce: Number(nonce),
      address: data.address,
      amount: formatUnits(amount, 18),
      deadlineSeconds,
    };

    await kv.set(`claim:${signature}`, claim, {
      ex: 60 * 10, // 10 minutes
    });
    for (const tokenId of data.tokenIds) {
      await kv.set(`claim-id:${network}:${tokenId}`, signature, {
        ex: 60 * 10, // 10 minutes
      });
    }

    return NextResponse.json({ claim });
  } catch (error) {
    return NextResponse.json({ error: "server error" }, { status: 400 });
  }
}
