import { type NextRequest, NextResponse } from "next/server";
import { type IMetadata } from "@/utils/metadata";

interface Params {
  tokenId: string;
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { tokenId } = params;
  return NextResponse.json<IMetadata>({
    id: Number(tokenId),
    name: `Society #${tokenId}`,
    image: `${process.env.OG_BASE_URL}/images/fame/gold-leaf-square.png`,
    description: `This Society NFT is also one million $FAME. 

WE are the Fame Lady Society

It's a wrap.`,
  });
}
