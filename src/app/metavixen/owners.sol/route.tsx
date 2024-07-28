import { NextResponse, NextRequest } from "next/server";
import { zeroAddress, checksumAddress, isAddress } from "viem";
import { client as polygonClient } from "@/viem/polygon-client";
import { fetchAllOwnersIterable } from "@/service/fetchAllOwnersIterable";
import { METAVIXEN_CONTRACT } from "@/features/claim-to-fame/hooks/constants";

export async function GET(req: NextRequest) {
  const data = await fetchAllOwnersIterable({
    contractAddress: METAVIXEN_CONTRACT,
    client: polygonClient,
    totalSupply: 1000n,
    zeroIndex: true,
  });

  const ownerAmounts = new Map<`0x${string}`, bigint>();
  for (const owner of data.values()) {
    if (owner && owner !== zeroAddress && isAddress(owner)) {
      const address = checksumAddress(owner);
      ownerAmounts.set(address, (ownerAmounts.get(address) ?? 0n) + 1n);
    }
  }

  const sol = `// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract MetavixenOwners {
    mapping(address => uint256) public balanceOf;

    constructor() {
${[...ownerAmounts]
  .map(([owner, amount]) => `        balanceOf[${owner}] = ${amount};`)
  .join("\n")}
    }
    function allOwners() public pure returns (address[] memory) {
        address[] memory owners = new address[](${ownerAmounts.size});
${[...ownerAmounts.keys()].map((owner, index) => `        owners[${index}] = ${owner};`).join("\n")}
        return owners;
    }
}

  `;
  const response = new NextResponse(sol, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": "attachment; filename=MetavixenOwners.sol",
    },
  });
  return response;
}

export const dynamic = "force-dynamic";
