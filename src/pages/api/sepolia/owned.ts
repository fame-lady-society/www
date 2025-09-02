import * as sentry from "@sentry/nextjs";
import { siweServer } from "@/utils/siweServer";
import { NextApiHandler } from "next";
import { sepolia } from "viem/chains";

export default (async function handler(req, res) {
  const { address, chainId } = await siweServer.getSession(req, res);
  if (!address) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (chainId !== sepolia.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    if (req.method === "GET") {
      const hodlers: { owners: Record<`0x${string}`, number[]> } = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/owners/sepolia`,
      ).then((res) => res.json());

      let ownedTokens: number[] = [];
      for (const [owner, tokens] of Object.entries(hodlers.owners)) {
        if (owner.toLowerCase() === address.toLowerCase()) {
          ownedTokens = tokens;
          break;
        }
      }

      return res.status(200).json(ownedTokens);
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error(error);
    sentry.captureException(error);
    res.status(500).json({ error: "Internal server error" });
  }
} as NextApiHandler);
