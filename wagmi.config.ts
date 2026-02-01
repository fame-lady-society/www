import { config } from "dotenv";
import { defineConfig } from "@wagmi/cli";
import {
  etherscan,
  react,
  foundry,
} from "@wagmi/cli/plugins";
import { sepolia, mainnet, base, baseSepolia } from "wagmi/chains";

config({
  path: ".env.local",
});

type SupportedChainId = typeof sepolia.id | typeof baseSepolia.id | typeof mainnet.id | typeof base.id;

export default defineConfig({
  out: "src/wagmi/index.ts",
  contracts: [],
  plugins: [
    etherscan({
      apiKey: process.env.ETHERSCAN_API_KEY!,
      chainId: sepolia.id,
      contracts: [
        {
          name: "UnrevealedLadyRenderer",
          address: {
            [base.id]: "0xa50c9a918c110ca159fb187f4a55896a4d063878",
          } as Partial<Record<SupportedChainId, `0x${string}`>> as any,
        },
        {
          name: "ZoraFactoryImpl",
          address: {
            [base.id]: "0x8Ec7f068A77fa5FC1925110f82381374BA054Ff2",
          } as Partial<Record<SupportedChainId, `0x${string}`>> as any,
        },
        {
          name: "BulkMinter",
          address: {
            [sepolia.id]: "0x71E57b37b4BeA589673D0aFE1992A6457ca754b3",
            [baseSepolia.id]: "0x4E6bB6d251db23dc0855D53B09da0d4E7049B354",
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
        {
          name: "FLSNaming",
          address: {
            [sepolia.id]: "0x9bf1E5dA76e5f62cfA843BA19A887578A341f674",
            [baseSepolia.id]: "0x7916d9bb560dcA5ecC3b681b2972f568EC1ce073",
            [mainnet.id]: "0xaE21fEF5E74B7Ec887704023EC13F412983Eb304",
          },
        },
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
