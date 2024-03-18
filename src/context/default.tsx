import { FC, PropsWithChildren, useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { i18n as I18nType } from "i18next";
import flsTheme from "@/theme";
import { Web3Provider } from "./Wagmi";
import { NotificationsProvider } from "@/features/notifications/Context";
import { Notifications } from "@/features/notifications/Notifications";
import { useAccount, useEnsName } from "wagmi";

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

export const DefaultProvider: FC<PropsWithChildren<{ i18n?: I18nType }>> = ({
  children,
  i18n,
}) => (
  <ThemeProvider theme={flsTheme}>
    <CssBaseline />
    <Web3Provider>
      <NotificationsProvider>
        <Config>{children}</Config>
        <Notifications />
      </NotificationsProvider>
    </Web3Provider>
  </ThemeProvider>
);
