import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import InputIcon from "@mui/icons-material/Input";
import UpdateIcon from "@mui/icons-material/Update";
import QAIcon from "@mui/icons-material/QuestionAnswer";
import ExchangeIcon from "@mui/icons-material/CurrencyExchange";
import DollarIcon from "@mui/icons-material/MonetizationOn";
import PersonIcon from "@mui/icons-material/Person";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import { FC } from "react";
import ListItemIcon from "@mui/material/ListItemIcon";
import { WrappedLink } from "@/components/WrappedLink";

export const SiteMenu: FC<{
  isFame?: boolean;
  isFaq?: boolean;
  isCustomize?: boolean;
  isHome?: boolean;
  isWrap?: boolean;
  isDao?: boolean;
  isLore?: boolean;
  isFameSwap?: boolean;
}> = ({
  isFame = false,
  isHome = false,
  isCustomize = false,
  isFaq = false,
  isWrap = false,
  isDao = false,
  isLore = false,
  isFameSwap = false,
}) => {
  return (
    <>
      <MenuItem component={WrappedLink} href="/lore" disabled={isLore}>
        <ListItemIcon>
          <AutoStoriesIcon />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography textAlign="right" color="text.primary">
              Lore
            </Typography>
          }
        />
      </MenuItem>
      <MenuItem component={WrappedLink} href="/wrap" disabled={isWrap}>
        <ListItemIcon>
          <ExchangeIcon />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography textAlign="right" color="text.primary">
              Wrap
            </Typography>
          }
        />
      </MenuItem>
      <MenuItem component={WrappedLink} href="/fame" disabled={isFame}>
        <ListItemIcon>
          <DollarIcon />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography textAlign="right" color="text.primary">
              $FAME
            </Typography>
          }
        />
      </MenuItem>
      <MenuItem
        component={WrappedLink}
        href="/fame/swap"
        disabled={isFameSwap}
      >
        <ListItemIcon>
          <ExchangeIcon />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography textAlign="right" color="text.primary">
              FAME Swap
            </Typography>
          }
        />
      </MenuItem>
      <MenuItem component={WrappedLink} href="/fameus" disabled={isDao}>
        <ListItemIcon>
          <InputIcon />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography textAlign="right" color="text.primary">
              FAMEus DAO
            </Typography>
          }
        />
      </MenuItem>
      <MenuItem
        component={WrappedLink}
        href="/customize"
        disabled={isCustomize}
      >
        <ListItemIcon>
          <UpdateIcon />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography textAlign="right" color="text.primary">
              Customize
            </Typography>
          }
        />
      </MenuItem>
      <MenuItem component={WrappedLink} href="/mainnet/~">
        <ListItemIcon>
          <PersonIcon />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography textAlign="right" color="text.primary">
              Profiles
            </Typography>
          }
        />
      </MenuItem>
      <MenuItem component={WrappedLink} href="/faq" disabled={isFaq}>
        <ListItemIcon>
          <QAIcon />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography textAlign="right" color="text.primary">
              FAQ
            </Typography>
          }
        />
      </MenuItem>
      <MenuItem component={WrappedLink} href="/" disabled={isHome}>
        <ListItemIcon>
          <InputIcon />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography textAlign="right" color="text.primary">
              home
            </Typography>
          }
        />
      </MenuItem>
    </>
  );
};
