import { NextRequest, NextResponse } from "next/server";
import { isAddress, isAddressEqual, type Address } from "viem";
import { base } from "viem/chains";
import { readContract } from "viem/actions";
import { getSession, type SessionData } from "@/app/siwe/session-utils";
import { creatorArtistMagicAddress } from "@/features/fame/contract";
import { client as basePublicClient } from "@/viem/base-client";
import { creatorArtistMagicAbi } from "@/wagmi";
import { buildNodeIrysUploader } from "@/service/irys_backend_client_node";
import type { IrysSponsoredUploader } from "@/service/irys_sponsored_upload";
import {
  CREATOR_UPLOAD_CHAIN_ID,
  CREATOR_UPLOAD_MAX_BODY_BYTES,
  digestSessionCookie,
  verifyCreatorUploadCapability,
} from "@/service/creator_upload_authorization";
import {
  createCreatorUploadJournal,
  type CreatorUploadJournal,
} from "@/service/creator_upload_journal";
import { normalizeCreatorAddress } from "@/features/fame/creatorMetadata";

type RevokeRequest = { capability: string };

type RevokeDeps = {
  getSession: (request: NextRequest) => SessionData | null;
  createUploader: () => Promise<IrysSponsoredUploader>;
  journal: CreatorUploadJournal;
};

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function trustedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  return (
    (!origin || origin === request.nextUrl.origin) &&
    (!fetchSite || fetchSite === "same-origin" || fetchSite === "same-site")
  );
}

async function parseBody(request: NextRequest): Promise<RevokeRequest | null> {
  if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") {
    return null;
  }
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > CREATOR_UPLOAD_MAX_BODY_BYTES) {
    return null;
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > CREATOR_UPLOAD_MAX_BODY_BYTES) {
    return null;
  }
  try {
    const body: unknown = JSON.parse(text);
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).sort().join(",") !== "capability" ||
      typeof (body as RevokeRequest).capability !== "string"
    ) {
      return null;
    }
    return body as RevokeRequest;
  } catch {
    return null;
  }
}

async function defaultCreateUploader() {
  const privateKey = process.env.METADATA_PRIVATE_KEY;
  if (!privateKey) throw new Error("METADATA_PRIVATE_KEY not configured");
  return (await buildNodeIrysUploader({
    privateKey: privateKey as `0x${string}`,
  })) as unknown as IrysSponsoredUploader;
}

const defaultDeps: RevokeDeps = {
  getSession,
  createUploader: defaultCreateUploader,
  journal: createCreatorUploadJournal(),
};

export async function handleCreatorMetadataRevoke(
  request: NextRequest,
  deps: RevokeDeps = defaultDeps,
) {
  if (!trustedOrigin(request)) return error("Invalid origin", 403);
  const session = deps.getSession(request);
  const cookie = request.cookies.get("siwe")?.value;
  const body = await parseBody(request);
  if (!session || !cookie || session.chainId !== CREATOR_UPLOAD_CHAIN_ID || !body) {
    return error("Invalid request", 422);
  }
  const capability = verifyCreatorUploadCapability(body.capability);
  if (!capability || capability.purpose !== "image-upload") {
    return error("Invalid upload authorization", 403);
  }
  if (
    !isAddress(capability.address) ||
    !isAddressEqual(capability.address, session.address) ||
    capability.sessionDigest !== digestSessionCookie(cookie)
  ) {
    return error("Unauthorized", 403);
  }
  const operation = await deps.journal.getOperation(capability.operationId);
  if (
    !operation ||
    operation.status === "finalized" ||
    operation.creatorAddress.toLowerCase() !== capability.address.toLowerCase() ||
    operation.sessionDigest !== capability.sessionDigest ||
    operation.imageHash !== capability.imageHash ||
    operation.imageBytes !== capability.imageBytes
  ) {
    return NextResponse.json({ revoked: false });
  }
  const uploader = await deps.createUploader();
  if (!uploader.approval) throw new Error("Irys approval support is unavailable");
  await uploader.approval.revokeApproval({
    approvedAddress: normalizeCreatorAddress(capability.address),
  });
  await deps.journal.updateOperation(capability.operationId, {
    status: "revoked",
  });
  await deps.journal.releaseCreator(
    normalizeCreatorAddress(capability.address),
    capability.operationId,
  );
  return NextResponse.json({ revoked: true });
}

export async function POST(request: NextRequest) {
  try {
    return await handleCreatorMetadataRevoke(request);
  } catch {
    return error("Unable to revoke upload authorization", 503);
  }
}
