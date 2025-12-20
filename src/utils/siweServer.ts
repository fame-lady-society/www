import { chains, transports } from "@/context/Wagmi";
import { configureServerSideSIWE } from "connectkit-next-siwe";

export const siweServer = configureServerSideSIWE({
  config: {
    chains: chains,
    transports: transports,
  },
  session: {
    cookieName: "siwe",
    password: process.env.SESSION_SECRET,
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
    },
  },
});
