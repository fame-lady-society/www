import { useEffect, useState } from "react";
import { fetchBaseNftLadiesData } from "../service/graphql";

export function useLadies({
  owner,
  first = 100,
  skip,
  sorted,
}: {
  owner?: `0x${string}`;
  first?: number;
  skip?: number;
  sorted?: "asc" | "desc";
}) {
  const [data, setData] = useState<BigInt[]>([]);
  const [error, setError] = useState<Error>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (owner) {
      setIsLoading(true);
      fetchBaseNftLadiesData({ owner, first, skip, sorted })
        .then(setData)
        .catch(setError)
        .finally(() => setIsLoading(false));
    }
  }, [first, owner, skip, sorted]);

  return { data, error, isLoading };
}
