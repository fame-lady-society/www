"use client";
import { FC, PropsWithChildren, useEffect, useMemo } from "react";
import * as Sentry from "@sentry/nextjs";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { ThemeProvider } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { createAppTheme, createFameTheme } from "@/theme";
import { Web3Provider } from "./Wagmi";
import { NotificationsProvider } from "@/features/notifications/Context";
import { Notifications } from "@/features/notifications/Notifications";
import { useAccount } from "@/hooks/useAccount";
import { useEnsName } from "wagmi";

const Config: FC<PropsWithChildren> = ({ children }) => {
  const { address, chain } = useAccount();
  const { data: ensName } = useEnsName({ address });

  useEffect(() => {
    if (address) {
      Sentry.setUser({ id: address, chain: chain?.name, ens: ensName });
    } else {
      Sentry.setUser(null);
    }
  }, [address, chain?.name, ensName]);
  return <>{children}</>;
};

export const DefaultProvider: FC<
  PropsWithChildren<{
    siwe?: boolean;
    authChains?: readonly number[];
    fame?: boolean;
  }>
> = ({
  siwe,
  children,
  authChains,
  fame = false,
}) => {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)", {
    defaultMatches: true,
  });
  const theme = useMemo(
    () =>
      fame
        ? createFameTheme()
        : createAppTheme(prefersDarkMode ? "dark" : "light"),
    [fame, prefersDarkMode],
  );

  return (
    <ThemeProvider theme={theme}>
      {!fame && <CssBaseline />}
      {!fame && (
        <GlobalStyles
          styles={(theme) => ({
            html: {
              backgroundColor: `${theme.palette.background.default} !important`,
              color: `${theme.palette.text.primary} !important`,
              colorScheme: theme.palette.mode,
            },
            body: {
              backgroundColor: `${theme.palette.background.default} !important`,
              color: `${theme.palette.text.primary} !important`,
            },
          })}
        />
      )}
      <Web3Provider siwe={siwe} authChains={authChains}>
        <NotificationsProvider>
          <Config>{children}</Config>
          <Notifications />
        </NotificationsProvider>
      </Web3Provider>
    </ThemeProvider>
  );
};
