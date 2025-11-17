import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
// import { useThemeStore } from "../../store/themeStore";

export default function VendedorLayout() {
  // const mode = useThemeStore((s) => s.mode);
  // const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return (
    <Box
      sx={{
        width: "100vw",
        minHeight: "100vh",
        p: 2,
        overflowX: "hidden",
        bgcolor: "background.default",
        color: "text.primary",
        transition: "background-color 0.3s ease",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        {/* <IconButton onClick={toggleTheme}>
          {mode === "light" ? (
            <DarkModeIcon />
          ) : (
            <LightModeIcon sx={{ color: "yellow" }} />
          )}
        </IconButton> */}
      </Box>

      <Outlet />
    </Box>
  );
}
