import { FC } from "react";
import InputIcon from "@mui/icons-material/Input";
import ExchangeIcon from "@mui/icons-material/CurrencyExchange";
import QAIcon from "@mui/icons-material/QuestionAnswer";
import GitHubIcon from "@mui/icons-material/GitHub";
import EditIcon from "@mui/icons-material/Edit";
import ReloadIcon from "@mui/icons-material/Replay";
import BankIcon from "@mui/icons-material/AccountBalance";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import PersonIcon from "@mui/icons-material/Person";

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
  isLore?: boolean;
  isProfile?: boolean;
}> = ({
  isFame = false,
  isHome = false,
  isCustomize = false,
  isFaq = false,
  isWrap = false,
  isDao = false,
  isLore = false,
  isProfile = false,
}) => {
  return (
    <>
      <MenuItem href="/" disabled={isHome} icon={<InputIcon />} text="home" />
      <MenuItem
        href="/lore"
        disabled={isLore}
        icon={<AutoStoriesIcon />}
        text="Lore"
      />
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
      <MenuItem
        href="/mainnet/~"
        disabled={isProfile}
        icon={<PersonIcon />}
        text="Profiles"
      />
      <MenuItem
        href="https://github.com/fame-lady-society"
        disabled={false}
        icon={<GitHubIcon />}
        text="GitHub"
      />
      <MenuItem href="/faq" disabled={isFaq} icon={<QAIcon />} text="FAQ" />
    </>
  );
};
