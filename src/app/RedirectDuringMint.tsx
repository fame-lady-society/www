"use client";

import { FC, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsMintOpen } from "./~/blu/funknlove/hooks/useIsMintOpen";
import { mainnet } from "viem/chains";

export const RedirectDuringMint: FC = () => {
  const router = useRouter();
  const { isMintOpen } = useIsMintOpen(mainnet.id);

  useEffect(() => {
    if (isMintOpen) {
      router.push("/~/blu/funknlove");
    }
  }, [isMintOpen, router]);

  return null;
};
