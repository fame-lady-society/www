import * as sentry from "@sentry/nextjs";
import {
  client as viemClient,
  flsTokenAddress,
  namedLadyRendererAddress,
  walletClient,
  createSignerAccount,
} from "@/viem/mainnet-client";
import { client as basePublicClient } from "@/viem/base-client";
import { encodePacked, erc721Abi, keccak256, PublicClient } from "viem";
import { readContract, signMessage, getBalance } from "viem/actions";
import { IMetadata, defaultDescription } from "@/utils/metadata";
import { fetchJson } from "@/ipfs/client";
import { siweServer } from "@/utils/siweServer";
import { NextApiHandler } from "next";
import { mainnet, base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import {
  namedLadyRendererAbi,
  fameLadySocietyAbi,
  fameLadySocietyAddress,
} from "@/wagmi";
import { buildNodeIrysUploader } from "@/service/irys_backend_client_node";

type IUpdateMetadata = {
  name: string;
  description: string;
  tokenId: number;
};
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

export default (async function handler(req, res) {
  const { address, chainId } = await siweServer.getSession(req, res);
  if (!address) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (chainId !== mainnet.id) {
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

      // check ownership using fameLadySocietyAddress and fetch metadata
      const [ownerOfToken, tokenUri] = await Promise.all([
        readContract(viemClient, {
          abi: fameLadySocietyAbi,
          address: fameLadySocietyAddress[mainnet.id],
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
      if (ownerOfToken.toLowerCase() !== address.toLowerCase()) {
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
            metadata: string;
            signature: string;
            expiration: string;
          })
        | undefined;
      if (!body) return res.status(400).json({ error: "Invalid request" });
      const {
        name,
        description,
        tokenId,
        metadata: metadataContent,
        signature: clientSig,
        expiration,
      } = body;
      if (!tokenId || !metadataContent || !clientSig || !expiration) {
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

      // check ownership using fameLadySocietyAddress
      const ownerOfToken = await readContract(viemClient, {
        abi: fameLadySocietyAbi,
        address: fameLadySocietyAddress[mainnet.id],
        functionName: "ownerOf",
        args: [BigInt(tokenId)],
      });
      if (ownerOfToken.toLowerCase() !== address.toLowerCase()) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // verify signature matches the provided content + expiration
      const regeneratedSig = await signContent(metadataContent, expiration);
      if (regeneratedSig !== clientSig) {
        return res.status(400).json({ error: "Invalid signature" });
      }

      // Upload metadata to Irys using backend wallet on Base
      const irysUploader = await getBackendIrysUploader();
      const metadataBytes = new TextEncoder().encode(metadataContent);
      const priceRaw = await irysUploader.getPrice(metadataBytes.length);
      const priceBn = BigInt(priceRaw?.toString?.() ?? priceRaw ?? 0);
      const bufferedPrice = (priceBn * 110n) / 100n;

      const loadedBalance = await irysUploader.getBalance();
      const loadedBn = BigInt(
        loadedBalance?.toString?.() ?? loadedBalance ?? 0,
      );

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

        if (availableBalance > 0n) {
          const need = bufferedPrice - loadedBn;
          const fundAmount = availableBalance < need ? availableBalance : need;
          await irysUploader.fund(fundAmount);
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
            // download filename
            name: "Content-Disposition",
            value: `attachment; filename="fls-metadata-${tokenId}.json"`,
          },
          {
            // content hash
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

      // Get current nonce and sign the tokenURI update
      const nonce = await readContract(viemClient, {
        abi: namedLadyRendererAbi,
        address: namedLadyRendererAddress,
        functionName: "currentNonce",
        args: [address as `0x${string}`],
      });

      const tokenUriRequest = encodePacked(
        ["uint256", "string", "uint256"],
        [BigInt(tokenId), uri, nonce],
      );
      const hash = keccak256(tokenUriRequest);
      const finalSignature = await signMessage(walletClient, {
        account: createSignerAccount(),
        message: { raw: hash },
      });

      return res.status(200).json({ uri, signature: finalSignature });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error(error);
    sentry.captureException(error);
    res.status(500).json({ error: "Internal server error" });
  }
} as NextApiHandler);
