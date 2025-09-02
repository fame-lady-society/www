import * as sentry from "@sentry/nextjs";
import {
  client as viemClient,
  flsTokenAddress,
  namedLadyRendererAddress,
  walletClient,
  createSignerAccount,
} from "@/viem/sepolia-client";
import { createWalletClient, encodePacked, erc721Abi, keccak256 } from "viem";
import { readContract, signMessage } from "viem/actions";
import { IMetadata, defaultDescription } from "@/utils/metadata";
import { fetchJson, upload } from "@/ipfs/client";
import { siweServer } from "@/utils/siweServer";
import { NextApiHandler } from "next";
import { sepolia } from "viem/chains";
import { namedLadyRendererAbi } from "@/wagmi";

type IUpdateMetadata = {
  name: string;
  description: string;
  tokenId: number;
};

export default (async function handler(req, res) {
  const { address, chainId } = await siweServer.getSession(req, res);
  if (!address) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (chainId !== sepolia.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // helper: sign a payload of { expiration, content }
  const signContent = async (content: string, expiration: string) => {
    const payload = { expiration, content };
    const signature = await signMessage(walletClient, {
      account: createSignerAccount(),
      message: {
        raw: keccak256(encodePacked(["string"], [JSON.stringify(payload)])),
      },
    });
    return signature;
  };

  try {
    if (req.method === "GET") {
      // GET: return the updated metadata text and a signed { expiration, content }
      const { name, description, tokenId } = req.query as {
        name?: string;
        description?: string;
        tokenId?: string;
      };
      if ((!name && !description) || !tokenId) {
        return res.status(400).json({ error: "Invalid request" });
      }
      if (name && name.length > 256) {
        return res.status(400).json({ error: "Name too long" });
      }
      if (description && description.length > 2048) {
        return res.status(400).json({ error: "Description too long" });
      }

      // check ownership and fetch metadata + nonce
      const [ownerOfToken, tokenUri] = await Promise.all([
        readContract(viemClient, {
          abi: erc721Abi,
          address: flsTokenAddress,
          functionName: "ownerOf",
          args: [BigInt(tokenId as string)],
        }),
        readContract(viemClient, {
          abi: erc721Abi,
          address: flsTokenAddress,
          functionName: "tokenURI",
          args: [BigInt(tokenId as string)],
        }),
      ]);
      if (ownerOfToken !== address) {
        return res.status(403).json({ error: "Unauthorized" });
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
        typeof description !== "undefined" && (description as string).length > 0
          ? `${description}\n\n${defaultDescription}`
          : defaultDescription;
      // ensure Named attribute
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

      // expiration: short-lived by design so client uploads soon after
      // assumption: 5 minutes TTL for signed content
      const expiration = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const content = JSON.stringify(metadata);
      const signature = await signContent(content, expiration);
      return res.status(200).json({ metadata: content, signature, expiration });
    }

    if (req.method === "POST") {
      const body = req.body as
        | (IUpdateMetadata & {
            uri: string;
            signature: string;
            expiration: string;
          })
        | undefined;
      if (!body) return res.status(400).json({ error: "Invalid request" });
      const {
        name,
        description,
        tokenId,
        uri,
        signature: clientSig,
        expiration,
      } = body;
      if (!tokenId || !uri || !clientSig || !expiration) {
        return res.status(400).json({ error: "Missing fields" });
      }
      if (!name && !description) {
        return res.status(400).json({ error: "Invalid request" });
      }
      if (name && name.length > 256) {
        return res.status(400).json({ error: "Name too long" });
      }
      if (description && description.length > 2048) {
        return res.status(400).json({ error: "Description too long" });
      }

      // Check expiration
      const isExpired = new Date(expiration) < new Date();
      if (isExpired) {
        return res.status(400).json({ error: "Signature expired" });
      }

      // check owner, tokenUri and current nonce
      const [ownerOfToken, nonce] = await Promise.all([
        readContract(viemClient, {
          abi: erc721Abi,
          address: flsTokenAddress,
          functionName: "ownerOf",
          args: [BigInt(tokenId)],
        }),
        readContract(viemClient, {
          abi: namedLadyRendererAbi,
          address: namedLadyRendererAddress,
          functionName: "currentNonce",
          args: [address as `0x${string}`],
        }),
      ]);
      if (ownerOfToken !== address) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // fetch original and provided metadata
      const originalResponse = await fetch(uri, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      const original = await originalResponse.json();

      // verify signature matches the provided content + expiration
      const regeneratedSig = await signContent(
        JSON.stringify(original),
        expiration,
      );
      if (regeneratedSig !== clientSig) {
        return res.status(400).json({ error: "Invalid signature" });
      }

      // final: sign the tokenURI update (uint256, string, uint256) as before
      const tokenUriRequest = encodePacked(
        ["uint256", "string", "uint256"],
        [BigInt(tokenId), uri, nonce],
      );
      const hash = keccak256(tokenUriRequest);
      const finalSignature = await signMessage(walletClient, {
        account: createSignerAccount(),
        message: { raw: hash },
      });
      return res.status(200).json({ signature: finalSignature });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error(error);
    sentry.captureException(error);
    res.status(500).json({ error: "Internal server error" });
  }
} as NextApiHandler);
