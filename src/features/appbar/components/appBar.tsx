import {
  FC,
  MouseEventHandler,
  MouseEvent,
  useCallback,
  useState,
  ReactNode,
} from "react";
import { AppBar as MuiAppBar, Toolbar, Box, Typography } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import { HomeMenu } from "./HomeMenu";
import { ConnectKitButton } from "connectkit";

export const AppBar: FC<{
  menu: ReactNode;
  title?: ReactNode;
}> = ({ menu, title }) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState<Element | null>(null);

  const onMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
  }, []);
  const handleMenu = useCallback((event: MouseEvent) => {
    setMenuAnchorEl(event.currentTarget);
  }, []);
  return (
    <>
      <MuiAppBar color="default">
        <Toolbar>
          <MenuIcon onClick={handleMenu} />
          {title}
          <Box sx={{ flexGrow: 1 }} component="span" />
          <ConnectKitButton />
        </Toolbar>
      </MuiAppBar>
      <HomeMenu anchorEl={menuAnchorEl} handleClose={onMenuClose}>
        {menu}
      </HomeMenu>
    </>
  );
};
