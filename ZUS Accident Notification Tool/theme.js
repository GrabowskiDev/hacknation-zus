// src/theme.js
import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#007834",
      light: "#60A5FA",
      dark: "#1E40AF",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#10B981",
      light: "#34D399",
      dark: "#059669",
      contrastText: "#ffffff",
    },
    background: {
      default: "#F3F4F6", // Jasnoszare tło dla całej strony (pod chatem)
      paper: "#ffffff", // Białe tło dla kart i dymków
    },
    text: {
      primary: "#111827", // Bardzo ciemny szary (zamiast czystej czerni - czytelniejszy)
      secondary: "#6B7280",
    },
  },
  typography: {
    // fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: "none", // Wyłącza domyślne wielkie litery w przyciskach
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 4, // Globalne zaokrąglenie (przyciski, inputy, karty będą łagodniejsze)
  },
});
