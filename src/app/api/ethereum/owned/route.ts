import * as sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/siwe/session-utils";

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json([], { status: 401 });
  }
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/owners/ethereum`;
  try {
    const hodlers: { owners: Record<`0x${string}`, number[]> } = await fetch(
      url,
    ).then((res) => res.json());

    const ownedTokens =
      hodlers.owners?.[session.address.toLowerCase() as `0x${string}`] ?? [];

    return NextResponse.json(ownedTokens);
  } catch (error) {
    console.error(error);
    sentry.captureException(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
