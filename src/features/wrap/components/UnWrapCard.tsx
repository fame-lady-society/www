import { FC } from "react";

import Card from "@mui/material/Card";
import CardTitle from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { useAccount } from "wagmi";
import { sepolia } from "wagmi/chains";
import { WrappedLink } from "@/components/WrappedLink";

export const UnwrapCard: FC<{
  testnetOnly?: boolean;
}> = ({ testnetOnly = false }) => {
  const { isConnected, chain: currentChain } = useAccount();

  return isConnected &&
    ((testnetOnly && currentChain.id === sepolia.id) || !testnetOnly) ? (
    <Card>
      <CardTitle title="Unwrap" />
      <CardContent>
        <Typography variant="body2" component="p">
          Coming soon. If you want to unwrap now, you can call the unwrap method
          directly on{" "}
          <WrappedLink
            href="https://etherscan.io/address/0x6cf4328f1ea83b5d592474f9fcdc714faafd1574#writeContract#F18"
            target="_blank"
            rel="noopener noreferrer"
          >
            etherscan
          </WrappedLink>
        </Typography>
      </CardContent>
    </Card>
  ) : null;
};
