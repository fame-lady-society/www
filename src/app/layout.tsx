"use client";
import { type Viewport } from "next";
import "@/styles/tailwind.css";
import { useEffect } from "react";

export const viewport: Viewport = {
  initialScale: 1.0,
  width: "device-width",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    import("@farcaster/miniapp-sdk").then(({ sdk }) => {
      sdk.actions.ready();
    });
  }, []);
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
