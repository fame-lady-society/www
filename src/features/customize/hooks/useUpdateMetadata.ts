import { useMutation } from "@tanstack/react-query";
import { useAccount } from "wagmi";

export function useUpdateMetadata() {
  const { chain } = useAccount();

  // This hook now performs the first (GET) phase: request the server to
  // produce the updated metadata text and a short-lived signature that
  // covers { expiration, content }.
  return useMutation({
    mutationFn: async ({
      tokenId,
      name,
      description,
    }: {
      tokenId: number;
      name: string;
      description: string;
    }) => {
      const q = new URLSearchParams();
      q.set("tokenId", String(tokenId));
      if (name) q.set("name", name);
      if (description) q.set("description", description);

      const chainName = chain?.name?.toLowerCase() ?? "sepolia";
      const response = await fetch(
        `/api/${chainName}/metadata?${q.toString()}`,
        {
          method: "GET",
        },
      );
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Metadata GET failed: ${response.status} ${text}`);
      }
      const r = await response.json();
      // returns { metadata: string, signature: string, expiration: string }
      return r as {
        metadata: string;
        signature: `0x${string}`;
        expiration: string;
      };
    },
  });
}
