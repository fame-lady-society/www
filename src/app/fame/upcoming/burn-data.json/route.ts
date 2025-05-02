import { fameFromNetwork } from "@/features/fame/contract";
import { client as baseClient } from "@/viem/base-client";
import { getDN404Storage } from "@/service/fame";
import { base } from "viem/chains";
import { NextResponse } from "next/server";

export async function GET() {
  const storage = await getDN404Storage(baseClient, fameFromNetwork(base.id));

  return NextResponse.json({
    burnedPool: storage.burnPool.map((i) => Number(i)),
  });
}
