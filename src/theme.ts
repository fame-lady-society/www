import { alpha, createTheme } from "@mui/material/styles";
import type { PaletteMode } from "@mui/material";

const buttonTones = {
  light: {
    primary: { solid: "#7c3aed", hover: "#6d28d9", foreground: "#6d28d9" },
    secondary: { solid: "#c2185b", hover: "#ad1457", foreground: "#ad1457" },
    success: { solid: "#2e7d32", hover: "#1b5e20", foreground: "#1b5e20" },
    error: { solid: "#c62828", hover: "#b71c1c", foreground: "#b71c1c" },
    warning: { solid: "#a64b00", hover: "#8a3e00", foreground: "#8a3e00" },
    info: { solid: "#0277bd", hover: "#01579b", foreground: "#01579b" },
  },
  dark: {
    primary: { solid: "#7c3aed", hover: "#8050e8", foreground: "#d8b4fe" },
    secondary: { solid: "#c2185b", hover: "#d81b60", foreground: "#f9a8d4" },
    success: { solid: "#2e7d32", hover: "#347f38", foreground: "#86efac" },
    error: { solid: "#c62828", hover: "#d32f2f", foreground: "#fca5a5" },
    warning: { solid: "#a64b00", hover: "#bd5b00", foreground: "#fcd34d" },
    info: { solid: "#0277bd", hover: "#027bbf", foreground: "#7dd3fc" },
  },
} as const;

function createButtonColorStyles(mode: PaletteMode) {
  const tones = buttonTones[mode];
  const styles: Record<string, object> = {};

  for (const [color, tone] of Object.entries(tones)) {
    const colorClass = `${color[0].toUpperCase()}${color.slice(1)}`;
    const outlinedBorder = alpha(
      tone.foreground,
      mode === "dark" ? 0.72 : 0.58,
    );

    styles[`&.MuiButton-contained${colorClass}`] = {
      backgroundColor: tone.solid,
      color: "#fff",
      "&:hover": {
        backgroundColor: tone.hover,
        "@media (hover: none)": {
          backgroundColor: tone.solid,
        },
      },
    };
    styles[`&.MuiButton-outlined${colorClass}`] = {
      borderColor: outlinedBorder,
      color: tone.foreground,
      "&:hover": {
        backgroundColor: alpha(tone.foreground, mode === "dark" ? 0.14 : 0.08),
        borderColor: tone.foreground,
        "@media (hover: none)": {
          backgroundColor: "transparent",
          borderColor: outlinedBorder,
        },
      },
    };
    styles[`&.MuiButton-text${colorClass}`] = {
      color: tone.foreground,
      "&:hover": {
        backgroundColor: alpha(tone.foreground, mode === "dark" ? 0.14 : 0.08),
        "@media (hover: none)": {
          backgroundColor: "transparent",
        },
      },
    };
  }

  return styles;
}

export function createAppTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            ...createButtonColorStyles(mode),
            "&.Mui-focusVisible": {
              outline: `3px solid ${alpha(
                buttonTones[mode].primary.foreground,
                mode === "dark" ? 0.55 : 0.35,
              )}`,
              outlineOffset: 2,
            },
            "&.Mui-disabled": {
              color: theme.palette.action.disabled,
            },
            "&.MuiButton-contained.Mui-disabled": {
              backgroundColor: theme.palette.action.disabledBackground,
              color: theme.palette.action.disabled,
            },
            "&.MuiButton-outlined.Mui-disabled": {
              borderColor: theme.palette.action.disabled,
            },
          }),
        },
      },
    },
  });
}

// Static dark theme kept for backward-compatible breakpoint imports
const theme = createAppTheme("dark");

export default theme;
