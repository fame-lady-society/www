import { createTheme, type PaletteMode } from "@mui/material/styles";

export function createAppTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
    },
  });
}

// Static dark theme kept for backward-compatible breakpoint imports
const theme = createAppTheme("dark");

export default theme;
