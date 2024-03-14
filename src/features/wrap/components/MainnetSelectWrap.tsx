import {
  fameLadySocietyAddress,
  useWriteFameLadySocietySetApprovalForAll,
  useReadFameLadySocietyIsApprovedForAll,
} from "@/wagmi";
import { FC } from "react";
import { WrapCardContent } from "./MainnetWrapCardContent";
import { useAccount } from "wagmi";

export const MainnetSelectWrap: FC<{
  minTokenId: number;
  maxTokenId: number;
}> = ({ minTokenId, maxTokenId }) => {
  const { address: selectedAddress, chain: currentChain } = useAccount();

  const isValidToCheckApproval =
    selectedAddress &&
    currentChain &&
    fameLadySocietyAddress[currentChain?.id] !== undefined;

  const { data: isApprovedForAll, isFetched: isApprovedForAllFetched } =
    useReadFameLadySocietyIsApprovedForAll({
      ...(isValidToCheckApproval && {
        args: [
          selectedAddress,
          fameLadySocietyAddress[currentChain?.id] as `0x${string}`,
        ],
      }),
    });
  const {
    writeContractAsync: setApprovalForAll,
    isError: approveIsError,
    isPending: approveIsLoading,
    isSuccess: approveIsSuccess,
  } = useWriteFameLadySocietySetApprovalForAll({});

  return (
    <WrapCardContent
      minTokenId={minTokenId}
      maxTokenId={maxTokenId}
      isApprovedForAll={isApprovedForAll}
      setApprovalForAll={() =>
        setApprovalForAll({
          args: [
            fameLadySocietyAddress[currentChain?.id] as `0x${string}`,
            true,
          ],
        })
      }
      approveIsError={approveIsError}
      approveIsSuccess={approveIsSuccess}
    />
  );
};
