import { NextResponse, NextRequest } from "next/server";
import { fetchAllOwners } from "@/service/fameClaimData";
import { zeroAddress } from "viem";

export async function GET(req: NextRequest) {
  let data = await fetchAllOwners();
  data = data.filter((item) => item.owner && item.owner !== zeroAddress);

  const owners = new Set<string>();
  for (const item of data) {
    owners.add(item.owner);
  }

  let csvData = `owner\n`;
  for (const owner of owners) {
    if (!owner) continue;
    csvData += `${owner}\n`;
  }
  const response = new NextResponse(csvData, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": "attachment; filename=owners.csv",
    },
  });
  return response;
}

export const dynamic = "force-dynamic";
