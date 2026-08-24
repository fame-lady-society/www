import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CompareArrowsRoundedIcon from "@mui/icons-material/CompareArrowsRounded";
import LocalMallOutlinedIcon from "@mui/icons-material/LocalMallOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

const societyArtwork = {
  staked: "/images/fame-society/base-token-1.jpg",
  available: "/images/fame-society/base-token-2.jpg",
} as const;

function FlowArrow({ label }: { label: string }) {
  return (
    <Stack
      aria-hidden="true"
      alignItems="center"
      justifyContent="center"
      spacing={0.75}
      sx={{
        minHeight: { xs: 68, md: 0 },
        color: "primary.main",
        textAlign: "center",
      }}
    >
      <ArrowForwardRoundedIcon
        sx={{
          fontSize: 34,
          transform: { xs: "rotate(90deg)", md: "none" },
        }}
      />
      <Typography
        color="text.secondary"
        sx={{
          maxWidth: 76,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.09em",
          lineHeight: 1.35,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
    </Stack>
  );
}

function Stage({
  number,
  label,
  title,
  children,
}: {
  number: number;
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Box
      component="article"
      sx={{
        minWidth: 0,
        p: { xs: 2, sm: 2.5 },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        backgroundColor: "rgba(13, 12, 10, 0.62)",
      }}
    >
      <Typography
        component="p"
        variant="overline"
        sx={{ color: "primary.main", lineHeight: 1.4 }}
      >
        {number} · {label}
      </Typography>
      <Typography
        component="h3"
        variant="h5"
        sx={{ mt: 0.75, textWrap: "balance" }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function NftPreview({
  image,
  label,
}: {
  image: string;
  label: string;
}) {
  return (
    <Box
      component="figure"
      aria-label={label}
      sx={{
        width: "min(100%, 164px)",
        m: 0,
        mx: "auto",
        mt: 2.25,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "rgba(201, 170, 103, 0.72)",
        borderRadius: 0.75,
        backgroundColor: "background.default",
        boxShadow: "0 20px 45px rgba(5, 4, 3, 0.34)",
      }}
    >
      <Box
        component="div"
        aria-hidden="true"
        sx={{
          aspectRatio: "1 / 1",
          backgroundImage: `linear-gradient(rgba(13, 12, 10, 0.04), rgba(13, 12, 10, 0.2)), url(${image})`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      />
      <Typography
        component="p"
        sx={{
          px: 1.25,
          py: 1,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textAlign: "center",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function MarketplaceInventory() {
  return (
    <Box
      component="div"
      sx={{
        mt: 2.25,
        p: { xs: 1.5, sm: 2 },
        border: "2px solid",
        borderColor: "primary.main",
        borderRadius: 1,
        backgroundColor: "rgba(201, 170, 103, 0.06)",
      }}
    >
      <Stack direction="row" justifyContent="center" spacing={1}>
        <StorefrontOutlinedIcon color="primary" />
        <Typography
          component="p"
          sx={{ fontWeight: 700, letterSpacing: "0.04em" }}
        >
          Shared inventory
        </Typography>
      </Stack>
      <Box
        component="figure"
        aria-label="A pool of FAME Society NFTs on Base held by the marketplace"
        sx={{
          height: 112,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 1,
          m: 0,
          my: 1.5,
          p: 1,
          borderRadius: 0.75,
          backgroundColor: "rgba(13, 12, 10, 0.72)",
        }}
      >
        <Box
          component="div"
          aria-hidden="true"
          sx={{
            minWidth: 0,
            border: "1px solid",
            borderColor: "rgba(201, 170, 103, 0.72)",
            borderRadius: 0.5,
            backgroundImage: `linear-gradient(rgba(13, 12, 10, 0.04), rgba(13, 12, 10, 0.18)), url(${societyArtwork.staked})`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            transform: "rotate(-1.5deg)",
          }}
        />
        <Box
          component="div"
          aria-hidden="true"
          sx={{
            minWidth: 0,
            border: "1px solid",
            borderColor: "rgba(201, 170, 103, 0.72)",
            borderRadius: 0.5,
            backgroundImage: `linear-gradient(rgba(13, 12, 10, 0.04), rgba(13, 12, 10, 0.18)), url(${societyArtwork.available})`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            transform: "rotate(1.5deg)",
          }}
        />
      </Box>
      <Typography
        component="p"
        variant="overline"
        sx={{ mb: 1.5, color: "text.secondary", textAlign: "center" }}
      >
        FAME Society NFTs · Base
      </Typography>
      <Box
        component="div"
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 1,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            p: 1.25,
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: "rgba(13, 12, 10, 0.66)",
          }}
        >
          <LocalMallOutlinedIcon color="primary" fontSize="small" />
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
            Someone can buy it
          </Typography>
        </Stack>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            p: 1.25,
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: "rgba(13, 12, 10, 0.66)",
          }}
        >
          <CompareArrowsRoundedIcon color="primary" fontSize="small" />
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
            It can power a metadata swap
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}

export function MarketplaceStakingExplainer() {
  return (
    <Box component="section" aria-labelledby="marketplace-staking-explainer">
      <Stack
        direction="row"
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="center"
        spacing={1.25}
        sx={{
          px: { xs: 2, sm: 3 },
          py: 1.75,
          color: "warning.contrastText",
          backgroundColor: "warning.main",
          textAlign: "center",
        }}
      >
        <WarningAmberRoundedIcon aria-hidden="true" sx={{ flexShrink: 0 }} />
        <Typography
          id="marketplace-staking-explainer"
          component="h2"
          sx={{
            fontSize: { xs: 13, sm: 15 },
            fontWeight: 800,
            letterSpacing: "0.055em",
            textTransform: "uppercase",
          }}
        >
          This is not a locker. Your NFT leaves your wallet.
        </Typography>
      </Stack>

      <Box
        component="div"
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "minmax(0, 0.92fr) 72px minmax(0, 1.18fr) 72px minmax(0, 0.92fr)",
          },
          alignItems: "stretch",
          gap: { xs: 0, md: 1 },
          p: { xs: 2, sm: 3 },
        }}
      >
        <Stage
          number={1}
          label="You stake"
          title="You give it to the marketplace."
        >
          <NftPreview
            image={societyArtwork.staked}
            label="Your FAME Society NFT on Base"
          />
          <Typography color="text.secondary" sx={{ mt: 1.75 }}>
            Stake one whole Society NFT with its attached 1,000,000 FAME. The
            staking action transfers it to the marketplace contract.
          </Typography>
        </Stage>

        <FlowArrow label="Leaves your wallet" />

        <Stage
          number={2}
          label="It joins the pool"
          title="The marketplace can use it."
        >
          <MarketplaceInventory />
        </Stage>

        <FlowArrow label="When you exit" />

        <Stage
          number={3}
          label="You withdraw"
          title="You get an available NFT."
        >
          <NftPreview
            image={societyArtwork.available}
            label="A different FAME Society NFT"
          />
          <Typography color="text.secondary" sx={{ mt: 1.75 }}>
            Your original NFT is not reserved. The NFT available when you exit
            may be different.
          </Typography>
        </Stage>
      </Box>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={1.25}
        sx={{
          mx: { xs: 2, sm: 3 },
          px: 2,
          py: 1.75,
          borderTop: "1px solid",
          borderBottom: "1px solid",
          borderColor: "divider",
          textAlign: "center",
        }}
      >
        <PaidOutlinedIcon aria-hidden="true" color="primary" />
        <Typography sx={{ fontWeight: 600 }}>
          While you provide an NFT, you earn a share of marketplace fees.
        </Typography>
      </Stack>

      <Typography
        component="p"
        variant="h5"
        sx={{ px: 2, pt: 2.5, pb: 3, textAlign: "center" }}
      >
        Same NFT back?{" "}
        <Box
          component="strong"
          sx={{
            color: "warning.main",
            font: "inherit",
            textDecoration: "underline",
            textDecorationThickness: "2px",
            textUnderlineOffset: "5px",
          }}
        >
          No guarantee.
        </Box>
      </Typography>
    </Box>
  );
}
