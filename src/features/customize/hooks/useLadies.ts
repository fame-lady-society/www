import { useEffect, useMemo, useState } from "react";
import {
  execute,
  SepoliaTokenByOwnerQuery,
  getBuiltGraphSDK,
  MainnetTokenByOwnerQuery,
} from "@/graphclient";
import { useAccount } from "wagmi";

export function useLadies({
  owner,
  sorted,
}: {
  owner?: `0x${string}`;
  sorted?: "asc" | "desc";
}) {
  const { chainId } = useAccount();

  const [data, setData] = useState<
    SepoliaTokenByOwnerQuery | MainnetTokenByOwnerQuery
  >();
  const [error, setError] = useState<Error>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (owner) {
      setIsLoading(true);
      const sdk = getBuiltGraphSDK();

      const action =
        chainId === 1
          ? sdk.MainnetTokenByOwner.bind(sdk)
          : chainId === 11155111
            ? sdk.SepoliaTokenByOwner.bind(sdk)
            : undefined;
      if (!action) {
        throw new Error("Unsupported chainId");
      }
      action({ owner })
        .then((result: SepoliaTokenByOwnerQuery | MainnetTokenByOwnerQuery) => {
          setData(result);
        })
        .catch((e) => {
          setError(e);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [chainId, owner, setData]);

  const lookup =
    chainId === 1
      ? "ownerships"
      : chainId === 11155111
        ? "sepolia_ownerships"
        : undefined;
  const tokenIds = useMemo(() => {
    const t =
      (lookup &&
        (data?.[lookup] as MainnetTokenByOwnerQuery["ownerships"] | undefined)
          ?.filter(
            (o) => o?.tokenId !== null || typeof o?.tokenId !== "undefined",
          )
          .map((o) => BigInt(o.tokenId.toString()))) ??
      [];
    if (sorted === "asc") {
      t.sort((a, b) => Number(a) - Number(b));
    } else if (sorted === "desc") {
      t.sort((a, b) => Number(b) - Number(a));
    }
    return t;
  }, [data, lookup, sorted]);

  return { data: tokenIds, error, isLoading };
}
