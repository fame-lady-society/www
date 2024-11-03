const ALCHEMY_KEY = process.env.ALCHEMY_KEY ?? "";

interface TokenBalanceResponse {
  jsonrpc: "2.0";
  id: number;
  result: {
    address: string;
    tokenBalances: TokenBalance[];
    pageKey?: string;
  };
}

interface TokenBalance {
  contractAddress: string;
  tokenBalance: string;
}

export async function getTokenBalance(
  address: `0x${string}`,
  contracts: `0x${string}`[],
): Promise<TokenBalanceResponse> {
  const response = await fetch(
    `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "alchemy_getTokenBalances",
        params: [address, contracts],
        id: 1,
      }),
    },
  );

  const data = await response.json();
  return data.result;
}
