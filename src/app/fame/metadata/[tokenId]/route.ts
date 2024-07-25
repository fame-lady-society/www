import { type NextRequest, NextResponse } from "next/server";
import { type IMetadata } from "@/utils/metadata";

interface Params {
  tokenId: string;
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  let { tokenId } = params;
  // check if tokenId ends in ".json"
  if (tokenId.endsWith(".json")) {
    // remove ".json" from the end of the tokenId
    tokenId = tokenId.slice(0, -5);
  }
  return NextResponse.json<IMetadata>({
    id: Number(tokenId),
    name: `FAME Society`,
    image: `${process.env.OG_BASE_URL}/images/fame/gold-leaf-square.png`,
    description: `This Society NFT is also one million $FAME. 

WE are the Fame Lady Society

It's a wrap.`,
  });
}
