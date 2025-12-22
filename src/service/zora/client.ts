import { setApiKey } from "@zoralabs/coins-sdk";
import { Address, decodeFunctionData, encodeFunctionData } from "viem";
import {
  createCoin as createCoinZora,
  createCoinCall,
  createMetadataBuilder,
  createZoraUploaderForCreator,
} from "@zoralabs/coins-sdk";
import { zoraFactoryImplAbi } from "@/wagmi";
import {
  decodeDopplerMultiCurveUniV4,
  encodeDopplerMultiCurveUniV4,
} from "./utils";
import { base } from "viem/chains";

setApiKey(process.env.ZORA_API_KEY);

export const createCoin = async ({
  creator,
  imageURI,
  currency,
  name,
  symbol,
  description,
}: {
  creator: Address;
  imageURI: string;
  currency: `0x${string}`;
  name: string;
  symbol: string;
  description: string;
}) => {
  const { createMetadataParameters } = await createMetadataBuilder()
    .withName(name)
    .withSymbol(symbol)
    .withDescription(description)
    .withImageURI(imageURI)
    .upload(createZoraUploaderForCreator(creator));

  try {
    const transactionParameters = await createCoinCall({
      creator,
      currency: "ZORA",
      chainId: base.id,
      metadata: createMetadataParameters.metadata,
      name: createMetadataParameters.name,
      symbol: createMetadataParameters.symbol,
    });

    return transactionParameters.map((parameter) => {
      // Lets start decoding the data
      const data = decodeFunctionData({
        abi: zoraFactoryImplAbi,
        data: parameter.data,
      });
      if (data.functionName === "deploy") {
        const [
          payoutRecipient,
          owners,
          uri,
          name,
          symbol,
          poolConfig,
          platformReferrer,
          postDeployHook,
          postDeployHookData,
          coinSalt,
        ] = data.args;
        const [
          _version,
          _currency,
          tickLower,
          tickUpper,
          numDiscoveryPositions,
          maxDiscoverySupplyShare,
        ] = decodeDopplerMultiCurveUniV4(poolConfig);
        const newPoolConfig = encodeDopplerMultiCurveUniV4(
          currency,
          tickLower,
          tickUpper,
          numDiscoveryPositions,
          maxDiscoverySupplyShare,
        );
        return {
          ...parameter,
          data: encodeFunctionData({
            abi: zoraFactoryImplAbi,
            functionName: "deploy",
            args: [
              payoutRecipient,
              owners,
              uri,
              name,
              symbol,
              newPoolConfig,
              platformReferrer,
              postDeployHook as `0x${string}`,
              postDeployHookData as `0x${string}`,
              coinSalt as `0x${string}`,
            ],
          }),
        };
      }
      return parameter;
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
};
