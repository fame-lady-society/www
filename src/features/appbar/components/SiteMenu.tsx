import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import InputIcon from "@mui/icons-material/Input";
import UpdateIcon from "@mui/icons-material/Update";
import QAIcon from "@mui/icons-material/QuestionAnswer";
import ExchangeIcon from "@mui/icons-material/CurrencyExchange";
import { FC } from "react";
import ListItemIcon from "@mui/material/ListItemIcon";
import { WrappedLink } from "@/components/WrappedLink";

export const SiteMenu: FC<{
  isFaq?: boolean;
  isCustomize?: boolean;
  isHome?: boolean;
  isWrap?: boolean;
}> = ({
  isHome = false,
  isCustomize = false,
  isFaq = false,
  isWrap = false,
}) => {
  return (
    <>
      <MenuItem component={WrappedLink} href="/wrap" disabled={isWrap}>
        <ListItemIcon>
          <ExchangeIcon />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography textAlign="right" color="white">
              Wrap
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
            <Typography textAlign="right" color="white">
              Customize
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
            <Typography textAlign="right" color="white">
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
            <Typography textAlign="right" color="white">
              home
            </Typography>
          }
        />
      </MenuItem>
    </>
  );
};
