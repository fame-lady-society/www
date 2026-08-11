import type { ReactNode } from "react";
import { BaseGalleryShell } from "@/features/fame-market/components/BaseGalleryShell";
import { createBaseGalleryRuntime } from "@/features/fame-market/config/baseGallery";
import { baseFameV3Stack } from "@/features/fame/contract";
import { fameForkModeEnabled } from "@/viem/baseRpcUrls";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <BaseGalleryShell
      config={createBaseGalleryRuntime(baseFameV3Stack(), {
        forkMode: fameForkModeEnabled(),
      })}
    >
      {children}
    </BaseGalleryShell>
  );
}
