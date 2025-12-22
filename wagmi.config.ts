import { config } from "dotenv";
import { defineConfig } from "@wagmi/cli";
import {
  etherscan,
  react,
  foundry,
  fetch as fetchPlugin,
} from "@wagmi/cli/plugins";
import { sepolia, mainnet, base } from "wagmi/chains";
// import { client as mainnetClient } from "./src/viem/mainnet-client.js";
import { toHex } from "viem";

config({
  path: ".env.local",
});

async function readMainnetImplementationAddress(
  contractAddress: `0x${string}`,
) {
  const { client: mainnetClient } = await import(
    "./src/viem/mainnet-client.js"
  );
  const storageSlot =
    "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"; // EIP-1967 implementation slot

  const addressStorage = await mainnetClient.getStorageAt({
    address: contractAddress,
    slot: storageSlot,
  });

  console.log(
    `Implementation address for ${contractAddress} is ${addressStorage!}`,
  );
  return `0x${addressStorage!.slice(-40)}`;
}

export default defineConfig({
  out: "src/wagmi/index.ts",
  contracts: [],
  plugins: [
    // fetchPlugin({
    //   contracts: [
    //     {
    //       name: "SaveLady",
    //       address: {
    //         [mainnet.id]: "0x31fA60d6fF9F8aE536E790ebf885435Be9053116",
    //       },
    //     },
    //   ],
    //   request: async (contract) => {
    //     const implementationAddress = await readMainnetImplementationAddress(
    //       "0x31fA60d6fF9F8aE536E790ebf885435Be9053116",
    //     );
    //     console.log(
    //       `Implementation address for SaveLady is ${implementationAddress}`,
    //     );
    //     // Fetch ABI from Etherscan
    //     const response = await fetch(
    //       `https://api.etherscan.io/v2/api?apikey=${process.env.ETHERSCAN_API_KEY}&chainid=1&module=contract&action=getabi&address=${implementationAddress}`,
    //     );
    //     const data = await response.json();
    //     if (data.status !== "1") {
    //       throw new Error(
    //         `Failed to fetch ABI from Etherscan: ${
    //           data.result || "Unknown error"
    //         }`,
    //       );
    //     }
    //     return JSON.parse(data.result);
    //   },
    // }),
    etherscan({
      apiKey: process.env.ETHERSCAN_API_KEY!,
      chainId: base.id,
      contracts: [
        {
          name: "UnrevealedLadyRenderer",
          address: {
            [base.id]: "0xa50c9a918c110ca159fb187f4a55896a4d063878",
          },
        },
        {
          name: "ZoraFactoryImpl",
          address: {
            [base.id]: "0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2",
          },
        },
      ],
    }),
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
          name: "FameSale",
          address: {
            [sepolia.id]: "0x740Af42cff003acd5e366b3A5392E38FF6b9e4F3",
            // [base.id]: "0x2d78B13a2E735Bc96ec797A37AaF4e17C4431C83",
          },
        },
        {
          name: "FameSaleToken",
          address: {
            [sepolia.id]: "0x233A9630e1fC80688E5cc2bb988836e0D5034328",
            // [base.id]: "0xf09326082a0B360567c72b6FEd67c22Fe2f76B60",
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
        {
          name: "NamedLadyRenderer",
          address: {
            [sepolia.id]: "0xDaE12D4fB5d0A173cEf2f8C69e5Dd32280f71c9a",
            [mainnet.id]: "0xC7A29659c34CB2551Aec0dc589e6450aF342bf24",
          },
        },
        {
          name: "WrappedNFTDonationVault",
          address: {
            [mainnet.id]: "0x7a276F4B91A97267D652500aa4aB8b2Fa388fb9b",
          },
        },

        {
          name: "SaveLady",
          address: {
            [mainnet.id]: "0x90a255715Eb31C13b42325eB9c997E2bAdbcC3BC",
          },
        },
      ],
    }),
    foundry({
      project: "../fame-contracts",
      include: [
        "ClaimToFame.sol/**",
        "Fame.sol/**",
        "FameMirror.sol/**",
        "IBalanceOf.sol/**",
        "FameVesting.sol/**",
        "GovSociety.sol/**",
        "LingerieDreams.sol/**",
        "FUNKNLOVE.sol/**",
        "CreatorArtistMagic.sol/**",
        "SimpleOffchainReveal.sol/**",
      ],
    }),
    react(),
  ],
});
