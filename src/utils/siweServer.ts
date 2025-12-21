import { COOKIE_NAME, SESSION_SECRET } from "@/app/siwe/session-utils";
import { chains, transports } from "@/context/wagmiConfig";
import { configureServerSideSIWE } from "connectkit-next-siwe";

export const siweServer = configureServerSideSIWE({
  config: {
    chains: chains,
    transports: transports,
  },
  session: {
    cookieName: COOKIE_NAME,
    password: SESSION_SECRET,
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
    },
  },
});
