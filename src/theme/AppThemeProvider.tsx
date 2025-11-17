import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import { useThemeStore } from "../store/themeStore";

export default function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode);

  const theme = createTheme({
    palette: {
      mode,

      // 🎨 COLOR CORPORATIVO
      primary: {
        main: "#695cfe",
        dark: "#5a4ee3",
        light: "#9e97ff",
        contrastText: "#ffffff",
      },

      // 🎨 PALETA SEGÚN MODO
      ...(mode === "light"
        ? {
            background: {
              default: "#f5f5f9",
              paper: "#ffffff",
            },
            text: {
              primary: "#111111",
              secondary: "#666666",
            },
            divider: "rgba(0,0,0,0.12)",
          }
        : {
            background: {
              default: "#121212",
              paper: "#1e1e1e",
            },
            text: {
              primary: "#ffffff",
              secondary: "#bbbbbb",
            },
            divider: "rgba(255,255,255,0.12)",
          }),
    },

    // ✔ BORDES REDONDEADOS
    shape: {
      borderRadius: 12,
    },

    // ✔ TIPOGRAFÍA (opcional mejorar)
    typography: {
      fontFamily: "Inter, Roboto, sans-serif",
      button: {
        textTransform: "none",
        fontWeight: 600,
      },
    },

    // ✔ COMPONENTES PERSONALIZADOS
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            transition: "all .2s ease",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            fontWeight: 700,
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
