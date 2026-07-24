"use client";

import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import type { PropsWithChildren } from "react";
import { DefaultProvider } from "@/context/default";
import { AppBar } from "@/features/appbar/components/appBar";
import type { GalleryRuntimeConfig } from "../config/galleryRuntime";
import { GalleryRuntimeProvider } from "../config/galleryRuntime";

export function BaseGalleryShell({
  config,
  children,
}: PropsWithChildren<{ config: GalleryRuntimeConfig }>) {
  return (
    <DefaultProvider base>
      <GalleryRuntimeProvider config={config}>
        <Box
          component="main"
          sx={{
            minHeight: "100vh",
            bgcolor: "background.default",
            color: "text.primary",
          }}
        >
          <AppBar
            title={
              <Typography
                component="span"
                sx={{
                  ml: { xs: 0, sm: 1 },
                  fontWeight: 700,
                  fontSize: { xs: 16, sm: 20 },
                }}
              >
                FAME Gallery
              </Typography>
            }
          />
          <Toolbar />
          {children}
        </Box>
      </GalleryRuntimeProvider>
    </DefaultProvider>
  );
}
