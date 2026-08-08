"use client";

import type { PropsWithChildren } from "react";
import { DefaultProvider } from "@/context/default";
import { FameMain } from "@/features/fame/components/FameShell";
import type { GalleryRuntimeConfig } from "../config/galleryRuntime";
import { GalleryRuntimeProvider } from "../config/galleryRuntime";

export function BaseGalleryShell({
  config,
  children,
}: PropsWithChildren<{ config: GalleryRuntimeConfig }>) {
  return (
    <DefaultProvider base>
      <GalleryRuntimeProvider config={config}>
        <FameMain title="FAME Marketplace" activeFamePage="marketplace">
          {children}
        </FameMain>
      </GalleryRuntimeProvider>
    </DefaultProvider>
  );
}
