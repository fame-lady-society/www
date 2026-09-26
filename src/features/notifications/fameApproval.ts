import { societyFromNetwork } from "@/features/fame/contract";
import { erc721Abi, type Address } from "viem";
import { base } from "viem/chains";

// Operator revoked in Base transaction
// 0xabe8d595d4e92a48d984dc8268bf109d2b7ce8425d7506ecea0faa597fa2e1bc.
export const riskyFameOperator =
  "0x9a1d00bed7cd04bcda516d721a596eb22aac6834" as const;

export function fameApprovalRead(account: Address) {
  return {
    abi: erc721Abi,
    address: societyFromNetwork(base.id),
    chainId: base.id,
    functionName: "isApprovedForAll",
    args: [account, riskyFameOperator],
  } as const;
}

export function fameApprovalRevoke(account: Address) {
  return {
    abi: erc721Abi,
    address: societyFromNetwork(base.id),
    chainId: base.id,
    account,
    functionName: "setApprovalForAll",
    args: [riskyFameOperator, false],
  } as const;
}
