"use client";

import Link from "next/link";
import { isAddressEqual } from "viem";
import { useConnection } from "wagmi";
import { useHasCreatorRole } from "./useHasCreatorRole";

export function CreatorMetadataUpdateLink({
  address,
}: {
  address: `0x${string}`;
}) {
  const connection = useConnection();
  const roles = useHasCreatorRole(address);
  const isConnectedCreator = Boolean(
    connection.address &&
      isAddressEqual(connection.address, address) &&
      roles.isCreator,
  );

  if (!isConnectedCreator) return null;

  return (
    <aside className="mb-6 border-l border-[#c9aa67] bg-[#16140f] px-5 py-4 text-[#f4eee2] sm:flex sm:items-center sm:justify-between sm:gap-6">
      <div>
        <p className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-[#c9aa67]">
          Released collection
        </p>
        <p className="mt-1 text-sm leading-6 text-[#bdb4a4]">
          Replace the artwork metadata for any released Society token.
        </p>
      </div>
      <Link
        href={`/fame/creator/${address}/metadata`}
        className="fame-action fame-focus mt-4 inline-flex min-h-11 shrink-0 items-center border border-[#c9aa67]/65 px-5 text-sm font-semibold text-[#f4eee2] hover:border-[#c9aa67] hover:bg-[#c9aa67]/10 sm:mt-0"
      >
        Open metadata studio&nbsp; →
      </Link>
    </aside>
  );
}
