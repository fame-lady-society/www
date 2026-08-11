import { isAddress, isAddressEqual } from "viem";

import type { SessionData } from "@/app/siwe/session-utils";

export function claimAuthorizationStatus(
  session: SessionData | null,
  requestedAddress: string,
): 401 | 403 | null {
  if (!session) return 401;
  if (
    !isAddress(session.address) ||
    !isAddress(requestedAddress) ||
    !isAddressEqual(session.address, requestedAddress)
  ) {
    return 403;
  }
  return null;
}
