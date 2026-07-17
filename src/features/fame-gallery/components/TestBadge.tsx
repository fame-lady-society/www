import Chip from "@mui/material/Chip";

export function TestBadge() {
  return (
    <Chip
      label="TEST"
      color="warning"
      size="small"
      sx={{ fontWeight: 800, letterSpacing: "0.08em" }}
    />
  );
}
