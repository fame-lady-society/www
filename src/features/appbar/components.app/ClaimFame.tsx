"use client";

import React, { FC, useState } from "react";
import { useReleasableAmount } from "@/features/claim/hooks/useReleasableAmount";
import { ClaimModal } from "@/features/claim/ClaimModal";

export const ClaimFame: FC = () => {
  const { releasableAmount } = useReleasableAmount();
  const [claimFameOpen, setClaimFameOpen] = useState(false);

  return releasableAmount && releasableAmount > 0n ? (
    <>
      <button
        onClick={() => setClaimFameOpen(true)}
        className="ml-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors duration-200"
      >
        <h1 className="text-xl font-bold">Claim $FAME</h1>
      </button>
      <ClaimModal
        open={claimFameOpen}
        onClose={() => setClaimFameOpen(false)}
      />
    </>
  ) : null;
};
