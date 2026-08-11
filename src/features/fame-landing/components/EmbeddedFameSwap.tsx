"use client";

import { FameSwapWidget } from "@/features/fame-swap/components/FameSwapWidget";

/** Deliberately the only landing module that imports wallet infrastructure. */
export default function EmbeddedFameSwap() {
  return <FameSwapWidget mode="embedded" />;
}
