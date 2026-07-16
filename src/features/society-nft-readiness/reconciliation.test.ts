import assert from "node:assert/strict";
import test from "node:test";
import {
  encodeEventTopics,
  erc721Abi,
  zeroAddress,
  type Address,
  type Hex,
  type Log,
} from "viem";
import { mintedSocietyNftTokenIds } from "./reconciliation";

const ACCOUNT = "0x1111111111111111111111111111111111111111" as Address;
const OTHER_ACCOUNT = "0x2222222222222222222222222222222222222222" as Address;
const SOCIETY = "0x3333333333333333333333333333333333333333" as Address;
const OTHER_CONTRACT = "0x4444444444444444444444444444444444444444" as Address;

function transferLog({
  address = SOCIETY,
  from,
  to,
  tokenId,
}: {
  address?: Address;
  from: Address;
  to: Address;
  tokenId: bigint;
}): Log {
  return {
    address,
    data: "0x" as Hex,
    topics: encodeEventTopics({
      abi: erc721Abi,
      eventName: "Transfer",
      args: { from, to, tokenId },
    }) as Log["topics"],
    blockHash: null,
    blockNumber: null,
    logIndex: null,
    transactionHash: null,
    transactionIndex: null,
    removed: false,
  };
}

test("receipt parsing returns only Society NFTs minted to the initiating account", () => {
  const logs = [
    transferLog({ from: zeroAddress, to: ACCOUNT, tokenId: 41n }),
    transferLog({ from: zeroAddress, to: ACCOUNT, tokenId: 42n }),
    transferLog({ from: OTHER_ACCOUNT, to: ACCOUNT, tokenId: 43n }),
    transferLog({ from: zeroAddress, to: OTHER_ACCOUNT, tokenId: 44n }),
    transferLog({
      address: OTHER_CONTRACT,
      from: zeroAddress,
      to: ACCOUNT,
      tokenId: 45n,
    }),
  ];

  assert.deepEqual(mintedSocietyNftTokenIds(logs, SOCIETY, ACCOUNT), [
    41n,
    42n,
  ]);
});

test("receipt parsing de-duplicates repeated matching logs", () => {
  const mint = transferLog({ from: zeroAddress, to: ACCOUNT, tokenId: 41n });

  assert.deepEqual(mintedSocietyNftTokenIds([mint, mint], SOCIETY, ACCOUNT), [
    41n,
  ]);
});
