import { GalleryRuntimeProvider } from "@/features/fame-market/config/galleryRuntime";
import { createBaseLegacyGalleryRuntime } from "@/features/fame-market/config/baseGallery";
import { LegacyPositionRecoveryGate } from "@/features/fame-market/components/LegacyPositionRecovery";
import { baseFameV3Stack } from "@/features/fame/contract";
import { fameForkModeEnabled } from "@/viem/baseRpcUrls";

export default function Page() {
  return (
    <GalleryRuntimeProvider
      config={createBaseLegacyGalleryRuntime(baseFameV3Stack(), {
        forkMode: fameForkModeEnabled(),
      })}
    >
      <LegacyPositionRecoveryGate />
    </GalleryRuntimeProvider>
  );
}
