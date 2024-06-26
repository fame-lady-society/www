import { NextResponse, NextRequest } from "next/server";
import { fetchFameClaimData } from "@/service/fameClaimData";
import { zeroAddress, checksumAddress, isAddress } from "viem";
import { fetchAllocationData } from "@/service/fetchAllocationData";
import { fetchAllOwnersIterable } from "@/service/fetchAllOwnersIterable";
import {
  ALLOCATION_PER_SISTER_TOKEN,
  HUNNYS_CONTRACT,
} from "@/features/claim/hooks/constants";

export async function GET(req: NextRequest) {
  const data = await fetchAllOwnersIterable({
    contractAddress: HUNNYS_CONTRACT,
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

contract FameLadySocietyOwners {
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
      "Content-Disposition": "attachment; filename=HunnysOwners.sol",
    },
  });
  return response;
}

export const dynamic = "force-dynamic";
