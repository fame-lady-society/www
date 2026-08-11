"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { isAddressEqual, type Hash } from "viem";
import { base } from "viem/chains";
import {
  useConnection,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { creatorArtistMagicAddress } from "@/features/fame/contract";
import {
  creatorArtistMagicAbi,
  useReadCreatorArtistMagicNextTokenId,
} from "@/wagmi";
import {
  SponsoredCreatorMetadataUploader,
  uploadSponsoredCreatorMetadata,
} from "./SponsoredCreatorMetadataUploader";
import { useHasCreatorRole } from "./useHasCreatorRole";
import {
  createArtworkReleaseSingleFlight,
  recoverContendedArtworkRelease,
  resolveArtworkReleaseFailure,
  type FrozenArtworkRelease,
} from "./releaseArtworkState";

type ReleasePhase =
  | "idle"
  | "switching"
  | "simulating"
  | "confirming"
  | "recovering"
  | "submitted_error"
  | "error";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Artwork release failed.";
}

function releaseButtonLabel(phase: ReleasePhase, tokenId: bigint) {
  switch (phase) {
    case "switching":
      return "Switching to Base…";
    case "simulating":
      return "Checking release…";
    case "confirming":
      return "Confirming release…";
    case "recovering":
      return "Refreshing metadata…";
    default:
      return `Release Society #${tokenId.toString()}`;
  }
}

export function ReleaseArtwork({ address }: { address: `0x${string}` }) {
  const contract = creatorArtistMagicAddress(base.id);
  const connection = useConnection();
  const connectedAddress = connection.address;
  const roles = useHasCreatorRole(address);
  const publicClient = usePublicClient({ chainId: base.id });
  const { mutateAsync: switchChain } = useSwitchChain();
  const { mutateAsync: writeContract } = useWriteContract();
  const router = useRouter();
  const [release, setRelease] = useState<FrozenArtworkRelease | null>(null);
  const [phase, setPhase] = useState<ReleasePhase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const submitSingleFlight = useRef(
    createArtworkReleaseSingleFlight(),
  ).current;
  const nextTokenId = useReadCreatorArtistMagicNextTokenId({
    chainId: base.id,
    address: contract,
  });
  const isConnectedCreator = Boolean(
    connectedAddress && isAddressEqual(connectedAddress, address),
  );

  if (
    !isConnectedCreator ||
    roles.isLoading ||
    roles.isPending ||
    !roles.isCreator
  ) {
    return null;
  }

  const recoverIfContended = async (frozen: FrozenArtworkRelease) => {
    if (!publicClient) return null;
    setPhase("recovering");
    const recovered = await recoverContendedArtworkRelease(
      frozen,
      async () => {
        const result = await nextTokenId.refetch();
        if (result.data === undefined) {
          throw (
            result.error ??
            new Error("The current release boundary is unavailable.")
          );
        }
        return BigInt(result.data);
      },
      async ({ expectedTokenId, imageUri }) => {
        const result = await uploadSponsoredCreatorMetadata({
          address,
          tokenId: Number(expectedTokenId),
          mode: "release",
          imageUri,
        });
        return result.metadataUri;
      },
    );
    if (recovered) {
      setRelease(recovered);
      setPhase("idle");
      setMessage(
        `The release boundary advanced to Society #${recovered.expectedTokenId.toString()}. The existing image was reused and its metadata was regenerated for the new boundary.`,
      );
    }
    return recovered;
  };

  const submit = () =>
    submitSingleFlight(async () => {
      if (!release || !publicClient || !connectedAddress) return;
      const frozen = release;
      let submittedHash: Hash | undefined;
      setMessage(null);
      try {
        if (connection.chainId !== base.id) {
          setPhase("switching");
          await switchChain({ chainId: base.id });
        }
        setPhase("simulating");
        const simulation = await publicClient.simulateContract({
          account: connectedAddress,
          address: contract,
          abi: creatorArtistMagicAbi,
          functionName: "releaseArtwork",
          args: [frozen.expectedTokenId, frozen.metadataUri],
        });
        const hash = await writeContract(simulation.request);
        submittedHash = hash;
        setPhase("confirming");
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== "success") {
          throw new Error("The artwork release transaction reverted.");
        }
        setPhase("idle");
        setMessage(
          `Society #${frozen.expectedTokenId.toString()} was released.`,
        );
        setRelease(null);
        await nextTokenId.refetch();
        router.refresh();
      } catch (error) {
        if (submittedHash) {
          const hashToReconcile = submittedHash;
          const failureResolution = await resolveArtworkReleaseFailure(
            true,
            async () =>
              (
                await publicClient.getTransactionReceipt({
                  hash: hashToReconcile,
                })
              ).status,
          );
          if (failureResolution === "complete") {
            setPhase("idle");
            setMessage(
              `Society #${frozen.expectedTokenId.toString()} was released.`,
            );
            setRelease(null);
            await nextTokenId.refetch();
            router.refresh();
            return;
          }
          if (failureResolution === "block") {
            setPhase("submitted_error");
            setMessage(
              `Transaction ${hashToReconcile} was submitted, but its receipt could not be confirmed. Refresh the page and check the transaction before attempting another release.`,
            );
            return;
          }
        }
        try {
          if (await recoverIfContended(frozen)) return;
        } catch (recoveryError) {
          setPhase("error");
          setMessage(errorMessage(recoveryError));
          return;
        }
        setPhase("error");
        setMessage(errorMessage(error));
      }
    });

  const boundary = nextTokenId.data;
  const busy =
    phase === "switching" ||
    phase === "simulating" ||
    phase === "confirming" ||
    phase === "recovering" ||
    phase === "submitted_error";

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
      <Stack spacing={2}>
        <div>
          <Typography component="h1" variant="h4">
            Release new artwork
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Add a new artwork at the end of the creator release sequence without
            selecting or owning a Society NFT.
          </Typography>
        </div>

        {nextTokenId.isPending ? (
          <Typography role="status">
            Loading the current release boundary…
          </Typography>
        ) : nextTokenId.isError || boundary === undefined ? (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                onClick={() => void nextTokenId.refetch()}
              >
                Try again
              </Button>
            }
          >
            The current release boundary is unavailable.
          </Alert>
        ) : (
          <>
            <Typography>
              Next release: Society #{boundary.toString()}
            </Typography>
            <SponsoredCreatorMetadataUploader
              key={boundary.toString()}
              address={address}
              tokenId={Number(boundary)}
              mode="release"
              onComplete={({ metadataUri, imageUri }) => {
                setRelease({
                  expectedTokenId: BigInt(boundary),
                  imageUri,
                  metadataUri,
                });
                setPhase("idle");
                setMessage(null);
              }}
            />
          </>
        )}

        {release ? (
          <Button
            variant="contained"
            disabled={busy}
            onClick={() => void submit()}
            sx={{ alignSelf: "flex-start", minHeight: 48 }}
          >
            {releaseButtonLabel(phase, release.expectedTokenId)}
          </Button>
        ) : null}

        {message ? (
          <Alert
            severity={
              phase === "error"
                ? "error"
                : phase === "submitted_error"
                  ? "warning"
                  : "success"
            }
          >
            {message}
          </Alert>
        ) : null}
      </Stack>
    </Paper>
  );
}
