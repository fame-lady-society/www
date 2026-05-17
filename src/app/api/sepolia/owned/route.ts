import * as sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

import { fetchOwnedTokenIds } from "@/app/api/ownedTokenIds";
import { getSession } from "@/app/siwe/session-utils";

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ownedTokens = await fetchOwnedTokenIds(
      request,
      "sepolia",
      session.address,
    );

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
