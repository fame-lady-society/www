import { FC } from "react";
import Image from "next/image";
import { TwitterIcon } from "@/components/icons/twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import { MagicEdenIcon } from "@/components/icons/magiceden";
import NextLink from "next/link";

export const LinksMenuItems: FC<{}> = ({}) => {
  return (
    <>
      <MenuItem href="https://twitter.com/FameLadySociety">
        <TwitterIcon className="w-5 h-5" />
        <MenuItemText>@FameLadySociety</MenuItemText>
      </MenuItem>
      <MenuItem href="https://www.instagram.com/famelady.society/">
        <InstagramIcon className="w-5 h-5" />
        <MenuItemText>famelady.society</MenuItemText>
      </MenuItem>
      <MenuItem href="https://www.threads.net/@famelady.society">
        <Image
          src="/images/logos/threads-logo.png"
          alt="threads logo"
          width={20}
          height={25}
          className="w-5 h-auto"
        />
        <MenuItemText>@famelady.society</MenuItemText>
      </MenuItem>
      <MenuItem href="https://buy.fameladysociety.com">
        <Image
          src="/images/logos/reservoir.svg"
          alt="reservoir"
          width={25}
          height={25}
          className="w-6 h-auto mr-2"
        />
        <MenuItemText>Our Marketplace</MenuItemText>
      </MenuItem>
      <MenuItem href="https://magiceden.io/collections/ethereum/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574">
        <MagicEdenIcon className="w-5 h-5" />
        <MenuItemText>Magic Eden Collection</MenuItemText>
      </MenuItem>
      <MenuItem href="https://discord.gg/jkAdAPXEpw">
        <Image
          src="/images/reveal/discord-dark.png"
          alt="discord"
          width={90}
          height={25}
          className="w-20 h-auto"
        />
        <MenuItemText>Invite</MenuItemText>
      </MenuItem>
      <MenuItem href="https://t.me/+RYjY8hmjLtxlYmVh">
        <Image
          src="/images/logos/telegram.png"
          alt="telegram"
          width={22}
          height={22}
          className="w-5 h-auto"
        />
        <MenuItemText>Join Telegram Group</MenuItemText>
      </MenuItem>
    </>
  );
};

const MenuItem: FC<{ href: string; children: React.ReactNode }> = ({
  href,
  children,
}) => (
  <li className="list-none">
    <NextLink
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center p-2 hover:bg-gray-100 transition-colors duration-200"
    >
      {children}
    </NextLink>
  </li>
);

const MenuItemText: FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="ml-auto text-right text-blue-600 hover:text-blue-800">
    {children}
  </span>
);
