import { sepolia, mainnet } from "viem/chains";

export function funknloveAddressForChain(
  chainId: typeof sepolia.id | typeof mainnet.id,
) {
  switch (chainId) {
    case sepolia.id:
      return "0x39364A9340dA367798BF7C687541Df3E4A114E74" as const;
    case mainnet.id:
      return "0xf407EE7289CA1941a0D9c89C57fe53F665AD237B" as const;
    default:
      throw new Error(`Unsupported chainId: ${chainId}`);
  }
}
