import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#2D6A4F",
      light: "#52B788",
      dark: "#1B4332",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#D8F3DC",
      light: "#F7F4EC",
      dark: "#B7E4C7",
    },
    info: {
      main: "#B8A9D9", // Pastel lavender
      light: "#E5DFF0", // Light pastel lavender
      dark: "#9B8AB8", // Darker pastel lavender
    },
    success: {
      main: "#C7E9D0", // Pastel mint green
      light: "#E8F5EB", // Light pastel mint
      dark: "#A8D4B8", // Darker pastel mint
    },
    warning: {
      main: "#FFD6CC", // Pastel coral/peach
      light: "#FFEBE5", // Light pastel coral
      dark: "#FFB8A3", // Darker pastel coral
    },
    background: {
      default: "#FFFFFF", // Pure white
      paper: "#FAFAFA", // Off-white/very light gray
      light: "#FFFEFB", // Warm white with slight tint
    },
    text: {
      primary: "#2C2C2C", // Dark gray for text
      secondary: "#666666", // Medium gray for secondary text
    },
    green: {
      deep: "#1B4332",
      main: "#2D6A4F",
      mid: "#40916C",
      light: "#52B788",
      mist: "#D8F3DC",
      cream: "#F7F4EC",
    },
    pastel: {
      lavender: "#B8A9D9",
      peach: "#F5E6D3",
      mint: "#C7E9D0",
      coral: "#FFD6CC",
      pink: "#FFE5E5",
    },
  },
  typography: {
    fontFamily:
      '"Poppins", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 16, // Rounded corners throughout
  },
  components: {
    MuiButtonBase: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: { "&:focus, &.Mui-focusVisible": { outline: "none" } },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          "&:hover, &:active, &.Mui-focusVisible": { backgroundColor: "transparent" },
        },
      },
    },
  },
});

export { theme };
