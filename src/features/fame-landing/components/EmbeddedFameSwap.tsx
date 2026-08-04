"use client";

import { DefaultProvider } from "@/context/default";
import { FameSwapWidget } from "@/features/fame-swap/components/FameSwapWidget";

/** Deliberately the only landing module that imports wallet infrastructure. */
export default function EmbeddedFameSwap() {
  return (
    <DefaultProvider base>
      <FameSwapWidget mode="embedded" />
    </DefaultProvider>
  );
}
