import { FC } from "react";
import InputIcon from "@mui/icons-material/Input";
import UpdateIcon from "@mui/icons-material/Update";
import QAIcon from "@mui/icons-material/QuestionAnswer";
import ExchangeIcon from "@mui/icons-material/CurrencyExchange";
import DollarIcon from "@mui/icons-material/MonetizationOn";

import NextLink from "next/link";

export const SiteMenu: FC<{
  isFame?: boolean;
  isFaq?: boolean;
  isCustomize?: boolean;
  isHome?: boolean;
  isWrap?: boolean;
}> = ({
  isFame = false,
  isHome = false,
  isCustomize = false,
  isFaq = false,
  isWrap = false,
}) => {
  return (
    <>
      <MenuItem
        href="/wrap"
        disabled={isWrap}
        icon={<ExchangeIcon />}
        text="Wrap"
      />
      <MenuItem
        href="/fame"
        disabled={isFame}
        icon={<DollarIcon />}
        text="$FAME"
      />
      <MenuItem
        href="/customize"
        disabled={isCustomize}
        icon={<UpdateIcon />}
        text="Customize"
      />
      <MenuItem href="/faq" disabled={isFaq} icon={<QAIcon />} text="FAQ" />
      <MenuItem href="/" disabled={isHome} icon={<InputIcon />} text="home" />
    </>
  );
};

const MenuItem: FC<{
  href: string;
  disabled: boolean;
  icon: React.ReactNode;
  text: string;
}> = ({ href, disabled, icon, text }) => (
  <NextLink
    href={href}
    className={`flex items-center p-2 hover:bg-gray-700 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
  >
    <span className="mr-4 text-white">{icon}</span>
    <span className="text-right text-white">{text}</span>
  </NextLink>
);
