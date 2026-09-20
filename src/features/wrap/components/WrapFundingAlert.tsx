import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import { formatEther } from "viem";

export function WrapFundingAlert({
  chainId,
  balance,
  cost,
  scope,
}: {
  chainId: number;
  balance?: bigint;
  cost?: bigint;
  scope: string;
}) {
  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      Not enough ETH to wrap {scope}, including gas fees.
      {balance !== undefined && cost !== undefined && (
        <>
          {" "}
          Your balance is {formatEther(balance)} ETH; wrapping requires{" "}
          {formatEther(cost)} ETH plus gas fees.
        </>
      )}
      {chainId === 1 ? (
        <>
          {" "}
          Add ETH on Ethereum to continue. If your funds are on another network,
          bridge them to Ethereum.{" "}
          <Link
            href="https://relay.link/bridge/ethereum"
            target="_blank"
            rel="noopener noreferrer"
          >
            Bridge to Ethereum with Relay (opens in a new tab)
          </Link>
        </>
      ) : (
        <> Add test ETH on Sepolia to continue.</>
      )}
    </Alert>
  );
}
