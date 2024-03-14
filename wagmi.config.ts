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
            [sepolia.id]: "0xb40d9f7D68f200650f9286138d520975603ae687",
          },
        },
        {
          name: "WrappedNFT",
          address: {
            [sepolia.id]: "0x384fCcC4E11B95379831151a44D10096Ec568277",
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
