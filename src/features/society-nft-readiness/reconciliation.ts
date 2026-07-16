import {
  erc721Abi,
  isAddressEqual,
  parseEventLogs,
  zeroAddress,
  type Address,
  type Log,
} from "viem";

export function mintedSocietyNftTokenIds(
  logs: readonly Log[],
  societyAddress: Address,
  account: Address,
): bigint[] {
  const societyLogs = logs.filter((log) =>
    isAddressEqual(log.address, societyAddress),
  );
  const transfers = parseEventLogs({
    abi: erc721Abi,
    eventName: "Transfer",
    logs: societyLogs,
    strict: true,
  });
  const tokenIds = transfers
    .filter(
      ({ args }) =>
        isAddressEqual(args.from, zeroAddress) &&
        isAddressEqual(args.to, account),
    )
    .map(({ args }) => args.tokenId);

  return [...new Set(tokenIds)];
}
