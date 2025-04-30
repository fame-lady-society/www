import type { IMetadata } from "@/utils/metadata";
import { type NextRequest, NextResponse } from "next/server";

const defaultDescription = `Late one night, Blü was cooking up some interstellar grooves when a signal came through the stars—Bootsy Collins, the Voice of the Mothership, answering the cosmic call. With his trademark swagger and space-dipped soul, Bootsy lent his legendary pipes to a mission of love and funk diplomacy. Together, they vibed across galaxies, spreading feel-good frequencies to alien hearts everywhere. “Funk n Love” is a ride through rhythm, romance, and the outer limits of funkified soundwaves.`;

type Tier = "bronze" | "silver" | "gold";

function tokenIdToTier(tokenId: string | number): Tier {
  switch (tokenId.toString()) {
    case "0":
      return "bronze";
    case "1":
      return "silver";
    case "2":
      return "gold";
    default:
      throw new Error(`Invalid tokenId: ${tokenId}`);
  }
}

const getMetadata = (tokenId: string | number): IMetadata => {
  const tier = tokenIdToTier(tokenId);
  const name = `Funknlove ${tier}`;
  return {
    name,
    image: `https://www.fameladysociety.com/~/jilly/funknlove/cover.png`,
    description: defaultDescription,
    tokenId: tokenId.toString(),
  };
};

export async function GET(
  _: NextRequest,
  { params }: { params: { tokenId: string } },
) {
  const tokenId = params.tokenId;
  const metadata = getMetadata(tokenId);
  return NextResponse.json(metadata);
}
