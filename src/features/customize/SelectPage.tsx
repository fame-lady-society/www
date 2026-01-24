import React, { FC, useMemo } from "react";

import { TokenProps, TokenSelect } from "./components/TokenSelect";

export const SelectPage: FC<{
  isLoading: boolean;
  tokens: TokenProps[];
}> = ({ isLoading, tokens }) => {
  return <TokenSelect isLoading={isLoading} tokens={tokens} />;
};
