import {
  FC,
  PropsWithChildren,
  useEffect,
  useRef,
  useState,
  MouseEventHandler,
  ReactNode,
} from "react";
import { Box, Toolbar } from "@mui/material";
import { AppBar } from "@/features/appbar/components/appBar";

export const Main: FC<
  PropsWithChildren<{
    menu?: ReactNode;
    title?: ReactNode;
    right?: ReactNode;
  }>
> = ({ children, menu, title, right }) => {
  return (
    <>
      <Box
        component="main"
        sx={{
          backgroundColor: "background.default",
        }}
      >
        <AppBar menu={menu} title={title} right={right} />
        {children}
      </Box>
    </>
  );
};
