import { FC, useEffect, useMemo, useState } from "react";
import Grid2 from "@mui/material/Unstable_Grid2";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardMedia from "@mui/material/CardMedia";
import CardHeader from "@mui/material/CardHeader";

import {
  fameLadySquadABI,
  fameLadySquadAddress,
  useReadFameLadySocietyBalanceOf,
} from "@/wagmi";
import { BigNumber } from "ethers";
import { useAccount, useReadContracts } from "wagmi";

export const MainnetTokenSelect: FC<{
  onSelected: (selected: string[]) => void;
}> = ({ onSelected }) => {
  const { address: selectedAddress, chain: currentChain } = useAccount();
  const [tokenIds, setTokenIds] = useState<string[]>([]);
  useEffect(() => {
    onSelected(tokenIds);
  }, [tokenIds, onSelected]);

  const { data: balanceOf } = useReadFameLadySocietyBalanceOf({
    ...(selectedAddress !== undefined && {
      args: [selectedAddress],
    }),
  });
  const { data: ownedTokens } = useReadContracts({
    contracts:
      selectedAddress !== undefined && balanceOf !== undefined
        ? (Array.from({ length: Number(balanceOf) }).map((_, index) => ({
            abi: fameLadySquadABI,
            address: fameLadySquadAddress[currentChain?.id] as `0x${string}`,
            functionName: "tokenOfOwnerByIndex",
            args: [selectedAddress, BigNumber.from(index)],
          })) as {
            abi: typeof fameLadySquadABI;
            address: `0x${string}`;
            functionName: "tokenOfOwnerByIndex";
            args: [string, BigNumber];
          }[])
        : [],
  });

  const validTokens = useMemo(() => {
    return (ownedTokens ?? [])
      .filter((t) => !!t)
      .map((tokenId) => {
        return tokenId.toString();
      });
  }, [ownedTokens]);
  return (
    <>
      <Grid2 container spacing={1}>
        {validTokens.map((tokenId) => (
          <Grid2 xs={12} sm={6} md={4} lg={3} key={tokenId}>
            <Card>
              <CardActionArea
                onClick={() => {
                  if (tokenIds.includes(tokenId)) {
                    setTokenIds(tokenIds.filter((id) => id !== tokenId));
                  } else {
                    setTokenIds([...tokenIds, tokenId]);
                  }
                }}
                sx={{
                  ...(tokenIds.includes(tokenId) && {
                    borderColor: "primary.main",
                    borderStyle: "solid",
                    borderWidth: 5,
                  }),
                }}
              >
                <CardHeader title={tokenId} />
                <CardMedia
                  component="img"
                  image={`https://fls-prod-imagestoragef1b24905-1ftqhtk2cy7nl.s3.amazonaws.com/thumb/${tokenId}.png`}
                  sx={{
                    objectFit: "contain",
                    width: "100%",
                    transition: "transform 0.5s ease-in-out",
                  }}
                />
              </CardActionArea>
            </Card>
          </Grid2>
        ))}
      </Grid2>
    </>
  );
};
