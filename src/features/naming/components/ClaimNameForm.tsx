"use client";

import { type FC, useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import LinearProgress from "@mui/material/LinearProgress";
import Grid2 from "@mui/material/Unstable_Grid2";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Link from "next/link";
import { sepolia, mainnet, baseSepolia } from "viem/chains";
import { useClaimName } from "../hooks/useClaimName";
import { useOwnedGateNftTokens, type NetworkType } from "../hooks/useOwnedGateNftTokens";
import { useAccount } from "@/hooks/useAccount";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useChainId, useSwitchChain } from "wagmi";

function getTokenImageUrl(network: NetworkType, tokenId: number): string {
  switch (network) {
    case "mainnet":
      return `https://fame.support/fls/thumb/${tokenId}`;
    case "sepolia":
    case "base-sepolia":
      // For testnets, use a placeholder with the token number
      return `https://placehold.co/200x200/1a1a2e/c44dff?text=%23${tokenId}`;
  }
}

function getExpectedChainId(network: NetworkType): number {
  switch (network) {
    case "sepolia":
      return sepolia.id;
    case "mainnet":
      return mainnet.id;
    case "base-sepolia":
      return baseSepolia.id;
  }
}

function getNetworkDisplayName(network: NetworkType): string {
  switch (network) {
    case "sepolia":
      return "Sepolia";
    case "mainnet":
      return "Ethereum Mainnet";
    case "base-sepolia":
      return "Base Sepolia";
  }
}

export interface ClaimNameFormProps {
  network: NetworkType;
}

export const ClaimNameForm: FC<ClaimNameFormProps> = ({ network }) => {
  const expectedChainId = getExpectedChainId(network);
  const chainId = useChainId();
  const { mutateAsync: switchChainAsync } = useSwitchChain();
  const { isConnected, signIn } = useAccount();
  const { token } = useAuthSession();
  const [desiredName, setDesiredName] = useState("");
  const [selectedTokenId, setSelectedTokenId] = useState<bigint | "">("");
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [pendingSignIn, setPendingSignIn] = useState(false);

  const isWrongChain = chainId !== expectedChainId;
  const needsSetup = !isConnected || !token || isWrongChain;

  const { data: availableTokens, isLoading: isLoadingTokens, refetch: refetchTokens } =
    useOwnedGateNftTokens(network);

  const {
    step,
    error,
    name,
    secondsRemaining,
    minCommitAge,
    canClaim,
    startCommit,
    submitClaim,
    reset,
  } = useClaimName(network);

  // Effect to sign in after chain switch completes
  useEffect(() => {
    if (pendingSignIn && !isWrongChain && isConnected) {
      setPendingSignIn(false);
      signIn()
        .then(() => {
          refetchTokens();
        })
        .catch((err) => {
          setSetupError(err instanceof Error ? err.message : "Sign in failed. Please try again.");
        })
        .finally(() => {
          setIsSettingUp(false);
        });
    }
  }, [pendingSignIn, isWrongChain, isConnected, signIn, refetchTokens]);

  // Handle the setup flow: switch chain if needed, then sign in
  const handleSetup = async () => {
    setIsSettingUp(true);
    setSetupError(null);

    try {
      // If connected but on wrong chain, switch first then sign in via effect
      if (isConnected && isWrongChain) {
        await switchChainAsync({ chainId: expectedChainId });
        // Set flag to trigger sign in after chain updates (effect will clear isSettingUp)
        setPendingSignIn(true);
        return;
      }

      // Already on correct chain (or not connected), sign in directly
      await signIn();
      refetchTokens();
      setIsSettingUp(false);
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : "Setup failed. Please try again.");
      setIsSettingUp(false);
    }
  };

  const handleStartClaim = () => {
    if (!desiredName.trim() || selectedTokenId === "") return;
    startCommit(desiredName.trim(), BigInt(selectedTokenId));
  };

  const handleSubmitClaim = () => {
    submitClaim();
  };

  // Show setup screen if not ready
  if (needsSetup) {
    let title = "Get Started";
    let description = "Connect your wallet and sign in to claim a name.";

    if (!isConnected) {
      title = "Connect Your Wallet";
      description = "Connect your wallet to claim a name.";
    } else if (isWrongChain && !token) {
      title = "Switch Network & Sign In";
      description = `Switch to ${getNetworkDisplayName(network)} and sign in to continue.`;
    } else if (isWrongChain) {
      title = "Switch Network";
      description = `Please switch to ${getNetworkDisplayName(network)} to continue.`;
    } else if (!token) {
      title = "Sign In Required";
      description = "Sign in to verify your wallet ownership and load your NFTs.";
    }

    return (
      <Card>
        <CardContent sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {description}
          </Typography>
          {setupError && (
            <Alert severity="error" sx={{ mb: 2, textAlign: "left" }}>
              {setupError}
            </Alert>
          )}
          <Button
            variant="contained"
            onClick={handleSetup}
            disabled={isSettingUp}
            startIcon={isSettingUp ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isSettingUp ? "Please wait..." : title}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "complete") {
    return (
      <Card>
        <CardContent sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ color: "success.main" }}>
            Congratulations!
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            You claimed the name "{name}"
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Your identity has been created and your soulbound NFT has been minted.
          </Typography>
          <Box component="div" sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              component={Link}
              href={`/${network}/naming/${encodeURIComponent(name)}`}
              variant="contained"
            >
              View Your Profile
            </Button>
            <Button
              component={Link}
              href={`/${network}/naming`}
              variant="outlined"
            >
              Back to All Profiles
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box component="div" sx={{ maxWidth: 600, mx: "auto" }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Claim Your Name
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Claiming a name uses a two-step commit-reveal process to prevent
            front-running. First, you'll commit to your name, wait{" "}
            {minCommitAge} seconds, then reveal and claim it.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Step 1: Enter name and select token */}
          {step === "idle" && (
            <Box component="div" sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                label="Desired Name"
                value={desiredName}
                onChange={(e) => setDesiredName(e.target.value)}
                fullWidth
                placeholder="Enter your desired name"
                helperText="Choose a unique name for your Fame Lady identity"
              />

              {isLoadingTokens ? (
                <Box component="div" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">
                    Loading your gate NFTs...
                  </Typography>
                </Box>
              ) : availableTokens?.length === 0 ? (
                <Alert severity="warning">
                  You don't own any gate NFTs. You need to own a Fame Lady
                  Society NFT to claim a name.
                </Alert>
              ) : (
                <Box component="div">
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Select a Gate NFT to bind to your identity:
                  </Typography>
                  <Grid2 container spacing={2}>
                    {availableTokens?.map((tokenId) => (
                      <Grid2 xs={6} sm={4} key={tokenId}>
                        <Card
                          sx={{
                            borderRadius: 2,
                            overflow: "hidden",
                            transition: "all 0.2s ease",
                            border: selectedTokenId === BigInt(tokenId)
                              ? "3px solid"
                              : "3px solid transparent",
                            borderColor: selectedTokenId === BigInt(tokenId)
                              ? "primary.main"
                              : "transparent",
                            "&:hover": {
                              transform: "translateY(-4px)",
                              boxShadow: "0 8px 20px rgba(196, 77, 255, 0.2)",
                            },
                          }}
                        >
                          <CardActionArea
                            onClick={() => setSelectedTokenId(BigInt(tokenId))}
                          >
                            <Box component="div" position="relative">
                              <CardMedia
                                component="img"
                                image={getTokenImageUrl(network, tokenId)}
                                alt={`Token #${tokenId}`}
                                sx={{
                                  aspectRatio: "1",
                                  objectFit: "cover",
                                }}
                              />
                              {selectedTokenId === BigInt(tokenId) && (
                                <Box
                                  component="div"
                                  sx={{
                                    position: "absolute",
                                    top: 8,
                                    right: 8,
                                    p: 0.5,
                                    borderRadius: "50%",
                                    background: "linear-gradient(135deg, #ff6b9d 0%, #c44dff 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <CheckCircle sx={{ fontSize: 20, color: "#fff" }} />
                                </Box>
                              )}
                            </Box>
                            <Box component="div" p={1.5} textAlign="center">
                              <Typography variant="body2" fontWeight={600}>
                                #{tokenId}
                              </Typography>
                            </Box>
                          </CardActionArea>
                        </Card>
                      </Grid2>
                    ))}
                  </Grid2>
                </Box>
              )}

              <Button
                variant="contained"
                size="large"
                onClick={handleStartClaim}
                disabled={
                  !desiredName.trim() ||
                  selectedTokenId === "" ||
                  availableTokens?.length === 0
                }
              >
                Start Claim Process
              </Button>
            </Box>
          )}

          {/* Step 2: Committing */}
          {step === "committing" && (
            <Box component="div" sx={{ textAlign: "center", py: 2 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="body1">
                Committing your name claim...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please confirm the transaction in your wallet
              </Typography>
            </Box>
          )}

          {/* Step 3: Waiting */}
          {step === "waiting" && (
            <Box component="div" sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="h6" gutterBottom>
                Commitment Confirmed!
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Claiming name: <strong>{name}</strong>
              </Typography>

              {secondsRemaining > 0 ? (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Please wait {secondsRemaining} seconds before revealing your
                    claim...
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={((minCommitAge - secondsRemaining) / minCommitAge) * 100}
                    sx={{ mb: 2, height: 8, borderRadius: 4 }}
                  />
                  <Typography
                    variant="h4"
                    sx={{ fontFamily: "monospace", color: "primary.main" }}
                  >
                    {secondsRemaining}s
                  </Typography>
                </>
              ) : (
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSubmitClaim}
                  disabled={!canClaim}
                  sx={{
                    background:
                      "linear-gradient(135deg, #ff6b9d 0%, #c44dff 50%, #6b5bff 100%)",
                  }}
                >
                  Reveal & Claim Name
                </Button>
              )}
            </Box>
          )}

          {/* Step 4: Claiming */}
          {step === "claiming" && (
            <Box component="div" sx={{ textAlign: "center", py: 2 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="body1">
                Revealing and claiming your name...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please confirm the transaction in your wallet
              </Typography>
            </Box>
          )}

          {/* Error state */}
          {step === "error" && (
            <Box component="div" sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="body1" color="error" sx={{ mb: 2 }}>
                Something went wrong
              </Typography>
              <Button variant="outlined" onClick={reset}>
                Try Again
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
