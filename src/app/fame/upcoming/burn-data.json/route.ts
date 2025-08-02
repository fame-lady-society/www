import { getFamePools } from "@/service/fame";
import { NextResponse } from "next/server";

export async function GET() {
  const { mintPool, burnPool } = await getFamePools();

  return NextResponse.json({
    burnPool: burnPool.map((tokenId) => Number(tokenId)),
    mintPool,
  });
}
