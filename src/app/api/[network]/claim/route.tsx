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
import { OG_AGE_BOOST, OG_RANK_BOOST } from "@/features/claim/hooks/constants";

export interface Input {
  address: `0x${string}`;
  tokenIds: number[];
}

export interface Claim {
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
  const hash = keccak256(
    encodePacked(
      ["address", "uint256", "uint256", "uint16[]", "uint256"],
      [address, amount, BigInt(deadlineSeconds), tokenIds, nonce],
    ),
  );

  return await client.signMessage({
    message: { raw: hash },
    account,
  });
}

const allocation = getFlsPoolAllocation(OG_RANK_BOOST, OG_AGE_BOOST);

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

    // console.log("data", data);

    // expect all tokens to be found in the allocation
    const tokenIds: number[] = [];
    const bannedTokenIds: number[] = [];

    for (const tokenId of data.tokenIds) {
      if (allocation.has(tokenId)) {
        tokenIds.push(tokenId);
      } else {
        bannedTokenIds.push(tokenId);
      }
    }

    // expect all tokens to be unclaimed
    const claimed = await wasClaimed(network, tokenIds);
    if (claimed.includes(true)) {
      console.warn(
        `some tokens [${claimed
          .map((c, i) => (c ? tokenIds[i] : null))
          .filter(Boolean)
          .join(", ")}] already claimed for address ${data.address}`,
      );
      return NextResponse.json(
        {
          error: "some tokens already claimed",
          tokenIds: tokenIds.filter((_, i) => claimed[i]),
        },
        { status: 400 },
      );
    }

    const kv = createClient({
      token: process.env.KV_REST_API_TOKEN,
      url: process.env.KV_REST_API_URL,
    });

    // console.log("kv connected");

    const tokensAlreadyHasActiveClaimId = new Map<number, string>();
    // For each token, check if it exists in the KV store
    await Promise.all(
      tokenIds.map(async (tokenId) => {
        const claim = await kv.get<string>(`claim-id:${network}:${tokenId}`);
        if (claim) {
          console.log(
            `Token ${tokenId} already has an active signature: ${claim}`,
          );
          tokensAlreadyHasActiveClaimId.set(tokenId, claim);
        }
      }),
    );
    const uniqueClaimIds = new Set<string>();
    const tokensAlreadyHasActiveClaim = new Map<string, Claim>();
    // For each token, check if it exists in the KV store
    const claimPromises = Array.from(
      tokensAlreadyHasActiveClaimId.values(),
    ).map(async (claimId) => {
      if (uniqueClaimIds.has(claimId)) {
        return;
      }
      uniqueClaimIds.add(claimId);
      const claim = await kv.get<Claim>(`claim:${claimId}`);
      if (claim) {
        tokensAlreadyHasActiveClaim.set(claimId, claim);
      }
    });

    // console.log("checking active claims");
    await Promise.all(claimPromises);
    // console.log("checked active claims");
    // if (tokensAlreadyHasActiveClaim.size > 0) {
    //   console.warn(
    //     `Found ${tokensAlreadyHasActiveClaim.size} tokens with active claims: ${JSON.stringify(Array.from(tokensAlreadyHasActiveClaim.values()))}`,
    //   );
    // }

    // Filter out tokens that already have an active claim
    const tokensWithoutActiveClaim = tokenIds
      .filter((tokenId) => !tokensAlreadyHasActiveClaimId.has(tokenId))
      .sort((a, b) => a - b);

    // console.log(
    //   `Found ${tokensWithoutActiveClaim.length} tokens without active claims`,
    // );

    let claims = Array.from(tokensAlreadyHasActiveClaim.values());
    if (tokensWithoutActiveClaim.length > 0) {
      const client = publicClientForNetwork(network);
      const claimToFameAddress = claimToFameAddressForNetwork(network);
      const account = createSignerAccountForNetwork(network);

      const nonce = await client.readContract({
        abi: claimToFameAbi,
        address: claimToFameAddress,
        functionName: "signatureNonces",
        args: [data.address],
      });
      // console.log("nonce", nonce);

      const amount = tokensWithoutActiveClaim.reduce(
        (acc, tokenId) => acc + allocation.get(tokenId)!,
        0n,
      );
      const deadlineSeconds = Math.floor((Date.now() + 1000 * 60 * 8) / 1000); // 8 minutes
      // console.log(`Signing claim with ${account.address}`);
      const signature = await signClaimRequest({
        account,
        address: data.address,
        amount,
        client: walletClientForNetwork(network),
        deadlineSeconds,
        network,
        nonce,
        tokenIds: tokensWithoutActiveClaim,
      });

      // console.log("signature", signature);

      const claim: Claim = {
        tokenIds: tokensWithoutActiveClaim,
        destination: data.address,
        signature,
        nonce: Number(nonce),
        address: data.address,
        amount: formatUnits(amount, 18),
        deadlineSeconds,
      };

      await Promise.all([
        kv.set(`claim:${signature}`, claim, {
          ex: 60 * 10, // 10 minutes
        }),
        ...tokensWithoutActiveClaim.map((tokenId) =>
          kv.set(`claim-id:${network}:${tokenId}`, signature, {
            ex: 60 * 10, // 10 minutes
          }),
        ),
      ]);
      claims.push(claim);
    }
    // Sort claims in ascending nonce order
    claims.sort((a, b) => a.nonce - b.nonce);
    return NextResponse.json({
      claims,
      ...(bannedTokenIds.length ? { bannedTokenIds } : {}),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "server error" }, { status: 400 });
  }
}

export type Output = {
  claims?: Claim[];
  bannedTokenIds?: number[];
  error?: string;
};
