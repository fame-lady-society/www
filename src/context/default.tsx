import { FC, PropsWithChildren } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { i18n as I18nType } from "i18next";
import flsTheme from "@/theme";
import { Web3Provider } from "./Wagmi";

export const DefaultProvider: FC<PropsWithChildren<{ i18n?: I18nType }>> = ({
  children,
  i18n,
}) => (
  <ThemeProvider theme={flsTheme}>
    <CssBaseline />
    <Web3Provider>{children}</Web3Provider>
  </ThemeProvider>
);
