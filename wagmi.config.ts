import { config } from "dotenv";
import { defineConfig } from "@wagmi/cli";
import { etherscan, react } from "@wagmi/cli/plugins";
import { sepolia, mainnet } from "wagmi/chains";

config({
  path: ".env.local",
});

export default defineConfig({
  out: "src/wagmi/index.ts",
  contracts: [],
  plugins: [
    etherscan({
      apiKey: process.env.ETHERSCAN_API_KEY!,
      chainId: sepolia.id,
      contracts: [
        {
          name: "BulkMinter",
          address: {
            [sepolia.id]: "0x71E57b37b4BeA589673D0aFE1992A6457ca754b3",
          },
        },
        {
          name: "WrappedNFT",
          address: {
            [sepolia.id]: "0x9EFf37047657a0f50b989165b48012834eDB2212",
          },
        },
        {
          name: "NamedLadyRenderer",
          address: {
            [sepolia.id]: "0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a",
          },
        },
      ],
    }),
    etherscan({
      apiKey: process.env.ETHERSCAN_API_KEY!,
      chainId: mainnet.id,
      contracts: [
        {
          name: "FameLadySociety",
          address: {
            [mainnet.id]: "0x6cf4328f1ea83b5d592474f9fcdc714faafd1574",
          },
        },
        {
          name: "FameLadySquad",
          address: {
            [mainnet.id]: "0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47",
          },
        },
      ],
    }),
    react(),
  ],
});
