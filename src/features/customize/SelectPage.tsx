import React, { FC, useMemo } from "react";

import { TokenSelect } from "./components/TokenSelect";
import { useLadies } from "./hooks/useLadies";
import { useAccount } from "wagmi";

export const SelectPage: FC<{
  prefix?: string;
}> = ({ prefix = "" }) => {
  const { address } = useAccount();
  const { data } = useLadies({ owner: address, sorted: "asc" });
  const selectLadiesTokens = useMemo(
    () => data?.map((tokenId) => ({ tokenId, url: `${prefix}/${tokenId}` })),
    [data, prefix],
  );

  return <TokenSelect tokens={selectLadiesTokens} />;
};
