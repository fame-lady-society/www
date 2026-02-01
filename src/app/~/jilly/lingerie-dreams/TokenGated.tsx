"use client";

import { FC } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";

export const TokenGated: FC<{
  contractAddress: `0x${string}`;
}> = () => {
  const router = useRouter();

  return (
    <Card sx={{ mt: 2, mb: 6 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Access Exclusive Content
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          View exclusive content for token holders
        </Typography>
        <CardActions>
          <Button
            variant="outlined"
            component="a"
            href="./lingerie-dreams/gated"
            size="large"
            sx={{
              color: "rgba(255,255,255,0.7)",
              "&:hover": {
                color: "#fff",
              },
            }}
          >
            View Exclusive Content
          </Button>
        </CardActions>
      </CardContent>
    </Card>
  );
};
