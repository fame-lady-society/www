import { useEffect, useState } from "react";
import { fetchBaseNftLadiesData } from "../service/graphql";

export function useLadies({ owner }: { owner?: `0x${string}` }) {
  const [data, setData] = useState<BigInt[]>([]);
  const [error, setError] = useState<Error>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (owner) {
      setIsLoading(true);
      fetchBaseNftLadiesData({ owner })
        .then(setData)
        .catch(setError)
        .finally(() => setIsLoading(false));
    }
  }, [owner]);

  return { data, error, isLoading };
}
