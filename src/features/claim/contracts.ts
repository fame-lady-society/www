import { base, sepolia } from "viem/chains";

export function claimToFameFromNetwork(
  chainId: typeof sepolia.id | typeof base.id,
) {
  switch (chainId) {
    case sepolia.id:
      return "0x75e4AdB3b0125C9c5E4dB92350cbe92CD76A3199" as const;
    case base.id:
      return "0x75e4AdB3b0125C9c5E4dB92350cbe92CD76A3199" as const;
  }
}
