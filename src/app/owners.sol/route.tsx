import { NextResponse, NextRequest } from "next/server";
import { fetchFameClaimData } from "@/service/fameClaimData";
import { zeroAddress, checksumAddress, isAddress } from "viem";
import { fetchAllocationData } from "@/service/fetchAllocationData";

export async function GET(req: NextRequest) {
  const data = await fetchFameClaimData();

  const owners = new Set<`0x${string}`>();
  for (const item of data) {
    if (item.owner && item.owner !== zeroAddress && isAddress(item.owner)) {
      const address = checksumAddress(item.owner);
      owners.add(address);
    }
  }

  // Create airdrop amount for each owner
  const airdropMap = new Map<`0x${string}`, bigint>();
  for (const owner of owners) {
    const { total: totalWithSquad, squadTotal } = await fetchAllocationData({
      address: owner,
      snapshot: data,
    });
    const total = totalWithSquad - squadTotal;
    airdropMap.set(owner, total);
  }

  const sol = `// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract FameLadySocietyOwners {
    mapping(address => uint256) public airdropAmounts;

    constructor() {
${[...airdropMap]
  .map(([owner, amount]) => `        airdropAmounts[${owner}] = ${amount};`)
  .join("\n")}
    }
    function allOwners() public pure returns (address[] memory) {
        address[] memory owners = new address[](${owners.size});
${[...owners].map((owner, index) => `        owners[${index}] = ${owner};`).join("\n")}
        return owners;
    }
}

  `;
  const response = new NextResponse(sol, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": "attachment; filename=FameLadySocietyOwners.sol",
    },
  });
  return response;
}

export const dynamic = "force-dynamic";
