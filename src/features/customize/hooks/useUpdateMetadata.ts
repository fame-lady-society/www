import { useMutation } from "@tanstack/react-query";
import { useAccount } from "@/hooks/useAccount";
import { withAuthHeaders } from "@/utils/authToken";

export function useUpdateMetadata(network: "mainnet" | "sepolia" = "mainnet") {
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
      // Step 1: GET metadata and signature
      const q = new URLSearchParams();
      q.set("tokenId", String(tokenId));
      if (name) q.set("name", name);
      if (description) q.set("description", description);

      const getResponse = await fetch(
        `/api/${network}/metadata?${q.toString()}`,
        {
          method: "GET",
          headers: withAuthHeaders(),
        },
      );
      if (!getResponse.ok) {
        const text = await getResponse.text();
        throw new Error(`Metadata GET failed: ${getResponse.status} ${text}`);
      }
      const getData = await getResponse.json();
      const { metadata, signature, expiration } = getData as {
        metadata: string;
        signature: `0x${string}`;
        expiration: string;
      };

      // Step 2: POST to upload metadata to Irys and get final signature
      const postResponse = await fetch(`/api/${network}/metadata`, {
        method: "POST",
        headers: withAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          tokenId,
          name,
          description,
          metadata,
          signature,
          expiration,
        }),
      });
      if (!postResponse.ok) {
        const text = await postResponse.text();
        throw new Error(`Metadata POST failed: ${postResponse.status} ${text}`);
      }
      const postData = await postResponse.json();
      // returns { uri: string, signature: `0x${string}` }
      return postData as {
        uri: string;
        signature: `0x${string}`;
      };
    },
  });
}
