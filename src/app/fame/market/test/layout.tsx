"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { DefaultProvider } from "@/context/default";
import { AppBar } from "@/features/appbar/components/appBar";
import { TestBadge } from "@/features/fame-market/components/TestBadge";

export default function GalleryTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DefaultProvider baseSepolia>
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
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{ ml: { xs: 0, sm: 1 } }}
            >
              <Typography
                component="span"
                sx={{ fontWeight: 700, fontSize: { xs: 16, sm: 20 } }}
              >
                FAME Gallery
              </Typography>
              <TestBadge />
            </Stack>
          }
        />
        <Toolbar />
        {children}
      </Box>
    </DefaultProvider>
  );
}
