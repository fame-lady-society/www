import type { IMetadata } from "@/utils/metadata";
import { type NextRequest, NextResponse } from "next/server";

const defaultDescription = `Description goes here`;

const getMetadata = (tokenId: string | number): IMetadata => ({
  name: `Lingerie Dreams #${tokenId}`,
  image: `https://www.fameladysociety.com/~/jilly/lingerie-dreams/social.jpeg`,
  description: defaultDescription,
  tokenId: tokenId.toString(),
});

export async function GET(
  _: NextRequest,
  { params }: { params: { tokenId: string } },
) {
  const tokenId = params.tokenId;
  const metadata = getMetadata(tokenId);
  return NextResponse.json(metadata);
}
