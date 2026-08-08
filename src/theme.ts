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

const fameDisplayFont =
  '"Iowan Old Style", "Baskerville", "Times New Roman", serif';
const fameBodyFont =
  '"Helvetica Neue", "Avenir Next", "Segoe UI", Helvetica, Arial, sans-serif';

/**
 * A deliberately dark, editorial theme for the FAME product family. Keeping
 * this separate prevents the release art direction from leaking into legacy
 * FLS routes while letting MUI and Tailwind surfaces share the same palette.
 */
export function createFameTheme() {
  const gold = "#c9aa67";
  const bone = "#f4eee2";
  const ink = "#0d0c0a";
  const paper = "#16140f";

  return createTheme({
    palette: {
      mode: "dark",
      primary: {
        main: gold,
        light: "#e4cd96",
        dark: "#92763c",
        contrastText: ink,
      },
      secondary: {
        main: "#9f8b61",
        contrastText: ink,
      },
      background: {
        default: ink,
        paper,
      },
      text: {
        primary: bone,
        secondary: "#bdb4a4",
      },
      divider: "rgba(201, 170, 103, 0.24)",
      action: {
        hover: "rgba(201, 170, 103, 0.08)",
        selected: "rgba(201, 170, 103, 0.14)",
        disabledBackground: "rgba(244, 238, 226, 0.08)",
      },
    },
    shape: {
      borderRadius: 3,
    },
    typography: {
      fontFamily: fameBodyFont,
      h1: {
        fontFamily: fameDisplayFont,
        fontWeight: 400,
        letterSpacing: "-0.04em",
        lineHeight: 0.96,
      },
      h2: {
        fontFamily: fameDisplayFont,
        fontWeight: 400,
        letterSpacing: "-0.035em",
        lineHeight: 1,
      },
      h3: {
        fontFamily: fameDisplayFont,
        fontWeight: 400,
        letterSpacing: "-0.03em",
        lineHeight: 1.05,
      },
      h4: {
        fontFamily: fameDisplayFont,
        fontWeight: 400,
        letterSpacing: "-0.025em",
        lineHeight: 1.08,
      },
      h5: {
        fontFamily: fameDisplayFont,
        fontWeight: 400,
        letterSpacing: "-0.015em",
      },
      h6: {
        fontWeight: 600,
        letterSpacing: "-0.01em",
      },
      button: {
        fontWeight: 650,
        letterSpacing: "0.01em",
        textTransform: "none",
      },
      overline: {
        fontWeight: 700,
        letterSpacing: "0.18em",
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          "::selection": {
            backgroundColor: gold,
            color: ink,
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundColor: "rgba(13, 12, 10, 0.9)",
            backgroundImage: "none",
            borderBottom: "1px solid rgba(201, 170, 103, 0.2)",
            color: bone,
            backdropFilter: "blur(18px)",
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            minHeight: 68,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 2,
            minHeight: 42,
            paddingInline: 18,
            transition:
              "transform 180ms ease, background-color 220ms ease, border-color 220ms ease, color 220ms ease",
            "&:hover": {
              transform: "translateY(-1px)",
            },
            "&:active": {
              transform: "translateY(1px) scale(0.99)",
            },
            "&.Mui-focusVisible": {
              outline: `2px solid ${gold}`,
              outlineOffset: 3,
            },
          },
          containedPrimary: {
            backgroundColor: gold,
            color: ink,
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "#dbc183",
              boxShadow: "none",
            },
          },
          outlinedPrimary: {
            borderColor: "rgba(201, 170, 103, 0.65)",
            color: bone,
            "&:hover": {
              borderColor: gold,
              backgroundColor: "rgba(201, 170, 103, 0.08)",
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
          outlined: {
            borderColor: "rgba(201, 170, 103, 0.22)",
            backgroundColor: "rgba(22, 20, 15, 0.72)",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: paper,
            backgroundImage: "none",
            borderColor: "rgba(201, 170, 103, 0.22)",
            boxShadow: "none",
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 2,
            backgroundColor: "rgba(6, 6, 5, 0.4)",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(201, 170, 103, 0.28)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(201, 170, 103, 0.58)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: gold,
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            height: 1,
            backgroundColor: gold,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontWeight: 650,
            letterSpacing: "0.08em",
            minHeight: 46,
            textTransform: "uppercase",
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 2,
          },
        },
      },
    },
  });
}

// Static dark theme kept for backward-compatible breakpoint imports
const theme = createAppTheme("dark");

export default theme;
