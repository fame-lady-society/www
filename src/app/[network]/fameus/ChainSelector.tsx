"use client";

import { FC, useCallback, useState, MouseEvent } from "react";
import Backdrop from "@mui/material/Backdrop";
import Box from "@mui/material/Box";
import Image from "next/image";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import CircularProgress from "@mui/material/CircularProgress";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import Typography from "@mui/material/Typography";
import CheckIcon from "@mui/icons-material/CheckCircle";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useChainId, useSwitchChain } from "wagmi";
import type { SxProps, TooltipProps } from "@mui/material";
import { Chain } from "viem";


export type TChain = Chain & {
  chainImageUrl: string;
};
export function decorateChainImageUrl(chain?: Chain): string {
  let chainImageUrl = "/images/chains/unknown.png";
  switch (chain?.id) {
    case 1:
      chainImageUrl = "/images/chains/homestead.png";
      break;
    case 111_55_111:
      chainImageUrl = "/images/chains/sepolia.png";
      break;
    case 5:
      chainImageUrl = "/images/chains/goerli.png";
      break;
    case 8543:
      chainImageUrl = "/images/chains/base.png";
      break;
    default:
      chainImageUrl = "/images/chains/unknown.png";
  }
  return chainImageUrl;
}

export const ConnectedDropDownModal: FC<{
  anchorEl: Element | null;
  chains: readonly [Chain, ...Chain[]];
  handleClose: () => void;
  handleSwitch: (chain: Chain) => void;
  currentChain?: Chain;
  assetPrefix?: string;
}> = ({
  anchorEl,
  assetPrefix,
  handleClose,
  handleSwitch,
  chains,
  currentChain,
}) => {
    const open = Boolean(anchorEl);
    return (
      <Menu
        anchorEl={anchorEl}
        open={open}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        onClose={(event) => {
          (event as MouseEvent).stopPropagation();
          handleClose();
        }}
        keepMounted
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Box component="div" sx={{ width: 320 }}>
          <MenuList disablePadding>
            {chains.map((chain) => (
              <MenuItem
                key={chain.id}
                onClick={(event) => {
                  event.stopPropagation();
                  handleSwitch(chain);
                }}
              >
                <ListItemIcon>
                  {currentChain?.id === chain.id ? (
                    // large CheckIcon
                    <CheckIcon sx={{ fontSize: 40 }} />
                  ) : (
                    <Image
                      src={`${assetPrefix ?? ""}${decorateChainImageUrl(chain)}`}
                      alt=""
                      width={40}
                      height={40}
                    />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography textAlign="right">{chain.name}</Typography>
                  }
                />
              </MenuItem>
            ))}
          </MenuList>
        </Box>
      </Menu>
    );
  };
export const ChainSelector: FC<{
  assetPrefix?: string;
  sx?: SxProps;
  tooltipProps?: Omit<TooltipProps, "title" | "children">;
}> = ({ assetPrefix, sx, tooltipProps }) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState<Element | null>(null);

  const chainId = useChainId();

  const { chains, error, switchChain, isPending } =
    useSwitchChain();
  const handleMenu = useCallback((event: MouseEvent) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  }, []);
  const onMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
  }, []);
  const handleSwitch = useCallback(
    (chain: Chain) => {
      onMenuClose();
      if (switchChain && chain?.id) {
        switchChain({ chainId: chain.id });
      }
    },
    [onMenuClose, switchChain]
  );

  const chain = chains.find((c) => c.id === chainId);
  return (
    <>
      <Tooltip
        title={
          <>
            <Typography>switch networks</Typography>
            <Typography>{`current network: ${chain?.name ?? "unknown"
              }`}</Typography>
            {error && <Typography color="error">{error.message}</Typography>}
            {!chain && <Typography>try connecting first</Typography>}
          </>
        }
        {...tooltipProps}
      >
        <IconButton onClick={handleMenu} sx={{ ...sx }}>
          <Image
            src={`${assetPrefix ?? ""}${decorateChainImageUrl(chain)}`}
            alt=""
            width={40}
            height={40}
          />
          {isPending && (
            <CircularProgress
              variant="indeterminate"
              sx={{
                width: 40,
                height: 40,
                position: "absolute",
              }}
            />
          )}
        </IconButton>
      </Tooltip>
      <ConnectedDropDownModal
        anchorEl={menuAnchorEl}
        assetPrefix={assetPrefix}
        handleClose={onMenuClose}
        handleSwitch={handleSwitch}
        chains={chains}
        currentChain={chain}
      />
    </>
  );
};
