import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import PersonIcon from "@mui/icons-material/Person";
import { FC } from "react";
import ListItemIcon from "@mui/material/ListItemIcon";
import { TwitterIcon } from "@/components/icons/twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import GitHubIcon from "@mui/icons-material/GitHub";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import Image from "next/image";
import { OpenSeaIcon } from "@/components/icons/opensea";
import Divider from "@mui/material/Divider";
import { WrappedLink } from "@/components/WrappedLink";

export const LinksMenuItems: FC<{}> = ({}) => {
  return (
    <>
      <MenuItem
        component={WrappedLink}
        href="https://twitter.com/FameLadySociety"
        target="_blank"
        rel="noopener noreferrer"
      >
        <ListItemIcon>
          <TwitterIcon />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography textAlign="right" color="white">
              @FameLadySociety
            </Typography>
          }
        />
      </MenuItem>
      <MenuItem
        component={WrappedLink}
        href="https://www.instagram.com/famelady.society/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <ListItemIcon>
          <InstagramIcon />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography textAlign="right" color="white">
              famelady.society
            </Typography>
          }
        />
      </MenuItem>
      <MenuItem
        component={WrappedLink}
        href="https://www.threads.net/@famelady.society"
        target="_blank"
        rel="noopener noreferrer"
      >
        <ListItemIcon>
          <Image
            src="/images/logos/threads-logo.png"
            alt="threads logo"
            width={20}
            height={25}
            style={{
              maxWidth: "100%",
              height: "auto",
            }}
          />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography textAlign="right" color="white">
              @famelady.society
            </Typography>
          }
        />
      </MenuItem>
      <MenuItem
        component={WrappedLink}
        href="https://buy.fameladysociety.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        <ListItemIcon>
          <Image
            src="/images/logos/reservoir.svg"
            alt="reservoir"
            width={25}
            height={25}
            style={{
              maxWidth: "100%",
              height: "auto",
              marginRight: 8,
            }}
          />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography textAlign="right" color="white">
              Our Marketplace
            </Typography>
          }
        />
      </MenuItem>
      <MenuItem
        component={WrappedLink}
        href="https://opensea.io/collection/fameladysociety"
        target="_blank"
        rel="noopener noreferrer"
      >
        <ListItemIcon>
          <OpenSeaIcon />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography textAlign="right" color="white">
              OpenSea Collection
            </Typography>
          }
        />
      </MenuItem>
      <MenuItem
        component={WrappedLink}
        href="https://discord.gg/jkAdAPXEpw"
        target="_blank"
        rel="noopener noreferrer"
      >
        <ListItemIcon>
          <Image
            src="/images/reveal/discord-dark.png"
            alt="discord"
            width={90}
            height={25}
            style={{
              maxWidth: "100%",
              height: "auto",
            }}
          />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography textAlign="right" color="white">
              Invite
            </Typography>
          }
        />
      </MenuItem>
      <MenuItem
        component={WrappedLink}
        href="https://t.me/+RYjY8hmjLtxlYmVh"
        target="_blank"
        rel="noopener noreferrer"
      >
        <ListItemIcon>
          <Image
            src="/images/logos/telegram.png"
            alt="telegram"
            width={22}
            height={22}
            style={{
              maxWidth: "100%",
              height: "auto",
            }}
          />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography textAlign="right" color="white">
              Join Telegram Group
            </Typography>
          }
        />
      </MenuItem>
      <MenuItem
        component={WrappedLink}
        href="https://www.tally.xyz/gov/fameus-dao"
        target="_blank"
        rel="noopener noreferrer"
      >
        <ListItemIcon>
          <AccountBalanceIcon />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography textAlign="right" color="white">
              FAMEus DAO
            </Typography>
          }
        />
      </MenuItem>
      <MenuItem
        component={WrappedLink}
        href="/mainnet/~"
      >
        <ListItemIcon>
          <PersonIcon />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography textAlign="right" color="white">
              Profiles
            </Typography>
          }
        />
      </MenuItem>
      <MenuItem
        component={WrappedLink}
        href="https://github.com/fame-lady-society"
        target="_blank"
        rel="noopener noreferrer"
      >
        <ListItemIcon>
          <GitHubIcon />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography textAlign="right" color="white">
              GitHub
            </Typography>
          }
        />
      </MenuItem>
      <Divider component="li" />
    </>
  );
};
