import { FC } from "react";
import InputIcon from "@mui/icons-material/Input";
import ExchangeIcon from "@mui/icons-material/CurrencyExchange";
import QAIcon from "@mui/icons-material/QuestionAnswer";
import EditIcon from "@mui/icons-material/Edit";
import ReloadIcon from "@mui/icons-material/Replay";
import BankIcon from "@mui/icons-material/AccountBalance";

import NextLink from "next/link";
import { MenuItem } from "./MenuItem";
import { NetworkMenuItem } from "./NetworkMenuItem";
import { mainnet } from "viem/chains";

export const SiteMenu: FC<{
  isFame?: boolean;
  isFaq?: boolean;
  isCustomize?: boolean;
  isHome?: boolean;
  isWrap?: boolean;
  isDao?: boolean;
}> = ({
  isFame = false,
  isHome = false,
  isCustomize = false,
  isFaq = false,
  isWrap = false,
  isDao = false,
}) => {
  return (
    <>
      <MenuItem href="/" disabled={isHome} icon={<InputIcon />} text="home" />
      <NetworkMenuItem
        path="/wrap"
        defaultChainId={mainnet.id}
        disabled={isWrap}
        icon={<ExchangeIcon />}
        text="Wrap"
      />
      <MenuItem
        href="/fame"
        disabled={isFame}
        icon={<ReloadIcon />}
        text="$FAME"
      />
      <MenuItem
        href="/fameus"
        disabled={isDao}
        icon={<BankIcon />}
        text="FAMEus DAO"
      />
      <MenuItem
        href="/customize"
        disabled={isCustomize}
        icon={<EditIcon />}
        text="Customize"
      />
      <MenuItem href="/faq" disabled={isFaq} icon={<QAIcon />} text="FAQ" />
    </>
  );
};
