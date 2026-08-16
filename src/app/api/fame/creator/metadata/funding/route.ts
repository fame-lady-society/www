import { NextRequest, NextResponse } from "next/server";
import { MAX_CREATOR_IMAGE_BYTES } from "@/features/fame/creatorMetadata";
import { getCreatorUploadFundingSnapshot } from "@/service/creator_upload_funding";

export const dynamic = "force-dynamic";

function parseSafeInteger(value: string | null) {
  if (value === null || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export async function GET(request: NextRequest) {
  const imageBytesParam = request.nextUrl.searchParams.get("imageBytes");
  const tokenIdParam = request.nextUrl.searchParams.get("tokenId");
  const imageBytes =
    imageBytesParam === null ? undefined : parseSafeInteger(imageBytesParam);
  const tokenId =
    tokenIdParam === null ? undefined : parseSafeInteger(tokenIdParam);

  if (
    imageBytes === null ||
    (imageBytes !== undefined &&
      (imageBytes <= 0 || imageBytes > MAX_CREATOR_IMAGE_BYTES)) ||
    tokenId === null
  ) {
    return NextResponse.json(
      { error: "Invalid funding estimate parameters" },
      { status: 400 },
    );
  }

  const snapshot = await getCreatorUploadFundingSnapshot({
    ...(imageBytes === undefined ? {} : { imageBytes }),
    ...(tokenId === undefined ? {} : { tokenId }),
  });
  const response = NextResponse.json(snapshot);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
