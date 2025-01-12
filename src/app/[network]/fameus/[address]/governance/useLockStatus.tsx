import { govSocietyFromNetwork } from "@/features/fame/contract";
import { govSocietyAbi, useReadGovSocietyIsLocked } from "@/wagmi";
import { useEffect, useState } from "react";
import { useClient, useConfig } from "wagmi";
import { readContracts } from "@wagmi/core";

export const useLockStatus = (chainId: 11155111 | 8453, tokenIds: bigint[]) => {
  const config = useConfig();
  const [lockStatus, setLockStatus] = useState<boolean[]>([]);
  const [guardianAddresses, setGuardianAddresses] = useState<
    (`0x${string}` | null)[]
  >([]);
  const client = useClient();

  useEffect(() => {
    if (!client) return;
    async function fetchLockStatus() {
      const isLockedResponse = await readContracts(config, {
        contracts: tokenIds.map((tokenId) => ({
          address: govSocietyFromNetwork(chainId),
          abi: govSocietyAbi,
          functionName: "isLocked" as const,
          args: [tokenId],
        })),
      });
      const isLocked = isLockedResponse.map(({ status, result }) =>
        status === "success" ? result : false,
      );
      // get the index of all the true values
      const trueIndices = isLocked
        .map((isLocked, index) => (isLocked ? index : -1))
        .filter((index) => index !== -1);

      const guardianAddressesResponse = await readContracts(config, {
        contracts: trueIndices.map((index) => ({
          address: govSocietyFromNetwork(chainId),
          abi: govSocietyAbi,
          functionName: "guardianForTokenId" as const,
          args: [tokenIds[index]],
        })),
      });

      // Now recreate the lockStatus array with the guardian addresses, just add null for the ones that are not locked
      const finalGuardianAddresses = isLocked
        .map((isLocked, index) =>
          isLocked ? guardianAddressesResponse[index] : null,
        )
        .map((item) =>
          item && item.status === "success" ? item.result : null,
        );

      setLockStatus(isLocked);
      setGuardianAddresses(finalGuardianAddresses);
    }
    fetchLockStatus();
  }, [chainId, client, config, tokenIds]);

  return {
    lockStatus,
    guardianAddresses,
  };
};
