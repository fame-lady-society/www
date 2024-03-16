import { useEffect, useState } from "react";
import {
  execute,
  SepoliaTokenByOwnerQuery,
  getBuiltGraphSDK,
} from "@/graphclient";

export function useLadies({
  owner,
  sorted,
}: {
  owner?: `0x${string}`;
  sorted?: "asc" | "desc";
}) {
  const [data, setData] = useState<SepoliaTokenByOwnerQuery>();
  const [error, setError] = useState<Error>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (owner) {
      setIsLoading(true);
      const sdk = getBuiltGraphSDK();
      sdk
        .SepoliaTokenByOwner({ owner })
        .then((result) => {
          setData(result);
        })
        .catch((e) => {
          setError(e);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [owner, setData]);

  const tokenIds =
    data?.ownerships
      .filter((o) => o?.tokenId !== null || typeof o?.tokenId !== "undefined")
      .map((o) => BigInt(o.tokenId.toString())) ?? [];

  if (sorted === "asc") {
    tokenIds.sort((a, b) => Number(a) - Number(b));
  } else if (sorted === "desc") {
    tokenIds.sort((a, b) => Number(b) - Number(a));
  }

  return { data: tokenIds, error, isLoading };
}
