"use client";
import { forwardRef } from "react";
import NextLink, { type LinkProps as NextLinkProps } from "next/link";
import MuiLink, { type LinkProps as MuiLinkProps } from "@mui/material/Link";

type WrappedLinkProps = Omit<
  MuiLinkProps<typeof NextLink>,
  "component" | "href"
> & {
  href: NextLinkProps["href"];
};

export const WrappedLink = forwardRef<HTMLAnchorElement, WrappedLinkProps>(
  function WrappedLink({ href, ...props }, ref) {
    return <MuiLink component={NextLink} ref={ref} href={href} {...props} />;
  },
);
WrappedLink.displayName = "WrappedLink";
